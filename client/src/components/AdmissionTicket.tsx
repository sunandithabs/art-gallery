import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type AdmissionTicketProps = {
  onOpened: () => void;
};

function playPaperTear() {
  try {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const duration = 0.22;
    const buffer = context.createBuffer(1, context.sampleRate * duration, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      const envelope = Math.pow(1 - index / data.length, 2.2);
      data[index] = (Math.random() * 2 - 1) * envelope;
    }

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 2200;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, context.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter).connect(gain).connect(context.destination);
    source.start();
    source.stop(context.currentTime + duration);
    source.addEventListener("ended", () => void context.close(), { once: true });
  } catch {
    // Audio is optional; the visual interaction remains complete without it.
  }
}

function TicketArtwork() {
  return (
    <div className="ticket-artwork" aria-hidden="true">
      <div className="ticket-rule ticket-rule-top" />
      <div className="ticket-copy">
        <p className="ticket-kicker">ANAGHA’S ART GALLERY · EST. 2004</p>
        <p className="ticket-exhibition">SPECIAL EXHIBITION</p>
        <p className="ticket-admit">ADMIT ONE</p>
      </div>
      <div className="ticket-details">
        <span>NO. 0915 · ONE GUEST</span>
        <span>VALID FOR ONE EVENING</span>
      </div>
      <div className="ticket-issue">SPECIAL COLLECTION / ANAGHA</div>
      <div className="ticket-stamp">AG<br /><small>ADMIT</small></div>
      <div className="ticket-barcode" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
      <div className="ticket-rule ticket-rule-bottom" />
    </div>
  );
}

export default function AdmissionTicket({ onOpened }: AdmissionTicketProps) {
  const ticketRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);

  const updateProgress = (clientY: number) => {
    const ticket = ticketRef.current;
    if (!ticket) return;
    const bounds = ticket.getBoundingClientRect();
    const inset = Math.min(30, bounds.height * 0.12);
    const nextProgress = Math.max(0, Math.min(1, (clientY - bounds.top - inset) / (bounds.height - inset * 2)));
    progressRef.current = nextProgress;
    setProgress(nextProgress);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isOpening) return;
    pointerId.current = event.pointerId;
    startX.current = event.clientX;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some preview harnesses do not allow capture for synthetic pointers.
    }
    setIsDragging(true);
    updateProgress(event.clientY);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerId.current !== event.pointerId || isOpening) return;
    if (Math.abs(event.clientX - startX.current) > 90) return;
    updateProgress(event.clientY);
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerId.current !== event.pointerId || isOpening) return;
    pointerId.current = null;
    setIsDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture is optional for the drag-to-open interaction.
    }

    if (progressRef.current >= 0.84) {
      setProgress(1);
      progressRef.current = 1;
      setIsOpening(true);
      playPaperTear();
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 120 : 1650;
      window.setTimeout(onOpened, delay);
    } else {
      progressRef.current = 0;
      setProgress(0);
    }
  };

  return (
    <section className={`admission-stage ${isOpening ? "is-opening" : ""}`} aria-label="Museum admission ticket">
      <div
        ref={ticketRef}
        className={`admission-ticket ${isDragging ? "is-dragging" : ""}`}
        style={{ "--tear-progress": progress } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="ticket-half ticket-half-left">
          <TicketArtwork />
        </div>
        <div className="ticket-half ticket-half-right">
          <TicketArtwork />
        </div>
        <div className="ticket-tear-line" aria-hidden="true" />
        <div className="ticket-notch ticket-notch-left" aria-hidden="true" />
        <div className="ticket-notch ticket-notch-right" aria-hidden="true" />
        <div className="ticket-grip" aria-hidden="true">
          <span />
        </div>
      </div>
      <p className="ticket-instruction">Drag down to enter</p>
    </section>
  );
}
