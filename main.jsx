import React from "react";
import { createRoot } from "react-dom/client";
import ComplaintForm from "./components/ComplaintForm.jsx";
import ComplaintsDisplay from "./components/ComplaintsDisplay.jsx";
import FinanceActionBoard from "./components/FinanceActionBoard.jsx";

// Example: Replace with actual user context or props
const getStoredUser = () => JSON.parse(localStorage.getItem('user') || '{}');
const user = getStoredUser();

const userRole = window.USER_ROLE || user.role || "PARENT";
const studentId = window.STUDENT_ID || user.id || "demo-student-id";
const studentName = user.name || "Student";

if (document.getElementById("complaints-root")) {
  createRoot(document.getElementById("complaints-root")).render(
    <div>
      <ComplaintForm studentId={studentId} onSubmitted={() => window.location.reload()} />
      <ComplaintsDisplay role={userRole} />
    </div>
  );
}

if (document.getElementById("finance-board-root")) {
  createRoot(document.getElementById("finance-board-root")).render(
    <FinanceActionBoard userRole={userRole} />
  );
}
