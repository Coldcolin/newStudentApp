import { NextRequest, NextResponse } from "next/server";

// Mock student data
const allStudents = [
  { id: "1", name: "Francesca Agbaozo", email: "francesca@example.com", avgRating: "82.5%", currentRating: "96%", stack: "Front-End" },
  { id: "2", name: "Aisha Oke", email: "aisha@example.com", avgRating: "73.5%", currentRating: "89%", stack: "Front-End" },
  { id: "3", name: "Emily Smith", email: "emily@example.com", avgRating: "69%", currentRating: "95%", stack: "Back-End" },
  { id: "4", name: "Michael Johnson", email: "michael@example.com", avgRating: "61.1%", currentRating: "67%", stack: "Back-End" },
  { id: "5", name: "Katherine Brown", email: "katherine@example.com", avgRating: "61.1%", currentRating: "84%", stack: "Product Design" },
  { id: "6", name: "David Lee", email: "david@example.com", avgRating: "46.1%", currentRating: "88%", stack: "Front-End" },
  { id: "7", name: "Sophia Rodriguez", email: "sophia@example.com", avgRating: "21.1%", currentRating: "71%", stack: "Back-End" },
  { id: "8", name: "Daniel Harrison", email: "daniel@example.com", avgRating: "81.1%", currentRating: "83%", stack: "Front-End" },
  { id: "9", name: "Ethan Taylor", email: "ethan@example.com", avgRating: "78.1%", currentRating: "", stack: "Product Design" },
  { id: "10", name: "Ava Anderson", email: "ava@example.com", avgRating: "82.1%", currentRating: "89%", stack: "Front-End" },
  { id: "11", name: "Liam Thomas", email: "liam@example.com", avgRating: "78.1%", currentRating: "67%", stack: "Back-End" },
  { id: "12", name: "Mia Scott", email: "mia@example.com", avgRating: "89.1%", currentRating: "90%", stack: "Front-End" },
  { id: "13", name: "Noah Walker", email: "noah@example.com", avgRating: "81.1%", currentRating: "94%", stack: "Product Design" },
  { id: "14", name: "William Clark", email: "william@example.com", avgRating: "89.5%", currentRating: "99%", stack: "Front-End" },
  { id: "15", name: "Sophia Hall", email: "sophiah@example.com", avgRating: "83.5%", currentRating: "88%", stack: "Back-End" },
  { id: "16", name: "Chisom Ikeadighim", email: "chisom@example.com", avgRating: "82.5%", currentRating: "96%", stack: "Front-End" },
];

// Staff data
const allStaff = [
  { id: "1", name: "Francesca Agbaozo", email: "www.projectsgmail.com", role: "Admin" },
  { id: "2", name: "Sophie Smith", email: "sophiesmith@gmail.com", role: "Instructor" },
  { id: "3", name: "Lily Chen", email: "lilychenemail@gmail.com", role: "Instructor" },
  { id: "4", name: "Maria Rodriguez", email: "mariarodriguez@gmail.com", role: "Instructor" },
  { id: "5", name: "Nathan Wagner", email: "nathanwagner@gmail.com", role: "Instructor" },
];

// Alumni data (same structure as students)
const allAlumni = [
  { id: "1", name: "James Wilson", email: "james@example.com", avgRating: "92.5%", currentRating: "98%", stack: "Front-End" },
  { id: "2", name: "Emma Davis", email: "emma@example.com", avgRating: "88.5%", currentRating: "95%", stack: "Back-End" },
  { id: "3", name: "Oliver Martinez", email: "oliver@example.com", avgRating: "85%", currentRating: "92%", stack: "Product Design" },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q")?.toLowerCase() || "";
  const type = searchParams.get("type") || "students"; // students, alumni, staffs
  const stack = searchParams.get("stack") || "all"; // Front-End, Back-End, Product Design

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let results;

  if (type === "staffs") {
    results = allStaff.filter(
      (staff) =>
        staff.name.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query) ||
        staff.role.toLowerCase().includes(query)
    );
  } else if (type === "alumni") {
    results = allAlumni.filter((student) => {
      const matchesQuery =
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesStack = stack === "all" || student.stack === stack;
      return matchesQuery && matchesStack;
    });
  } else {
    results = allStudents.filter((student) => {
      const matchesQuery =
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query);
      const matchesStack = stack === "all" || student.stack === stack;
      return matchesQuery && matchesStack;
    });
  }

  return NextResponse.json({
    data: results,
    total: results.length,
    query,
    type,
    stack,
  });
}
