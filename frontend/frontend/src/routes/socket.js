import React from 'react'
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(API, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket", "polling"],
});

export default socket

