import { useEffect, useState } from 'react';

// Formats a number of seconds as HH:MM:SS.
export function secsToHMS(total) {
  const s = Math.max(0, Math.floor(Number(total) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(ss)}`;
}

// Parses "HH:MM:SS", "MM:SS", or a bare number of seconds into seconds.
export function hmsToSecs(str) {
  if (str == null) return 0;
  const parts = String(str).trim().split(':');
  if (parts.length === 1) return Math.max(0, Math.floor(Number(parts[0]) || 0));
  const nums = parts.map((p) => Number(p) || 0);
  let h = 0, m = 0, s = 0;
  if (parts.length >= 3) [h, m, s] = nums.slice(-3);
  else [m, s] = nums;
  return Math.max(0, h * 3600 + m * 60 + s);
}

// Text input that shows HH:MM:SS but reports whole seconds to onChange (on blur).
// Storage stays in seconds so the video player can seek/compare directly.
export default function TimeInput({ value, onChange, className = 'input w-28' }) {
  const [text, setText] = useState(secsToHMS(value));

  // Re-sync when the underlying value changes (e.g. switching lessons/markers).
  useEffect(() => {
    setText(secsToHMS(value));
  }, [value]);

  function commit() {
    const secs = hmsToSecs(text);
    setText(secsToHMS(secs)); // normalize the display (e.g. "90" → "00:01:30")
    onChange(secs);
  }

  return (
    <input
      className={className}
      value={text}
      placeholder="hh:mm:ss"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
    />
  );
}
