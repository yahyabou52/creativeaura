import React from "react";
import iconMarkup from "./generated/icon-markup";
import {
  ArrowUpRight, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, X, Menu,
  Plus, Paperclip, Mail, MessageCircle, Check, Circle, CircleCheck,
  Pause, Play, Camera, Search,
} from "lucide-react";

const icons = {
  ArrowUpRight, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, X, Menu,
  Plus, Paperclip, Mail, MessageCircle, Check, Circle, CircleCheck,
  Pause, Play, Camera, Search,
};

export default function Icon({ name, className = "", ...props }) {
  const Component = icons[name];
  return <Component size={20} strokeWidth={1.75} aria-hidden="true" focusable="false" className={`ui-icon ${className}`} {...props} />;
}

const glyphs = {
  "↗": "ArrowUpRight", "→": "ArrowRight", "←": "ArrowLeft",
  "↓": "ArrowDown", "↑": "ArrowUp", "×": "X", "＋": "Plus",
  "◎": "Camera", "◉": "Play", "○": "Pause", "Ⅱ": "Pause",
  "▷": "Play", "⌕": "Search",
};
function iconHTML(name) {
  return iconMarkup[name];
}

// The original home and portfolio sections are HTML managed by legacy scripts.
// Adapt only interface text, preserving branded SVGs, artwork and text labels.
export function installLegacyIcons(root) {
  const controls = 'a,button,summary,.visual-arrow,.cursor';
  function enhance(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement;
      if (!parent || parent.closest('svg,script,style,textarea,[contenteditable]') || !parent.closest(controls)) return;
      const value = node.nodeValue;
      if (!/[↗→←↓↑×＋◎◉○Ⅱ▷⌕]/u.test(value)) return;
      const fragment = document.createDocumentFragment();
      for (const part of value.split(/([↗→←↓↑×＋◎◉○Ⅱ▷⌕])/u)) {
        if (glyphs[part]) {
          const template = document.createElement('template');
          template.innerHTML = iconHTML(glyphs[part]);
          fragment.append(template.content);
        } else if (part) fragment.append(document.createTextNode(part));
      }
      node.replaceWith(fragment);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest('svg,script,style,textarea,[contenteditable]')) return;
    if (node.matches('.menu-toggle') && !node.querySelector('.ui-icon')) {
      node.innerHTML = iconHTML('Menu');
      return;
    }
    if (node.matches('.header-actions > .small-cta') && !node.querySelector('.ui-icon')) {
      const slot = node.querySelector('span');
      if (slot) slot.innerHTML = iconHTML('Mail');
    }
    [...node.childNodes].forEach(enhance);
  }
  enhance(root);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') enhance(record.target);
      else record.addedNodes.forEach(enhance);
    }
  });
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}
