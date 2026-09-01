"use client";

/**
 * The call.
 *
 * The layout is built from daily-react's hooks rather than Daily's
 * prebuilt frame because phase 5 puts a teaching UI in this space, and a
 * prebuilt room is the one thing that would leave nowhere to put it.
 *
 * Three things about the shape of this file are deliberate:
 *
 * - **The stage is a grid, not a stack.** The controls are a row of the
 *   grid rather than an overlay, so they cannot sit on top of a face.
 *   The video area is a sibling above them, which is the whole reason
 *   the earlier absolutely-positioned control bar was replaced.
 * - **A name is asked for before joining.** It is what the initial on a
 *   closed camera is drawn from, so there is nothing sensible to render
 *   without it. It is not an identity and is not verified — see the note
 *   on JoinCard.
 * - **Chat holds no history.** Messages ride on `sendAppMessage`, which
 *   reaches whoever is in the room at the time; there is no database in
 *   phase 1 to keep anything in. See class/lib/chat.ts.
 * - **Screen sharing is offered only where the browser can do it.** See
 *   `useCanScreenShare` — the check is a capability, not a guess at the
 *   device.
 * - **Every tile is the shape of what is inside it**, so no video is
 *   ever cropped. See class/lib/video-fit.ts.
 */
import {
  DailyAudio,
  DailyProvider,
  DailyVideo,
  useAppMessage,
  useCallObject,
  useDaily,
  useLocalSessionId,
  useMeetingState,
  useParticipantIds,
  useParticipantProperty,
  useScreenShare,
  useVideoTrack,
} from "@daily-co/daily-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

import { MAX_CHAT_TEXT, buildChatPayload, parseChatPayload } from "@/lib/chat";
import { initial } from "@/lib/initials";
import { describeScreenShareError } from "@/lib/screen-share";
import { tileRatio } from "@/lib/video-fit";

/**
 * Must match `basePath` in next.config.ts: fetch does not know about it,
 * so the one place a URL is written by hand is here.
 */
const JOIN_ENDPOINT = "/class/api/join";

const MESSAGES: Record<string, string> = {
  "not-valid": "This link is not valid any more. Ask for a new one.",
  "room-unavailable":
    "The class room could not be opened. Try again in a moment.",
  "token-unavailable":
    "Could not get permission to join. Try again in a moment.",
};

/** Shown for a participant who somehow has no name at all. */
const UNNAMED = "Guest";

interface JoinResponse {
  roomUrl: string;
  meetingToken: string;
}

export default function CallClient({
  token,
  slug,
}: {
  token: string;
  slug?: string;
}) {
  const callObject = useCallObject({});

  return (
    <DailyProvider callObject={callObject}>
      <Call token={token} slug={slug} />
    </DailyProvider>
  );
}

function Call({ token, slug }: { token: string; slug?: string }) {
  const daily = useDaily();
  const meetingState = useMeetingState();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = useCallback(
    async (userName: string) => {
      if (!daily) return;

      setPending(true);
      setError(null);

      try {
        const response = await fetch(JOIN_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(
            (body.error && MESSAGES[body.error]) ?? "Could not start the class.",
          );
        }

        const { roomUrl, meetingToken } =
          (await response.json()) as JoinResponse;
        await daily.join({ url: roomUrl, token: meetingToken, userName });
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Could not start the class.",
        );
      } finally {
        setPending(false);
      }
    },
    [daily, token],
  );

  if (meetingState === "joined-meeting") {
    return <Stage onLeave={() => void daily?.leave()} />;
  }

  // The name survives leaving, so rejoining is one click rather than a
  // second round of typing.
  if (meetingState === "left-meeting") {
    return (
      <main className="notice">
        <h1>You have left the class</h1>
        <p>You can rejoin with the same link while the class is running.</p>
        {error ? <p className="error">{error}</p> : null}
        <button type="button" onClick={() => void join(name)} disabled={pending}>
          {pending ? "Rejoining…" : "Rejoin"}
        </button>
      </main>
    );
  }

  return (
    <JoinCard
      slug={slug}
      name={name}
      onNameChange={setName}
      onJoin={() => void join(name)}
      pending={pending || !daily}
      error={error}
    />
  );
}

/**
 * Ask for a name, then join.
 *
 * The name is a label, not an identity: nothing is checked against it and
 * nothing is authorised by it — the signed link already decided who gets
 * in. It exists because a closed camera has to show *something*, and an
 * initial is what the room layout asks for. That is also why it is only
 * required to be non-blank.
 */
