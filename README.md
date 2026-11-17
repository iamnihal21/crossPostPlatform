# Postlane Social Studio

Postlane is a responsive social publishing dashboard prototype for managing multiple projects, connected accounts, scheduled posts, and simple analytics across X, LinkedIn, Instagram, YouTube Shorts, Facebook, and Threads.

## Current features

- Multi-project workspace
- Connected-account management screens
- Cross-platform post composer
- Schedule and calendar views
- Overview and channel analytics
- Responsive desktop and mobile layouts
- Interactive demo flows using browser-local state

## Run locally

The application is a build-free static site. From the repository root, serve the `dist` directory with any static server:

```bash
npx serve dist
```

Then open the local URL printed by the server.

## Project structure

```text
dist/
  index.html    Main application markup
  styles.css    Responsive interface styles
  app.js        Demo data and interactions
.openai/
  hosting.json  Sites deployment configuration
```

## Integration status

The current version is a functional front-end prototype. Live OAuth, publishing, scheduled background jobs, media storage, and analytics syncing require the relevant platform API credentials and a backend service.

## Live preview

https://postlane-social-studio.shadylotus256.chatgpt.site
