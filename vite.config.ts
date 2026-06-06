import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bind to IPv4 loopback explicitly. By default Vite listens on ::1 only,
    // which ngrok can't reach since it resolves localhost as 127.0.0.1.
    host: "127.0.0.1",
    // Accept the dynamic *.ngrok-free.app / *.ngrok.app hostnames in the Host
    // header so a tunnel into the dev server isn't rejected.
    allowedHosts: [".ngrok-free.app", ".ngrok.app", ".ngrok.io"],
  },
});
