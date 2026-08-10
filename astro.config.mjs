// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import clerk from '@clerk/astro';
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [clerk()],
  adapter: vercel(),
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  }
});
