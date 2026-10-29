# CreativeAura React app

The original CreativeAura v5 site now runs as a Vite + React app.

## Run it

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173/`). Use `npm run build` for a production build in `dist/`.

## Where to edit

- `src/main.jsx` contains the React page structure and script loading.
- `src/markup/` contains one editable HTML fragment per page section or dialog.
- `src/styles/` contains the original styles.
- `public/assets/` contains the images.
- `src/legacy/` contains the original animation, interaction, and portfolio code, loaded through Vite after React mounts.

The existing scripts still control animations, dialogs, and hash routes. React mounts the static sections first, then loads those scripts in order. This keeps the current site working while allowing individual sections and behaviors to be converted into React components as the site evolves.

## Inquiry email

The form prepares a brief on the visitor's device. It offers copy and download actions. To also show an **Open email app** button, copy `.env.example` to `.env.local` and replace the sample address with your real agency mailbox:

```text
VITE_INQUIRY_EMAIL=hello@your-real-domain.com
```

Restart Vite after changing `.env.local`. The visitor must still send the prepared message from their email app. The site does not silently send or store form data. Until a real mailbox or form backend is configured, the site clearly says no inquiry has been sent.

The portfolio has two art-directed "coming soon" panels for future client stories. They do not claim completed client work. Replace them with approved case studies, scope and outcomes when available. Page descriptions and social titles change for the hash routes in the browser; server-rendered metadata and clean URLs require a later routing/deployment pass.

The untouched source from the supplied zip is in `CreativeAura/` for reference.
