import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ChatStatus =
  | "idle"
  | "starting"
  | "searching"
  | "connecting"
  | "connected"
  | "partner-left"
  | "error";

export type MatchRow = {
  id: string;
  user_a: string;
  user_b: string;
  started_at: string;
  ended_at: string | null;
  ended_by: string | null;
};

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type PartnerProfile = {
  id: string;
  display_name: string;
  gender: string;
  country: string;
  interests: string[];
};

export type Preferences = {
  interests: string[];
  wantGender: string | null;
  wantCountry: string | null;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
};

export function useRandomChat() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  const prefsRef = useRef<Preferences>({ interests: [], wantGender: null, wantCountry: null });
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const signalRef = useRef<RealtimeChannel | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const offerSentRef = useRef(false);
  const keepSearchingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ------------------------------------------------------------------ media */

  const ensureMedia = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setCamOn(true);
    setMicOn(true);
    return stream;
  }, []);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }, []);

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  /* ------------------------------------------------------------ peer teardown */

  const teardownPeer = useCallback(() => {
    try {
      pcRef.current?.close();
    } catch {
      /* noop */
    }
    pcRef.current = null;
    if (signalRef.current) {
      void supabase.removeChannel(signalRef.current);
      signalRef.current = null;
    }
    pendingIceRef.current = [];
    offerSentRef.current = false;
    setRemoteStream(null);
    setPartnerTyping(false);
  }, []);

  /* ----------------------------------------------------------------- actions */

  const tryJoinQueue = useCallback(async () => {
    const prefs = prefsRef.current;
    const { data, error: rpcError } = await supabase.rpc("join_queue", {
      p_interests: prefs.interests,
      p_want_gender: prefs.wantGender,
      p_want_country: prefs.wantCountry,
    });
    if (rpcError) throw new Error(rpcError.message);
    return (data as string | null) ?? null;
  }, []);

  const loadMatch = useCallback(async (matchId: string) => {
    const { data } = await supabase.from("matches").select("*").eq("id", matchId).maybeSingle();
    if (data) setMatch(data as MatchRow);
  }, []);

  const start = useCallback(
    async (prefs: Preferences) => {
      if (!userId) return;
      prefsRef.current = prefs;
      setError(null);
      setStatus("starting");
      try {
        await ensureMedia();
      } catch {
        setError("We could not reach your camera or microphone. Check the browser permission.");
        setStatus("error");
        return;
      }
      keepSearchingRef.current = true;
      setMessages([]);
      setStatus("searching");
      try {
        const matchId = await tryJoinQueue();
        if (matchId) await loadMatch(matchId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not join the queue");
        setStatus("error");
        keepSearchingRef.current = false;
      }
    },
    [userId, ensureMedia, tryJoinQueue, loadMatch],
  );

  const stop = useCallback(async () => {
    keepSearchingRef.current = false;
    const current = match;
    teardownPeer();
    setMatch(null);
    setPartner(null);
    setMessages([]);
    await supabase.rpc("leave_queue");
    if (current) await supabase.rpc("end_match", { p_match_id: current.id });
    stopMedia();
    setStatus("idle");
  }, [match, teardownPeer, stopMedia]);

  const next = useCallback(async () => {
    const current = match;
    teardownPeer();
    setMatch(null);
    setPartner(null);
    setMessages([]);
    if (current) await supabase.rpc("end_match", { p_match_id: current.id });
    keepSearchingRef.current = true;
    setStatus("searching");
    try {
      const matchId = await tryJoinQueue();
      if (matchId) await loadMatch(matchId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not join the queue");
      setStatus("error");
    }
  }, [match, teardownPeer, tryJoinQueue, loadMatch]);

  const sendMessage = useCallback(
    async (body: string) => {
      if (!match || !userId || !body.trim()) return;
      const { error: insertError } = await supabase
        .from("messages")
        .insert({ match_id: match.id, sender_id: userId, body: body.trim().slice(0, 500) });
      if (insertError) throw new Error(insertError.message);
    },
    [match, userId],
  );

  const sendTyping = useCallback(() => {
    signalRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
  }, []);

  /* ------------------------------------------------- watch for a match while queued */

  useEffect(() => {
    if (status !== "searching" || !userId || match) return;

    const channel = supabase
      .channel(`match-watch-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "matches" },
        (payload) => {
          const row = payload.new as MatchRow;
          if (row.user_a === userId || row.user_b === userId) setMatch(row);
        },
      )
      .subscribe();

    const poll = setInterval(async () => {
      if (!keepSearchingRef.current) return;
      const { data } = await supabase.rpc("current_match");
      if (data) {
        await loadMatch(data as string);
      } else {
        // Re-attempt pairing in case someone joined while we were waiting.
        try {
          const matchId = await tryJoinQueue();
          if (matchId) await loadMatch(matchId);
        } catch {
          /* ignore transient */
        }
      }
    }, 2500);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [status, userId, match, loadMatch, tryJoinQueue]);

  /* ----------------------------------------------------- set up an active match */

  useEffect(() => {
    if (!match || !userId || match.ended_at) return;
    let cancelled = false;
    const partnerId = match.user_a === userId ? match.user_b : match.user_a;
    const isInitiator = match.user_a === userId;

    setStatus("connecting");

    void supabase
      .from("profiles")
      .select("id, display_name, gender, country, interests")
      .eq("id", partnerId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data) setPartner(data as PartnerProfile);
      });

    void supabase
      .from("messages")
      .select("*")
      .eq("match_id", match.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled && data) setMessages(data as ChatMessage[]);
      });

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    const remote = new MediaStream();
    setRemoteStream(remote);

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current as MediaStream);
    });

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((t) => {
        if (!remote.getTracks().includes(t)) remote.addTrack(t);
      });
      setRemoteStream(new MediaStream(remote.getTracks()));
    };

    pc.onconnectionstatechange = () => {
      if (cancelled) return;
      if (pc.connectionState === "connected") setStatus("connected");
      if (pc.connectionState === "failed") {
        setError("The direct video connection failed. Try Next for a different person.");
      }
    };

    const signal = supabase.channel(`signal-${match.id}`, {
      config: { broadcast: { self: false }, presence: { key: userId } },
    });
    signalRef.current = signal;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void signal.send({
          type: "broadcast",
          event: "ice",
          payload: { candidate: event.candidate.toJSON() },
        });
      }
    };

    async function makeOffer() {
      if (offerSentRef.current || !pcRef.current) return;
      offerSentRef.current = true;
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      await signal.send({ type: "broadcast", event: "sdp", payload: { sdp: offer } });
    }

    async function drainIce() {
      const pending = pendingIceRef.current;
      pendingIceRef.current = [];
      for (const c of pending) {
        try {
          await pcRef.current?.addIceCandidate(c);
        } catch {
          /* ignore */
        }
      }
    }

    signal
      .on("broadcast", { event: "sdp" }, async ({ payload }) => {
        const desc = payload.sdp as RTCSessionDescriptionInit;
        if (!pcRef.current) return;
        if (desc.type === "offer") {
          await pcRef.current.setRemoteDescription(desc);
          await drainIce();
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await signal.send({ type: "broadcast", event: "sdp", payload: { sdp: answer } });
        } else if (desc.type === "answer" && !pcRef.current.currentRemoteDescription) {
          await pcRef.current.setRemoteDescription(desc);
          await drainIce();
        }
      })
      .on("broadcast", { event: "ice" }, async ({ payload }) => {
        const candidate = payload.candidate as RTCIceCandidateInit;
        if (pcRef.current?.remoteDescription) {
          try {
            await pcRef.current.addIceCandidate(candidate);
          } catch {
            /* ignore */
          }
        } else {
          pendingIceRef.current.push(candidate);
        }
      })
      .on("broadcast", { event: "typing" }, () => {
        setPartnerTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 2200);
      })
      .on("presence", { event: "sync" }, () => {
        const online = Object.keys(signal.presenceState());
        if (isInitiator && online.length >= 2) void makeOffer();
      })
      .subscribe(async (state) => {
        if (state === "SUBSCRIBED") await signal.track({ at: Date.now() });
      });

    const messageChannel = supabase
      .channel(`messages-${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          if (row.sender_id !== userId) setPartnerTyping(false);
        },
      )
      .subscribe();

    const matchChannel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "matches", filter: `id=eq.${match.id}` },
        (payload) => {
          const row = payload.new as MatchRow;
          if (row.ended_at && row.ended_by !== userId) {
            setStatus("partner-left");
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      void supabase.removeChannel(messageChannel);
      void supabase.removeChannel(matchChannel);
      teardownPeer();
    };
  }, [match, userId, teardownPeer]);

  /* ------------------------------------------------------- leave cleanly on exit */

  useEffect(() => {
    const cleanup = () => {
      void supabase.rpc("leave_queue");
      if (match) void supabase.rpc("end_match", { p_match_id: match.id });
    };
    window.addEventListener("pagehide", cleanup);
    return () => {
      window.removeEventListener("pagehide", cleanup);
    };
  }, [match]);

  useEffect(() => {
    return () => {
      void supabase.rpc("leave_queue");
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    status,
    error,
    match,
    partner,
    messages,
    partnerTyping,
    localStream,
    remoteStream,
    camOn,
    micOn,
    start,
    stop,
    next,
    sendMessage,
    sendTyping,
    toggleCam,
    toggleMic,
    setError,
  };
}
