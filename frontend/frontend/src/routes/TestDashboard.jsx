import React from "react";

function TestDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  
  return (
    <div style={{ padding: "20px", minHeight: "100vh", background: "#f0f0f0" }}>
      <h1>Test Dashboard</h1>
      <p>User: {user ? user.name : "No user"}</p>
      <p>This is a test to see if the dashboard renders</p>
    </div>
  );
}

export default TestDashboard;