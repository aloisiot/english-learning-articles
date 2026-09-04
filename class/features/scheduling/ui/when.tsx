/**
 * An instant, written in the reader's own zone.
 *
 * Every stored time is UTC (04 §1) and this is the only thing that turns
 * one back into words, so that "which zone is this in" has one answer
 * everywhere in the app.
 */
export function When({
  instant,
  timeZone,
  withZone = false,
}: {
  instant: Date;
  timeZone: string;
  withZone?: boolean;
}) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    ...(withZone ? { timeZoneName: "short" as const } : {}),
  }).format(instant);

  return <time dateTime={instant.toISOString()}>{formatted}</time>;
}
