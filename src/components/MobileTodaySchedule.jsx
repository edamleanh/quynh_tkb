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


  // Định dạng giờ SA/CH
  function fmtTimeSA(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const suffix = h < 12 ? "S" : "C";
    const base = ((h + 11) % 12) + 1;
    return `${base}:${m.toString().padStart(2, "0")} ${suffix}`;
  }


  // Lấy thời gian hiện tại (giờ:phút) ở GMT+7
  function getNowTimeStr() {
    const d = now.tzDate;
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  }

  // So sánh thời gian dạng "HH:mm"
  function compareTime(a, b) {
    return a.localeCompare(b);
  }

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
                const nowTime = getNowTimeStr();
                let bg = "bg-blue-50";
                if (compareTime(ev.end, nowTime) <= 0) {
                  bg = "bg-red-100"; // đã diễn ra
                } else if (compareTime(ev.start, nowTime) <= 0 && compareTime(nowTime, ev.end) < 0) {
                  bg = "bg-green-100"; // đang diễn ra
                } else if (compareTime(ev.start, nowTime) > 0) {
                  bg = "bg-blue-100"; // chưa diễn ra
                }
                return (
                  <div key={ev.id} className={`rounded-lg border px-3 py-2 flex flex-col ${bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success" className="h-5 text-xs whitespace-nowrap">{subj?.name || ev.subject}</Badge>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ev.type === "chinhthuc" ? "bg-blue-200 text-blue-800" : ev.type === "hocthem" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>{typeLabel}</span>
                    </div>
                    <div className="text-sm font-semibold">{fmtTimeSA(ev.start)} – {fmtTimeSA(ev.end)}</div>
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
