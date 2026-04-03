import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://docs.composeproof.dev',
  integrations: [
    starlight({
      title: 'ComposeProof',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/aldefy/composeproof' },
        { icon: 'x.com', label: 'X', href: 'https://x.com/AditLal' },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://aditlal.dev/stats/script.js',
            'data-website-id': '5a0d08a2-a550-421d-a218-28aa4912639d',
          },
        },
      ],
      sidebar: [
        { label: 'Introduction', slug: '' },
        {
          label: 'Getting Started',
          items: [
            { label: 'Installation', slug: 'getting-started/installation' },
            { label: 'Configuration', slug: 'getting-started/configuration' },
            { label: 'First Render', slug: 'getting-started/first-render' },
            { label: 'First Device Session', slug: 'getting-started/first-device-session' },
          ],
        },
        { label: 'Prompt Cookbook', slug: 'prompt-cookbook' },
        {
          label: 'Concepts',
          items: [
            { label: 'How It Works', slug: 'concepts/how-it-works' },
            { label: 'Zero-Install Architecture', slug: 'concepts/zero-install' },
            { label: 'Headless Rendering', slug: 'concepts/headless-rendering' },
            { label: 'Golden Management', slug: 'concepts/golden-management' },
            { label: 'Context Graph', slug: 'concepts/context-graph' },
            { label: 'Embedded Agent', slug: 'concepts/embedded-agent' },
          ],
        },
        {
          label: 'Tools',
          items: [
            { label: 'Context & Orientation', slug: 'tools/context-orientation' },
            { label: 'Headless Rendering', slug: 'tools/headless-rendering' },
            { label: 'Device Interaction', slug: 'tools/device-interaction' },
            { label: 'Device Inspection', slug: 'tools/device-inspection' },
            { label: 'Embedded Agent — Runtime', slug: 'tools/embedded-runtime' },
            { label: 'Embedded Agent — Compose', slug: 'tools/embedded-compose' },
            { label: 'Testing & Mocking', slug: 'tools/testing-mocking' },
            { label: 'Code Intelligence (Pro)', slug: 'tools/code-intelligence' },
            { label: 'Expert Prompts', slug: 'tools/expert-prompts' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'CI/CD Integration', slug: 'guides/ci-cd' },
            { label: 'Debugging Workflows', slug: 'guides/debugging' },
            { label: 'Spec-Driven Verification', slug: 'guides/spec-verification' },
          ],
        },
        { label: 'Roadmap', slug: 'roadmap' },
      ],
    }),
    tailwind({ applyBaseStyles: false }),
  ],
  output: 'static',
});
