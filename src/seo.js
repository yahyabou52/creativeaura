const defaultDescription = 'CreativeAura is a creative studio designing websites, web apps, brand identities and digital experiences for brands and teams ready to stand apart.';
const projectDescriptions = {
  nova: 'NOVA is a CreativeAura studio concept exploring botanical care branding, packaging and art direction.',
  'aura-objects': 'Aura Objects is a CreativeAura studio concept exploring digital image making and material studies.',
  forme: 'Forme is a CreativeAura studio concept for an editorial interiors website and user experience.',
  chromatic: 'Chromatic is a CreativeAura studio concept for editorial imagery and art direction.',
  flow: 'Flow is a CreativeAura studio concept for a team workspace and digital product interface.',
};
const projectTitles = {
  nova: 'NOVA',
  'aura-objects': 'AURA OBJECTS',
  forme: 'FORME',
  chromatic: 'CHROMATIC',
  flow: 'FLOW',
};

function setMeta(name, content, attribute = 'name') {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export function updatePageMetadata() {
  const hash = window.location.hash;
  const slug = hash.startsWith('#/project/') ? hash.slice('#/project/'.length) : null;
  const title = slug && projectTitles[slug]
    ? `${projectTitles[slug]} — CreativeAura`
    : hash === '#/portfolio'
      ? 'Portfolio — CreativeAura'
      : 'CreativeAura® — Uncommon by design';
  const description = slug && projectDescriptions[slug]
    ? projectDescriptions[slug]
    : hash === '#/portfolio'
      ? 'Explore CreativeAura studio concepts across brand identity, websites, digital products and image making. Client work will be added here soon.'
      : defaultDescription;
  setMeta('description', description);
  setMeta('og:title', title, 'property');
  setMeta('og:description', description, 'property');
  setMeta('og:type', 'website', 'property');
  setMeta('og:url', window.location.href, 'property');
}