function JoinCard({
  slug,
  name,
  onNameChange,
  onJoin,
  pending,
  error,
}: {
  slug?: string;
  name: string;
  onNameChange: (value: string) => void;
  onJoin: () => void;
  pending: boolean;
  error: string | null;
}) {
  const ready = name.trim() !== "" && !pending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (ready) onJoin();
  };

  return (
    <main className="notice">
      <h1>Ready to join</h1>
      {slug ? <p className="muted">{slug}</p> : null}

      <form className="join-form" onSubmit={submit}>
        <label>
          Your name
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="How the other person will see you"
            autoComplete="name"
            maxLength={60}
            autoFocus
            required
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button type="submit" disabled={!ready}>
          {pending ? "Joining…" : "Join class"}
        </button>
      </form>
    </main>
  );
}

function Stage({ onLeave }: { onLeave: () => void }) {
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const remoteIds = useParticipantIds({ filter: "remote" });
  const canScreenShare = useCanScreenShare();
  const [shareError, setShareError] = useState<string | null>(null);

  const { isSharingScreen, screens, startScreenShare, stopScreenShare } =
    useScreenShare({
      // Silent on a cancelled picker, loud on anything else — see
      // class/lib/screen-share.ts for why that is the right way round.
      onError: (event) => setShareError(describeScreenShareError(event.errorMsg)),
      onLocalScreenShareStarted: () => setShareError(null),
    });

  // At most two people are in the room, so at most one shared screen is
  // worth showing; if both somehow share, the first is the one on stage.
  const screen = screens[0];
  const remoteId = remoteIds[0];

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [unread, setUnread] = useState(0);

  // Read inside the app-message callback, which daily-react registers
  // once: reading `chatOpen` there directly would capture the value from
  // the render that registered it and count every message as unread.
  const chatOpenRef = useRef(chatOpen);
  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  const nextId = useRef(0);
  const addMessage = useCallback((entry: Omit<ChatEntry, "id">) => {
    setMessages((current) => [...current, { ...entry, id: nextId.current++ }]);
  }, []);

  const sendAppMessage = useAppMessage({
    onAppMessage: (event) => {
      const text = parseChatPayload(event.data);
      if (text === null) return;

      // The name comes from Daily's participant record rather than from
      // the message, so a peer cannot send one that appears to be from
      // the other person. See class/lib/chat.ts.
      const sender = event.fromId
        ? daily?.participants()?.[event.fromId]
        : undefined;

      addMessage({ name: sender?.user_name?.trim() || UNNAMED, text, mine: false });
      if (!chatOpenRef.current) setUnread((count) => count + 1);
    },
  });

  const send = useCallback(
    (text: string) => {
      const payload = buildChatPayload(text);
      if (payload === null) return;

      sendAppMessage(payload, "*");

      // sendAppMessage does not loop back to the sender, so the local
      // copy of a sent message is added here rather than arriving as an
      // event like the other person's does.
      addMessage({ name: "You", text: payload.text, mine: true });
    },
    [addMessage, sendAppMessage],
  );

  const toggleChat = useCallback(() => {
    setChatOpen((open) => {
      if (!open) setUnread(0);
      return !open;
    });
  }, []);

  return (
    <main className="stage">
      <div className="stage-main">
        {/*
          One large tile and a column of small ones. What is large
          changes: a shared screen outranks a face, because the screen is
          what is being talked about. The faces do not disappear for it —
          they move to the inset column, which is why that column can
          hold two tiles rather than only the self view.
        */}
        <div className="videos">
          {screen ? (
            <ScreenTile sessionId={screen.session_id} local={screen.local} />
          ) : remoteId ? (
            <VideoTile sessionId={remoteId} showName main />
          ) : (
            <div className="tile tile-main tile-empty">
              <p className="waiting">Waiting for the other person to join…</p>
            </div>
          )}

          {/*
            Self first, which `column-reverse` puts at the bottom: the
            self view then stays exactly where it was when a screen share
            starts, and the remote camera appears above it rather than
            shunting it upward.
          */}
          <div className="insets">
            {localSessionId ? (
              <VideoTile sessionId={localSessionId} self inset />
            ) : null}
            {screen && remoteId ? (
              <VideoTile sessionId={remoteId} showName inset />
            ) : null}
          </div>
        </div>

        <ChatPanel
          open={chatOpen}
          messages={messages}
          onSend={send}
          onClose={() => setChatOpen(false)}
        />
      </div>

      {shareError ? (
        <p className="stage-error" role="status">
          {shareError}
          <button
            type="button"
            className="stage-error-dismiss"
            onClick={() => setShareError(null)}
            aria-label="Dismiss"
          >
            <CloseIcon />
          </button>
        </p>
      ) : null}

      <div className="controls">
        <MediaToggle kind="audio" />
        <MediaToggle kind="video" />
        {canScreenShare ? (
          <button
            type="button"
            className={isSharingScreen ? "icon-button off" : "icon-button"}
            onClick={() => {
              setShareError(null);
              if (isSharingScreen) stopScreenShare();
              else startScreenShare();
            }}
            aria-label={isSharingScreen ? "Stop sharing screen" : "Share screen"}
            aria-pressed={isSharingScreen}
            title={isSharingScreen ? "Stop sharing screen" : "Share screen"}
          >
            <ScreenIcon on={!isSharingScreen} />
          </button>
        ) : null}
        <button
          type="button"
          className="icon-button leave"
          onClick={onLeave}
          aria-label="Leave the class"
          title="Leave the class"
        >
          <LeaveIcon />
        </button>
        <button
          type="button"
          className="icon-button chat-toggle"
          onClick={toggleChat}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          aria-expanded={chatOpen}
          title={chatOpen ? "Close chat" : "Open chat"}
        >
          <ChatIcon />
          {/* Only meaningful while the panel is shut — an unread count
              next to an open chat is a count of messages being read. */}
          {!chatOpen && unread > 0 ? (
            <span className="badge" aria-label={`${unread} unread messages`}>
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>
      </div>

      {/* Renders every remote audio track; without it the call is silent. */}
      <DailyAudio />
    </main>
  );
}

/**
 * Whether this browser can share a screen at all.
 *
 * A capability, deliberately, rather than a guess at the device: no
 * mobile or tablet browser implements `getDisplayMedia` — not iOS
 * Safari, not Chrome on Android — so asking the browser what it can do
 * answers "is this a computer?" as ground truth instead of by sniffing a
 * user agent or a viewport width. A desktop browser in a narrow window
 * keeps the feature, and a touchscreen laptop keeps it too, because both
 * of those really can share a screen.
 *
 * Read in an effect rather than during render: `navigator` does not
 * exist while this is being server-rendered, and a value that differs
 * between the server and the first client render is a hydration
 * mismatch. Starting false means the button appears a frame late on a
 * computer, which is the harmless direction to be wrong in.
 */
function useCanScreenShare(): boolean {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(
      typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getDisplayMedia === "function",
    );
  }, []);

  return canShare;
}

