import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { copyOrDownloadAsMarkdownButtons } from 'vitepress-plugin-llms';

import { sidebar } from './sidebar';
import { BASE_URL, withBase } from './utils';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: BASE_URL,
  lang: 'en-US',
  title: 'VTK.js ',
  description: 'VTK.js a Visualization Toolkit for the Web',
  lastUpdated: true,
  ignoreDeadLinks: true,
  srcExclude: ['**/scripts/**',],
  vite: {
    plugins: [
      llmstxt({
        ignoreFiles: ['examples/*', 'coverage/*', 'scripts/*'],
      }),
    ],
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
      copyright: `© ${new Date().getFullYear()} <a href="https://www.kitware.com/" target="_blank">Kitware Inc</a>.`,
    },
  },
  markdown: {
    config(md) {
      md.use(copyOrDownloadAsMarkdownButtons);
    },
  },
});
