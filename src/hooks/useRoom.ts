import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ICE_SERVERS } from "@/hooks/useRandomChat";
import type { RoomRow } from "@/hooks/useRooms";

export type RoomStatus = "loading" | "joining" | "live" | "ended" | "full" | "error";

export type RoomPeerMeta = {
  name: string;
  avatar_url: string | null;
  cam_on: boolean;
  mic_on: boolean;
};

export type RoomMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

const MAX_BITRATE = 400_000;

export function useRoom(roomId: string | undefined) {
  const { user, profile } = useAuth();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<RoomStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [peerMeta, setPeerMeta] = useState<Record<string, RoomPeerMeta>>({});
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [messages, setMessages] = useState<RoomMessage[]>([]);

  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const camOnRef = useRef(true);
  const micOnRef = useRef(true);
  const metaRef = useRef<RoomPeerMeta>({ name: "Stranger", avatar_url: null, cam_on: true, mic_on: true });
  const leftRef = useRef(false);

  metaRef.current = {
    name: profile?.display_name ?? "Stranger",
    avatar_url: profile?.avatar_url ?? null,
    cam_on: camOnRef.current,
    mic_on: micOnRef.current,
  };

  const sendSignal = useCallback((to: string, payload: unknown) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: { from: userId, to, payload },
    });
  }, [userId]);

  /* ------------------------------------------------------------ peer helpers */

  const destroyPeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    pcsRef.current.delete(peerId);
    pendingIceRef.current.delete(peerId);
    try {
      pc?.close();
    } catch {
      /* noop */
    }
    setRemoteStreams((prev) => {
      if (!prev.has(peerId)) return prev;
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  }, []);

  const createPeer = useCallback(
    (peerId: string, initiator: boolean) => {
      if (!localStreamRef.current || pcsRef.current.has(peerId) || !userId) return;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcsRef.current.set(peerId, pc);

      for (const track of localStreamRef.current.getTracks()) {
        const sender = pc.addTrack(track, localStreamRef.current);
        const params = sender.getParameters();
        params.encodings = [{ maxBitrate: MAX_BITRATE }];
        try {
          void sender.setParameters(params);
        } catch {
          /* some browsers reject empty encodings tweaks */
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) sendSignal(peerId, { type: "candidate", candidate: event.candidate.toJSON() });
      };
      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream) setRemoteStreams((prev) => new Map(prev).set(peerId, stream));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          destroyPeer(peerId);
        }
      };

      if (initiator) {
        void pc
          .createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => sendSignal(peerId, { type: "offer", sdp: pc.localDescription?.sdp }))
          .catch(() => destroyPeer(peerId));
      }
    },
    [userId, sendSignal, destroyPeer],
  );

  const handleSignal = useCallback(
    async (from: string, payload: { type: string; sdp?: string; candidate?: RTCIceCandidateInit; muted?: boolean }) => {
      if (!userId) return;
      let pc = pcsRef.current.get(from);
      if (!pc && payload.type === "offer") {
        createPeer(from, false);
        pc = pcsRef.current.get(from);
        if (!pc) return;
      }
      if (!pc) return;
      try {
        if (payload.type === "offer" && payload.sdp) {
          await pc.setRemoteDescription({ type: "offer", sdp: payload.sdp });
          const buffered = pendingIceRef.current.get(from) ?? [];
          for (const c of buffered) await pc.addIceCandidate(c).catch(() => undefined);
          pendingIceRef.current.delete(from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(from, { type: "answer", sdp: pc.localDescription?.sdp });
        } else if (payload.type === "answer" && payload.sdp) {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
            const buffered = pendingIceRef.current.get(from) ?? [];
            for (const c of buffered) await pc.addIceCandidate(c).catch(() => undefined);
            pendingIceRef.current.delete(from);
          }
        } else if (payload.type === "candidate" && payload.candidate) {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(payload.candidate).catch(() => undefined);
          } else {
            const list = pendingIceRef.current.get(from) ?? [];
            list.push(payload.candidate);
            pendingIceRef.current.set(from, list);
          }
        }
      } catch {
        destroyPeer(from);
      }
      if (payload.type === "host-mute") {
        const muted = payload.muted ?? true;
        const track = localStreamRef.current?.getAudioTracks()[0];
        if (track && track.enabled === muted) {
          track.enabled = !muted;
          micOnRef.current = !muted;
          setMicOn(!muted);
          channelRef.current?.track({ ...metaRef.current, mic_on: !muted });
        }
      }
    },
    [userId, createPeer, sendSignal, destroyPeer],
  );

  /* ------------------------------------------------------------- media + join */

  const join = useCallback(async () => {
    if (!userId || !roomId) return;
    setStatus("joining");
    setError(null);
    try {
      const { data: roomRow } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      const found = (roomRow ?? null) as RoomRow | null;
      if (!found || !found.is_live) {
        setRoom(found);
        setStatus("ended");
        return;
      }
      setRoom(found);

      const { count } = await supabase
        .from("room_members")
        .select("user_id", { count: "exact", head: true })
        .eq("room_id", roomId)
        .is("left_at", null);
      if ((count ?? 0) >= found.max_members && found.host_id !== userId) {
        setStatus("full");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCamOn(true);
      setMicOn(true);
      camOnRef.current = true;
      micOnRef.current = true;

      await supabase
        .from("room_members")
        .upsert({ room_id: roomId, user_id: userId, left_at: null }, { onConflict: "room_id,user_id" });

      leftRef.current = false;
      setStatus("live");
    } catch {
      setError("We could not reach your camera or microphone. Check the browser permission.");
      setStatus("error");
    }
  }, [roomId, userId]);

  const reconcile = useCallback(() => {
    const channel = channelRef.current;
    if (!channel || !userId) return;
    const state = channel.presenceState() as Record<string, { user_id: string }[]>;
    const others = Object.keys(state).filter((id) => id !== userId && id !== "undefined");
    for (const id of others) {
      if (!pcsRef.current.has(id)) createPeer(id, userId > id);
    }
    for (const id of [...pcsRef.current.keys()]) {
      if (!others.includes(id)) destroyPeer(id);
    }
    setPeerMeta((prev) => {
      const next: Record<string, RoomPeerMeta> = {};
      for (const id of others) {
        const meta = state[id]?.[0] as unknown as RoomPeerMeta | undefined;
        next[id] = {
          name: meta?.name ?? "Stranger",
          avatar_url: meta?.avatar_url ?? null,
          cam_on: meta?.cam_on ?? true,
          mic_on: meta?.mic_on ?? true,
        };
      }
      const changed = JSON.stringify(prev) !== JSON.stringify(next);
      return changed ? next : prev;
    });
  }, [userId, createPeer, destroyPeer]);

  const leave = useCallback(async () => {
    leftRef.current = true;
    for (const id of [...pcsRef.current.keys()]) destroyPeer(id);
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setPeerMeta({});
    if (userId && roomId) {
      await supabase
        .from("room_members")
        .update({ left_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .is("left_at", null);
    }
  }, [userId, roomId, destroyPeer]);

  const endRoom = useCallback(async () => {
    if (!userId || !room || room.host_id !== userId) return;
    await supabase
      .from("rooms")
      .update({ is_live: false, ended_at: new Date().toISOString() })
      .eq("id", room.id)
      .eq("host_id", userId);
    channelRef.current?.send({ type: "broadcast", event: "room-ended", payload: {} });
    await leave();
  }, [userId, room, leave]);

  /* ------------------------------------------------------- channel + realtime */

  useEffect(() => {
    if (status !== "live" || !userId || !roomId) return;
    const channel = supabase.channel(`room:${roomId}`, { config: { presence: { key: userId } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, reconcile)
      .on("presence", { event: "leave" }, reconcile)
      .on("broadcast", { event: "signal" }, ({ payload }) => {
        const { from, to, payload: data } = payload as {
          from: string;
          to: string;
          payload: { type: string; sdp?: string; candidate?: RTCIceCandidateInit };
        };
        if (to === userId && from !== userId) void handleSignal(from, data);
      })
      .on("broadcast", { event: "room-ended" }, () => {
        setStatus("ended");
        void leave();
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const next = payload.new as RoomRow;
          setRoom(next);
          if (!next.is_live && next.host_id !== userId) {
            setStatus("ended");
            void leave();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev.slice(-200), payload.new as RoomMessage]);
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") void channel.track(metaRef.current);
      });

    const poll = setInterval(reconcile, 4000);

    void supabase
      .from("room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        if (data) setMessages(data as RoomMessage[]);
      });

    return () => {
      clearInterval(poll);
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      for (const id of [...pcsRef.current.keys()]) destroyPeer(id);
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setRemoteStreams(new Map());
      setPeerMeta({});
      if (!leftRef.current && userId) {
        void supabase
          .from("room_members")
          .update({ left_at: new Date().toISOString() })
          .eq("room_id", roomId)
          .eq("user_id", userId)
          .is("left_at", null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId, roomId]);

  /* ----------------------------------------------------------------- actions */

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    camOnRef.current = track.enabled;
    setCamOn(track.enabled);
    channelRef.current?.track({ ...metaRef.current, cam_on: track.enabled });
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    micOnRef.current = track.enabled;
    setMicOn(track.enabled);
    channelRef.current?.track({ ...metaRef.current, mic_on: track.enabled });
  }, []);

  const hostSetMic = useCallback(
    (peerId: string, muted: boolean) => {
      if (!room || room.host_id !== userId) return;
      channelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: { from: userId, to: peerId, payload: { type: "host-mute", muted } },
      });
    },
    [room, userId],
  );

  const sendMessage = useCallback(
    async (body: string) => {
      if (!userId || !roomId || !body.trim()) return;
      const { error: insertError } = await supabase
        .from("room_messages")
        .insert({ room_id: roomId, sender_id: userId, body: body.trim().slice(0, 300) });
      if (insertError) setError(insertError.message);
    },
    [userId, roomId],
  );

  return {
    status,
    error,
    room,
    userId,
    localStream,
    remoteStreams,
    peerMeta,
    camOn,
    micOn,
    messages,
    isHost: !!room && room.host_id === userId,
    join,
    leave,
    endRoom,
    toggleCam,
    toggleMic,
    hostSetMic,
    sendMessage,
  };
}
