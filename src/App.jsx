import React from "react"
// Thêm import useRef
import html2pdf from "html2pdf.js"
import { ROOMS, SLOTS, DAYS } from "@/lib/timeTableData"
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const makeKey = (dayId, slot, room) => `${dayId}|${slot}|${room}`

const randomColor = () => {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default function App() {
  // Mật khẩu truy cập (có thể đổi theo ý muốn)
  const ACCESS_PASSWORD = "12345678";
  // Lấy teacher từ URL (nếu có) - chỉ khai báo 1 lần
  function getTeacherFromPath() {
    const path = window.location.pathname.replace(/^\/|\/$/g, "").toLowerCase();
    if (!path) return "all";
    const slugMap = {
      a1b2c3d4: "Cô Giang",
      e5f6g7h8: "Cô Duyên",
      i9j0k1l2: "Cô Hà",
      m3n4o5p6: "Cô Quỳnh",
      q7r8s9t0: "Cô Ngọc",
      u1v2w3x4: "Cô Hoa",
      y5z6a7b8: "Cô Diễm",
      c9d0e1f2: "Cô Huyên",
      g3h4i5j6: "Cô Linh",
      k7l8m9n0: "Cô Trinh",
      o1p2q3r4: "Cô Hạnh",
      s5t6u7v8: "Thầy Cường",
      w9x0y1z2: "Thầy Bình",
      a3b4c5d6: "Thầy Tâm",
      e7f8g9h0: "GVNN"
    };
    // Nếu không khớp slug nào thì trả về null
    return slugMap[path] || (path === "all" ? "all" : null);
  }
  const teacherFromPath = getTeacherFromPath();
  const isTeacherUrl = teacherFromPath && teacherFromPath !== "all";
  // State kiểm soát đăng nhập
  const [isAuthed, setIsAuthed] = React.useState(() => {
    if (isTeacherUrl) return true;
    return localStorage.getItem("ttb-authed") === "yes";
  });
  // Đảm bảo khi localStorage thay đổi thì App sẽ render lại
  React.useEffect(() => {
    if (!isTeacherUrl) {
      const handler = () => {
        setIsAuthed(localStorage.getItem("ttb-authed") === "yes");
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    }
  }, [isTeacherUrl]);
  // Force update để render lại App khi đăng nhập thành công
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [pwInput, setPwInput] = React.useState("");
  const [pwError, setPwError] = React.useState("");
  // Hiển thị form nhập mật khẩu nếu chưa xác thực (và không phải URL giáo viên)
  if (!isAuthed && !isTeacherUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <form
          className="bg-white p-6 rounded-lg shadow-md w-full max-w-xs"
          onSubmit={e => {
            e.preventDefault();
            if (pwInput === ACCESS_PASSWORD) {
              localStorage.setItem("ttb-authed", "yes");
              setIsAuthed(true);
              setPwError("");
              window.location.reload(); // reload lại app để chắc chắn render đúng
            } else {
              setPwError("Sai mật khẩu!");
            }
          }}
        >
          <div className="mb-4 text-lg font-semibold text-center">Nhập mật khẩu để truy cập</div>
          <input
            type="password"
            className="w-full border rounded px-3 py-2 mb-2"
            placeholder="Mật khẩu"
            value={pwInput}
            onChange={e => setPwInput(e.target.value)}
            autoFocus
          />
          {pwError && <div className="text-red-600 text-sm mb-2">{pwError}</div>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }
  // Thêm state cho bộ lọc giáo viên, chỉ khai báo 1 lần
  const [teacherFilter, setTeacherFilter] = React.useState(getTeacherFromPath());
  // Danh sách giáo viên cố định
  const TEACHERS = [
    "Cô Giang",
    "Cô Duyên",
    "Cô Hà",
    "Cô Quỳnh",
    "Cô Ngọc",
    "Cô Hoa",
    "Cô Diễm",
    "Cô Huyên",
    "Cô Linh",
    "Cô Trinh",
    "Cô Hạnh",
    "Thầy Cường",
    "Thầy Bình",
    "Thầy Tâm",
    "GVNN"
  ];
  // Mảng màu thẻ tương ứng giáo viên (cùng index với TEACHERS)
  const TEACHER_COLORS = [
    "bg-pink-100 text-pink-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-pink-100 text-pink-700",
    "bg-red-100 text-red-700",
    "bg-cyan-100 text-cyan-700",
    "bg-lime-100 text-lime-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-orange-100 text-orange-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
    "bg-gray-100 text-gray-700",
    "bg-red-100 text-red-700",
    "bg-yellow-100 text-yellow-700"
  ];

  // Hàm lấy màu theo giáo viên
  function getTeacherColor(teacher) {
    const idx = TEACHERS.indexOf(teacher);
    return idx >= 0 ? TEACHER_COLORS[idx % TEACHER_COLORS.length] : "bg-gray-100 text-gray-700";
  }
  const { toast } = useToast()

  // Firebase init
  const app = React.useMemo(() => initializeApp(firebaseConfig), []);
  const db = React.useMemo(() => getFirestore(app), [app]);

  // Đọc dữ liệu Firestore realtime
  const [items, setItems] = React.useState({});
  React.useEffect(() => {
    const docRef = doc(db, "timetables", "main");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setItems(docSnap.data().items || {});
      } else {
        setItems({});
      }
    });
    return () => unsub();
  }, [db]);
  const [open, setOpen] = React.useState(false)
  const [editingKey, setEditingKey] = React.useState(null)
  const [form, setForm] = React.useState({
    dayId: DAYS[0]?.id || '',
    slot: SLOTS[0] || '',
    room: ROOMS[0] || '',
    subject: "",
    teacher: TEACHERS[0] || '',
    note: "",
    // color sẽ tự động theo giáo viên
  })

  // Thêm state kiểm soát chế độ chỉnh sửa
  const [editMode, setEditMode] = React.useState(false);

  // Hàm lưu dữ liệu Firestore (dùng trong handleSave, handleDelete)
  const saveItemsToFirestore = async (newItems) => {
    await setDoc(doc(db, "timetables", "main"), { items: newItems });
  };

  const openCreate = (dayId, slot, room) => {
    setForm({
      dayId: dayId || DAYS[0]?.id || '',
      slot: slot || SLOTS[0] || '',
      room: room || ROOMS[0] || '',
      subject: "",
      teacher: TEACHERS[0] || '',
      note: ""
    })
    setEditingKey(null)
    setOpen(true)
  }

  const openEdit = (dayId, slot, room) => {
    const key = makeKey(dayId, slot, room)
    const data = items[key]
    if (!data) return
    setForm({
      dayId: dayId || DAYS[0]?.id || '',
      slot: slot || SLOTS[0] || '',
      room: room || ROOMS[0] || '',
      subject: data.subject || '',
      teacher: data.teacher || TEACHERS[0] || '',
      note: data.note || ''
    })
    setEditingKey(key)
    setOpen(true)
  }

  const handleSave = () => {
    if (!form.subject?.trim()) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng nhập tên lớp học." })
      return
    }
    const key = makeKey(form.dayId, form.slot, form.room);
    // Kiểm tra trùng phòng cùng khung giờ, ngày (trừ chính lớp đang sửa)
    const isRoomConflict = Object.entries(items).some(([k, v]) => {
      if (editingKey && k === editingKey) return false;
      const [d, s, r] = k.split("|");
      return d === form.dayId && s === form.slot && r === form.room;
    });
    if (isRoomConflict) {
      toast({ title: "Trùng phòng", description: "Phòng này đã có lớp ở khung giờ này!" });
      return;
    }
    // Kiểm tra trùng giáo viên cùng khung giờ, ngày (trừ chính lớp đang sửa)
    const isTeacherConflict = Object.entries(items).some(([k, v]) => {
      if (editingKey && k === editingKey) return false;
      const [d, s, r] = k.split("|");
      return d === form.dayId && s === form.slot && v.teacher === form.teacher && form.teacher;
    });
    if (isTeacherConflict) {
      toast({ title: "Trùng giáo viên", description: "Giáo viên này đã có lớp ở khung giờ này!" });
      return;
    }
    setItems(prev => {
      let newItems = { ...prev };
      if (editingKey && editingKey !== key) {
        delete newItems[editingKey];
      }
      newItems[key] = { subject: form.subject, teacher: form.teacher, note: form.note };
      // Lưu Firestore
      saveItemsToFirestore(newItems);
      return newItems;
    });
    toast({ title: editingKey ? "Đã cập nhật" : "Đã thêm lớp" });
    setOpen(false);
  }

  const handleDelete = () => {
    if (!editingKey) return
    setItems(prev => {
      const n = { ...prev };
      delete n[editingKey];
      // Lưu Firestore
      saveItemsToFirestore(n);
      return n;
    });
    toast({ title: "Đã xóa lớp" });
    setOpen(false);
  }

  // Ref cho bảng thời khóa biểu
  const tableRef = React.useRef(null);


  // Hàm xuất PDF chỉ cho bảng
  const handleExportPDF = () => {
    if (!tableRef.current) return;
    let filename = 'thoi-khoa-bieu.pdf';
    if (filterTeacherLabel) {
      // Chuyển tiếng Việt sang không dấu, thay dấu cách bằng _
      const toAscii = (str) => str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, '_');
      const safeName = toAscii(filterTeacherLabel);
      filename = `thoi-khoa-bieu-${safeName}.pdf`;
    }
    html2pdf()
      .set({
        margin: 0.2,
        filename,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .from(tableRef.current)
      .save();
  };

  // Tên giáo viên đang lọc (nếu có)
  const filterTeacherLabel = teacherFilter !== "all" && teacherFilter ? teacherFilter : null;

  // Nếu truy cập url /cogiang... thì không cho đổi bộ lọc giáo viên (ẩn select)
  // Đã khai báo isTeacherUrl ở đầu function, không cần khai báo lại

  if (!isAuthed) return passwordGate;

  // Nếu truy cập url không hợp lệ (không phải giáo viên, không phải trang chính)
  if (teacherFromPath === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xs text-center">
          <div className="mb-4 text-lg font-semibold">404 - Không tìm thấy trang</div>
          <div className="text-neutral-600">Đường dẫn bạn truy cập không hợp lệ.</div>
        </div>
      </div>
    );
  }

  // Nếu là trang giáo viên (ví dụ: /a1b2c3d4, /e5f6g7h8, ...) thì chỉ hiển thị bảng thời khóa biểu, không hiển thị gì thêm
  const teacherSlugList = [
    "a1b2c3d4", "e5f6g7h8", "i9j0k1l2", "m3n4o5p6", "q7r8s9t0", "u1v2w3x4", "y5z6a7b8", "c9d0e1f2", "g3h4i5j6", "k7l8m9n0", "o1p2q3r4", "s5t6u7v8", "w9x0y1z2", "a3b4c5d6", "e7f8g9h0"
  ];
  const currentSlug = window.location.pathname.replace(/^\/|\/$/g, "");
  if (teacherSlugList.includes(currentSlug)) {
    const teacherName = slugMap[currentSlug];
    return (
      <div className="min-h-screen bg-neutral-50">
        <main className="container py-2 sm:py-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                Lịch dạy của {teacherName} (Cột dọc: Thứ, Cột ngang: Giờ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto" ref={tableRef}>
                <table className="w-full border border-neutral-200 text-xs sm:text-sm">
                  <thead className="bg-neutral-100 text-xs sm:text-sm">
                    <tr>
                      <th className="border border-neutral-200 px-1 py-2 text-left sticky left-0 z-20 bg-neutral-100" style={{width: 60, minWidth: 50}}>
                        Giờ
                      </th>
                      {DAYS.map(d => (
                        <th key={d.id} className="border border-neutral-200 px-1 py-2 text-left">
                          {d.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(slot => (
                      <tr key={slot}>
                        <td className="border border-neutral-200 px-1 py-2 font-medium bg-white sticky left-0 z-10" style={{width: 60, minWidth: 50}}>
                          {slot}
                        </td>
                        {DAYS.map(d => {
                          // Tìm phòng có lớp của giáo viên này ở khung giờ này
                          const found = ROOMS.map(room => {
                            const key = makeKey(d.id, slot, room);
                            const item = items[key];
                            if (item && item.teacher === teacherName) {
                              return { ...item, room };
                            }
                            return null;
                          }).find(Boolean);
                          if (!found) {
                            return <td key={d.id} className="border border-neutral-200 p-1 bg-neutral-50" />;
                          }
                          return (
                            <td key={d.id} className="border border-neutral-200 p-1">
                              <div className={`rounded-lg p-1 text-xs ${getTeacherColor(found.teacher)}`} style={{ minHeight: 24, padding: '2px 4px' }}>
                                <div className="font-semibold leading-tight text-xs">{found.teacher}</div>
                                <div className="text-xs">Lớp {found.subject}</div>
                                <div className="text-xs italic">Phòng: {found.room.toUpperCase()}</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Bộ lọc giáo viên */}
      {!isTeacherUrl && (
        <div className="container py-4 flex gap-3 items-center">
          <label className="text-sm text-neutral-700">Lọc theo giáo viên:</label>
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tất cả giáo viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả giáo viên</SelectItem>
              {TEACHERS.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Toaster />
      <header className="border-b bg-white">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold">Quản lý thời khóa biểu</h1>
          <div className="flex items-center gap-2">
            {!isTeacherUrl && (
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(e => !e)}
              >
                {editMode ? "Đang chỉnh sửa" : "Chỉnh sửa"}
              </Button>
            )}
            {!isTeacherUrl && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (window.confirm("Bạn có chắc chắn muốn làm trống toàn bộ thời khóa biểu?")) {
                    localStorage.removeItem("ttb-items-v2");
                    setItems({});
                    await setDoc(doc(db, "timetables", "main"), { items: {} });
                    toast({ title: "Đã làm trống thời khóa biểu" });
                  }
                }}
              >
                Làm trống
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex justify-end mb-3 no-print gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            Xuất PDF bảng
          </Button>
        </div>
        {/* Nếu lọc giáo viên chỉ định thì đổi bảng: cột dọc là thứ, cột ngang là giờ */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">
              {filterTeacherLabel
                ? `Lịch dạy của ${filterTeacherLabel} (Cột dọc: Thứ, Cột ngang: Giờ)`
                : "Lịch theo ngày (Hàng: Thứ 2 → CN, Cột: P1 → P6)"}
            </CardTitle>
            {filterTeacherLabel && (
              <div className="mt-2 text-base font-semibold text-blue-700 print:block hidden" id="teacher-filter-print">
                Giáo viên: {filterTeacherLabel}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto" ref={tableRef}>
              {filterTeacherLabel && (
                <div className="mb-2 text-base font-semibold text-blue-700 block print:block" id="teacher-filter-pdf">
                  Giáo viên: {filterTeacherLabel}
                </div>
              )}
              {filterTeacherLabel ? (
                <table className="w-full border border-neutral-200">
                  <thead className="bg-neutral-100 text-sm">
                    <tr>
                      <th className="border border-neutral-200 px-2 py-2 text-left sticky left-0 z-20 bg-neutral-100" style={{width: 80, minWidth: 60}}>
                        Giờ
                      </th>
                      {DAYS.map(d => (
                        <th key={d.id} className="border border-neutral-200 px-2 py-2 text-left">
                          {d.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(slot => (
                      <tr key={slot}>
                        <td className="border border-neutral-200 px-2 py-2 font-medium bg-white sticky left-0 z-10" style={{width: 80, minWidth: 60}}>
                          {slot}
                        </td>
                        {DAYS.map(d => {
                          // Tìm phòng có lớp của giáo viên này ở khung giờ này
                          const found = ROOMS.map(room => {
                            const key = makeKey(d.id, slot, room);
                            const item = items[key];
                            if (item && item.teacher === filterTeacherLabel) {
                              return { ...item, room };
                            }
                            return null;
                          }).find(Boolean);
                          if (!found) {
                            return <td key={d.id} className="border border-neutral-200 p-2 bg-neutral-50" />;
                          }
                          return (
                            <td key={d.id} className="border border-neutral-200 p-2">
                              <div className={`rounded-lg p-1 text-xs ${getTeacherColor(found.teacher)}`} style={{ minHeight: 28, padding: '4px 6px' }}>
                                <div className="font-semibold leading-tight text-xs">{found.teacher}</div>
                                <div className="text-xs">Lớp {found.subject}</div>
                                <div className="text-xs italic">Phòng: {found.room.toUpperCase()}</div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                // ...existing code for bảng mặc định...
                <table className="w-full border border-neutral-200">
                  <thead className="bg-neutral-100 text-sm">
                    <tr>
                      <th className="border border-neutral-200 px-1 py-2 text-left sticky left-0 z-20 bg-neutral-100" style={{width: 70, minWidth: 60}}>
                        Ngày
                      </th>
                      <th className="border border-neutral-200 px-2 py-2 text-left sticky left-0 z-20 bg-neutral-100" style={{width: 80, minWidth: 60}}>
                        Giờ
                      </th>
                      {ROOMS.map(r => (
                        <th key={r} className="border border-neutral-200 px-3 py-2 text-left">
                          {r.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((d, dayIdx) => (
                      <React.Fragment key={d.id}>
                        {SLOTS.map((slot, slotIdx) => (
                          <tr key={`${d.id}-${slot}`} className="align-top">
                            {slotIdx === 0 && (
                              <td
                                className="border border-neutral-200 px-1 py-2 font-medium bg-white"
                                rowSpan={SLOTS.length}
                                style={{width: 70, minWidth: 60}}
                              >
                                {d.label}
                              </td>
                            )}
                            <td className="border border-neutral-200 px-2 py-2 bg-white/80 sticky left-0 z-20 bg-neutral-100" style={{width: 80, minWidth: 60}}>
                              <span className="text-sm text-neutral-700">{slot}</span>
                            </td>
                            {ROOMS.map(room => {
                              const key = makeKey(d.id, slot, room)
                              const item = items[key]
                              if (teacherFilter !== "all" && teacherFilter && (!item || item.teacher !== teacherFilter)) {
                                return <td key={key} className="border border-neutral-200 p-2 bg-neutral-50" />
                              }
                              return (
                                <td key={key} className="border border-neutral-200 p-2">
                                  {!item ? (
                                    editMode && (
                                      <Button size="sm" variant="ghost" onClick={() => openCreate(d.id, slot, room)}>
                                        + Thêm lớp
                                      </Button>
                                    )
                                  ) : (
                                    <div
                                      className={`rounded-lg p-1 cursor-pointer text-xs ${getTeacherColor(item.teacher)}`}
                                      style={{ minHeight: 28, padding: '4px 6px' }}
                                      onClick={() => editMode && openEdit(d.id, slot, room)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {!!item.teacher && (
                                          <span className="text-[10px] opacity-80 font-bold">{item.teacher}</span>
                                        )}
                                        <span className="font-semibold leading-tight text-xs">- Lớp {item.subject}</span>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                        <tr aria-hidden>
                          <td colSpan={ROOMS.length + 2} className="h-2 bg-neutral-50" />
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog thêm/sửa */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKey ? "Sửa lớp học" : "Thêm lớp học"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Ngày</label>
                <Select
                  value={form.dayId}
                  onValueChange={v => setForm(f => ({ ...f, dayId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-neutral-500">Giờ</label>
                <Select
                  value={form.slot}
                  onValueChange={v => setForm(f => ({ ...f, slot: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ" />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-neutral-500">Phòng</label>
              <Select
                value={form.room}
                onValueChange={v => setForm(f => ({ ...f, room: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  {ROOMS.map(r => (
                    <SelectItem key={r} value={r}>
                      {r.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-neutral-500">Lớp học *</label>
              <Input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="VD: Toán 9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-500">Giáo viên</label>
                <Select
                  value={form.teacher}
                  onValueChange={v => setForm(f => ({ ...f, teacher: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giáo viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEACHERS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Đã bỏ chọn màu thẻ, màu tự động theo giáo viên */}
            </div>

            <div>
              <label className="text-xs text-neutral-500">Ghi chú</label>
              <Input
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="VD: Ôn tập kiểm tra"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            {editingKey && (
              <Button variant="destructive" onClick={handleDelete}>
                Xóa
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>{editingKey ? "Lưu" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
