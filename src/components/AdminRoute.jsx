import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    // corrupted storage — treat as logged out
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" />;
  }

  return children;
}
