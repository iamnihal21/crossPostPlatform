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

The production code includes secure OAuth connection flows for X, LinkedIn, Facebook/Instagram, Threads, and Google/YouTube. Apply the Supabase migrations and copy `.env.example` to `.env.local` before connecting live accounts. Tokens are encrypted with AES-256-GCM before storage and are never exposed to browser clients.

Generate the encryption key once and store it in your deployment secret manager:

```bash
openssl rand -base64 32
```

Each provider app must use these callback URL patterns:

```text
https://YOUR_DOMAIN/api/oauth/x/callback
https://YOUR_DOMAIN/api/oauth/linkedin/callback
https://YOUR_DOMAIN/api/oauth/meta/callback
https://YOUR_DOMAIN/api/oauth/threads/callback
https://YOUR_DOMAIN/api/oauth/google/callback
```

Real publishing, scheduled background jobs, media storage, token refresh jobs, and analytics syncing are separate components still to be implemented.

## Live preview

https://postlane-social-studio.shadylotus256.chatgpt.site
