import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cwd = path.join(__dirname, '..', 'api');

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

  const sidebar = {
    '/': [
      {
        text: 'Getting Started',
        collapsed: true,
        items: [
          { text: 'Introduction', link: '/introduction' },
          { text: 'Tutorial', link: '/tutorial' },
        ],
      },
    ],
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
