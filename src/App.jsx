import MobileTodaySchedule from "./components/MobileTodaySchedule";
import { getDefaultExtraSubjects, useExtraSubjects, isOverlap } from "./lib/appFunctions";
import { minutesFrom0700, clampToRange, toPct, fmtHourLabel, rid } from "./lib/helpers";
import { DAYS, START_HOUR, END_HOUR, TOTAL_MIN, OFFICIAL_SUBJECTS } from "./lib/constants";
import React, { useMemo, useState, useEffect } from "react"
import { saveTimetable, loadTimetable } from "./lib/firebase"

// ⬇️ Nếu chưa có alias "@/...", hãy đổi sang "./components/ui/..."
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
// Simple Label component (do not import)
function Label({ children, className = "", ...props }) {
  return <label className={"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 " + className} {...props}>{children}</label>;
}
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

function ExtraSubjectsManager({ open, onOpenChange, extraSubjects, setExtraSubjects }) {
  const [name, setName] = React.useState("");

  function getUsedColors() {
    const officialColors = OFFICIAL_SUBJECTS.map(s => s.color);
    const extraColors = extraSubjects.map(s => s.color);
    return new Set([...officialColors, ...extraColors]);
  }

  function pickColor() {
    return "bg-green-100 text-green-700 border-green-300";
  }

  function addSubject() {
    if (!name.trim()) return;
    const color = pickColor();
    setExtraSubjects(prev => [...prev, { id: rid(), name: name.trim(), color }]);
    setName("");
  }
  function deleteSubject(id) {
    setExtraSubjects(prev => prev.filter(s => s.id !== id));
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tuỳ chỉnh môn học thêm</DialogTitle>
        </DialogHeader>
        <div className="mb-2 flex flex-wrap gap-2">
          {extraSubjects.map(s => (
            <span key={s.id} className={`px-2 py-1 rounded border text-xs ${s.color} flex items-center gap-1`}>
              {s.name}
              <button className="ml-1 text-red-500 hover:underline" onClick={() => deleteSubject(s.id)}>x</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input className="border rounded px-2 py-1 text-xs" placeholder="Tên môn học thêm..." value={name} onChange={e => setName(e.target.value)} />
          <Button className="px-2 py-1 text-xs" onClick={addSubject}>Thêm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- component thêm/sửa sự kiện ----------
function AddEventDialog({ open, onOpenChange, onAdd, onUpdate, editingEvent, extraSubjects, events }) {
  const [day, setDay] = useState("Mon")
  const [type, setType] = useState("chinhthuc")
  const [subject, setSubject] = useState("")
  const [start, setStart] = useState("07:00")
  const [end, setEnd] = useState("09:00")
  const [note, setNote] = useState("")

  // Khi mở dialog để sửa, nạp dữ liệu vào form
  React.useEffect(() => {
    if (open && editingEvent) {
      setDay(editingEvent.day || "Mon");
      setType(editingEvent.type || "chinhthuc");
      setSubject(editingEvent.subject || "");
      setStart(editingEvent.start || "07:00");
      setEnd(editingEvent.end || "09:00");
      setNote(editingEvent.note || "");
    } else if (open && !editingEvent) {
      setDay("Mon");
      setType("chinhthuc");
      setSubject("");
      setStart("07:00");
      // Tính giờ kết thúc mặc định dựa trên loại môn học
      let addMin = 45; // chính thức
      let total = 7 * 60 + addMin;
      let newH = Math.floor(total / 60);
      let newM = total % 60;
      const pad = n => n.toString().padStart(2, "0");
      setEnd(`${pad(newH)}:${pad(newM)}`);
      setNote("");
    }
  }, [open, editingEvent]);

  // Khi chọn ngày, tự động set giờ bắt đầu phù hợp
  React.useEffect(() => {
    // Chỉ tự động set giờ bắt đầu khi thêm mới (không phải khi chỉnh sửa)
    if (!day || editingEvent) return;
    const dayEvents = (events || []).filter(ev => ev.day === day)
      .sort((a, b) => minutesFrom0700(a.end) - minutesFrom0700(b.end));
    let newStart = "07:00";
    if (dayEvents.length === 0) {
      newStart = "07:00";
    } else {
      newStart = dayEvents[dayEvents.length - 1].end;
    }
    setStart(newStart);
    // Tự động cập nhật giờ kết thúc phù hợp với loại môn học
    let [h, m] = newStart.split(":").map(Number);
    let addMin = type === "chinhthuc" ? 45 : (type === "hocthem" ? 90 : 0);
    let total = h * 60 + m + addMin;
    let newH = Math.floor(total / 60);
    let newM = total % 60;
    const pad = n => n.toString().padStart(2, "0");
    setEnd(`${pad(newH)}:${pad(newM)}`);
  }, [day, events, open, editingEvent, type]);

  const subjectOptions = type === "chinhthuc" ? OFFICIAL_SUBJECTS : extraSubjects

  React.useEffect(() => {
    if (type === "chinhthuc" && subject && !OFFICIAL_SUBJECTS.some(s => s.id === subject)) {
      setSubject(OFFICIAL_SUBJECTS[0]?.id || "")
    }
    if (type === "hocthem" && subject && !extraSubjects.some(s => s.id === subject)) {
      setSubject(extraSubjects[0]?.id || "")
    }
  }, [type, extraSubjects])

  React.useEffect(() => {
    if (start) {
      const [h, m] = start.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        let addMin = type === "chinhthuc" ? 45 : (type === "hocthem" ? 90 : 0);
        let total = h * 60 + m + addMin;
        let newH = Math.floor(total / 60);
        let newM = total % 60;
        if (newH > END_HOUR) {
          newH = END_HOUR;
          newM = 0;
        }
        const pad = n => n.toString().padStart(2, "0");
        setEnd(`${pad(newH)}:${pad(newM)}`);
      }
    }
  }, [start, type]);

  function submit() {
    if (!subject) {
      alert("Vui lòng chọn môn học!");
      return;
    }
    const s = minutesFrom0700(start)
    const e = minutesFrom0700(end)
    if (isNaN(s) || isNaN(e)) return
    if (e <= s) return alert("Giờ kết thúc phải > giờ bắt đầu.")
    if (s < 0 || e > TOTAL_MIN) {
      const ok = confirm("Sự kiện nằm ngoài khung 7:00–22:00. Vẫn thêm (sẽ tự cắt trong khung)?")
      if (!ok) return
    }
    // Kiểm tra trùng lịch (bỏ qua chính nó nếu đang sửa)
    const overlap = (events || []).some(ev => ev.day === day && (!editingEvent || ev.id !== editingEvent.id) && isOverlap(s, e, minutesFrom0700(ev.start), minutesFrom0700(ev.end)));
    if (overlap) {
      alert("Lịch bị trùng với một sự kiện đã có!");
      return;
    }
    if (editingEvent) {
      onUpdate({
        ...editingEvent,
        day,
        subject,
        type,
        start,
        end,
        note: note.trim(),
      });
    } else {
      onAdd({
        id: rid(),
        day,
        subject,
        type,
        start, end,
        note: note.trim(),
      });
    }
    setStart("07:30")
    setEnd("09:00")
    setNote("")
    setType("chinhthuc")
    onOpenChange(false)
  }

  function handleDelete() {
    if (editingEvent && window.confirm("Bạn có chắc muốn xoá sự kiện này?")) {
      if (typeof onDelete === 'function') {
        e.stopPropagation();
        onDelete(editingEvent.id);
      }
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Chỉnh sửa lịch học" : "Thêm lịch học"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Ngày</Label>
            <div className="col-span-3">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger><SelectValue placeholder="Chọn ngày" /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (<SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Loại</Label>
            <div className="col-span-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chinhthuc">Chính thức</SelectItem>
                  <SelectItem value="hocthem">Học thêm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Môn</Label>
            <div className="col-span-3">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Chọn môn" /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Bắt đầu</Label>
            <Input className="col-span-3" type="time" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Kết thúc</Label>
            <Input className="col-span-3" type="time" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-2">
            <Label className="col-span-1">Ghi chú</Label>
            <Input className="col-span-3" placeholder="Ghi chú..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="mt-2 flex gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit}>{editingEvent ? "Lưu" : "Thêm"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- layout lịch ----------
function WeekGrid({ events, onDelete, extraSubjects, onEdit }) {
  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map(d => [d.id, []]))
    events.forEach(ev => { if (map[ev.day]) map[ev.day].push(ev) })
    return map
  }, [events])

  return (
    <div className="w-full">
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div />
        {DAYS.map(d => (
          <div key={`head-${d.id}`} className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-3 py-2 font-semibold">
            {d.label}
          </div>
        ))}
        <div className="border-r">
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
            const hour = START_HOUR + i
            return (
              <div key={hour} className="relative h-[90px]">
                <div className="absolute -top-3 right-2 text-xs text-muted-foreground">{fmtHourLabel(hour)}</div>
              </div>
            )
          })}
        </div>
        {DAYS.map(d => (
          <DayColumn
            key={d.id}
            day={d.id}
            events={byDay[d.id]}
            onDelete={onDelete}
            label={d.label}
            extraSubjects={extraSubjects}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({ day, events, onDelete, label, extraSubjects, onEdit }) {
  function fmtTimeSA(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const suffix = h < 12 ? "" : "";
    const base = ((h + 11) % 12) + 1;
    return `${base}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
  const MINUTES_PER_HOUR = 60;
  const HOUR_HEIGHT = 90;
  const MIN_HEIGHT = 1;
  return (
    <div className="relative border-l" title={label}>
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <div key={i} className="h-[90px]" />
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
            const subj = (OFFICIAL_SUBJECTS.concat(extraSubjects)).find(x => x.id === ev.subject)
            const color = subj?.color ?? "bg-gray-100 text-gray-700 border-gray-300"
            return (
              <div
                key={ev.id}
                className={`absolute left-1 right-1 rounded-lg border px-2 py-1 shadow-sm cursor-pointer ${color}`}
                style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                title={`${ev.title} • ${ev.start}–${ev.end}`}
                onClick={e => {
                  // Chỉ mở dialog chỉnh sửa nếu không phải click vào nút x
                  if (e.target.closest('button')) return;
                  e.stopPropagation();
                  if (onEdit) onEdit(ev);
                }}
              >
                <div className="mt-0.5 text-[10px] opacity-80">{fmtTimeSA(ev.start)} – {fmtTimeSA(ev.end)}</div>
                {ev.note && <div className="mt-0.5 text-[10px] italic text-gray-500 line-clamp-2">{ev.note}</div>}
                <div className={`mt-1 flex ${ev.type === "hocthem" ? "flex-col items-start gap-0.5" : "flex-row items-center gap-1"}`}>
                  <Badge variant="outline" className="h-5 text-[11px] whitespace-nowrap">{subj?.name || ev.subject}</Badge>
                  {ev.type === "hocthem" && (
                    <Badge variant="destructive" className="h-5 text-[11px] whitespace-nowrap mt-0.5">Học thêm</Badge>
                  )}
                  {ev.type === "chinhthuc" && (
                    <Badge variant="success" className="h-5 text-[11px] whitespace-nowrap mt-0.5">Trường</Badge>
                  )}
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(ev.id);
                  }}
                  className="absolute right-1.5 top-1 text-[10px] opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            )
          })}
      </div>
    </div>
  )
}

// ---------- app ----------
export default function App() {
  function fmtTimeAMPM(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const suffix = h < 12 ? "AM" : "PM";
    const base = ((h + 11) % 12) + 1;
    return `${base}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const USER_ID = "demo-user";
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [extraSubjects, setExtraSubjects] = useExtraSubjects();
  const [showExtraManager, setShowExtraManager] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    setLoading(true)
    loadTimetable(USER_ID).then((data) => {
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setEvents(Array.isArray(data.events) ? data.events : [])
        if (Array.isArray(data.extraSubjects)) setExtraSubjects(data.extraSubjects)
      } else {
        setEvents(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!loading) {
      saveTimetable(USER_ID, { events, extraSubjects })
    }
  }, [events, extraSubjects, loading])

  function addEvent(ev) {
    setEvents(prev => [...prev, ev])
  }
  function updateEvent(ev) {
    setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
  }
  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedEvent(null); // Đảm bảo đóng dialog chỉnh sửa nếu đang mở
    setOpen(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải dữ liệu...</div>;
  }
  if (isMobile) {
    return (
      <MobileTodaySchedule
        events={events}
        extraSubjects={extraSubjects}
        officialSubjects={OFFICIAL_SUBJECTS}
      />
    );
  }
  function getNowInfo() {
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const tzDate = new Date(utc + 7 * 3600000);
    const weekdayMap = ["CN", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = weekdayMap[tzDate.getDay()];
    const hour = tzDate.getHours();
    const minute = tzDate.getMinutes();
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    return { weekday, hour, minute, timeStr, tzDate };
  }

  function getCurrentAndUpcomingEvents() {
    const { weekday, timeStr } = getNowInfo();
    const todayEvents = events.filter(ev => ev.day === weekday)
      .map(ev => ({ ...ev, s: minutesFrom0700(ev.start), e: minutesFrom0700(ev.end) }))
      .sort((a, b) => a.s - b.s);
    const nowMin = minutesFrom0700(timeStr);
    let current = null;
    const upcoming = [];
    for (let ev of todayEvents) {
      if (ev.s <= nowMin && nowMin < ev.e) current = ev;
      else if (ev.s > nowMin) upcoming.push(ev);
    }
    return { current, upcoming };
  }

  const { current, upcoming } = getCurrentAndUpcomingEvents();

  return (
    <div className="w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold text-blue-800 mb-2 mt-4">Thời khoá biểu của Lê Ngọc Như Quỳnh</h1>
      <div className="max-w-[1500px] pl-2 pr-2 pt-4 pb-4 flex flex-row gap-4 w-full">
      <div className="flex-1 min-w-0">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Thời khoá biểu (7:00 → 22:00)</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setOpen(true)}>+ Thêm lịch</Button>
              <Button variant="destructive" onClick={() => {
                if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch không?')) setEvents([]);
              }}>
                Xóa toàn bộ lịch
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button className="ml-4 px-2 py-1 rounded bg-slate-200 text-xs border hover:bg-slate-300" onClick={() => setShowExtraManager(true)}>
                Tuỳ chỉnh môn học thêm
              </button>
            </div>
            <ExtraSubjectsManager open={showExtraManager} onOpenChange={setShowExtraManager} extraSubjects={extraSubjects} setExtraSubjects={setExtraSubjects} />
            <WeekGrid
              events={events}
              onDelete={deleteEvent}
              extraSubjects={extraSubjects}
              onEdit={ev => {
                setSelectedEvent(ev);
                setOpen(true);
              }}
            />
          </CardContent>
        </Card>
        <AddEventDialog
          open={open}
          onOpenChange={o => {
            setOpen(o);
            if (!o) setSelectedEvent(null);
          }}
          onAdd={addEvent}
          onUpdate={updateEvent}
          onDelete={deleteEvent}
          editingEvent={selectedEvent}
          extraSubjects={extraSubjects}
          events={events}
        />
      </div>
      {/* Sidebar phải */}
      <div className="w-[320px] flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lịch hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <span className="font-semibold">Bây giờ: </span>
              {(() => {
                const { tzDate } = getNowInfo();
                return tzDate.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Bangkok" });
              })()}
            </div>
            <div className="mb-3">
              <div className="font-semibold text-green-700">Đang diễn ra:</div>
              {current ? (
                <div className="mt-1 p-2 rounded border bg-green-50">
                  <div><b>{(() => {
                    const subj = (OFFICIAL_SUBJECTS.concat(extraSubjects)).find(x => x.id === current.subject);
                    return subj?.name || current.subject;
                  })()}</b></div>
                  <div>{fmtTimeAMPM(current.start)} – {fmtTimeAMPM(current.end)}</div>
                  <div className="text-xs text-gray-500">{current.note}</div>
                </div>
              ) : <div className="text-xs text-gray-500">Không có tiết nào đang diễn ra</div>}
            </div>
            <div>
              <div className="font-semibold text-blue-700">Sắp diễn ra:</div>
              {upcoming.length > 0 ? (
                <div className="flex flex-col gap-2 mt-1">
                  {upcoming.map(ev => {
                    const subj = (OFFICIAL_SUBJECTS.concat(extraSubjects)).find(x => x.id === ev.subject);
                    const typeLabel = ev.type === "chinhthuc" ? "Trường" : (ev.type === "hocthem" ? "Học thêm" : "Khác");
                    return (
                      <div key={ev.id} className="p-2 rounded border bg-blue-50">
                        <div className="flex items-center gap-2">
                          <b>{subj?.name || ev.subject}</b>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ev.type === "chinhthuc" ? "bg-blue-200 text-blue-800" : ev.type === "hocthem" ? "bg-green-200 text-green-800" : "bg-gray-200 text-gray-700"}`}>{typeLabel}</span>
                        </div>
                        <div>{fmtTimeAMPM(ev.start)} – {fmtTimeAMPM(ev.end)}</div>
                        <div className="text-xs text-gray-500">{ev.note}</div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-xs text-gray-500">Không có tiết nào sắp diễn ra</div>}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  )
}