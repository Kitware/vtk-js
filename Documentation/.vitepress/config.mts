import { defineConfig } from 'vitepress';
import llmstxt from "vitepress-plugin-llms";
import { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms'

import { sidebar } from './sidebar';

// https://vitepress.dev/reference/site-config
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProd ? '/vtk-js/' : '/',
  lang: 'en-US',
  title: 'VTK.js ',
  description: 'VTK.js a Visualization Toolkit for the Web',
  srcDir: './content',
  lastUpdated: true,
  ignoreDeadLinks: true,
  vite: {
    plugins: [llmstxt({
      ignoreFiles: [
        'examples/*',
        'coverage/*',
      ]
    })],
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo-wide.svg',
    siteTitle: '',
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Datasets', link: 'https://kitware.github.io/vtk-js-datasets/' },
    ],
    sidebar: sidebar,
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Kitware/vtk-js' },
    ],
    outline: 'deep',
    search: {
      provider: 'local',
    },
    footer: {
      copyright: `© ${new Date().getFullYear()} Kitware Inc.`,
    }
  },
   markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons)
    }
  }
});
