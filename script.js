// Southstar Business site: mobile menu, download link, year, and gentle reveal-on-scroll.

// Where the Windows installer is hosted. Put the link to "Southstar Business Setup 0.1.0.exe" here
// (for example a GitHub Releases download link). While it's empty, Download buttons scroll to the
// download section instead.
const DOWNLOAD_URL = "";

// ---------------------------------------------------------------- selling license keys
// Fill these in. Leave a handle empty to hide that button.
const SHOP = {
  cashApp: "coldcoretech", // your $Cashtag without the "$", e.g. "SouthstarBiz"
  venmo: "coldcoretech", // your Venmo username without the "@", e.g. "Southstar-Business"
  email: "", // where customers can reach you about their key, e.g. "keys@yourdomain.com"
  price: 20, // US dollars, one time
};

const payLinks = () => {
  const amount = SHOP.price.toFixed(2);
  const note = "Southstar Business license - my email: ";
  return [
    SHOP.cashApp && { label: "Pay with Cash App", className: "pay-cashapp", handle: `$${SHOP.cashApp}`, href: `https://cash.app/$${encodeURIComponent(SHOP.cashApp)}/${amount}` },
    SHOP.venmo && {
      label: "Pay with Venmo",
      className: "pay-venmo",
      handle: `@${SHOP.venmo}`,
      href: `https://venmo.com/${encodeURIComponent(SHOP.venmo)}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`,
    },
  ].filter(Boolean);
};

document.querySelectorAll("[data-price]").forEach((node) => {
  node.textContent = `$${SHOP.price}`;
});

const payBar = document.querySelector("[data-pay-buttons]");
if (payBar) {
  const links = payLinks();
  if (!links.length) {
    payBar.innerHTML = `<p class="pay-soon">Online payment is coming soon${SHOP.email ? `. Email <a href="mailto:${SHOP.email}">${SHOP.email}</a> to buy now.` : "."}</p>`;
  } else {
    const title = document.createElement("p");
    title.className = "pay-title";
    title.textContent = `Get your license: $${SHOP.price}`;
    payBar.appendChild(title);
    const row = document.createElement("div");
    row.className = "pay-row";
    for (const link of links) {
      const anchor = document.createElement("a");
      anchor.className = `btn ${link.className}`;
      anchor.href = link.href;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      anchor.innerHTML = `<span>${link.label}</span><small>${link.handle}</small>`;
      row.appendChild(anchor);
    }
    payBar.appendChild(row);
    const note = document.createElement("p");
    note.className = "pay-handles";
    note.innerHTML = `<u class="pay-note">Put your email in the payment note.</u>${SHOP.email ? ` Questions or forgot the note? Email <a href="mailto:${SHOP.email}">${SHOP.email}</a>.` : ""}`;
    payBar.appendChild(note);
  }
}
document.querySelectorAll("[data-download]").forEach((link) => {
  if (DOWNLOAD_URL) {
    link.setAttribute("href", DOWNLOAD_URL);
    link.setAttribute("download", "");
  }
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = String(new Date().getFullYear());
});

// Mobile menu
const toggle = document.querySelector(".menu-toggle");
const nav = document.getElementById("site-nav");
if (toggle && nav) {
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

// Fade sections in as they scroll into view (skipped when the visitor prefers less motion).
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const targets = document.querySelectorAll(".feature, .spot-copy, .mock-card, .privacy-item, .steps li, .faq details, .compare-wrap");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  targets.forEach((target, index) => {
    target.classList.add("reveal");
    target.style.transitionDelay = `${(index % 4) * 70}ms`;
    observer.observe(target);
  });
}

// ---------------------------------------------------------------- Formspree forms ("Forgot your email?" and Contact)
// Every <form data-ajax-form> is sent in the background so visitors stay on the page. Required fields carry
// data-required-msg; errors show in the matching [data-error-for]. Without JavaScript the forms still post normally.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

document.querySelectorAll("form[data-ajax-form]").forEach((form) => {
  const status = form.querySelector(".claim-status");
  const button = form.querySelector('button[type="submit"]');
  const buttonText = button.textContent;

  const showError = (name, text) => {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) slot.textContent = text;
    form.querySelectorAll(`[name="${name}"]`).forEach((field) => field.setAttribute("aria-invalid", text ? "true" : "false"));
  };

  // Clear a field's error as soon as it's fixed.
  for (const type of ["input", "change"]) form.addEventListener(type, (event) => event.target?.name && showError(event.target.name, ""));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    let firstProblem = null;
    for (const field of form.querySelectorAll("[required]")) {
      const value = String(data.get(field.name) ?? "").trim();
      const problem = !value ? field.dataset.requiredMsg || "Please fill this in." : field.type === "email" && !EMAIL.test(value) ? "That email address doesn't look right." : "";
      showError(field.name, problem);
      if (problem && !firstProblem) firstProblem = field;
    }
    if (firstProblem) {
      status.textContent = "";
      firstProblem.focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Sending…";
    status.className = "claim-status";
    status.textContent = "";
    try {
      const response = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.errors?.map((error) => error.message).join(" ") || "The message couldn't be sent.");
      }
      form.reset();
      status.className = "claim-status is-good";
      status.textContent = form.dataset.success || "Thanks! Sent.";
    } catch (error) {
      status.className = "claim-status is-bad";
      status.textContent = `${error instanceof Error ? error.message : "Something went wrong."} Please try again.`;
    } finally {
      button.disabled = false;
      button.textContent = buttonText;
    }
  });
});
// ---------------------------------------------------------------- tour tabs (screenshots)
const tourTabs = [...document.querySelectorAll('.tour-tabs [role="tab"]')];
const tourImage = document.querySelector("[data-tour-image]");
const tourCaption = document.querySelector("[data-tour-caption]");
const tourPanel = document.getElementById("panel-tour");
if (tourTabs.length && tourImage) {
  // Fetch the other screenshots once the tour is about to scroll into view, so switching is instant
  // without slowing down the first page load.
  const warm = () => tourTabs.forEach((tab) => (new Image().src = `images/${tab.dataset.shot}.webp`));
  if ("IntersectionObserver" in window) {
    const watcher = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        warm();
        watcher.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    watcher.observe(tourImage);
  } else warm();
  const select = (tab, focus = false) => {
    for (const other of tourTabs) {
      const on = other === tab;
      other.setAttribute("aria-selected", String(on));
      other.tabIndex = on ? 0 : -1;
    }
    tourImage.src = `images/${tab.dataset.shot}.webp`;
    tourImage.alt = `The Southstar Business ${tab.textContent.trim()} screen`;
    tourCaption.textContent = tab.dataset.caption;
    tourPanel.setAttribute("aria-labelledby", tab.id);
    if (focus) tab.focus();
  };
  tourTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      select(tourTabs[(index + step + tourTabs.length) % tourTabs.length], true);
    });
  });
}
