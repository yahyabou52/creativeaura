(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)],
    clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const moving = () =>
    !document.documentElement.classList.contains("no-motion");
  const hero = $(".hero-stage"),
    gallery = $(".hero-gallery"),
    lines = $$(".kinetic-line"),
    ticker = $(".ticker>div"),
    panels = $$(".work-panel"),
    feeling = $(".feeling"),
    feelingLines = $$(".feeling-words>span"),
    contact = $(".contact"),
    contactTitle = $(".contact-title h2"),
    sticker = $(".contact-sticker");
  $$("[data-letter-reveal]").forEach((element) => {
    let index = 0;
    function split(node) {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          [...child.textContent].forEach((char) => {
            const span = document.createElement("span");
            span.className = char === " " ? "letter letter-space" : "letter";
            span.textContent = char === " " ? "\u00a0" : char;
            span.style.setProperty("--letter-index", index++);
            fragment.append(span);
          });
          child.replaceWith(fragment);
        } else split(child);
      });
    }
    split(element);
  });
  const headingObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("heading-arrived");
          headingObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.25 },
  );
  $$(
    ".work-heading h2,.expertise-intro h2,.process-title h2,.lab-heading h2",
  ).forEach((h) => {
    h.classList.add("kinetic-heading");
    headingObserver.observe(h);
  });
  $$(".navigation nav a").forEach((a) => {
    a.addEventListener("pointerenter", () => {
      if (!moving()) return;
      a.animate(
        [
          { letterSpacing: "-1px" },
          { letterSpacing: "2px" },
          { letterSpacing: "-1px" },
        ],
        { duration: 800, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    });
  });

  const field = $(".idea-field"),
    chips = $$(".idea-chip"),
    services = [
      "Websites & web apps",
      "Branding & identity",
      "UI / UX design",
      "Photography & content",
      "Digital management",
    ];
  const states = chips.map((el, i) => ({
    el,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    vx: 0,
    vy: 0,
    angle: [-9, 9, -6, 8, -7][i],
    baseAngle: [-9, 9, -6, 8, -7][i],
    drag: false,
    initialized: false,
    phase: i * 1.5,
  }));
  let active = null,
    startX = 0,
    startY = 0,
    dragX = 0,
    dragY = 0,
    distance = 0;
  function layout() {
    if (!field || !field.clientWidth) return;
    const w = field.clientWidth,
      h = field.clientHeight,
      mobile = w < 600;
    const anchors = mobile
      ? [
          [0.26, 0.22],
          [0.73, 0.39],
          [0.21, 0.61],
          [0.66, 0.73],
          [0.67, 0.17],
        ]
      : [
          [0.16, 0.3],
          [0.45, 0.22],
          [0.76, 0.32],
          [0.33, 0.68],
          [0.7, 0.71],
        ];
    states.forEach((s, i) => {
      const [px, py] = anchors[i];
      s.tx = clamp(w * px - s.el.offsetWidth / 2, 2, w - s.el.offsetWidth - 2);
      s.ty = clamp(
        h * py - s.el.offsetHeight / 2,
        5,
        h - s.el.offsetHeight - 30,
      );
      if (!s.initialized) {
        s.x = s.tx;
        s.y = s.ty;
        s.initialized = true;
      }
    });
  }
  layout();
  new ResizeObserver(layout).observe(field);
  window.addEventListener("resize", layout);
  if (document.fonts) document.fonts.ready.then(layout);
  states.forEach((s) => {
    s.el.addEventListener("pointerdown", (e) => {
      if (!moving() || e.button !== 0) return;
      active = s;
      s.drag = true;
      s.el.classList.add("dragging");
      s.el.style.zIndex = 5;
      startX = e.clientX;
      startY = e.clientY;
      dragX = s.x;
      dragY = s.y;
      distance = 0;
      s.el.setPointerCapture(e.pointerId);
    });
    s.el.addEventListener("pointermove", (e) => {
      if (active !== s) return;
      const dx = e.clientX - startX,
        dy = e.clientY - startY;
      distance = Math.hypot(dx, dy);
      s.tx = clamp(dragX + dx, 0, field.clientWidth - s.el.offsetWidth);
      s.ty = clamp(dragY + dy, 0, field.clientHeight - s.el.offsetHeight - 25);
      s.angle = s.baseAngle + clamp(dx * 0.05, -12, 12);
    });
    function finish() {
      if (active !== s) return;
      s.drag = false;
      s.el.classList.remove("dragging");
      s.el.style.zIndex = "";
      active = null;
      if (distance > 6) {
        s.el.dataset.dragged = "true";
        setTimeout(() => delete s.el.dataset.dragged, 100);
      } else s.el.dataset.dragged = "false";
    }
    s.el.addEventListener("pointerup", finish);
    s.el.addEventListener("pointercancel", finish);
    s.el.addEventListener("click", () => {
      if (s.el.dataset.dragged === "true") return;
      const target = $$(".service-start").find(
        (b) => b.dataset.service === services[Number(s.el.dataset.chip)],
      );
      target?.click();
    });
  });
  let previous = performance.now(),
    lastCount = -1;
  function frame(now) {
    const dt = clamp((now - previous) / 16.67, 0.2, 2);
    previous = now;
    const motion = moving(),
      y = scrollY;
    if (motion) {
      const hr = hero.getBoundingClientRect(),
        progress = clamp(-hr.top / hero.offsetHeight);
      if (hr.bottom > 0 && hr.top < innerHeight) {
        lines.forEach((line, i) => {
          const dir = Number(line.dataset.direction),
            x = progress * innerWidth * (innerWidth <= 700 ? 0.055 : 0.1) * dir;
          line.style.transform = `translate3d(${x}px,${-progress * (i + 1) * 15}px,0) rotate(${dir * progress * 1.2}deg)`;
        });
        $(".hero-signature").style.opacity = 1 - progress * 1.7;
      }
      const gr = gallery.getBoundingClientRect();
      if (gr.top < innerHeight && gr.bottom > 0) {
        const gp = clamp((innerHeight - gr.top) / (innerHeight + gr.height));
        gallery.style.clipPath = `inset(0 ${Math.max(0, (0.35 - gp) * 7)}% round ${Math.max(0, (0.5 - gp) * 65)}px)`;
        gallery.style.backgroundColor = "#d8d9d2";
      }
      const tr = ticker.parentElement.getBoundingClientRect();
      if (tr.top < innerHeight && tr.bottom > 0) {
        ticker.style.transform = `translate3d(${-((y * 0.13) % (ticker.scrollWidth / 2))}px,0,0)`;
      }
      const fr = feeling.getBoundingClientRect(),
        fp = clamp(-fr.top / Math.max(1, feeling.offsetHeight - innerHeight));
      if (fr.top < innerHeight && fr.bottom > 0) {
        feelingLines.forEach(
          (line, i) =>
            (line.style.transform = `translate3d(${(i === 1 ? -1 : 1) * (fp - 0.4) * innerWidth * 0.07}px,0,0) rotate(${(i === 1 ? -1 : 1) * (fp - 0.5) * 1.5}deg)`),
        );
      }
      const cr = contact.getBoundingClientRect();
      if (cr.top < innerHeight && cr.bottom > 0) {
        const cp = clamp((innerHeight - cr.top) / (innerHeight * 0.8));
        contactTitle.style.transform = `translateY(${(1 - cp) * 65}px)`;
        sticker.style.transform = `rotate(${-20 + cp * 14}deg) translateY(${(1 - cp) * 80}px)`;
      }
    }
    const activeIndex = panels.reduce(
      (best, p, i) =>
        Math.abs(p.getBoundingClientRect().left - innerWidth * 0.06) <
        Math.abs(panels[best].getBoundingClientRect().left - innerWidth * 0.06)
          ? i
          : best,
      0,
    );
    if (activeIndex !== lastCount) {
      panels.forEach((p, i) =>
        p.classList.toggle("active-panel", i === activeIndex),
      );
      lastCount = activeIndex;
    }
    if (field) {
      const r = field.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) {
        states.forEach((s, i) => {
          if (motion) {
            const force = s.drag ? 0.18 : 0.055,
              damping = s.drag ? 0.65 : 0.82;
            s.vx = (s.vx + (s.tx - s.x) * force * dt) * damping;
            s.vy = (s.vy + (s.ty - s.y) * force * dt) * damping;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
          } else {
            s.x = s.tx;
            s.y = s.ty;
          }
          const bob =
            motion && !s.drag ? Math.sin(now * 0.0007 + s.phase) * 6 : 0;
          const tilt =
            motion && !s.drag ? Math.sin(now * 0.0004 + s.phase) * 2 : 0;
          s.el.style.transform = `translate3d(${s.x}px,${s.y + bob}px,0) rotate(${s.angle + tilt}deg)`;
        });
      }
    }
    if (!motion) {
      lines.forEach((l) => (l.style.transform = ""));
      feelingLines.forEach((l) => (l.style.transform = ""));
      gallery.style.clipPath = "";
      contactTitle.style.transform = "";
      sticker.style.transform = "";
      $(".hero-signature").style.opacity = "";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
