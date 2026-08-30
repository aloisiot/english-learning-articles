"use client";

/**
 * The call, and nothing else.
 *
 * Phase 3 is deliberately just "two people see and hear each other" —
 * no article, no section sync, no chat, no screen share
 * (research/video-calls/08-implementation-plan.md). The layout is built
 * from daily-react's hooks rather than Daily's prebuilt frame because
 * phase 5 puts a teaching UI in this space, and a prebuilt room is the
 * one thing that would leave nowhere to put it.
 */
import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useCallObject,
  useDaily,
  useLocalSessionId,
  useMeetingState,
  useParticipantIds,
} from "@daily-co/daily-react";
import { useCallback, useState } from "react";

/**
 * Must match `basePath` in next.config.mjs: fetch does not know about it,
 * so the one place a URL is written by hand is here.
 */
const JOIN_ENDPOINT = "/class/api/join";

const MESSAGES = {
  "not-valid": "This link is not valid any more. Ask for a new one.",
  "room-unavailable": "The class room could not be opened. Try again in a moment.",
  "token-unavailable": "Could not get permission to join. Try again in a moment.",
};

export default function CallClient({ token, slug }) {
  const callObject = useCallObject({});

  return (
    <DailyProvider callObject={callObject}>
      <Call token={token} slug={slug} />
    </DailyProvider>
  );
}

function Call({ token, slug }) {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const join = useCallback(async () => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(JOIN_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(MESSAGES[body.error] ?? "Could not start the class.");
      }

      const { roomUrl, meetingToken } = await response.json();
      await daily.join({ url: roomUrl, token: meetingToken });
    } catch (cause) {
      setError(cause.message ?? "Could not start the class.");
    } finally {
      setPending(false);
    }
  }, [daily, token]);

  if (meetingState === "joined-meeting") {
    return <Stage onLeave={() => daily.leave()} />;
  }

  if (meetingState === "left-meeting") {
    return (
      <main className="notice">
        <h1>You have left the class</h1>
        <p>You can rejoin with the same link while the class is running.</p>
        <button type="button" onClick={join} disabled={pending}>
          Rejoin
        </button>
      </main>
    );
  }

  return (
    <main className="notice">
      <h1>Ready to join</h1>
      <p className="muted">{slug}</p>
      {error ? <p className="error">{error}</p> : null}
      <button type="button" onClick={join} disabled={pending || !daily}>
        {pending ? "Joining…" : "Join class"}
      </button>
    </main>
  );
}

function Stage({ onLeave }) {
  const localSessionId = useLocalSessionId();
  const remoteIds = useParticipantIds({ filter: "remote" });

  return (
    <main className="stage">
      <div className="remote">
        {remoteIds.length === 0 ? (
          <p className="waiting">Waiting for the other person to join…</p>
        ) : (
          remoteIds.map((id) => (
            <DailyVideo key={id} sessionId={id} type="video" automirror={false} />
          ))
        )}
      </div>

      {localSessionId ? (
        <DailyVideo
          className="self"
          sessionId={localSessionId}
          type="video"
          mirror
        />
      ) : null}

      <div className="controls">
        <MediaToggle kind="audio" />
        <MediaToggle kind="video" />
        <button type="button" className="leave" onClick={onLeave}>
          Leave
        </button>
      </div>

      {/* Renders every remote audio track; without it the call is silent. */}
      <DailyAudio />
    </main>
  );
}

const LABELS = {
  audio: { on: "Mute", off: "Unmute" },
  video: { on: "Stop video", off: "Start video" },
};

function MediaToggle({ kind }) {
  const daily = useDaily();
  const [on, setOn] = useState(true);

  const toggle = useCallback(() => {
    const next = !on;
    if (kind === "audio") {
      daily.setLocalAudio(next);
    } else {
      daily.setLocalVideo(next);
    }
    setOn(next);
  }, [daily, kind, on]);

  return (
    <button type="button" onClick={toggle}>
      {on ? LABELS[kind].on : LABELS[kind].off}
    </button>
  );
}
