export const defaultDescription =
  "CreativeAura is a Casablanca creative studio building websites, web apps, brand identities and visual content for clients worldwide.";
export const siteOrigin = "https://c-aura.com";
export const projectDescriptions = {
  nova: "NOVA is a CreativeAura studio concept exploring botanical care branding, packaging and art direction.",
  "aura-objects":
    "Aura Objects is a CreativeAura studio concept exploring digital image making and material studies.",
  forme:
    "Forme is a CreativeAura studio concept for an editorial interiors website and user experience.",
  chromatic:
    "Chromatic is a CreativeAura studio concept for editorial imagery and art direction.",
  flow: "Flow is a CreativeAura studio concept for a team workspace and digital product interface.",
};
export const projectTitles = {
  nova: "NOVA",
  "aura-objects": "AURA OBJECTS",
  forme: "FORME",
  chromatic: "CHROMATIC",
  flow: "FLOW",
};

function setMeta(name, content, attribute = "name") {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function updatePageMetadata() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const slug = path.startsWith("/project/")
    ? path.slice("/project/".length)
    : null;
  const title =
    slug && projectTitles[slug]
      ? `${projectTitles[slug]} — CreativeAura`
      : path === "/portfolio"
        ? "Portfolio — CreativeAura"
        : "CreativeAura® — Uncommon by design";
  const description =
    slug && projectDescriptions[slug]
      ? projectDescriptions[slug]
      : path === "/portfolio"
        ? "Explore CreativeAura studio concepts across brand identity, websites, digital products and image making. Client work will be added here soon."
        : defaultDescription;
  const canonical = siteOrigin + path;
  document.title = title;
  setMeta("description", description);
  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:type", "website", "property");
  setMeta("og:url", canonical, "property");
  setMeta("og:image", siteOrigin + "/social-preview.png", "property");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", siteOrigin + "/social-preview.png");
  let canonicalTag = document.head.querySelector('link[rel="canonical"]');
  if (!canonicalTag) {
    canonicalTag = document.createElement("link");
    canonicalTag.rel = "canonical";
    document.head.appendChild(canonicalTag);
  }
  canonicalTag.href = canonical;
}
