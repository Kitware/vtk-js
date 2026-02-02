import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = path.join(__dirname, '..', 'api');

const docsMenu = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Overview', link: 'index.html' },
      { text: 'Import from a CDN', link: 'intro_vtk_as_external_script.html' },
      { text: 'ES6 Dependency', link: 'intro_vtk_as_es6_dependency.html' },
      { text: 'React Usage', link: 'vtk_react.html' },
      { text: 'Vue Usage', link: 'vtk_vue.html' },
      { text: 'Vanilla Usage', link: 'vtk_vanilla.html' },
      { text: 'Tutorial', link: 'tutorial.html' },
      { text: 'Old ES6 Docs', link: 'old_intro_vtk_es6.html' },
    ],
  },
  {
    text: 'Develop',
    items: [
      { text: 'Requirement', link: 'develop_requirement.html' },
      { text: 'Class', link: 'develop_class.html' },
      { text: 'Example', link: 'develop_example.html' },
      { text: 'Test', link: 'develop_test.html' },
      { text: 'Build', link: 'develop_build.html' },
      { text: 'Widget', link: 'develop_widget.html' },
      { text: 'WebGPU', link: 'develop_webgpu.html' },
      { text: 'WebXR', link: 'develop_webxr.html' },
    ],
  },
  {
    text: 'Concepts',
    items: [{ text: 'Widgets', link: 'concepts_widgets.html' }],
  },
  {
    text: 'Miscellaneous',
    items: [
      { text: 'Tools', link: 'misc_tools.html' },
      { text: 'Troubleshooting', link: 'misc_troubleshooting.html' },
      { text: 'Contributing', link: 'misc_contributing.html' },
    ],
  },
  {
    text: 'Data Format',
    items: [
      { text: 'Structures', link: 'structures.html' },
      { text: 'Data Array', link: 'structures_DataArray.html' },
      { text: 'String Array', link: 'structures_StringArray.html' },
      { text: 'Poly Data', link: 'structures_PolyData.html' },
    ],
  },
  {
    text: 'Testing',
    items: [
      { text: 'Tests', link: '/vtk-js/coverage/tests.html' },
      { text: 'Coverage', link: '/vtk-js/coverage/home.html' },
    ],
  },
];

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkSync(fullPath, filelist);
    } else if (file.endsWith('.md') && file !== 'index.md') {
      filelist.push(fullPath);
    }
  });
  return filelist;
}

function generateSidebarConfig() {
  const apiFiles = walkSync(cwd);
  const sidebarStructure = {};

  apiFiles.forEach((file) => {
    const filename = path.basename(file, '.md'); // e.g., Common_Core_Base64
    const parts = filename.split('_');
    let current = sidebarStructure;

    // Build nested structure from filename parts
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Leaf node: store filename for link
        console.log(`Adding ${filename} to sidebar structure`);
        current[part] = `${filename}`;
      } else {
        // If current[part] exists and is a string, convert it to an object
        if (typeof current[part] === 'string') {
          current[part] = { [part]: current[part] };
        } else if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    }
  });

  function convertToSidebarItems(obj, parentParts = []) {
    return Object.keys(obj).map((key) => {
      const value = obj[key];
      if (typeof value === 'string') {
        // Leaf node
        return {
          text: key,
          link: `/api/${value}.html`,
        };
      }
      // Nested node
      return {
        text: key,
        collapsed: true,
        items: convertToSidebarItems(value, [...parentParts, key]),
      };
    });
  }

  const docsSidebarItems = docsMenu.map((section) => ({
    text: section.text,
    collapsed: true,
    items: section.items.map((item) => ({
      text: item.text,
      link: item.link.startsWith('/') ? item.link : `/docs/${item.link}`,
    })),
  }));

  const sidebar = {
    '/docs/': docsSidebarItems,
    '/api/': convertToSidebarItems(sidebarStructure),
  };

  const sidebarConfig = `import { DefaultTheme } from 'vitepress'

export const sidebar: DefaultTheme.Sidebar = ${JSON.stringify(
    sidebar,
    null,
    2
  )}`;

  fs.writeFileSync(
    path.join(__dirname, '..', '.vitepress', 'sidebar.ts'),
    sidebarConfig
  );
  console.log('Sidebar configuration has been generated!');
}

generateSidebarConfig();
