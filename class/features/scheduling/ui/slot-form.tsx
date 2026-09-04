"use client";

/**
 * The tutor types a wall-clock time; the server stores an instant.
 *
 * The zone is shown rather than assumed, because "19:00" with no zone is
 * exactly the ambiguity 04 §1 exists to remove.
 */
import { useState } from "react";

export default function SlotForm({ timeZone }: { timeZone: string }) {
  const [value, setValue] = useState("");

  return (
    <form method="post" action="/class/api/slots" className="stack">
      <label>
        Date and time
        <input
          type="datetime-local"
          name="local_datetime"
          value={value}
          required
          onChange={(event) => setValue(event.target.value)}
        />
      </label>

      <label>
        Length
        <select name="duration_minutes" defaultValue="30">
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
        </select>
      </label>

      <p className="hint">
        Times are in your timezone, <strong>{timeZone}</strong>. A student
        sees the same moment written in theirs.
      </p>

      <button type="submit">Open this time</button>
    </form>
  );
}
