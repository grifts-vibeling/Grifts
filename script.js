// State
let TRIBES = [];
let QUESTIONS = [];
let ACTIVE_RESULT = null; // { tribe, vibeling }

// Utilities
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
function goto(hash) {
  window.location.hash = hash;
}
function setActiveView() {
  const hash = window.location.hash || "#home";
  $$(".view").forEach(v => v.classList.remove("active"));
  const id = hash.replace("#", "");
  const el = document.getElementById(id);
  (el || document.getElementById("home")).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.addEventListener("hashchange", setActiveView);

// Load data
async function loadData() {
  try {
    const [tribes, questions] = await Promise.all([
      fetch("data/tribes.json").then(r => r.json()),
      fetch("data/questions.json").then(r => r.json())
    ]);
    TRIBES = tribes;
    QUESTIONS = questions;
  } catch (e) {
    alert("Could not load data. Check data/ JSON files.");
    console.error(e);
  }
}

// Build quiz UI
function buildQuiz() {
  const form = $("#quiz-form");
  form.innerHTML = "";
  QUESTIONS.forEach((item, qi) => {
    const card = document.createElement("div");
    card.className = "card";
    const qEl = document.createElement("div");
    qEl.className = "question";
    qEl.textContent = `${qi + 1}. ${item.q}`;
    card.appendChild(qEl);

    item.a.forEach((opt, oi) => {
      const id = `q${qi}-a${oi}`;
      const label = document.createElement("label");
      label.className = "option";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q${qi}`;
      input.value = opt.t;
      input.id = id;

      const span = document.createElement("span");
      span.textContent = ` ${opt.label}`;

      label.appendChild(input);
      label.appendChild(span);
      card.appendChild(label);
    });

    form.appendChild(card);
  });
}

// Score quiz → pick tribe
function getTopTribe() {
  const counts = {};
  TRIBES.forEach(t => counts[t.id] = 0);

  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const checked = document.querySelector(`input[name="q${qi}"]:checked`);
    if (!checked) continue;
    counts[checked.value] = (counts[checked.value] || 0) + 1;
  }

  let top = null;
  let max = -1;
  Object.entries(counts).forEach(([id, c]) => {
    if (c > max) { max = c; top = id; }
  });
  return TRIBES.find(t => t.id === top);
}

// Render result view
function renderResult(tribe) {
  const vibeling = tribe.vibelings[Math.floor(Math.random() * tribe.vibelings.length)];
  ACTIVE_RESULT = { tribe, vibeling };

  const chip = $("#result-tribe");
  const title = $("#result-title");
  const desc = $("#result-desc");
  const img = $("#result-image");
  const pack = $("#download-pack");

  chip.textContent = tribe.name;
  chip.style.background = tribe.color;
  title.textContent = `${vibeling.name} • ${tribe.name}`;
  desc.textContent = tribe.desc;
  img.src = vibeling.image;
  img.alt = `${vibeling.name} — ${tribe.name}`;
  pack.href = tribe.packUrl || "#";

  goto("#result");
}

// Build tribe grid
function buildTribeGrid() {
  const grid = $("#tribe-grid");
  grid.innerHTML = "";
  TRIBES.forEach(t => {
    const card = document.createElement("div");
    card.className = "card-tribe";
    card.style.borderColor = "#1f1f25";
    const h = document.createElement("h3");
    h.textContent = t.name;
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = t.desc;

    const imgs = document.createElement("div");
    imgs.style.display = "flex";
    imgs.style.gap = "8px";
    imgs.style.marginTop = "8px";
    t.vibelings.slice(0, 2).forEach(v => {
      const img = document.createElement("img");
      img.src = v.image;
      img.alt = v.name;
      img.style.width = "100px";
      img.style.height = "100px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "10px";
      img.style.border = "1px solid #222";
      imgs.appendChild(img);
    });

    const btn = document.createElement("a");
    btn.href = "#quiz";
    btn.className = "btn";
    btn.textContent = "Find your match";

    card.appendChild(h);
    card.appendChild(p);
    card.appendChild(imgs);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

// My Vibelings (local save)
function loadMine() {
  try {
    const data = JSON.parse(localStorage.getItem("grifts.mine") || "[]");
    const grid = $("#mine-grid");
    grid.innerHTML = "";
    data.forEach(item => {
      const card = document.createElement("div");
      card.className = "card-tribe";
      const h = document.createElement("h3");
      h.textContent = `${item.vibeling} • ${item.tribe}`;
      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.vibeling;
      img.style.width = "100%";
      img.style.maxWidth = "220px";
      img.style.borderRadius = "12px";
      img.style.border = "1px solid #222";
      card.appendChild(h);
      card.appendChild(img);
      grid.appendChild(card);
    });
  } catch {}
}
function saveActiveToMine() {
  if (!ACTIVE_RESULT) return;
  const mine = JSON.parse(localStorage.getItem("grifts.mine") || "[]");
  mine.push({
    tribe: ACTIVE_RESULT.tribe.name,
    vibeling: ACTIVE_RESULT.vibeling.name,
    image: ACTIVE_RESULT.vibeling.image,
    at: Date.now()
  });
  localStorage.setItem("grifts.mine", JSON.stringify(mine));
  alert("Saved to My Vibelings on this device.");
}

// Share card (Canvas → image)
async function makeShareCard() {
  if (!ACTIVE_RESULT) return null;
  const { tribe, vibeling } = ACTIVE_RESULT;
  const canvas = $("#share-canvas");
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0, tribe.color);
  grad.addColorStop(1, "#121216");
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,420);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, Arial";
  ctx.fillText(tribe.name, 60, 120);
  ctx.font = "bold 44px system-ui, Arial";
  ctx.fillText(vibeling.name, 60, 180);

  // Copy
  ctx.font = "28px system-ui, Arial";
  ctx.fillStyle = "#cfcfd6";
  wrapText(ctx, "I’m " + tribe.name + " with " + vibeling.name + " — what’s your tribe?", 60, 260, 960, 34);

  // Vibeling image (same-origin recommended)
  try {
    const img = await loadImage(vibeling.image);
    const size = 560;
    ctx.drawImage(img, canvas.width - size - 60, 140, size, size);
  } catch {
    // If CORS blocks the image, skip drawing it
  }

  // Footer
  ctx.font = "24px system-ui, Arial";
  ctx.fillStyle = "#9a9aa5";
  ctx.fillText("grifts.co.uk • Take the Vibe Test", 60, 1280);

  return canvas.toDataURL("image/png");
}
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Event wiring
function wireEvents() {
  // Buttons that jump between views
  $$("[data-goto]").forEach(el => {
    el.addEventListener("click", () => goto(el.getAttribute("data-goto")));
  });

  $("#quiz-reset").addEventListener("click", () => {
    $$("#quiz-form input[type=radio]").forEach(i => i.checked = false);
  });

  $("#quiz-submit").addEventListener("click", () => {
    const tribe = getTopTribe();
    if (!tribe) {
      alert("Please answer at least one question.");
      return;
    }
    renderResult(tribe);
  });

  $("#save-vibeling").addEventListener("click", saveActiveToMine);

  $("#share-btn").addEventListener("click", async () => {
    const dataUrl = await makeShareCard();
    if (!dataUrl) return;
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "grifts-share.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: "I found my tribe on Grifts. What’s yours?" });
      } else {
        const a = $("#share-download");
        a.href = dataUrl;
        a.classList.remove("hide");
        a.textContent = "Download share image";
        alert("Tap ‘Download share image’ to save and share.");
      }
    } catch {
      const a = $("#share-download");
      a.href = dataUrl;
      a.classList.remove("hide");
      a.textContent = "Download share image";
    }
  });

  // Refresh My Vibelings when opening that view
  window.addEventListener("hashchange", () => {
    if ((window.location.hash || "#home") === "#mine") loadMine();
  });
}

// Init
(async function init() {
  await loadData();
  buildQuiz();
  buildTribeGrid();
  loadMine();
  wireEvents();
  setActiveView();
})();