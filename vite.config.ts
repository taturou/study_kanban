import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/study_kanban/",
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    deps: {
      inline: ["@mui/material", "@mui/system", "@mui/utils", "@mui/x-date-pickers", "@mui/icons-material"],
    },
  },
});
