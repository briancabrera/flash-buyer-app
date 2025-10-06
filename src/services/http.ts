// src/services/http.ts
import axios from "axios";

const BASE_URL ="http://localhost:4000";

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
});

