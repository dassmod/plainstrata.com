import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://plainstrata.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
