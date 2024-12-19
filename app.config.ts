import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  // vite: {
  //   ssr: {
  //     noExternal: ["pdf-img-convert", "node-fetch"],
  //     external: ["canvas"],
  //   },
  // },
  ssr: false,
  server: {
    preset: "node-server",
  },
});
