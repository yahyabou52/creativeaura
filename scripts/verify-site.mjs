import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { parseHTML } from "linkedom";
import postcss from "postcss";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const project = resolve(import.meta.dirname, "..");
const markupDir = join(project, "src/markup");
const fragments = readdirSync(markupDir).filter((name) => name.endsWith(".html"))
  .map((name) => readFileSync(join(markupDir, name), "utf8"));
const { window } = parseHTML(`<html><body><main id="test-root">${fragments.join("\n")}</main></body></html>`);
globalThis.document = window.document;
globalThis.Node = window.Node;
globalThis.MutationObserver = window.MutationObserver;
const root = document.getElementById("test-root");
const temporary = mkdtempSync(join(project, "node_modules/.site-check-"));
const settle = () => new Promise((done) => setTimeout(done, 0));

try {
  // Exercise the actual icon adapter, including content injected after routing.
  const compiled = join(temporary, "icons.mjs");
  await build({ entryPoints:[join(project,"src/Icons.jsx")], outfile:compiled,
    bundle:true, platform:"node", format:"esm", packages:"external", logLevel:"silent" });
  const { installLegacyIcons } = await import(pathToFileURL(compiled));
  const logoBefore = root.querySelector(".brand svg").outerHTML;
  const stopIcons = installLegacyIcons(root);
  await settle();
  assert.equal(root.querySelector(".brand svg").outerHTML, logoBefore, "Brand logo must stay intact");
  for (const element of root.querySelectorAll(".visual-arrow,.menu-toggle,.header-actions>.small-cta")) {
    assert.equal(element.querySelectorAll("svg.ui-icon").length, 1, "Exactly one icon per icon control");
  }
  const dynamic = document.createElement("button");
  dynamic.innerHTML = 'Explore <span>↗</span>';
  root.append(dynamic);
  await settle();
  assert.equal(dynamic.querySelectorAll("svg.ui-icon").length, 1);
  dynamic.innerHTML = 'Close <span>×</span>';
  await settle();
  assert.equal(dynamic.querySelectorAll("svg.ui-icon").length, 1);
  assert.equal(dynamic.querySelector("svg").getAttribute("aria-hidden"), "true");
  assert.equal(root.querySelectorAll(".process-aura-art img").length, 3);
  for (const image of root.querySelectorAll('img[src^="/"]')) {
    assert.ok(existsSync(join(project, "public", image.getAttribute("src"))), `Missing image: ${image.src}`);
  }
  stopIcons();

  const details = [...root.querySelectorAll(".service-list details")];
  assert.equal(details.length, 5);
  assert.equal(details.filter((item) => item.hasAttribute("open")).length, 1);
  assert.ok(details[0].hasAttribute("open"));
  for (const item of details) {
    assert.ok(item.querySelector("summary h3"));
    assert.ok(item.querySelector(".service-body p").textContent.trim());
    assert.ok(item.querySelector(".service-start[data-service]"));
    // Linkedom does not implement the HTMLDetailsElement.open reflection.
    Object.defineProperty(item, "open", { get(){ return this.hasAttribute("open"); },
      set(value){ this.toggleAttribute("open", value); } });
    item.getBoundingClientRect = () => ({ height:100 });
    item.animate = () => {
      const animation = { cancel(){} };
      queueMicrotask(() => animation.onfinish?.());
      return animation;
    };
  }
  const source = readFileSync(join(project,"src/legacy/aura.js"),"utf8");
  const accordion = source.slice(source.indexOf("  const serviceAnimations ="), source.indexOf("  const projectData ="));
  assert.ok(accordion.includes("animateService"));
  const $ = (selector, context=root) => context.querySelector(selector);
  const $$ = (selector, context=root) => [...context.querySelectorAll(selector)];
  for (const motion of [false, true]) {
    details.forEach((item, i) => { item.open = i === 0; });
    // Replace old handlers by using fresh summaries for each motion setting.
    details.forEach((item) => item.querySelector("summary").replaceWith(item.querySelector("summary").cloneNode(true)));
    new Function("$", "$$", "motion", accordion)($, $$, motion);
    details[1].querySelector("summary").dispatchEvent(new window.Event("click", { cancelable:true }));
    await settle();
    assert.ok(details[1].open, "Selected service opens");
    assert.ok(!details[0].open, "Previous service closes");
    details[1].querySelector("summary").dispatchEvent(new window.Event("click", { cancelable:true }));
    await settle();
    assert.ok(!details[1].open, "Selected service can close");
  }

  const css = readFileSync(join(project,"src/styles/professional.css"),"utf8");
  assert.ok(!/\.visual-arrow:after\s*\{[^}]*content:/u.test(css), "Legacy duplicate arrow must be removed");
  const main = readFileSync(join(project,"src/main.jsx"),"utf8");
  const chromeCompiled=join(temporary,'site-chrome.mjs');
  await build({ entryPoints:[join(project,'src/SiteChrome.jsx')], outfile:chromeCompiled,
    bundle:true, platform:'node', format:'esm', packages:'external', logLevel:'silent',
    plugins:[{ name:'raw-markup', setup(bundler) {
      bundler.onLoad({filter:/\.html\?raw$/}, (args) => ({contents:readFileSync(args.path.replace(/\?raw$/,''),'utf8'),loader:'text'}));
      bundler.onResolve({filter:/\.html\?raw$/}, (args) => ({path:resolve(args.resolveDir,args.path)}));
    } }] });
  const { SiteHeader, SiteNavigation }=await import(pathToFileURL(chromeCompiled));
  const chromeFixture=document.createElement('div');
  chromeFixture.innerHTML=renderToStaticMarkup(React.createElement(SiteHeader,{innerPage:true}))
    +renderToStaticMarkup(React.createElement(SiteNavigation,{innerPage:true}));
  assert.ok(chromeFixture.querySelector('header.site-header'));
  assert.ok(chromeFixture.querySelector('dialog.navigation'));
  assert.equal(chromeFixture.querySelector('.brand').getAttribute('href'),'/');
  for (const section of ['studio','services','contact']) assert.ok(chromeFixture.querySelector(`.navigation a[href="/#${section}"]`));
  assert.equal(chromeFixture.querySelectorAll('.navigation nav a[href="/"]').length,1,'Shared menu must include Home once');
  assert.ok(!readFileSync(join(project,'src/ContactPage.jsx'),'utf8').includes('contact-house-menu'));
  if (main.includes('./styles/mobile.css')) {
    // Check the built cascade, including the older competing header rules.
    // This validates sizes and readability declarations, not browser geometry.
    const builtHome = readFileSync(join(project,"dist/index.html"),"utf8");
    const stylesheet = builtHome.match(/href="(\/assets\/[^" ]+\.css)"/)[1];
    const cssTree = postcss.parse(readFileSync(join(project,"dist",stylesheet),"utf8"));
    const contactHeader = root.querySelector('.site-header').cloneNode(true);
    const contactFixture = document.createElement('div');
    contactFixture.className = 'contact-page';
    contactFixture.append(contactHeader);
    const homeMenu=root.querySelector('dialog.navigation');
    const contactMenu=homeMenu.cloneNode(true);
    contactMenu.setAttribute('open','');
    contactFixture.append(contactMenu);
    root.append(contactFixture);
    function active(rule, width) {
      for (let parent=rule.parent; parent; parent=parent.parent) {
        if (parent.type !== 'atrule') continue;
        if (parent.name.includes('keyframes')) return false;
        if (parent.name !== 'media') continue;
        const query = parent.params;
        if (query.includes('prefers-reduced-motion:reduce') || query.includes('prefers-reduced-motion: reduce')) return false;
        for (const match of query.matchAll(/(min|max)-(width|height)\s*:\s*(\d+)px/g)) {
          const actual = match[2] === 'width' ? width : 844;
          if (match[1] === 'min' ? actual < +match[3] : actual > +match[3]) return false;
        }
      }
      return true;
    }
    function value(element, property, width) {
      let winner = null;
      cssTree.walkRules((rule) => {
        if (!active(rule,width)) return;
        for (const selector of rule.selectors) {
          if (selector.includes('::') || /:(before|after|hover|focus|active)\b/.test(selector)) continue;
          let matches=false;
          try { matches=element.matches(selector); } catch { continue; }
          if (!matches) continue;
          const specificity = (selector.match(/#[\w-]+/g)||[]).length * 10000
            + (selector.match(/\.[\w-]+|\[[^\]]+\]|:[\w-]+/g)||[]).length * 100
            + (selector.match(/(?:^|[\s>+~])([a-z][\w-]*)/g)||[]).length;
          rule.walkDecls(property,(declaration) => {
            const priority = (declaration.important ? 1000000 : 0) + specificity;
            if (!winner || priority >= winner.priority) winner={ priority, value:declaration.value };
          });
        }
      });
      return winner?.value;
    }
    for (const width of [320,360,375,390,414,700]) {
      for (const header of [root.querySelector('.site-header'),contactHeader]) {
        for (const control of header.querySelectorAll('.small-cta,.menu-toggle')) {
          assert.equal(value(control,'width',width),'44px', `Header control width at ${width}px`);
          assert.equal(value(control,'height',width),'44px', `Header control height at ${width}px`);
          assert.equal(value(control,'min-width',width),'44px', `Header control minimum at ${width}px`);
          const icon=control.querySelector('svg.ui-icon');
          assert.equal(value(icon,'width',width),'22px');
          assert.equal(value(icon,'height',width),'22px');
        }
        assert.equal(value(header.querySelector('.small-cta > span'),'width',width),'44px');
        assert.equal(value(header.querySelector('.small-cta > span'),'height',width),'44px');
        assert.equal(value(header.querySelector('.brand svg'),'height',width),'auto');
      }
      assert.ok(parseFloat(value(root.querySelector('.service-body p'),'font-size',width))>=16);
      assert.ok(parseFloat(value(root.querySelector('.service-body > div'),'font-size',width))>=14);
      for (const property of ['background','color','width','height','max-height','padding']) {
        assert.equal(value(contactMenu,property,width),value(homeMenu,property,width), `Menu ${property} must match across pages`);
      }
      assert.equal(value(contactMenu.querySelector('nav a'),'font-size',width),value(homeMenu.querySelector('nav a'),'font-size',width));
    }
    assert.notEqual(value(root.querySelector('.small-cta'),'width',1024),'44px', 'Phone button sizing must not affect desktop');
    console.log('PASS: mobile header/icon cascade and service readability at 320, 360, 375, 390, 414 and 700px; desktop sizing preserved.');
  }
  for (const route of ["contact", "business-intake"]) assert.ok(main.includes(`"/${route}"`));
  for (const page of ["index.html","contact.html","portfolio.html","business-intake.html",
    "project/nova.html","project/forme.html","project/flow.html","project/chromatic.html","project/aura-objects.html"]) {
    const html = readFileSync(join(project,"dist",page),"utf8");
    assert.ok(html.includes('<link rel="canonical"'), `Missing canonical: ${page}`);
    for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)) {
      assert.ok(existsSync(join(project,"dist",match[1])), `Missing built asset: ${match[1]}`);
    }
  }
  console.log("PASS: dropdown open/close with motion on/off; initial and dynamic Lucide icons; preserved branding; image references; 9 built routes and their assets.");
} finally {
  rmSync(temporary, { recursive:true, force:true });
}
