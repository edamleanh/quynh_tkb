// src/lib/constants.js

export const DAYS = [
  { id: "Mon", label: "Thứ 2" },
  { id: "Tue", label: "Thứ 3" },
  { id: "Wed", label: "Thứ 4" },
  { id: "Thu", label: "Thứ 5" },
  { id: "Fri", label: "Thứ 6" },
  { id: "Sat", label: "Thứ 7" },
  { id: "CN", label: "Chủ nhật" },
];

export const START_HOUR = 7;    // 7:00
export const END_HOUR = 22;     // 22:00 (10PM)
export const TOTAL_MIN = (END_HOUR - START_HOUR) * 60; // 900 phút

export const OFFICIAL_SUBJECTS = [
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
];
