<template>
  <div class="banner">
    <h1>VTK.js</h1>
    <div class="banner-description">
      Visualize Your Data With VTK.js
    </div>
    <div class="actions">
      <a href="/docs/" class="btn-primary">Get Started</a>
      <a href="/examples/">Examples</a>
    </div>
    <div class="install">
      <svg class="install-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 19h8M4 17l6-6l-6-6" />
      </svg>
      <button class="install-copy" type="button" @click="copyInstall" :aria-label="copyLabel">
        <code>npm install @kitware/vtk.js</code>
        <span class="copy-status">{{ copied ? "✅" : "📋" }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const installCommand = "npm install @kitware/vtk.js";
const copied = ref(false);
const copyLabel = "Copy install command";

async function copyInstall() {
  try {
    await navigator.clipboard.writeText(installCommand);
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = installCommand;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>


<style lang="css">
@import "../.vitepress/theme/styles/index.css";

.banner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 3.5rem;
  padding-bottom: 7.5rem;
  text-align: center;
}

.banner h1 {
  margin-top: 5rem;
  font-size: 1.875rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--primary);
}

@media (min-width: 1280px) {
  .banner h1 {
    font-size: 3rem;
  }
}

.banner .banner-description {
  font-size: 1.125rem;
  color: var(--muted-foreground);
}

@media (min-width: 1280px) {
  .banner .banner-description {
    font-size: 1.5rem;
  }
}

.banner .actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.banner .actions a {
  display: flex;
  align-items: center;
  height: 2rem;
  border-radius: 0.375rem;
  gap: 0.375rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  text-decoration: none;
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.banner .actions a:hover {
  background-color: color-mix(in oklab, var(--secondary) 70%, transparent);
}

.banner .actions a.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.banner .actions a.btn-primary:hover {
  background-color: color-mix(in oklab, var(--primary) 90%, transparent);
}

.banner .install {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  margin-top: 2rem;
  padding: 0.2rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 0.375rem;
  background-color: color-mix(in oklab, var(--background) 90%, transparent);
}

.banner .install-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.7;
}

.banner .install-copy {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.banner .install-copy:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 70%, transparent);
  outline-offset: 3px;
  border-radius: 999px;
}

.banner .install code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.8125rem;
  background: transparent;
  padding: 0;
}

.banner .copy-status {
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  opacity: 0.7;
}
</style>
