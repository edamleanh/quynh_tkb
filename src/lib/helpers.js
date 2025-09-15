// src/lib/helpers.js

import { START_HOUR, END_HOUR, TOTAL_MIN } from "./constants";

export function minutesFrom0700(timeHHmm) {
  // timeHHmm dạng "HH:MM" (24h). Trả về số phút kể từ 07:00.
  const [hStr, mStr] = timeHHmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return (h - START_HOUR) * 60 + m;
}

export function clampToRange(mins) {
  // Giới hạn sự kiện nằm trong [0, TOTAL_MIN]
  return Math.max(0, Math.min(TOTAL_MIN, mins));
}

export function toPct(mins) {
  return `${(mins / TOTAL_MIN) * 100}%`;
}

export function fmtHourLabel(h) {
  // 7 -> "7 AM", 13 -> "1 PM"
  const suffix = h < 12 ? "AM" : "PM";
  const base = ((h + 11) % 12) + 1;
  return `${base} ${suffix}`;
}

export const rid = () => Math.random().toString(36).slice(2, 9);
