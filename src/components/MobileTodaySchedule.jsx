import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Nhận props: events (toàn bộ), extraSubjects, OFFICIAL_SUBJECTS
export default function MobileTodaySchedule({ events, extraSubjects, officialSubjects }) {
  // Lấy thứ hiện tại GMT+7
  const now = React.useMemo(() => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const tzDate = new Date(utc + 7 * 3600000);
    const weekdayMap = ["CN", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = weekdayMap[tzDate.getDay()];
    return { tzDate, weekday };
  }, []);

  // Lọc sự kiện hôm nay
  const todayEvents = React.useMemo(() => {
    return events
      .filter(ev => ev.day === now.weekday)
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [events, now.weekday]);

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center p-2">
      <Card className="w-full max-w-md mt-2">
        <CardHeader>
          <CardTitle className="text-lg text-center">Lịch hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center text-gray-500">Không có lịch nào hôm nay</div>
          ) : (
            <div className="flex flex-col gap-3">
              {todayEvents.map(ev => {
                const subj = (officialSubjects.concat(extraSubjects)).find(x => x.id === ev.subject);
                const typeLabel = ev.type === "chinhthuc" ? "Chính thức" : (ev.type === "hocthem" ? "Học thêm" : "Khác");
                return (
                  <div key={ev.id} className="rounded-lg border px-3 py-2 bg-blue-50 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="h-5 text-xs whitespace-nowrap">{subj?.name || ev.subject}</Badge>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ev.type === "chinhthuc" ? "bg-blue-200 text-blue-800" : ev.type === "hocthem" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>{typeLabel}</span>
                    </div>
                    <div className="text-sm font-semibold">{ev.start} – {ev.end}</div>
                    {ev.note && <div className="text-xs text-gray-500 mt-1">{ev.note}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
