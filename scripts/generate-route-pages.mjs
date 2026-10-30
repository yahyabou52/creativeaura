import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  defaultDescription,
  projectDescriptions,
  projectTitles,
  siteOrigin,
} from "../src/seo.js";

const dist = join(process.cwd(), "dist");
const template = readFileSync(join(dist, "index.html"), "utf8");

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function page(title, description, fallback, path, noindex = false) {
  let html = template.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  );
  const metadata = [
    ["name", "description", description],
    ["property", "og:title", title],
    ["property", "og:description", description],
    ["name", "twitter:title", title],
    ["name", "twitter:description", description],
    ["property", "og:url", siteOrigin + path],
  ];
  for (const [attribute, key, value] of metadata) {
    const expression = new RegExp(
      `(<meta ${attribute}="${key}" content=")[^"]*("\\s*\\/>)`,
    );
    html = html.replace(expression, `$1${escapeHtml(value)}$2`);
  }
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(" \/>)/,
    `$1${siteOrigin + path}$2`,
  );
  if (noindex) html = html.replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n  </head>');
  return html.replace(
    /<noscript>.*?<\/noscript>/s,
    `<noscript><main>${fallback}</main></noscript>`,
  );
}

const portfolioDescription =
  "Explore CreativeAura studio concepts across brand identity, websites, digital products and image making. Client work will be added here soon.";
writeFileSync(
  join(dist, "portfolio.html"),
  page(
    "Portfolio — CreativeAura",
    portfolioDescription,
    `<h1>CreativeAura portfolio</h1><p>${escapeHtml(portfolioDescription)}</p><p><a href="/">CreativeAura home</a></p>`,
    "/portfolio",
  ),
);

writeFileSync(
  join(dist, "business-intake.html"),
  page(
    "Studio details — CreativeAura",
    "A private worksheet to gather the business information needed for the CreativeAura website.",
    '<h1>CreativeAura studio details</h1><p>Enable JavaScript to fill in and save this worksheet on your device.</p>',
    "/business-intake",
    true,
  ),
);

writeFileSync(
  join(dist, "contact.html"),
  page(
    "Start a project — CreativeAura",
    "Tell CreativeAura what you want to make. Explore a project brief or contact our Casablanca team directly by email or WhatsApp.",
    '<h1>Start a project with CreativeAura</h1><p>We are based in Casablanca and work worldwide. Email <a href="mailto:contact@c-aura.com">contact@c-aura.com</a> to say hello.</p>',
    "/contact",
  ),
);

mkdirSync(join(dist, "project"), { recursive: true });
for (const [slug, title] of Object.entries(projectTitles)) {
  const description = projectDescriptions[slug] || defaultDescription;
  writeFileSync(
    join(dist, "project", `${slug}.html`),
    page(
      `${title} — CreativeAura`,
      description,
      `<h1>${escapeHtml(title)} — studio concept</h1><p>${escapeHtml(description)}</p><p><a href="/portfolio">Explore the portfolio</a></p>`,
      `/project/${slug}`,
    ),
  );
}
