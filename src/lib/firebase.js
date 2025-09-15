// Khởi tạo Firebase App và Firestore
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lưu dữ liệu thời khóa biểu lên Firestore
export async function saveTimetable(userId, data) {
	const ref = doc(db, "timetables", userId);
	await setDoc(ref, { data });
}

// Lấy dữ liệu thời khóa biểu từ Firestore
export async function loadTimetable(userId) {
	const ref = doc(db, "timetables", userId);
	const snap = await getDoc(ref);
	if (snap.exists()) {
		return snap.data().data;
	}
	return {};
}

export { db };
