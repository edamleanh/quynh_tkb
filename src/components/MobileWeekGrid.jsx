import React, { useMemo } from "react";
import MobileDayColumn from "./MobileDayColumn";
const DAYS = [
  { id: "Mon", label: "Thứ 2" },
  { id: "Tue", label: "Thứ 3" },
  { id: "Wed", label: "Thứ 4" },
  { id: "Thu", label: "Thứ 5" },
  { id: "Fri", label: "Thứ 6" },
  { id: "Sat", label: "Thứ 7" },
  { id: "CN", label: "Chủ nhật" },
];

export default function MobileWeekGrid({ events, onDelete, extraSubjects }) {
  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map(d => [d.id, []]));
    events.forEach(ev => { if (map[ev.day]) map[ev.day].push(ev); });
    return map;
  }, [events]);
  return (
    <div className="w-full">
      <div
        className="grid"
        style={{
          gridTemplateColumns: '40px repeat(7, minmax(0, 1fr))',
        }}
      >
        <div className="hidden sm:block" />
        {DAYS.map(d => (
          <div
            key={`head-${d.id}`}
            className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-1 py-1 font-semibold text-[11px] text-center"
          >
            {d.label}
          </div>
        ))}
        <div className="border-r hidden sm:block" />
        {DAYS.map(d => (
          <MobileDayColumn key={d.id} day={d.id} events={byDay[d.id]} onDelete={onDelete} label={d.label} extraSubjects={extraSubjects} />
        ))}
      </div>
    </div>
  );
}