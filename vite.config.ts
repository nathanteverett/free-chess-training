import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// https://vite.dev/config/
export default defineConfig({
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
})
