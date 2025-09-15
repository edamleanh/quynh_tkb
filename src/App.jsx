import MobileTodaySchedule from "./components/MobileTodaySchedule";
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

// ---------- cấu hình ----------
const DAYS = [
  { id: "Mon", label: "Thứ 2" },
  { id: "Tue", label: "Thứ 3" },
  { id: "Wed", label: "Thứ 4" },
  { id: "Thu", label: "Thứ 5" },
  { id: "Fri", label: "Thứ 6" },
  { id: "Sat", label: "Thứ 7" },
  { id: "CN", label: "Chủ nhật" },
]
const START_HOUR = 7    // 7:00
const END_HOUR = 22     // 22:00 (10PM)
const TOTAL_MIN = (END_HOUR - START_HOUR) * 60 // 900 phút

const OFFICIAL_SUBJECTS = [
  { id: "math",     name: "Toán",          color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "lit",      name: "Ngữ văn",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "eng",      name: "Anh văn",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "art",      name: "Mĩ thuật",      color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "bio",      name: "Sinh Học",      color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "chem",     name: "Hóa học",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "civics",   name: "GDCD",          color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "comp",     name: "Tin học",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "geo",      name: "Địa lí",        color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "hist",     name: "Lịch sử",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "music",    name: "Âm nhạc",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "pe",       name: "Thể Dục",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "phys",     name: "Vật lí",        color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "tech",     name: "Công nghệ",     color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "flag",     name: "Chào cờ",       color: "bg-blue-100 text-blue-700 border-blue-300" },
  { id: "shcn",     name: "SHCN",          color: "bg-blue-100 text-blue-700 border-blue-300" },
]

// Thay EXTRA_SUBJECTS bằng hook động
function getDefaultExtraSubjects() {
  return [
    { id: "mathplus", name: "Toán nâng cao", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "engplus",  name: "Tiếng Anh nâng cao", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "physplus", name: "Lý chuyên đề", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "chemplus", name: "Hóa chuyên đề", color: "bg-green-100 text-green-700 border-green-300" },
  ];
}

function useExtraSubjects() {
  const [extraSubjects, setExtraSubjects] = React.useState(() => {
    try {
      const raw = localStorage.getItem("extra-subjects-v1");
      return raw ? JSON.parse(raw) : getDefaultExtraSubjects();
    } catch {
      return getDefaultExtraSubjects();
    }
  });
  React.useEffect(() => {
    localStorage.setItem("extra-subjects-v1", JSON.stringify(extraSubjects));
  }, [extraSubjects]);
  return [extraSubjects, setExtraSubjects];
}

