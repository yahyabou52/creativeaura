import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { parseHTML } from "linkedom";

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
