import React from "react";
import { Badge } from "./ui/badge";
import { OFFICIAL_SUBJECTS } from "../lib/subjectConstants";
// Helper functions (copy from App.jsx)
function minutesFrom0700(timeHHmm) {
  const [hStr, mStr] = timeHHmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  return (h - 7) * 60 + m;
}
function clampToRange(mins) {
  return Math.max(0, Math.min(900, mins));
}
const MINUTES_PER_HOUR = 60;
const HOUR_HEIGHT = 36;
const MIN_HEIGHT = 1;

export default function MobileDayColumn({ day, events, onDelete, label, extraSubjects }) {
  return (
    <div className="relative border-l" title={label}>
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="h-[36px]" />
      ))}
      <div className="absolute inset-0">
        {events
          .slice()
          .sort((a, b) => minutesFrom0700(a.start) - minutesFrom0700(b.start))
          .map((ev) => {
            const sM = clampToRange(minutesFrom0700(ev.start));
            const eM = clampToRange(minutesFrom0700(ev.end));
            const topPx = (sM / MINUTES_PER_HOUR) * HOUR_HEIGHT;
            const heightPx = Math.max(MIN_HEIGHT, ((eM - sM) / MINUTES_PER_HOUR) * HOUR_HEIGHT);
            const subj = (OFFICIAL_SUBJECTS.concat(extraSubjects)).find(x => x.id === ev.subject);
            const color = subj?.color ?? "bg-gray-100 text-gray-700 border-gray-300";
            return (
              <div
                key={ev.id}
                className={`absolute left-0.5 right-0.5 rounded border px-1.5 py-0.5 shadow-sm text-[10px] ${color}`}
                style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                title={`${ev.title} • ${ev.start}–${ev.end}`}
              >
                <div className="mt-0.5">{ev.start} – {ev.end}</div>
                {ev.note && <div className="mt-0.5 italic text-gray-500 line-clamp-2">{ev.note}</div>}
                <div className={`mt-1 flex ${ev.type === "hocthem" ? "flex-col items-start gap-0.5" : "flex-row items-center gap-1"}`}>
                  <Badge variant="outline" className="h-5 whitespace-nowrap">{subj?.name || ev.subject}</Badge>
                  {ev.type === "hocthem" && (
                    <Badge variant="destructive" className="h-5 whitespace-nowrap mt-0.5">Học thêm</Badge>
                  )}
                  {ev.type === "chinhthuc" && (
                    <Badge variant="success" className="h-5 whitespace-nowrap mt-0.5">Trường</Badge>
                  )}
                </div>
                <button
                  onClick={() => onDelete(ev.id)}
                  className="absolute right-1 top-1 text-[10px] opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}