function ExtraSubjectsManager({ open, onOpenChange, extraSubjects, setExtraSubjects }) {
  const [name, setName] = React.useState("");

  // Danh sách màu khả dụng, không trùng với OFFICIAL_SUBJECTS và extraSubjects hiện tại
  const COLOR_POOL = [
    "bg-blue-50 text-blue-800 border-blue-200",
    "bg-violet-50 text-violet-800 border-violet-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-rose-50 text-rose-800 border-rose-200",
    "bg-amber-50 text-amber-800 border-amber-200",
    "bg-gray-50 text-gray-800 border-gray-200",
    "bg-pink-50 text-pink-800 border-pink-200",
    "bg-green-50 text-green-800 border-green-200",
    "bg-cyan-50 text-cyan-800 border-cyan-200",
    "bg-orange-50 text-orange-800 border-orange-200",
    "bg-lime-50 text-lime-800 border-lime-200",
    "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
    "bg-teal-50 text-teal-800 border-teal-200",
    "bg-indigo-50 text-indigo-800 border-indigo-200",
    "bg-yellow-50 text-yellow-800 border-yellow-200",
    "bg-red-50 text-red-800 border-red-200",
  ];

  function getUsedColors() {
    // Lấy tất cả màu đã dùng ở OFFICIAL_SUBJECTS và extraSubjects
    const officialColors = OFFICIAL_SUBJECTS.map(s => s.color);
    const extraColors = extraSubjects.map(s => s.color);
    return new Set([...officialColors, ...extraColors]);
  }

  function pickColor() {
    // Luôn trả về màu xanh lá cho tất cả môn học thêm
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

// ---------- helpers ----------
function minutesFrom0700(timeHHmm) {
  // timeHHmm dạng "HH:MM" (24h). Trả về số phút kể từ 07:00.
  const [hStr, mStr] = timeHHmm.split(":")
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  return (h - START_HOUR) * 60 + m
}

function clampToRange(mins) {
  // Giới hạn sự kiện nằm trong [0, TOTAL_MIN]
  return Math.max(0, Math.min(TOTAL_MIN, mins))
}

function toPct(mins) {
  return `${(mins / TOTAL_MIN) * 100}%`
}

function fmtHourLabel(h) {
  // 7 -> "7 AM", 13 -> "1 PM"
  const suffix = h < 12 ? "AM" : "PM"
  const base = ((h + 11) % 12) + 1
  return `${base} ${suffix}`
}

// Tạo ID ngẫu nhiên nhẹ nhàng
const rid = () => Math.random().toString(36).slice(2, 9)

// ---------- component thêm sự kiện ----------


function AddEventDialog({ open, onOpenChange, onAdd, extraSubjects, events }) {
  const [day, setDay] = useState("Mon")
  const [type, setType] = useState("chinhthuc")
  const [subject, setSubject] = useState("")
  const [start, setStart] = useState("07:00")
  const [end, setEnd] = useState("09:00")
  const [note, setNote] = useState("")

  // Khi chọn ngày, tự động set giờ bắt đầu phù hợp
  React.useEffect(() => {
    if (!day) return;
    // Lấy tất cả sự kiện của ngày này, sắp xếp theo giờ kết thúc
    const dayEvents = (events || []).filter(ev => ev.day === day)
      .sort((a, b) => minutesFrom0700(a.end) - minutesFrom0700(b.end));
    if (dayEvents.length === 0) {
      setStart("07:00");
    } else {
      // Lấy giờ kết thúc của sự kiện cuối cùng
      const lastEnd = dayEvents[dayEvents.length - 1].end;
      setStart(lastEnd);
    }
  }, [day, events, open]);

  // Chọn danh sách môn học theo loại
  const subjectOptions = type === "chinhthuc" ? OFFICIAL_SUBJECTS : extraSubjects

  // Đảm bảo subject luôn hợp lệ khi đổi loại
  React.useEffect(() => {
    if (type === "chinhthuc" && subject && !OFFICIAL_SUBJECTS.some(s => s.id === subject)) {
      setSubject(OFFICIAL_SUBJECTS[0]?.id || "")
    }
    if (type === "hocthem" && subject && !extraSubjects.some(s => s.id === subject)) {
      setSubject(extraSubjects[0]?.id || "")
    }
  }, [type, extraSubjects])

  // Nếu là chính thức, khi đổi giờ bắt đầu thì tự set giờ kết thúc = giờ bắt đầu + 45 phút
  // Nếu là học thêm thì + 90 phút
  React.useEffect(() => {
    if (start) {
      const [h, m] = start.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        let addMin = type === "chinhthuc" ? 45 : (type === "hocthem" ? 90 : 0);
        let total = h * 60 + m + addMin;
        let newH = Math.floor(total / 60);
        let newM = total % 60;
        // Nếu vượt quá END_HOUR thì giới hạn
        if (newH > END_HOUR) {
          newH = END_HOUR;
          newM = 0;
        }
        const pad = n => n.toString().padStart(2, "0");
        setEnd(`${pad(newH)}:${pad(newM)}`);
      }
    }
  }, [start, type]);

  function isOverlap(newStart, newEnd, existingStart, existingEnd) {
    // Trả về true nếu [newStart, newEnd) giao với [existingStart, existingEnd)
    return newStart < existingEnd && existingStart < newEnd;
  }

  function submit() {
    // kiểm tra hợp lệ cơ bản
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
    // Kiểm tra trùng lịch
    const overlap = (events || []).some(ev => ev.day === day && isOverlap(s, e, minutesFrom0700(ev.start), minutesFrom0700(ev.end)));
    if (overlap) {
      alert("Lịch bị trùng với một sự kiện đã có!");
      return;
    }
    onAdd({
      id: rid(),
      day,
      subject,
      type,
      start, end,
      note: note.trim(),
    })
    setStart("07:30")
    setEnd("09:00")
    setNote("")
    setType("chinhthuc")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm lịch học</DialogTitle>
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

          {/* Đưa loại lên trên */}
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

        <DialogFooter className="mt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit}>Thêm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------- layout lịch ----------
function WeekGrid({ events, onDelete, extraSubjects }) {
  // gom sự kiện theo ngày
  const byDay = useMemo(() => {
  const map = Object.fromEntries(DAYS.map(d => [d.id, []]))
  events.forEach(ev => { if (map[ev.day]) map[ev.day].push(ev) })
    return map
  }, [events])

  return (
    <div className="w-full">
      <div className="grid grid-cols-[80px_repeat(7,1fr)]">
        {/* cột giờ bên trái */}
        <div />
        {DAYS.map(d => (
          <div key={`head-${d.id}`} className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-3 py-2 font-semibold">
            {d.label}
          </div>
        ))}

        {/* body: 15 hàng giờ */}
        {/* cột giờ (gutter) */}
        <div className="border-r">
          {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
            const hour = START_HOUR + i
            // Không còn đường kẻ ngang giữa các giờ
            return (
              <div key={hour} className="relative h-[65px]">
                <div className="absolute -top-3 right-2 text-xs text-muted-foreground">{fmtHourLabel(hour)}</div>
              </div>
            )
          })}
        </div>

        {/* 7 cột ngày */}
        {DAYS.map(d => (
          <DayColumn key={d.id} day={d.id} events={byDay[d.id]} onDelete={onDelete} label={d.label} extraSubjects={extraSubjects} />
        ))}
      </div>
    </div>
  )
}

function DayColumn({ day, events, onDelete, label, extraSubjects }) {
  // Định dạng giờ SA/CH
  function fmtTimeSA(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const suffix = h < 12 ? "SA" : "CH";
    const base = ((h + 11) % 12) + 1;
    return `${base}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
  // cột là relative container, cao theo 15 giờ * 60px = 900px
  // vạch kẻ mỗi giờ
  // Số phút trong 1 giờ (dùng để tính pixel)
  const MINUTES_PER_HOUR = 60;
  const HOUR_HEIGHT = 65; // px, phải khớp với .h-[60px] ở trên
  const MIN_HEIGHT = 1; // px, tối thiểu để không bị ẩn
  return (
    <div className="relative border-l" title={label}>
      {/* nền lưới giờ */}
      {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
        <div key={i} className="h-[60px]" />
      ))}
      {/* render sự kiện (absolute) */}
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
                className={`absolute left-1 right-1 rounded-lg border px-2 py-1 shadow-sm ${color}`}
                style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                title={`${ev.title} • ${ev.start}–${ev.end}`}
              >
                {/* Không hiển thị tiêu đề */}
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
                  onClick={() => onDelete(ev.id)}
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
  // Định dạng giờ AM/PM
  function fmtTimeAMPM(time) {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return time;
    const suffix = h < 12 ? "AM" : "PM";
    const base = ((h + 11) % 12) + 1;
    return `${base}:${m.toString().padStart(2, "0")} ${suffix}`;
  }
  // Phát hiện thiết bị di động đơn giản
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 600;
  // State để cập nhật thời gian thực
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const USER_ID = "demo-user"; // Có thể thay bằng id đăng nhập thực tế
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [extraSubjects, setExtraSubjects] = useExtraSubjects();
  const [showExtraManager, setShowExtraManager] = useState(false);

  // Load dữ liệu từ Firebase khi mở app
  useEffect(() => {
    setLoading(true)
    loadTimetable(USER_ID).then((data) => {
      // data có thể là { events, extraSubjects } hoặc mảng cũ
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setEvents(Array.isArray(data.events) ? data.events : [])
        if (Array.isArray(data.extraSubjects)) setExtraSubjects(data.extraSubjects)
      } else {
        setEvents(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    })
  }, [])

  // Lưu dữ liệu lên Firebase mỗi khi events hoặc extraSubjects thay đổi (trừ lúc đang loading)
  useEffect(() => {
    if (!loading) {
      saveTimetable(USER_ID, { events, extraSubjects })
    }
  }, [events, extraSubjects, loading])

  function addEvent(ev) {
    setEvents(prev => [...prev, ev])
  }

  function deleteEvent(id) {
    setEvents(prev => prev.filter(e => e.id !== id))
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
  // Helper lấy thứ hiện tại (Mon-Sun) và giờ phút hiện tại GMT+7
  function getNowInfo() {
    // Lấy giờ GMT+7
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const tzDate = new Date(utc + 7 * 3600000);
    // Đổi id: Chủ nhật là CN, các ngày khác giữ nguyên (0=CN, 1=Mon, ..., 6=Sat)
    const weekdayMap = ["CN", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = weekdayMap[tzDate.getDay()];
    const hour = tzDate.getHours();
    const minute = tzDate.getMinutes();
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    return { weekday, hour, minute, timeStr, tzDate };
  }

  // Tìm lịch đang diễn ra và tất cả sự kiện sắp diễn ra trong ngày
  function getCurrentAndUpcomingEvents() {
    const { weekday, timeStr } = getNowInfo();
    // Lấy tất cả sự kiện hôm nay, sắp xếp theo start
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
              {/* <span className="text-sm text-muted-foreground">Màu theo môn học:</span>
              <span className="font-semibold text-sm">Môn chính thức:</span>
              {OFFICIAL_SUBJECTS.map(s => (
                <span key={s.id} className={`px-2 py-1 rounded border text-xs ${s.color}`}>{s.name}</span>
              ))}
              <span className="font-semibold text-sm ml-4">Môn học thêm:</span>
              {extraSubjects.map(s => (
                <span key={s.id} className={`px-2 py-1 rounded border text-xs ${s.color}`}>{s.name}</span>
              ))} */}
              <button className="ml-4 px-2 py-1 rounded bg-slate-200 text-xs border hover:bg-slate-300" onClick={() => setShowExtraManager(true)}>
                Tuỳ chỉnh môn học thêm
              </button>
            </div>
            <ExtraSubjectsManager open={showExtraManager} onOpenChange={setShowExtraManager} extraSubjects={extraSubjects} setExtraSubjects={setExtraSubjects} />
            <WeekGrid events={events} onDelete={deleteEvent} extraSubjects={extraSubjects} />
          </CardContent>
        </Card>
  <AddEventDialog open={open} onOpenChange={setOpen} onAdd={addEvent} extraSubjects={extraSubjects} events={events} />
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
