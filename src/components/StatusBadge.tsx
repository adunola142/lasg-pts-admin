import { AlertTriangle, CheckCircle2, Circle, XCircle } from "lucide-react";

// Status colors are reserved for state and always paired with an icon +
// label — never color alone (see the dataviz skill's status-palette
// rule). One mapping used everywhere a status appears: badges, stat
// tiles, and chart bars alike.
type Tone = "good" | "warning" | "critical" | "neutral";

const STATUS_TONE: Record<string, Tone> = {
  PENDING: "warning",
  VERIFIED: "good",
  REJECTED: "critical",
  OPEN: "warning",
  RESOLVED: "good",
  DISMISSED: "critical",
  DELIVERED: "good",
  FAILED: "critical",
  RESCHEDULED: "warning",
};

// Solid, filled pills (not soft tints) to match the reference
// dashboard's look. Label color follows the dataviz skill's rule for
// text inside a filled swatch: white, except on the warning/amber
// step, which is light enough to need dark ink instead.
const TONE_STYLES: Record<Tone, { bg: string; fg: string; Icon: typeof Circle }> = {
  good: { bg: "bg-status-good", fg: "text-white", Icon: CheckCircle2 },
  warning: { bg: "bg-status-warning", fg: "text-[#1a1203]", Icon: AlertTriangle },
  critical: { bg: "bg-status-critical", fg: "text-white", Icon: XCircle },
  neutral: { bg: "bg-gray-400 dark:bg-white/20", fg: "text-white", Icon: Circle },
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  const { bg, fg, Icon } = TONE_STYLES[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${bg} ${fg}`}>
      <Icon size={13} strokeWidth={2.5} />
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function statusTone(status: string): Tone {
  return STATUS_TONE[status] ?? "neutral";
}

export const TONE_HEX: Record<Tone, string> = {
  good: "#16a34a",
  warning: "#b45309",
  critical: "#dc2626",
  neutral: "#9ca3af",
};
