(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => [...r.querySelectorAll(s)],
    clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)"),
    mobile = matchMedia("(max-width: 700px)");
  let motion = !reduce.matches;
  document.documentElement.classList.add(motion ? "js-motion" : "no-motion");
  let loaded = false;
  const openingStart = performance.now();
  function finishLoad() {
    if (loaded) return;
    loaded = true;
    setTimeout(
      () => document.body.classList.add("loaded"),
      motion ? Math.max(0, 950 - (performance.now() - openingStart)) : 0,
    );
  }
  if (document.fonts) document.fonts.ready.then(finishLoad);
  else finishLoad();
  setTimeout(finishLoad, 1500);

  const nav = $("#navigation"),
    project = $("#project-dialog");
  let lastFocus = null;
  function openDialog(d) {
    lastFocus = document.activeElement;
    d.showModal();
    document.body.classList.add("dialog-open");
  }
  function closeDialog(d) {
    d.close();
  }
  $$("dialog").forEach((d) => {
    d.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]"))
        document.body.classList.remove("dialog-open");
      $(".menu-toggle").setAttribute("aria-expanded", "false");
      if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    });
    d.addEventListener("click", (e) => {
      if (e.target === d) {
        const r = d.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          d.close();
      }
    });
    $(".dialog-close", d)?.addEventListener("click", () => closeDialog(d));
  });
  $(".menu-toggle").addEventListener("click", () => {
    openDialog(nav);
    $(".menu-toggle").setAttribute("aria-expanded", "true");
  });
  $(".nav-close").addEventListener("click", () => closeDialog(nav));
  let currentY = window.scrollY,
    targetY = window.scrollY,
    smoothActive = false;
  const smoothDuration = 760;
  let smoothFrom = 0,
    smoothStart = 0;
  function maxY() {
    return Math.max(0, document.documentElement.scrollHeight - innerHeight);
  }
  function goTo(y, animated = true) {
    targetY = clamp(y, 0, maxY());
    if (!motion || !animated) {
      window.scrollTo(0, targetY);
      currentY = targetY;
      smoothActive = false;
      return;
    }
    smoothFrom = window.scrollY;
    smoothStart = performance.now();
    smoothActive = true;
  }
  function stopScroll() {
    smoothActive = false;
    targetY = window.scrollY;
  }
  window.addEventListener(
    "wheel",
    (e) => {
      if (
        !motion ||
        mobile.matches ||
        document.querySelector("dialog[open]") ||
        e.ctrlKey ||
        Math.abs(e.deltaX) > Math.abs(e.deltaY)
      )
        return;
      e.preventDefault();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      if (!smoothActive) targetY = window.scrollY;
      targetY = clamp(targetY + delta, 0, maxY());
      smoothFrom = window.scrollY;
      smoothStart = performance.now();
      smoothActive = true;
    },
    { passive: false },
  );
  window.addEventListener("touchstart", stopScroll, { passive: true });
  window.addEventListener("pointerdown", (e) => {
    if (e.clientX >= document.documentElement.clientWidth) stopScroll();
  });
  window.addEventListener("keydown", (e) => {
    if (
      [
        "ArrowDown",
        "ArrowUp",
        "PageDown",
        "PageUp",
        "Home",
        "End",
        " ",
      ].includes(e.key) &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)
    )
      stopScroll();
  });
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.startsWith("#/")) return;
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      if (nav.open) closeDialog(nav);
      history.replaceState(null, "", id);
      const y =
        id === "#top"
          ? 0
          : el.getBoundingClientRect().top + window.scrollY - 120;
      goTo(y);
    }),
  );
  window.addEventListener(
    "scroll",
    () =>
      document.body.classList.toggle("scrolled", scrollY > innerHeight * 0.7),
    { passive: true },
  );
  const words = [];
  const manifesto = $("[data-word-reveal]");
  if (manifesto) {
    const walker = document.createTreeWalker(manifesto, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((t) => {
        if (!t.trim()) {
          frag.append(t);
          return;
        }
        const span = document.createElement("span");
        span.className = "word";
        span.textContent = t;
        frag.append(span);
        words.push(span);
      });
      node.replaceWith(frag);
    });
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.12 },
  );
  $$(
    ".studio-copy,.expertise-intro,.service-list,.process-title,.process-cards article,.contact-title,.contact-lower",
  ).forEach((el, i) => {
    el.classList.add("reveal");
    if (el.matches(".process-cards article"))
      el.style.transitionDelay = (i % 3) * 100 + "ms";
    observer.observe(el);
  });
  window.addEventListener("aura:route", stopScroll);
  const work = $(".work"),
    track = $(".work-track"),
    panels = $$(".work-panel"),
    meter = $(".work-meter i"),
    feeling = $(".feeling"),
    feelingWords = $(".feeling-words"),
    feelingObject = $(".feeling-object"),
    hero = $(".hero"),
    cards = $$(".hero-card");
  let workProgress = 0;
  function workMetrics() {
    const gap = innerWidth * 0.04;
    return {
      step: panels[0].getBoundingClientRect().width + gap,
      travel:
        (panels[0].getBoundingClientRect().width + gap) * (panels.length - 1),
      range: work.offsetHeight - innerHeight,
    };
  }
  function jumpWork(dir) {
    if (mobile.matches) {
      const top = window.scrollY + 80;
      const idx = panels.findIndex(
        (p) => p.getBoundingClientRect().top + window.scrollY > top,
      );
      const next = clamp(
        (idx === -1 ? panels.length - 1 : idx) + (dir < 0 ? -1 : 0),
        0,
        panels.length - 1,
      );
      goTo(panels[next].getBoundingClientRect().top + window.scrollY - 25);
      return;
    }
    const index = clamp(Math.round(workProgress * 3) + dir, 0, 3),
      m = workMetrics();
    goTo(work.offsetTop + (m.range * index) / 3);
  }
  $(".work-next").addEventListener("click", () => jumpWork(1));
  $(".work-prev").addEventListener("click", () => jumpWork(-1));
  const serviceAnimations = new WeakMap();
  function animateService(detail, open) {
    const start = detail.getBoundingClientRect().height;
    serviceAnimations.get(detail)?.cancel();
    if (!motion) {
      detail.open = open;
      detail.style.height = "";
      detail.style.overflow = "";
      return;
    }
    detail.style.overflow = "hidden";
    if (open) detail.open = true;
    const summary = $("summary", detail);
    const end = summary.offsetHeight + (open ? $(".service-body", detail).offsetHeight : 0) + 1;
    const animation = detail.animate(
      { height: [start + "px", end + "px"] },
      { duration: 420, easing: "cubic-bezier(.16,1,.3,1)" },
    );
    serviceAnimations.set(detail, animation);
    animation.onfinish = () => {
      detail.open = open;
      detail.style.height = "";
      detail.style.overflow = "";
      serviceAnimations.delete(detail);
    };
  }
  $$(".service-list details").forEach((detail) => {
    $("summary", detail).addEventListener("click", (event) => {
      event.preventDefault();
      const open = !detail.open;
      $$(".service-list details").forEach((other) => {
        if (other !== detail && other.open) animateService(other, false);
      });
      animateService(detail, open);
    });
  });
  const projectData = [
    {
      title: "NOVA — Everyday, reimagined",
      type: "01 / BRAND WORLD",
      description:
        "A studio concept for a botanical body-care brand. Confident typography, tactile packaging, and a fresh green-and-orange palette make everyday rituals feel a little less everyday. An exploration of how a brand can have personality from the shelf to the screen.",
      tags: ["Brand strategy", "Visual identity", "Packaging", "Art direction"],
    },
    {
      title: "Aura Objects — Beyond the surface",
      type: "02 / MATERIAL & MOTION",
      description:
        "An experimental visual world built around liquid chrome, soft lilac, and one unexpected flash of orange. This generated artwork explores the meeting point between organic form and digital possibility.",
      tags: ["Generated artwork", "Visual exploration", "Digital art"],
    },
    {
      title: "Forme — Room to be",
      type: "03 / DIGITAL EXPERIENCE",
      description:
        "An imagined website for an independent interiors studio. Architectural shapes, generous space, and a quiet editorial rhythm turn the interface into an extension of the brand. A concept exploration of website design and UI/UX.",
      tags: ["Website design", "UI / UX", "Creative development"],
    },
    {
      title: "Chromatic — In your own light",
      type: "04 / IMAGE & ART DIRECTION",
      description:
        "An editorial image-making concept exploring confidence through colour. Electric blue, translucent orange, and dramatic light create an expressive campaign direction. The portrait is generated concept artwork, illustrating a visual direction rather than a completed client photography commission.",
      tags: ["Generated portrait", "Art direction", "Editorial concept"],
    },
  ];
  // Project navigation is handled by the portfolio router

  function openContact(service) {
    const query = service ? `?service=${encodeURIComponent(service)}` : "";
    window.location.assign(`/contact${query}`);
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest(".project-start,.service-start");
    if (button) openContact(button.dataset.service);
  });
  const cursor = $(".cursor");
  let pointer = { x: innerWidth / 2, y: innerHeight / 2 },
    cursorPos = { ...pointer },
    mouseIn = false;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      mouseIn = e.pointerType === "mouse";
      if (!mobile.matches && motion) cursor.style.opacity = mouseIn ? "1" : "0";
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    mouseIn = false;
    cursor.style.opacity = "0";
  });
  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      cursor.classList.add("view");
      cursor.querySelector("span").innerHTML = "VIEW<br>PROJECT ↗";
    });
    el.addEventListener("pointerleave", () => cursor.classList.remove("view"));
  });
  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      if (!motion || mobile.matches) return;
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px,${(e.clientY - r.top - r.height / 2) * 0.18}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 600);
    });
  });
  const motionToggle = $(".motion-toggle");
  function setMotion(on) {
    motion = on;
    document.documentElement.classList.toggle("no-motion", !on);
    document.documentElement.classList.toggle("js-motion", on);
    motionToggle.setAttribute("aria-pressed", String(!on));
    motionToggle.innerHTML = `MOTION ${on ? "ON" : "OFF"} <span>${on ? "◉" : "○"}</span>`;
    if (!on) {
      stopScroll();
      cursor.style.opacity = "0";
      cards.forEach(
        (c, i) => (c.style.transform = `rotate(${[-9, 4, 10][i]}deg)`),
      );
      feelingWords.style.transform = "";
      feelingObject.style.transform = "";
      $$(".reveal").forEach((e) => e.classList.add("visible"));
    }
  }
  motionToggle.addEventListener("click", () => setMotion(!motion));
  reduce.addEventListener("change", (e) => setMotion(!e.matches));
  setMotion(motion);
  let lastFrame = 0;
  function render(now) {
    const delta = clamp((now - lastFrame) / 16.67, 0.1, 3);
    lastFrame = now;
    if (smoothActive) {
      const t = clamp((now - smoothStart) / smoothDuration),
        ease = 1 - Math.pow(1 - t, 4);
      currentY = smoothFrom + (targetY - smoothFrom) * ease;
      window.scrollTo(0, currentY);
      if (t >= 1 || Math.abs(targetY - currentY) < 0.3) smoothActive = false;
    }
    const y = window.scrollY;
    $(".reading-progress").style.transform =
      `scaleX(${maxY() ? y / maxY() : 0})`;
    if (!mobile.matches) {
      const m = workMetrics();
      workProgress = clamp((y - work.offsetTop) / Math.max(1, m.range));
      track.style.transform = `translate3d(${-workProgress * m.travel}px,0,0)`;
      const n = clamp(Math.round(workProgress * 3) + 1, 1, 4);
      $(".work-count").innerHTML = `0${n} <i>/ 04</i>`;
      meter.style.transform = `translateX(${workProgress * 300}%)`;
    } else {
      const visible = panels.findIndex((p) => {
        const r = p.getBoundingClientRect();
        return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.25;
      });
      if (visible >= 0) {
        $(".work-count").innerHTML = `0${visible + 1} <i>/ 04</i>`;
        meter.style.transform = `translateX(${visible * 100}%)`;
      }
    }
    if (motion) {
      const sr = manifesto.getBoundingClientRect(),
        lit = clamp(
          (innerHeight * 0.8 - sr.top) / (innerHeight * 0.6 + sr.height * 0.2),
        );
      words.forEach((w, i) =>
        w.classList.toggle("lit", i / words.length < lit),
      );
      if (hero.getBoundingClientRect().bottom > 0) {
        cards.forEach((c, i) => {
          const base = [-9, 4, 10][i];
          const mouseX =
            mouseIn && !mobile.matches
              ? (pointer.x / innerWidth - 0.5) * 10
              : 0;
          c.style.transform = `translate3d(${mouseX * (i === 1 ? -0.4 : 1)}px,${y * Number(c.dataset.depth)}px,0) rotate(${base + y * 0.004 * (i === 1 ? -1 : 1)}deg)`;
        });
      }
      const fr = feeling.getBoundingClientRect(),
        fp = clamp(-fr.top / Math.max(1, feeling.offsetHeight - innerHeight));
      if (fr.top < innerHeight && fr.bottom > 0) {
        feelingWords.style.transform = `scale(${1 + fp * 0.23}) translateY(${-fp * 12}px)`;
        feelingObject.style.transform = `translate(${(fp - 0.5) * 120}px,${(fp - 0.5) * -80}px) rotate(${fp * 70 - 25}deg) scale(${0.8 + fp * 0.5})`;
        feeling.style.backgroundColor = `rgb(${199 + Math.round(fp * 8)},${183 + Math.round(fp * 10)},${223 - Math.round(fp * 10)})`;
      }
      if (mouseIn && !mobile.matches) {
        cursorPos.x += (pointer.x - cursorPos.x) * Math.min(1, 0.22 * delta);
        cursorPos.y += (pointer.y - cursorPos.y) * Math.min(1, 0.22 * delta);
        cursor.style.transform = `translate3d(${cursorPos.x}px,${cursorPos.y}px,0)`;
      }
    }
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
  $("#year").textContent = new Date().getFullYear();
})();
