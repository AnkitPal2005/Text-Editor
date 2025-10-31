import React from "react";
import { Navigate } from "react-router-dom";

export default function PprotectedRoute({ children }) {
  const token = localStorage.getItem("token");
  // treat missing / "null" / empty token as unauthenticated
  if (
    !token ||
    token === "null" ||
    (typeof token === "string" && token.trim() === "")
  ) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
