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

The existing scripts still control animations, dialogs, and routing. React mounts the static sections first, then loads those scripts in order. Portfolio and project pages use clean paths; section anchors on the home page still use hashes.

## Project brief

The `/contact` page has a project form on the left and direct email/WhatsApp contact details on the right. For this static version, **Send your idea** saves the form and optional attachment to IndexedDB in the visitor's current browser, then shows a local confirmation. It does not submit to a server, send email, or make the inquiry visible to the studio. Attachments may be any file type up to 20 MB. Browser data can be cleared by the visitor, and saved inquiries do not follow them to another device. Connect this flow to the planned dashboard before treating the form as a live inquiry channel.

## Business information worksheet

Open `/business-intake` to answer the website planning questions one section at a time. Answers save automatically to this browser's local storage and can be downloaded as `creativeaura-business-info.json`. The worksheet does not send answers to a server; download the JSON before clearing browser data or switching devices. This is an owner worksheet and is intentionally absent from the public navigation.

The portfolio has two art-directed "coming soon" panels for future client stories. They do not claim completed client work. Replace them with approved case studies, scope and outcomes when available.

The untouched source from the supplied zip is preserved in the repository's initial Git commit. The duplicate `CreativeAura/` directory was removed from the current tree.

## Site metadata

The app includes a favicon, a 1200 × 630 share image, `robots.txt` and a sitemap for `https://c-aura.com`. Run `python scripts/generate_social_preview.py` if the share image needs to be regenerated. The build writes route-specific HTML metadata and canonical URLs for `/portfolio` and `/project/<slug>`; `vercel.json` serves these files at clean URLs. The page body still renders in the browser, so full content pre-rendering remains future work. The owner worksheet is marked `noindex` and excluded from the sitemap.

## Confirmed business details

CreativeAura is based in Casablanca and works with clients worldwide. Public contact routes are `contact@c-aura.com` and WhatsApp `+212689111339`. Projects are scoped individually; timelines and prices are agreed after a brief. The studio offers design, development, brand work, photography, video and motion. The site currently uses English; a full French version still needs translation and visual review. Do not publish founder names, legal registration details, client claims or private project work until explicitly approved.

## Code formatting

The original interaction scripts in `src/legacy/` are now formatted for editing. They still manage animations, dialogs and routes until those behaviors are moved into React components. Run `npm run format` to format the maintained source files.
