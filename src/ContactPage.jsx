import React, { useEffect, useRef, useState } from "react";
import "./styles/contact-page.css";
import siteHeaderMarkup from "./markup/site_header.html?raw";
import Icon from "./Icons";

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const services = [
  "Websites & web apps",
  "UI / UX design",
  "Branding & identity",
  "Digital tools",
  "Photo, video & motion",
];
const logoSvg = siteHeaderMarkup.match(/<svg\b[\s\S]*?<\/svg>/i)?.[0] || "";
const DB_NAME = "creativeaura-inquiries";

function ContactIcon({ type }) {
  return <Icon name={type === "email" ? "Mail" : "MessageCircle"} />;
}

function AuraFace({ className = "" }) {
  return <img className={`aura-face ${className}`} src="/assets/aura-face.png" alt="" aria-hidden="true" />;
}

function saveLocalInquiry(inquiry) {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("Local storage unavailable"));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("inquiries")) {
        request.result.createObjectStore("inquiries", { keyPath: "id" });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("inquiries", "readwrite");
      transaction.objectStore("inquiries").put(inquiry);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    };
  });
}

export default function ContactPage() {
  const [selected, setSelected] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("service");
    const normalized = requested === "Digital management" ? "Digital tools" : requested === "Photography & content" ? "Photo, video & motion" : requested;
    return normalized && services.includes(normalized) ? [normalized] : [];
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [complete, setComplete] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInput = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    document.title = "Start a project | CreativeAura";
    document.body.classList.add("contact-route");
    return () => document.body.classList.remove("contact-route");
  }, []);

  function toggleService(service) {
    setSelected((current) => current.includes(service) ? current.filter((item) => item !== service) : [...current, service]);
  }

  function chooseFile(event) {
    const chosen = event.target.files?.[0] || null;
    if (chosen && chosen.size > MAX_FILE_BYTES) {
      event.target.value = "";
      setFile(null);
      setFileError("This file is over 20 MB. Choose a smaller one");
      return;
    }
    setFile(chosen);
    setFileError("");
  }

  async function send(event) {
    event.preventDefault();
    if (file && file.size > MAX_FILE_BYTES) {
      setFileError("This file is over 20 MB. Choose a smaller one");
      fileInput.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await saveLocalInquiry({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        name: name.trim(),
        email: email.trim(),
        services: selected,
        idea: idea.trim(),
        attachment: file,
      });
      setComplete(true);
      setStatus("");
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      setStatus("We couldn't save this yet. Please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="contact-page" id="main">
      <header className="site-header contact-site-header">
        <a aria-label="CreativeAura home" className="brand" href="/" dangerouslySetInnerHTML={{ __html: logoSvg }} />
        <nav className="header-note contact-header-links" aria-label="Site navigation"><a href="/">Home</a><a href="/#studio">Studio</a><a href="/portfolio">Portfolio</a><a href="/#services">Services</a></nav>
        <div className="header-actions"><a className="small-cta contact-header-cta" href="#project-form">Start a project <span aria-hidden="true"><Icon name="ArrowUpRight" /></span></a><button className="menu-toggle" aria-expanded={menuOpen} aria-label="Open navigation" type="button" onClick={() => { menuRef.current?.showModal(); setMenuOpen(true); }}><Icon name="Menu" /></button></div>
      </header>
      <dialog ref={menuRef} className="contact-house-menu" onClose={() => setMenuOpen(false)}><div className="contact-house-menu-top"><span>CREATIVEAURA / COME ON IN</span><button type="button" onClick={() => menuRef.current?.close()} aria-label="Close navigation">Close <Icon name="X" /></button></div><nav aria-label="Expanded navigation"><a href="/">Home <span><Icon name="ArrowUpRight" /></span></a><a href="/#studio">Studio <span><Icon name="ArrowUpRight" /></span></a><a href="/portfolio">Portfolio <span><Icon name="ArrowUpRight" /></span></a><a href="/#services">Services <span><Icon name="ArrowUpRight" /></span></a><a href="/contact" onClick={() => menuRef.current?.close()}>Let’s talk <span><Icon name="ArrowUpRight" /></span></a></nav><p>CASABLANCA / EVERYWHERE</p></dialog>

      <div className="contact-page-grid">
        <section className="contact-page-form-side" aria-labelledby="contact-page-title">
          <p className="contact-page-eyebrow"><AuraFace className="contact-page-star" /> THE DOOR IS OPEN / NEW CONVERSATION</p>
          <h1 id="contact-page-title">COME IN<br /><em>LET’S MAKE</em><br />SOMETHING</h1>
          <p className="contact-page-intro">Tell us the messy first version, a problem, a feeling or a wild idea. We can figure out the shape together</p>

          {!complete ? (
            <form className="contact-page-form" id="project-form" onSubmit={send}>
              <fieldset className="contact-page-services">
                <legend>What’s on your mind? <span>Pick a direction, or leave it open</span></legend>
                <div className="contact-page-chips">{services.map((service, index) => <label key={service} className={selected.includes(service) ? "selected" : ""}><input type="checkbox" checked={selected.includes(service)} onChange={() => toggleService(service)} /><small>{String(index + 1).padStart(2, "0")}</small><strong>{service}</strong><span aria-hidden="true">{selected.includes(service) ? <AuraFace className="contact-chip-face" /> : <Icon name="ArrowUpRight" />}</span></label>)}</div>
              </fieldset>

              <div className="contact-page-row"><label>YOUR NAME <input autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" /></label><label>YOUR EMAIL <input autoComplete="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Where can we reach you?" /></label></div>
              <label className="contact-page-idea">TELL US A LITTLE MORE <span>What are you hoping to make, change or solve?</span><textarea required maxLength={5000} rows={5} value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="There is no wrong place to start…" /></label>

              <div className="contact-page-file"><label htmlFor="project-attachment"><span className="contact-page-file-icon" aria-hidden="true"><Icon name="Paperclip" /></span><span><strong>{file ? file.name : "Have something to show us?"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB selected` : "Add a file if it helps · Any type · 20 MB max"}</small></span></label><input ref={fileInput} id="project-attachment" type="file" onChange={chooseFile} aria-describedby="contact-page-file-error" /><p id="contact-page-file-error" role="status">{fileError}</p></div>

              <div className="contact-page-form-end"><p className="contact-page-status" role="status">{status}</p><button type="submit" disabled={busy}>{busy ? "One moment…" : "Send your idea"} <span><Icon name="ArrowUpRight" /></span></button></div>
            </form>
          ) : (
            <section className="contact-page-complete" aria-labelledby="contact-complete-title"><AuraFace className="contact-page-complete-mark" /><p className="contact-page-eyebrow">A LITTLE SPARK, SAVED</p><h2 id="contact-complete-title">YOUR IDEA<br /><em>HAS A HOME</em></h2><p>Your note is saved here for now. When the CreativeAura inbox is ready, we’ll connect this page to the team</p><a href="/">Explore the house <span><Icon name="ArrowUpRight" /></span></a></section>
          )}
        </section>

        <aside className="contact-page-info" aria-label="Meet AURA and get in touch">
          <div className="contact-page-scene"><div className="contact-page-art"><span className="contact-page-scene-word" aria-hidden="true">I’M<br />AURA</span><div className="contact-page-scene-halo" aria-hidden="true"></div><img src="/assets/aura-mascot.png" alt="AURA, a smiling blue flower character waving hello" /></div></div>
          <div className="contact-page-info-main"><h2>YOUR IDEA<br /><em>STARTS HERE</em></h2><p>Big plans, tiny sparks, half formed thoughts. Bring them all. We love figuring things out together</p></div>
          <div className="contact-page-info-bottom"><span>WANT TO SAY HELLO DIRECTLY?</span><a href="mailto:contact@c-aura.com"><span className="contact-page-contact-icon"><ContactIcon type="email" /></span><strong>contact@c-aura.com</strong></a><a href="https://wa.me/212689111339" target="_blank" rel="noopener noreferrer"><span className="contact-page-contact-icon"><ContactIcon type="whatsapp" /></span><strong>WhatsApp</strong></a></div>
        </aside>
      </div>
    </main>
  );
}
