import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import SignupForm from "../auth/signup";
import Login from "../auth/login";
import Dashboard from "./Dashboard";
import SimpleDashboard from "./SimpleDashboard";
import Editor from "./Editor";
import PprotectedRoute from "./PprotectedRoute";
import Failed404 from "./Failed404";
import { ThemeProvider } from "./ThemeContext";

export default function RouterPage() {
  const [token, settoken] = useState("");
  useEffect(() => {
    settoken(localStorage.getItem("token"));
  }, [])
  return (
    <Router>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <PprotectedRoute>
              <Dashboard />
            </PprotectedRoute>
          }
        />
        <Route
          path="/dashboard-full"
          element={
            <PprotectedRoute>
              <Dashboard />
            </PprotectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <PprotectedRoute>
              <Editor />
            </PprotectedRoute>
          }
        />
        <Route path="/404" element={<Failed404 />} />
      </Routes>
    </Router>
  );
}
