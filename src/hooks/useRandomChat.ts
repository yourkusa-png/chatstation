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
  message_type: "text" | "gif";
  media_url: string | null;
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
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: "stun:global.stun.twilio.com:3478" },
    // Free public relay fallback for mobile networks that block direct P2P.
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 2,
  bundlePolicy: "max-bundle",
};

const VIDEO_SIZE = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } };
const MAX_VIDEO_BITRATE = 600_000;

export function useRandomChat() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [likesReceived, setLikesReceived] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [cameraCount, setCameraCount] = useState(0);
  const [camPermission, setCamPermission] = useState<PermissionState>("prompt");
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");

  /* ------------------------------------------- live device permission state */

  useEffect(() => {
    let cleanups: (() => void)[] = [];
    let cancelled = false;
    async function watch(name: "camera" | "microphone", set: (s: PermissionState) => void) {
      try {
        const status = await navigator.permissions.query({ name: name as PermissionName });
        if (cancelled) return;
        set(status.state);
        const onChange = () => set(status.state);
        status.addEventListener("change", onChange);
        cleanups.push(() => status.removeEventListener("change", onChange));
      } catch {
        /* permissions API unsupported — treated as prompt */
      }
    }
    void watch("camera", setCamPermission);
    void watch("microphone", setMicPermission);
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

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
      video: { ...VIDEO_SIZE, facingMode: { ideal: facingMode } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    setCamOn(true);
    setMicOn(true);
    setCamPermission("granted");
    setMicPermission("granted");
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCameraCount(devices.filter((device) => device.kind === "videoinput").length);
    return stream;
  }, [facingMode]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setCamOn(false);
    setMicOn(false);
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

  const switchCamera = useCallback(async () => {
    if (isSwitchingCamera) return;
    setIsSwitchingCamera(true);
    setError(null);
    try {
      const currentStream = localStreamRef.current ?? (await ensureMedia());
      const currentTrack = currentStream.getVideoTracks()[0];
      const wasEnabled = currentTrack?.enabled ?? true;
      const currentDeviceId = currentTrack?.getSettings().deviceId;
      const nextFacingMode = facingMode === "user" ? "environment" : "user";

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
      setCameraCount(videoInputs.length);

      // Phones usually can't open two cameras at once: release the current one first.
      currentTrack?.stop();

      const size = VIDEO_SIZE;
      const attempts: MediaTrackConstraints[] = [
        { ...size, facingMode: { exact: nextFacingMode } },
      ];
      const idx = videoInputs.findIndex((d) => d.deviceId === currentDeviceId);
      if (videoInputs.length > 1) {
        const other = videoInputs[(idx + 1) % videoInputs.length];
        if (other) attempts.push({ ...size, deviceId: { exact: other.deviceId } });
      }
      attempts.push({ ...size, facingMode: { ideal: nextFacingMode } });

      let nextTrack: MediaStreamTrack | null = null;
      for (const video of attempts) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video, audio: false });
          const t = s.getVideoTracks()[0];
          if (t && (t.getSettings().deviceId !== currentDeviceId || videoInputs.length <= 1)) {
            nextTrack = t;
            break;
          }
          s.getTracks().forEach((x) => x.stop());
        } catch {
          /* try next */
        }
      }

      if (!nextTrack) {
        // Restore the original camera.
        const s = await navigator.mediaDevices.getUserMedia({
          video: currentDeviceId ? { ...size, deviceId: { exact: currentDeviceId } } : size,
          audio: false,
        });
        nextTrack = s.getVideoTracks()[0] ?? null;
        setError("This device does not have another camera.");
      } else {
        setFacingMode(nextFacingMode);
      }
      if (!nextTrack) throw new Error("no camera");

      nextTrack.enabled = wasEnabled;
      const sender = pcRef.current?.getSenders().find((s) => s.track?.kind === "video" || (!s.track && s.dtmf === null));
      if (sender) await sender.replaceTrack(nextTrack);
      if (currentTrack) currentStream.removeTrack(currentTrack);
      currentStream.addTrack(nextTrack);
      localStreamRef.current = currentStream;
      setLocalStream(new MediaStream(currentStream.getTracks()));
      setCamOn(wasEnabled);
    } catch {
      setError("Could not switch the camera. Check camera permission.");
    } finally {
      setIsSwitchingCamera(false);
    }
  }, [facingMode, ensureMedia, isSwitchingCamera]);

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
      p_want_gender: prefs.wantGender as string,
      p_want_country: prefs.wantCountry as string,
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
      setLikesReceived(0);
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
    setLikesReceived(0);
    await supabase.rpc("leave_queue");
    if (current) await supabase.rpc("end_match", { p_match_id: current.id });
    stopMedia();
    setStatus("idle");
  }, [match, teardownPeer, stopMedia]);

  const disableDevices = useCallback(async () => {
    keepSearchingRef.current = false;
    const current = match;
    teardownPeer();
    setMatch(null);
    setPartner(null);
    setMessages([]);
    setLikesReceived(0);
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
    setLikesReceived(0);
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
        .insert({
          match_id: match.id,
          sender_id: userId,
          body: body.trim().slice(0, 500),
          message_type: "text",
          media_url: null,
        });
      if (insertError) throw new Error(insertError.message);
    },
    [match, userId],
  );

  const sendGif = useCallback(
    async (url: string) => {
      if (!match || !userId || !url.startsWith("https://")) return;
      const { error: insertError } = await supabase.from("messages").insert({
        match_id: match.id,
        sender_id: userId,
        body: "GIF",
        message_type: "gif",
        media_url: url,
      });
      if (insertError) throw new Error(insertError.message);
    },
    [match, userId],
  );

  const sendTyping = useCallback(() => {
    signalRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
  }, []);

  const sendLike = useCallback(() => {
    signalRef.current?.send({ type: "broadcast", event: "like", payload: {} });
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
    }, 1500);

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
      const sender = pc.addTrack(track, localStreamRef.current as MediaStream);
      if (track.kind === "video") {
        try {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
          const enc = params.encodings[0]!;
          enc.maxBitrate = MAX_VIDEO_BITRATE;
          enc.maxFramerate = 24;
          void sender.setParameters(params).catch(() => {});
        } catch {
          /* bitrate cap unsupported */
        }
      }
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
      .on("broadcast", { event: "like" }, () => {
        setLikesReceived((n) => n + 1);
      })
      .on("broadcast", { event: "typing" }, () => {
        setPartnerTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setPartnerTyping(false), 2200);
      })
      // Instant handshake: both sides say "hello" as soon as they join the
      // channel; the initiator sends the offer the moment it hears the partner.
      .on("broadcast", { event: "hello" }, ({ payload }) => {
        if (isInitiator) void makeOffer();
        else if (!(payload as { reply?: boolean })?.reply) {
          void signal.send({ type: "broadcast", event: "hello", payload: { reply: true } });
        }
      })
      .on("presence", { event: "sync" }, () => {
        const online = Object.keys(signal.presenceState());
        if (isInitiator && online.length >= 2) void makeOffer();
      })
      .subscribe((state) => {
        if (state === "SUBSCRIBED") {
          void signal.send({ type: "broadcast", event: "hello", payload: {} });
          void signal.track({ at: Date.now() });
        }
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
    likesReceived,
    localStream,
    remoteStream,
    camOn,
    micOn,
    facingMode,
    isSwitchingCamera,
    cameraCount,
    camPermission,
    micPermission,
    requestPermissions: ensureMedia,
    disableDevices,
    start,
    stop,
    next,
    sendMessage,
    sendGif,
    sendTyping,
    sendLike,
    toggleCam,
    toggleMic,
    switchCamera,
    setError,
  };
}
