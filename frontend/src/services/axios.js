import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000", // Your FastAPI base URL
  withCredentials: true           // Allow sending cookies
});

// Remove the token injection because you're using HttpOnly cookies now
// You no longer need to attach Authorization header manually
export default api;
