import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

/** @type {import('vite').UserConfig} */
const config = defineConfig({
  base: "/icon-creator/",
  plugins: [svelte()],
});

export default config;
