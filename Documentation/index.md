---
# https://vitepress.dev/reference/default-theme-home-page
layout: page
sidebar: false
hero:
  name: 'VTK.js'
  text: 'A VitePress Site'
  tagline: Visualize Your Data With vtk.js
  actions:
    - theme: brand
      text: Markdown Examples
      link: /markdown-examples
    - theme: alt
      text: API Examples
      link: /api-examples

features:
  - icon: ⚡️
    title: Feature A
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature B
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
  - title: Feature C
    details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
---

<script setup>
  import {
    VPHomeHero,
    VPHomeFeatures,
  } from 'vitepress/theme'
</script>

<div class="HPHero"></div>
<VPHomeHero />
<VPHomeFeatures />
