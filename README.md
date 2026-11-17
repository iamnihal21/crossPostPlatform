# Postlane Social Studio

Postlane is a social publishing workspace for managing multiple projects, connected accounts, scheduled posts, and analytics across X, LinkedIn, Instagram, YouTube Shorts, Facebook, and Threads.

The production application is being rebuilt component by component with Next.js and TypeScript. The original static prototype remains in `dist/` as a visual reference while this work is in progress.

## Current features

- Multi-project workspace
- Connected-account management screens
- Cross-platform post composer
- Schedule and calendar views
- Overview and channel analytics
- Responsive desktop and mobile layouts
- Interactive demo flows using browser-local state

## Production development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Before committing changes, run:

```bash
npm run typecheck
npm run build
```

## Prototype

The original prototype is a build-free static site. From the repository root, serve the `dist` directory with any static server:

```bash
npx serve dist
```

Then open the local URL printed by the server.

## Project structure

```text
dist/
  index.html       Original prototype markup
  styles.css       Original prototype styles
  app.js           Original prototype interactions
app/               Next.js routes and global styles
components/        Reusable layout, dashboard, and UI components
lib/               Typed navigation and dashboard data
.openai/
  hosting.json     Sites deployment configuration
```

## Integration status

The current version is a functional front-end prototype. Live OAuth, publishing, scheduled background jobs, media storage, and analytics syncing require the relevant platform API credentials and a backend service.

## Live preview

https://postlane-social-studio.shadylotus256.chatgpt.site
