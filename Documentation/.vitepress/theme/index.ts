// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ExamplesGallery from './components/ExamplesGallery.vue'

import './styles/index.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
        app.component('ExamplesGallery', ExamplesGallery)

  }
} satisfies Theme