/**
 * One participant's video, with the two things a black rectangle cannot
 * say on its own: whose it is, and that the camera is off rather than
 * broken.
 *
 * The video element stays mounted when the camera is off and the initial
 * is drawn over it. Unmounting instead would make every toggle tear down
 * and rebuild a track subscription, which shows up as a flash of black
 * when the camera comes back.
 */
function VideoTile({
  sessionId,
  self = false,
  showName = false,
  main = false,
  inset = false,
}: {
  sessionId: string;
  self?: boolean;
  showName?: boolean;
  main?: boolean;
  inset?: boolean;
}) {
  const videoTrack = useVideoTrack(sessionId);
  const userName = useParticipantProperty(sessionId, "user_name");
  const name = userName?.trim() || UNNAMED;

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const className = [
    "tile",
    main ? "tile-main" : "",
    inset ? "tile-inset" : "",
    self ? "tile-self" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // The tile is the shape of the stream — square while the camera is
  // off. `--tile-ratio` is the same number as a bare unitless value,
  // which the stylesheet needs separately from `aspect-ratio` because
  // sizing the large tile to fit its container has to multiply by it.
  const ratio = tileRatio(aspectRatio, { cameraOff: videoTrack.isOff });

  return (
    <div
      className={className}
      style={
        { aspectRatio: String(ratio), "--tile-ratio": String(ratio) } as CSSProperties
      }
    >
      <DailyVideo
        sessionId={sessionId}
        type="video"
        automirror={self}
        // The box already matches the media, so `contain` crops nothing;
        // it only guards the frame or two before the ratio is known.
        fit="contain"
        onResize={({ aspectRatio: reported }) => setAspectRatio(reported)}
      />

      {videoTrack.isOff ? (
        <div className="tile-initial">
          <span aria-hidden="true">{initial(name)}</span>
          <span className="visually-hidden">{name}, camera off</span>
        </div>
      ) : null}

      {showName ? <span className="tile-name">{name}</span> : null}
    </div>
  );
}

/**
 * Somebody's shared screen.
 *
 * Always `contain`, unlike a camera: cropping a face loses a chin, and
 * cropping a screen loses whatever was in the corner that was cut off —
 * a line of code, a slide's title. There is no version of this where
 * filling the tile is worth hiding content the sharer meant to show.
 */
function ScreenTile({
  sessionId,
  local,
}: {
  sessionId: string;
  local: boolean;
}) {
  const userName = useParticipantProperty(sessionId, "user_name");
  const name = userName?.trim() || UNNAMED;
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  // A screen has a shape too, and it is rarely 16:9 — a window on a
  // tall monitor is nothing like a webcam. Taking the shared surface's
  // own ratio is what keeps the corner of a slide or a line of code from
  // being cut off.
  const ratio = tileRatio(aspectRatio);

  return (
    <div
      className="tile tile-main tile-screen"
      style={
        { aspectRatio: String(ratio), "--tile-ratio": String(ratio) } as CSSProperties
      }
    >
      <DailyVideo
        sessionId={sessionId}
        type="screenVideo"
        fit="contain"
        onResize={({ aspectRatio: reported }) => setAspectRatio(reported)}
      />
      <span className="tile-name">
        {local ? "Your screen" : `${name}'s screen`}
      </span>
    </div>
  );
}

interface ChatEntry {
  id: number;
  name: string;
  text: string;
  mine: boolean;
}

function ChatPanel({
  open,
  messages,
  onSend,
  onClose,
}: {
  open: boolean;
  messages: ChatEntry[];
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view, both when one arrives and when the
  // panel is opened onto a backlog.
  useEffect(() => {
    const list = listRef.current;
    if (list && open) list.scrollTop = list.scrollHeight;
  }, [messages, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSend(draft);
    setDraft("");
  };

  return (
    <aside
      className="chat"
      data-open={open}
      aria-label="Chat"
      // Keeps the closed panel out of the tab order and away from screen
      // readers without unmounting it, which is what lets it animate.
      inert={!open}
    >
      <header className="chat-header">
        <h2>Chat</h2>
        <button
          type="button"
          className="icon-button chat-close"
          onClick={onClose}
          aria-label="Close chat"
          title="Close chat"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="chat-messages" ref={listRef} aria-live="polite">
        {messages.length === 0 ? (
          <p className="muted chat-empty">
            Messages sent during this class appear here.
          </p>
        ) : (
          messages.map((message) => (
            <p
              key={message.id}
              className={message.mine ? "message mine" : "message"}
            >
              <span className="message-name">{message.name}</span>
              <span className="message-text">{message.text}</span>
            </p>
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message"
          maxLength={MAX_CHAT_TEXT}
          aria-label="Message"
        />
        <button type="submit" disabled={draft.trim() === ""}>
          Send
        </button>
      </form>
    </aside>
  );
}

type MediaKind = "audio" | "video";

const LABELS: Record<MediaKind, { on: string; off: string }> = {
  audio: { on: "Mute microphone", off: "Unmute microphone" },
  video: { on: "Turn camera off", off: "Turn camera on" },
};

function MediaToggle({ kind }: { kind: MediaKind }) {
  const daily = useDaily();
  const [on, setOn] = useState(true);

  const toggle = useCallback(() => {
    if (!daily) return;

    const next = !on;
    if (kind === "audio") {
      daily.setLocalAudio(next);
    } else {
      daily.setLocalVideo(next);
    }
    setOn(next);
  }, [daily, kind, on]);

  const label = on ? LABELS[kind].on : LABELS[kind].off;

  return (
    <button
      type="button"
      className={on ? "icon-button" : "icon-button off"}
      onClick={toggle}
      aria-label={label}
      aria-pressed={!on}
      title={label}
    >
      {kind === "audio" ? <MicIcon on={on} /> : <CameraIcon on={on} />}
    </button>
  );
}

/*
  Icons are inline SVG rather than a library: there are five of them, and
  a dependency that ships hundreds would be most of a megabyte for the
  privilege of not writing these paths. `currentColor` lets the button
  states below drive them.
*/

const SVG = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

/** A line through the icon, for the "off" half of a toggle. */
function Slash() {
  return <line x1="3" y1="21" x2="21" y2="3" />;
}

function MicIcon({ on }: { on: boolean }) {
  return (
    <svg {...SVG}>
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      {on ? null : <Slash />}
    </svg>
  );
}

function CameraIcon({ on }: { on: boolean }) {
  return (
    <svg {...SVG}>
      <rect x="2" y="6" width="13" height="12" rx="2.5" />
      <path d="M15 10.5 22 7v10l-7-3.5z" />
      {on ? null : <Slash />}
    </svg>
  );
}

function ScreenIcon({ on }: { on: boolean }) {
  return (
    <svg {...SVG}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      {on ? null : <Slash />}
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg {...SVG}>
      <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 0 1 11 4h2a8 8 0 0 1 8 8z" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg {...SVG}>
      <path d="M2.5 15.5a16 16 0 0 1 19 0l-2.5 3-4-1.5v-2.6a12 12 0 0 0-6 0V17l-4 1.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg {...SVG}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}
