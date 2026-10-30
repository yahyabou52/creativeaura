import React, { useEffect, useState } from "react";
import "./styles/business-intake.css";

const STORAGE_KEY = "creativeaura:business-intake:v1";
const STEP_KEY = "creativeaura:business-intake:step:v1";
const steps = [
  {
    title: "The studio",
    kicker: "01 / IDENTITY",
    intro: "Tell us who is behind CreativeAura so the website can sound like a real studio",
    fields: [
      { id: "publicName", label: "Name shown on the website", placeholder: "CreativeAura", required: true },
      { id: "legalName", label: "Registered business name, if different", placeholder: "Leave blank if not registered yet" },
      { id: "location", label: "Where are you based?", placeholder: "City, country" },
      { id: "founder", label: "Who should visitors meet?", placeholder: "Your name and role" },
      { id: "story", label: "Why did you start the studio?", type: "textarea", placeholder: "The short, honest story behind the work" },
    ],
  },
  {
    title: "Your people",
    kicker: "02 / AUDIENCE",
    intro: "The best copy speaks directly to the people you want to work with",
    fields: [
      { id: "idealClients", label: "Who are your ideal clients?", type: "textarea", placeholder: "Industries, company size, stage, or type of founder" },
      { id: "markets", label: "Which countries or cities do you serve?", placeholder: "For example: Morocco, France, remote worldwide" },
      { id: "languages", label: "Which website languages do you need?", placeholder: "For example: English, French, Arabic" },
      { id: "clientProblems", label: "What problems do clients usually bring you?", type: "textarea", placeholder: "What is difficult for them before they hire you?" },
    ],
  },
  {
    title: "The offer",
    kicker: "03 / SERVICES",
    intro: "Define what you actually sell and what a client receives",
    fields: [
      { id: "coreServices", label: "Which services are available now?", type: "textarea", placeholder: "List the services you can deliver today" },
      { id: "deliverables", label: "What does a typical project include?", type: "textarea", placeholder: "For example: strategy, design, development, handover" },
      { id: "timeline", label: "What are your typical timelines?", placeholder: "A range is fine" },
      { id: "budget", label: "What budget guidance can the site show?", placeholder: "Starting prices, typical ranges, or ‘discuss after brief’" },
      { id: "difference", label: "Why choose CreativeAura?", type: "textarea", placeholder: "What can you back up with your way of working?" },
    ],
  },
  {
    title: "The proof",
    kicker: "04 / WORK",
    intro: "Real examples help visitors trust the studio. Leave anything you cannot publish blank",
    fields: [
      { id: "realProjects", label: "Which real projects may we feature?", type: "textarea", placeholder: "Client, challenge, work delivered, result, and permission status" },
      { id: "testimonials", label: "Do you have approved testimonials or client logos?", type: "textarea", placeholder: "Include the exact quote and who approved it" },
      { id: "metrics", label: "Any results you can verify and publish?", type: "textarea", placeholder: "Numbers, outcomes, or before-and-after details" },
      { id: "conceptPolicy", label: "How should the current studio concepts appear?", type: "textarea", placeholder: "Keep, replace, reorder, or remove any concepts" },
    ],
  },
  {
    title: "Reach you",
    kicker: "05 / CONTACT",
    intro: "These details can be used when you are ready to connect the site to your future dashboard",
    fields: [
      { id: "publicEmail", label: "Public contact email", type: "email", placeholder: "hello@yourdomain.com" },
      { id: "whatsapp", label: "Business WhatsApp number, if public", placeholder: "Include country code" },
      { id: "socials", label: "Which social profiles should be linked?", type: "textarea", placeholder: "Paste public profile URLs" },
      { id: "contactPreference", label: "How should new inquiries work later?", type: "textarea", placeholder: "Dashboard, WhatsApp, email, calls, or a combination" },
    ],
  },
  {
    title: "Before launch",
    kicker: "06 / PRACTICAL",
    intro: "A few details that affect the final website and its legal pages",
    fields: [
      { id: "domain", label: "Do you have a domain in mind or already own one?", placeholder: "Leave blank if undecided" },
      { id: "businessDetails", label: "What business details can appear on legal pages?", type: "textarea", placeholder: "Registration number, address, or details still to confirm" },
      { id: "privacyContact", label: "Who should receive privacy requests?", placeholder: "Name or contact channel" },
      { id: "assets", label: "What real assets can you provide?", type: "textarea", placeholder: "Portraits, team photos, logo files, project images, brand guide" },
      { id: "other", label: "Anything else the website should say or avoid?", type: "textarea", placeholder: "Your priorities, tone, claims to avoid, future plans" },
    ],
  },
];

const initialAnswers = Object.fromEntries(steps.flatMap((step) => step.fields.map(({ id }) => [id, ""])));

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved && typeof saved === "object" ? { ...initialAnswers, ...saved } : initialAnswers;
  } catch {
    return initialAnswers;
  }
}

function readStep() {
  try {
    const saved = Number(localStorage.getItem(STEP_KEY));
    return Number.isInteger(saved) && saved >= 0 && saved <= steps.length ? saved : 0;
  } catch {
    return 0;
  }
}

