import { defineConfig } from 'vitepress';
import { sidebar } from './sidebar';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: 'VTK.js ',
  description: 'VTK.js a Visualization Toolkit for the Web',
  lastUpdated: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
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
      copyright: `© ${new Date().getFullYear()} Kitware Inc.`
    }
  },
});
