import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./styles/aura.css";
import "./styles/kinetic.css";
import "./styles/professional.css";
import "./styles/improvements.css";
import { updatePageMetadata } from "./seo";
import BusinessIntake from "./BusinessIntake";
import ContactPage from "./ContactPage";

const sections = import.meta.glob("./markup/*.html", {
  eager: true,
  query: "?raw",
  import: "default",
});

function Markup({ name }) {
  const template = document.createElement("template");
  template.innerHTML = sections[`./markup/${name}.html`];
  const element = template.content.firstElementChild;
  const props = Object.fromEntries(
    [...element.attributes].map(({ name, value }) => [
      name === "class" ? "className" : name,
      name === "hidden" ? true : value,
    ]),
  );
  props.dangerouslySetInnerHTML = { __html: element.innerHTML };
  return React.createElement(element.tagName.toLowerCase(), props);
}

const homeSections = [
  "top",
  "studio",
  "ticker",
  "work",
  "services",
  "feeling",
  "idea_lab",
  "process",
  "contact",
];
const legacyModules = [
  () => import("./legacy/aura.js"),
  () => import("./legacy/liquid.js"),
  () => import("./legacy/sculptures.js"),
  () => import("./legacy/kinetic.js"),
  () => import("./legacy/portfolio.js"),
];

function App() {
  useEffect(() => {
    // The original animation and routing code still manages its own DOM nodes.
    // Import in its original order after React has mounted the page.
    let cancelled = false;
    async function loadLegacyModules() {
      for (const load of legacyModules) {
        if (cancelled) return;
        await load();
      }
    }
    loadLegacyModules()
      .then(updatePageMetadata)
      .catch((error) => console.error("Could not load site scripts", error));
    window.addEventListener("aura:route", updatePageMetadata);
    window.addEventListener("popstate", updatePageMetadata);
    return () => {
      cancelled = true;
      window.removeEventListener("aura:route", updatePageMetadata);
      window.removeEventListener("popstate", updatePageMetadata);
    };
  }, []);

  return (
    <>
      <Markup name="skip" />
      <Markup name="loader" />
      <Markup name="cursor" />
      <Markup name="reading_progress" />
      <Markup name="site_header" />
      <Markup name="navigation" />
      <main data-home-page="" id="main">
        {homeSections.map((name) => (
          <Markup key={name} name={name} />
        ))}
      </main>
      <Markup name="page_view" />
      <Markup name="footer" />
      <Markup name="project_dialog" />
    </>
  );
}

const path = window.location.pathname.replace(/\/+$/, "");
createRoot(document.getElementById("root")).render(
  path === "/business-intake" ? <BusinessIntake /> : path === "/contact" ? <ContactPage /> : <App />,
);
