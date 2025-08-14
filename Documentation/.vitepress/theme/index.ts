// https://vitepress.dev/guide/custom-theme
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import googleAnalytics from "vitepress-plugin-google-analytics";
import CopyOrDownloadAsMarkdownButtons from 'vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue'

import ExamplesGallery from './components/ExamplesGallery.vue'

import './styles/index.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    app.component('ExamplesGallery', ExamplesGallery),
    app.component('CopyOrDownloadAsMarkdownButtons', CopyOrDownloadAsMarkdownButtons)
    googleAnalytics({
      id: "G-5XH2Z0Y9LQ",
    });
  }
} satisfies Theme
