import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// A bad VITE_LIVE_SERVER_URL cannot fail at build time on its own: it is just a
// string that gets baked into the bundle, and only breaks in the user's browser
// when they try to start a game. A placeholder left unreplaced is the obvious
// way to get this wrong, so refuse to build one.
const liveServer = process.env.VITE_LIVE_SERVER_URL
if (liveServer) {
  try {
    new URL(liveServer)
  } catch {
    throw new Error(
      `VITE_LIVE_SERVER_URL is not a valid URL: "${liveServer}"\n` +
        'It must be the deployed Worker origin, e.g.\n' +
        '  https://free-chess-training-live.<your-subdomain>.workers.dev\n' +
        'with <your-subdomain> replaced by your real workers.dev subdomain.',
    )
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub project pages serve the site from /<repo>/, not the domain root, so
  // every asset URL needs that prefix. The deploy workflow sets BASE_PATH; a
  // custom domain (or `vite dev`) wants the default "/". Anything reading an
  // asset by absolute path must go through `import.meta.env.BASE_URL`, which
  // Vite fills in from this — see EngineService and Layout.
  base: process.env.BASE_PATH ?? '/',

  plugins: [
    // MDX must run before the React plugin so that .mdx compiles to JSX first.
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          // Exposes YAML frontmatter as a named `frontmatter` export on each .mdx module.
          [remarkMdxFrontmatter, { name: 'frontmatter' }],
        ],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    tailwindcss(),
  ],
  worker: {
    format: 'es',
  },
  server: {
    // Live play needs the game server. `npm run dev:worker` runs it on 8787;
    // everything else in the app still works with the Worker stopped.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
