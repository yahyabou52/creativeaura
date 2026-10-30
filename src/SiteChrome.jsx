import React, { useEffect, useMemo, useRef } from "react";
import headerMarkup from "./markup/site_header.html?raw";
import navigationMarkup from "./markup/navigation.html?raw";
import { installLegacyIcons } from "./Icons";

function useTemplate(markup, innerPage) {
  return useMemo(() => {
    const template = document.createElement("template");
    template.innerHTML = markup;
    const element = template.content.firstElementChild;
    if (innerPage) {
      // Section links from another page must lead back to the homepage.
      element.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.setAttribute("href", `/${link.getAttribute("href")}`);
      });
      element.querySelector(".brand")?.setAttribute("href", "/");
    }
    return element.innerHTML;
  }, [markup, innerPage]);
}

export function SiteHeader({ innerPage = false, menuOpen = false, onOpenMenu, onStartProject }) {
  const headerRef = useRef(null);
  const html = useTemplate(headerMarkup, innerPage);
  useEffect(() => {
    if (innerPage) return installLegacyIcons(headerRef.current);
  }, [innerPage]);
  useEffect(() => {
    if (innerPage) headerRef.current.querySelector(".menu-toggle")?.setAttribute("aria-expanded", String(menuOpen));
  }, [innerPage, menuOpen]);
  function handleClick(event) {
    if (onOpenMenu && event.target.closest(".menu-toggle")) {
      event.preventDefault();
      onOpenMenu();
    } else if (onStartProject && event.target.closest(".project-start")) {
      event.preventDefault();
      onStartProject();
    }
  }
  return <header ref={headerRef} className="site-header" onClick={handleClick} dangerouslySetInnerHTML={{ __html:html }} />;
}

export function SiteNavigation({ innerPage = false, dialogRef, onClose }) {
  const localRef = useRef(null);
  const ref = dialogRef || localRef;
  const html = useTemplate(navigationMarkup, innerPage);
  useEffect(() => {
    if (innerPage) return installLegacyIcons(ref.current);
  }, [innerPage, ref]);
  function handleClick(event) {
    if (!innerPage) return; // The homepage's existing navigation script handles this.
    if (event.target.closest(".nav-close,a")) ref.current.close();
  }
  return <dialog ref={ref} className="navigation" id="navigation" onClick={handleClick} onClose={onClose} dangerouslySetInnerHTML={{ __html:html }} />;
}
