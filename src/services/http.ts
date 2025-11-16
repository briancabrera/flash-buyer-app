// src/services/http.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
});

