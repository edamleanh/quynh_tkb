// src/lib/appFunctions.js
import { DAYS, START_HOUR, END_HOUR, TOTAL_MIN, OFFICIAL_SUBJECTS } from "./constants";
import { minutesFrom0700, clampToRange, toPct, fmtHourLabel, rid } from "./helpers";
import React from "react";

export function getDefaultExtraSubjects() {
  return [
    { id: "mathplus", name: "Toán nâng cao", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "engplus",  name: "Tiếng Anh nâng cao", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "physplus", name: "Lý chuyên đề", color: "bg-green-100 text-green-700 border-green-300" },
    { id: "chemplus", name: "Hóa chuyên đề", color: "bg-green-100 text-green-700 border-green-300" },
  ];
}

export function useExtraSubjects() {
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

export function isOverlap(newStart, newEnd, existingStart, existingEnd) {
  // Trả về true nếu [newStart, newEnd) giao với [existingStart, existingEnd)
  return newStart < existingEnd && existingStart < newEnd;
}
