import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2015",
    outDir: "dist",
    lib: {
      entry: "./index.ts",
      fileName: "index",
      name: "WebAudioTag",
    },
  },
});