export default function BusinessIntake() {
  const [answers, setAnswers] = useState(readSaved);
  const [step, setStep] = useState(readStep);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isReview = step === steps.length;
  const answered = Object.values(answers).filter((value) => String(value).trim()).length;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
      setNotice("Saved on this device");
    } catch {
      setNotice("Local save is unavailable. Download your answers before leaving");
    }
  }, [answers]);

  useEffect(() => {
    document.title = "Studio details — CreativeAura";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STEP_KEY, String(step)); } catch { /* The answers remain usable in this tab. */ }
  }, [step]);

  function change(id, value) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setError("");
  }

  function next() {
    const missing = steps[step].fields.find((field) => field.required && !String(answers[field.id]).trim());
    if (missing) {
      setError(`Add ${missing.label.toLowerCase()} to continue`);
      document.getElementById(missing.id)?.focus();
      return;
    }
    setError("");
    setStep((current) => current + 1);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function download() {
    const payload = {
      title: "CreativeAura website business information",
      exportedAt: new Date().toISOString(),
      answers: Object.fromEntries(steps.flatMap((section) => section.fields.map((field) => [field.id, { question: field.label, answer: answers[field.id] }]))),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "creativeaura-business-info.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="intake-page">
      <header className="intake-header">
        <a className="intake-brand" href="/" aria-label="CreativeAura home">creative<span>Aura</span><img className="aura-face intake-brand-face" src="/assets/aura-face.png" alt="" aria-hidden="true" /></a>
        <span>WEBSITE FOUNDATION / LOCAL WORKSHEET</span>
        <a className="intake-exit" href="/">Back to site ↗</a>
      </header>

      <div className="intake-layout">
        <aside className="intake-rail">
          <div className="intake-rail-top"><img className="aura-face intake-spark" src="/assets/aura-face.png" alt="" aria-hidden="true" /><p>MAKE THE SITE<br />SOUND LIKE YOU</p></div>
          <p className="intake-rail-copy">Your answers are saved in this browser as you type. Download a copy when you finish</p>
          <nav aria-label="Business information steps">
            {steps.map((item, index) => (
              <button key={item.title} type="button" className={step === index ? "active" : ""} onClick={() => { setStep(index); setError(""); }} aria-current={step === index ? "step" : undefined}>
                <span>{String(index + 1).padStart(2, "0")}</span>{item.title}<span className="rail-check">{item.fields.some((field) => answers[field.id]?.trim()) ? "●" : "○"}</span>
              </button>
            ))}
            <button type="button" className={isReview ? "active" : ""} onClick={() => { setStep(steps.length); setError(""); }} aria-current={isReview ? "step" : undefined}><span>07</span>Review & export<span className="rail-check">↗</span></button>
          </nav>
          <div className="intake-progress"><span>{answered} answers saved</span><div><i style={{ width: `${(answered / Object.keys(initialAnswers).length) * 100}%` }} /></div></div>
        </aside>

        <section className="intake-main" aria-live="polite">
          {!isReview ? (
            <>
              <div className="intake-heading"><span className="intake-kicker">{steps[step].kicker} <span>— {steps.length} STEPS TOTAL</span></span><h1>{steps[step].title}<img className="aura-face intake-heading-face" src="/assets/aura-face.png" alt="" aria-hidden="true" /></h1><p>{steps[step].intro}</p></div>
              <div className="intake-fields">
                {steps[step].fields.map((field, index) => (
                  <div className="intake-field" key={field.id}>
                    <label htmlFor={field.id}><span>{String(index + 1).padStart(2, "0")}</span>{field.label}{field.required && <em>Required</em>}</label>
                    {field.type === "textarea" ? <textarea id={field.id} value={answers[field.id]} onChange={(event) => change(field.id, event.target.value)} placeholder={field.placeholder} rows={4} /> : <input id={field.id} type={field.type || "text"} value={answers[field.id]} onChange={(event) => change(field.id, event.target.value)} placeholder={field.placeholder} />}
                  </div>
                ))}
              </div>
              {error && <p className="intake-error" role="alert">{error}</p>}
              <div className="intake-actions"><button type="button" className="intake-back" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>← Previous</button><span role="status">{notice}</span><button type="button" className="intake-next" onClick={next}>Next step <b>↗</b></button></div>
            </>
          ) : (
            <>
              <div className="intake-heading"><span className="intake-kicker">07 / REVIEW</span><h1>Your story,<br />in progress<img className="aura-face intake-heading-face" src="/assets/aura-face.png" alt="" aria-hidden="true" /></h1><p>Check your answers, revisit any section, then download a copy to share with us later</p></div>
              <div className="intake-review">{steps.map((section, index) => <article key={section.title}><div><span>{String(index + 1).padStart(2, "0")} / {section.title}</span><button type="button" onClick={() => setStep(index)}>Edit ↗</button></div>{section.fields.map((field) => <p key={field.id}><strong>{field.label}</strong><span>{answers[field.id]?.trim() || "Not answered yet"}</span></p>)}</article>)}</div>
              <div className="intake-actions intake-review-actions"><button type="button" className="intake-back" onClick={() => setStep(steps.length - 1)}>← Previous</button><span role="status">{notice}</span><button type="button" className="intake-next" onClick={download}>Download answers <b>↓</b></button></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
