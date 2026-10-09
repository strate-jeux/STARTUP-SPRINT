const MAX = 16;

const THEMES = ["Sport", "Divertissement", "Santé", "Quotidien", "Nature"];
const CIBLES = ["Retraités", "Étudiants", "Familles avec jeunes enfants", "Cadres dynamiques", "Jeunes urbains créatifs"];
const CONTRAINTES = ["Plateforme numérique", "Moins de 10 €", "Co-conception avec les utilisateurs", "Technologie innovante", "Aucune"];

const CRITERES = [
  ["Originalité", "Quelle idée est la plus originale, différente de ce qui existe déjà ?"],
  ["Adéquation à la cible", "Quelle start-up répond le mieux aux besoins de sa cible ?"],
  ["Faisabilité", "Laquelle semble la plus réaliste à lancer concrètement ?"],
  ["Modèle économique", "Laquelle a le meilleur potentiel pour gagner de l’argent ?"],
  ["Impact", "Laquelle a l’impact le plus positif (social, environnemental, sociétal) ?"]
];

// ⚠️ Adapte ces chemins si tes fichiers sont ailleurs.
// Ici, on suppose que tes images sont dans /assets/ (comme sur ta capture)
const ICONS = {
  theme: {
    "Sport": "assets/items/theme-sport.png",
    "Divertissement": "assets/items/theme-divertissement.png",
    "Santé": "assets/items/theme-sante.png",
    "Quotidien": "assets/items/theme-quotidien.png",
    "Nature": "assets/items/theme-nature.png",
  },
  cible: {
    "Retraités": "assets/items/cible-retraites.png",  // ⚠️ sans accent recommandé
    "Étudiants": "assets/items/cible-etudiants.png",
    "Familles avec jeunes enfants": "assets/items/cible-familles.png",
    "Cadres dynamiques": "assets/items/cible-cadres.png",
    "Jeunes urbains créatifs": "assets/items/cible-jeunes-urbains.png",
  },
  contrainte: {
    "Plateforme numérique": "assets/items/contrainte-plateforme.png",
    "Moins de 10 €": "assets/items/contrainte-10e.png",
    "Co-conception avec les utilisateurs": "assets/items/contrainte-coconception.png",
    "Technologie innovante": "assets/items/contrainte-tech.png",
    "Aucune": ""
  }
};

let startups = [];
let currentRound = [];
let roundIndex = 1;

let winners = [];
let currentMatch = null;
let justAdded = -1; // index de la carte à animer à l'ajout

// Résultats par match (pour affichage score + état terminé)
let matchResults = []; // { roundIndex, matchIdx, aName, bName, scoreA, scoreB, winnerName, loserName }
let semifinalLosers = [];
let lastFinal = null;

const $ = (id) => document.getElementById(id);

function show(screenId) {
  ["screenSetup", "screenRound", "screenWinner"].forEach((s) => $(s).classList.add("hidden"));
  const el = $(screenId);
  el.classList.remove("hidden", "screen-enter");
  void el.offsetWidth; // relance l'animation d'entrée
  el.classList.add("screen-enter");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function loadPref(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === "1"; } catch { return fallback; }
}
function savePref(key, value) {
  try { localStorage.setItem(key, value ? "1" : "0"); } catch { /* stockage indisponible */ }
}

let toastTimer = null;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden", "toast-in");
  void t.offsetWidth;
  t.classList.add("toast-in");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* -------- Setup -------- */
function addStartup(data = {}) {
  if (startups.length >= MAX) return;
  startups.push({
    name: data.name || "",
    theme: data.theme || THEMES[0],
    cible: data.cible || CIBLES[0],
    contrainte: data.contrainte || "Aucune"
  });
  justAdded = startups.length - 1;
  renderStartups();
  justAdded = -1;
}

function iconForTheme(theme) { return ICONS.theme[theme] || ""; }
function iconForCible(cible) { return ICONS.cible[cible] || ""; }
function iconForContrainte(con) { return ICONS.contrainte[con] || ""; }

function renderIconChips(s) {
  const con = s.contrainte;
  return `
    <div class="icon-row">
      <div class="chip theme" title="Thème">
        <span>${escapeHtml(s.theme)}</span>
        <img alt="" src="${iconForTheme(s.theme)}">
      </div>
      <div class="chip cible" title="Cible">
        <span>${escapeHtml(s.cible)}</span>
        <img alt="" src="${iconForCible(s.cible)}">
      </div>
      ${
        con !== "Aucune"
          ? `<div class="chip contrainte" title="Contrainte">
               <span>${escapeHtml(con)}</span>
               <img alt="" src="${iconForContrainte(con)}">
             </div>`
          : ``
      }
    </div>
  `;
}

function renderStartups() {
  const list = $("startupList");
  list.innerHTML = "";

  startups.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = i === justAdded ? "card card-new" : "card";
    div.innerHTML = `
      <div class="card-head">
        <div class="card-index">START-UP #${i + 1}</div>
        <button class="btn danger" type="button" data-del="${i}">Supprimer</button>
      </div>

      <label>Nom</label>
      <input placeholder="Nom de la start-up" value="${escapeHtml(s.name)}">

      ${renderIconChips(s)}

      <label>Thème</label>
      <select>${THEMES.map(t => `<option ${t===s.theme?"selected":""}>${t}</option>`).join("")}</select>

      <label>Cible</label>
      <select>${CIBLES.map(c => `<option ${c===s.cible?"selected":""}>${c}</option>`).join("")}</select>

      <label>Contrainte (facultatif)</label>
      <select>${CONTRAINTES.map(c => `<option ${c===s.contrainte?"selected":""}>${c}</option>`).join("")}</select>
    `;

    div.querySelector("[data-del]").onclick = () => {
      startups.splice(i, 1);
      renderStartups();
    };

    const inputs = div.querySelectorAll("input, select");
    const name = inputs[0];
    const theme = inputs[1];
    const cible = inputs[2];
    const contrainte = inputs[3];

    name.oninput = (e) => { s.name = e.target.value; };
    theme.onchange = (e) => { s.theme = e.target.value; renderStartups(); };
    cible.onchange = (e) => { s.cible = e.target.value; renderStartups(); };
    contrainte.onchange = (e) => { s.contrainte = e.target.value; renderStartups(); };

    list.appendChild(div);
  });
}

/* -------- Sons (synthétisés, aucun fichier requis) -------- */
const Sound = {
  ctx: null,
  on: loadPref("ss-sound", true),

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },

  tone(freq, dur = 0.15, type = "sine", vol = 0.12, delay = 0) {
    if (!this.on) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },

  whoosh() { this.tone(300, 0.10, "triangle", 0.05); this.tone(480, 0.10, "triangle", 0.04, 0.04); },
  pick()   { this.tone(660, 0.10, "square", 0.06); this.tone(990, 0.18, "square", 0.06, 0.08); },
  vs()     { this.tone(98, 0.45, "sawtooth", 0.10); this.tone(147, 0.45, "sawtooth", 0.07, 0.06); this.tone(196, 0.5, "triangle", 0.08, 0.12); },
  drum(dur = 1.4) {
    for (let t = 0; t < dur; t += 0.055) this.tone(80 + Math.random() * 40, 0.05, "triangle", 0.05 + 0.08 * (t / dur), t);
  },
  fanfare() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.12, i * 0.12));
    this.tone(1047, 0.7, "triangle", 0.13, 0.36);
    this.tone(784, 0.7, "sine", 0.06, 0.36);
  }
};

function toggleSound() {
  Sound.on = !Sound.on;
  savePref("ss-sound", Sound.on);
  syncSoundButtons();
  if (Sound.on) Sound.pick();
}

function syncSoundButtons() {
  ["btnSound", "btnSoundTop"].forEach((id) => {
    const b = $(id);
    if (!b) return;
    b.textContent = Sound.on ? "🔊" : "🔇";
    b.setAttribute("aria-pressed", String(Sound.on));
  });
}

function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  } catch { /* plein écran non supporté */ }
}

/* -------- Confettis (canvas) -------- */
const Confetti = (() => {
  const COLORS = ["#ec4899", "#93c5fd", "#3b82f6", "#ef4444", "#22c55e", "#facc15", "#ffffff"];
  let canvas, ctx, parts = [], raf = null;

  function setup() {
    canvas = $("confetti");
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    const d = window.devicePixelRatio || 1;
    canvas.width = innerWidth * d;
    canvas.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  // angle en radians (−π/2 = vers le haut), spread = ouverture du cône
  function burst({ x = innerWidth / 2, y = innerHeight / 3, n = 140, angle = -Math.PI / 2, spread = Math.PI * 2, speed = 11 } = {}) {
    if (reducedMotion()) return;
    if (!ctx) setup();
    for (let i = 0; i < n; i++) {
      const a = angle + (Math.random() - 0.5) * spread;
      const v = speed * (0.45 + Math.random() * 0.75);
      parts.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        r: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.3,
        c: COLORS[i % COLORS.length],
        life: 0,
        max: 160 + Math.random() * 120
      });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function cannons() {
    burst({ x: 0, y: innerHeight, angle: -Math.PI / 3, spread: 0.6, n: 120, speed: 22 });
    burst({ x: innerWidth, y: innerHeight, angle: -2 * Math.PI / 3, spread: 0.6, n: 120, speed: 22 });
  }

  function tick() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      p.life++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.12)) + 1);
      ctx.restore();
    }
    parts = parts.filter((p) => p.life < p.max && p.y < innerHeight + 60);
    if (parts.length) raf = requestAnimationFrame(tick);
    else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }

  return { burst, cannons };
})();

/* -------- Tournament -------- */
function roundName(n = currentRound.length) {
  if (n <= 2) return "Finale";
  if (n <= 4) return "Demi-finales";
  if (n <= 8) return "Quarts de finale";
  return "Huitièmes de finale";
}

function showRoundBanner() {
  const nb = Math.floor(currentRound.length / 2);
  $("rbKicker").textContent = `Tour ${roundIndex}`;
  $("rbTitle").textContent = roundName();
  $("rbSub").textContent = nb === 1 ? "Le duel ultime" : `${nb} duels • ${currentRound.length} start-ups en lice`;

  const banner = $("roundBanner");
  banner.classList.remove("hidden", "rb-play");
  void banner.offsetWidth;
  banner.classList.add("rb-play");
  Sound.vs();

  clearTimeout(showRoundBanner.timer);
  showRoundBanner.timer = setTimeout(() => banner.classList.add("hidden"), reducedMotion() ? 900 : 2100);
}

function startTournament() {
  const valid = startups
    .map(s => ({...s, name: (s.name || "").trim()}))
    .filter(s => s.name.length > 0);

  if (valid.length < 2) {
    toast("Ajoute au moins 2 start-ups avec un nom.");
    return;
  }

  currentRound = shuffle([...valid]);
  winners = [];
  matchResults = [];
  semifinalLosers = [];
  lastFinal = null;
  roundIndex = 1;

  renderRound();
  show("screenRound");
  showRoundBanner();
}

function initials(name) {
  const clean = String(name).trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const caps = clean.replace(/[^A-ZÀ-Ý]/g, ""); // "CityFun" → "CF"
  const letters = words.length > 1 ? words[0][0] + words[1][0]
    : caps.length >= 2 ? caps.slice(0, 2)
    : clean.slice(0, 1);
  return escapeHtml(letters.toUpperCase());
}

function renderRound() {
  $("roundKicker").textContent = `Tour ${roundIndex}`;
  $("roundTitle").textContent = roundName();
  $("btnNextRound").disabled = true;
  $("btnNextRound").classList.remove("ready");

  const m = $("matches");
  m.innerHTML = "";
  winners = [];

  let k = 0;
  for (let i = 0; i < currentRound.length; i += 2, k++) {
    const a = currentRound[i];
    const b = currentRound[i + 1];

    const wrap = document.createElement("div");
    wrap.className = "match";
    wrap.id = `match-${roundIndex}-${i}`;
    wrap.style.setProperty("--i", k);

    if (!b) {
      winners.push(a);
      wrap.classList.add("bye");
      wrap.innerHTML = `
        <div class="match-grid">
          <div class="side side-A winner">
            <div class="name">${escapeHtml(a.name)}</div>
            ${miniBadges(a)}
          </div>
          <div class="vs">
            <div class="label">BYE</div>
            <div class="smallmuted">Passe automatiquement</div>
            <div class="score-pill">—</div>
          </div>
          <div class="side side-B empty">
            <div class="name">—</div>
            <div class="smallmuted">Aucun adversaire</div>
          </div>
        </div>
        <div class="match-foot">
          <div class="smallmuted">Match non joué</div>
          <div class="smallmuted">Avance : <strong>${escapeHtml(a.name)}</strong></div>
        </div>
      `;
      m.appendChild(wrap);
      continue;
    }

    const existing = matchResults.find(r => r.roundIndex === roundIndex && r.matchIdx === i);

    const scoreText = existing ? `${existing.scoreA}–${existing.scoreB}` : `0–0`;
    const doneTag = existing
      ? `<div class="done-tag">Terminé</div>
         <div class="winner-badge">Gagnant : ${escapeHtml(existing.winnerName)}</div>`
      : `<div class="smallmuted crit-count">5 critères</div>`;

    wrap.innerHTML = `
      <div class="match-grid">
        <div class="side side-A">
          <div class="name">${escapeHtml(a.name)}</div>
          ${miniBadges(a)}
        </div>

        <div class="vs">
          <div class="label">VS</div>
          <div class="score-pill" id="score-${roundIndex}-${i}">${scoreText}</div>
          ${doneTag}
        </div>

        <div class="side side-B">
          <div class="name">${escapeHtml(b.name)}</div>
          ${miniBadges(b)}
        </div>
      </div>

      <div class="match-foot">
        <div class="smallmuted">${existing ? "Match terminé" : "Duel n°" + (k + 1) + " • clique pour lancer le vote"}</div>
        <button class="btn primary vote-btn" type="button" id="vote-${roundIndex}-${i}" ${existing ? "disabled" : ""}>
          ${existing ? "Voté" : "▶ Voter"}
        </button>
      </div>
    `;

    if (existing) {
      wrap.classList.add("done");
    } else {
      wrap.querySelector(`#vote-${roundIndex}-${i}`).onclick = () => openVote(a, b, i);
    }

    m.appendChild(wrap);
  }

  maybeEnableNextRound();
}

function miniBadges(s) {
  const con = s.contrainte;
  const conHtml = con !== "Aucune"
    ? `<span class="chip contrainte">
         <span>${escapeHtml(con)}</span>
         <img alt="" src="${iconForContrainte(con)}">
       </span>`
    : "";

  return `
    <div class="mini">
      <span class="chip theme">
        <span>${escapeHtml(s.theme)}</span>
        <img alt="" src="${iconForTheme(s.theme)}">
      </span>
      <span class="chip cible">
        <span>${escapeHtml(s.cible)}</span>
        <img alt="" src="${iconForCible(s.cible)}">
      </span>
      ${conHtml}
    </div>
  `;
}

function maybeEnableNextRound() {
  const totalNeedVote = Math.floor(currentRound.length / 2);
  const playedThisRound = matchResults.filter(r => r.roundIndex === roundIndex).length;

  const pct = totalNeedVote ? Math.round((playedThisRound / totalNeedVote) * 100) : 100;
  $("roundProgressBar").style.width = `${pct}%`;

  const btn = $("btnNextRound");
  btn.textContent = winners.length === 1 && playedThisRound >= totalNeedVote ? "🏆 Voir le podium" : "Tour suivant →";

  if (playedThisRound >= totalNeedVote) {
    btn.disabled = false;
    btn.classList.add("ready");
  }
}

/* -------- Vote (diaporama plein écran) -------- */
const STEP_INTRO = -1;
const STEP_RESULT = CRITERES.length;

function isModalOpen() { return !$("modal").classList.contains("hidden"); }

// setTimeout annulé si le match a changé ou si la scène a été fermée
function later(fn, ms) {
  const m = currentMatch;
  setTimeout(() => { if (currentMatch === m && isModalOpen()) fn(); }, ms);
}

function matchScores(m = currentMatch) {
  return {
    scoreA: m.picks.filter(p => p === "A").length,
    scoreB: m.picks.filter(p => p === "B").length
  };
}

function openVote(a, b, matchIdx) {
  currentMatch = {
    a, b, matchIdx,
    step: STEP_INTRO,
    picks: new Array(CRITERES.length).fill(null),
    shownA: 0,
    shownB: 0,
    busy: false,
    revealed: false,
    validated: false
  };

  $("modalTitle").textContent = `Tour ${roundIndex} • ${roundName()}`;
  $("modalSubtitle").textContent = `${a.name} vs ${b.name}`;
  $("modal").classList.remove("hidden");
  document.body.classList.add("no-scroll");

  goTo(STEP_INTRO, 0);
  Sound.vs();
}

function closeModal(force = false) {
  const m = currentMatch;
  if (!force && m && !m.validated && m.picks.some(Boolean)) {
    if (!confirm("Abandonner le vote en cours ? Les points attribués seront perdus.")) return;
  }
  $("modal").classList.add("hidden");
  document.body.classList.remove("no-scroll");
}

function goTo(step, dir = 1) {
  const m = currentMatch;
  const body = $("modalBody");
  const old = body.querySelector(".slide");
  m.busy = true;

  const render = () => {
    m.step = step;
    $("modal").dataset.step = step === STEP_INTRO ? "intro" : step === STEP_RESULT ? "result" : "vote";
    body.innerHTML = `<div class="slide" style="--dir:${dir}">${slideHtml()}</div>`;
    bindSlide();
    renderScoreboard();
    updateFoot();
    m.busy = false;
  };

  if (old && dir !== 0 && !reducedMotion()) {
    old.style.setProperty("--dir", dir);
    old.classList.add("leaving");
    Sound.whoosh();
    later(render, 230);
  } else {
    render();
  }
}

function contestant(s, side) {
  return `
    <div class="contestant side-${side}">
      <div class="avatar">${initials(s.name)}</div>
      <div class="name">${escapeHtml(s.name)}</div>
      ${miniBadges(s)}
    </div>
  `;
}

function slideHtml() {
  const { a, b, step, picks } = currentMatch;

  if (step === STEP_INTRO) {
    return `
      <div class="intro">
        <div class="fighter left">${contestant(a, "A")}</div>
        <div class="vs-burst" aria-hidden="true"><span class="ring"></span><span class="txt">VS</span></div>
        <div class="fighter right">${contestant(b, "B")}</div>
        <div class="intro-cta">
          <button class="btn primary big start-btn" id="btnStartVote" type="button">Lancer le vote ▶</button>
          <div class="hint">${CRITERES.length} critères • 1 point par critère • <kbd>Entrée</kbd> pour commencer</div>
        </div>
      </div>
    `;
  }

  if (step === STEP_RESULT) {
    const { scoreA, scoreB } = matchScores();
    const winSide = scoreA > scoreB ? "A" : "B";
    const winner = winSide === "A" ? a : b;
    const recap = CRITERES.map(([title], i) => {
      const p = picks[i];
      const who = p === "A" ? a.name : b.name;
      return `
        <div class="recap-row" style="--i:${i}">
          <span class="recap-crit">${escapeHtml(title)}</span>
          <span class="recap-who side-${p}">${escapeHtml(who)}</span>
        </div>`;
    }).join("");

    return `
      <div class="result ${currentMatch.revealed ? "revealed" : ""}">
        <div class="suspense">
          <div class="drum" aria-hidden="true">🥁</div>
          <div class="suspense-text">Et le gagnant du duel est<span class="dots"><i>.</i><i>.</i><i>.</i></span></div>
        </div>
        <div class="reveal">
          <div class="crown" aria-hidden="true">🏆</div>
          <div class="reveal-name side-${winSide}">${escapeHtml(winner.name)}</div>
          <div class="reveal-score"><span class="side-A">${scoreA}</span> – <span class="side-B">${scoreB}</span></div>
          <div class="recap">${recap}</div>
        </div>
      </div>
    `;
  }

  const [title, question] = CRITERES[step];
  const picked = picks[step];

  return `
    <div class="criterion">
      <div class="crit-num">Critère ${step + 1}<span>/${CRITERES.length}</span></div>
      <div class="crit-title">${escapeHtml(title)}</div>
      <div class="crit-q">${escapeHtml(question)}</div>
    </div>

    <div class="duel">
      <button class="pick side-A ${picked === "A" ? "chosen" : picked ? "faded" : ""}" id="pickA" type="button">
        <kbd class="key">←</kbd>
        <div class="name">${escapeHtml(a.name)}</div>
        ${miniBadges(a)}
        <div class="pick-cta">Attribuer le point</div>
      </button>

      <div class="duel-vs" aria-hidden="true">VS</div>

      <button class="pick side-B ${picked === "B" ? "chosen" : picked ? "faded" : ""}" id="pickB" type="button">
        <kbd class="key">→</kbd>
        <div class="name">${escapeHtml(b.name)}</div>
        ${miniBadges(b)}
        <div class="pick-cta">Attribuer le point</div>
      </button>
    </div>
  `;
}

function bindSlide() {
  const m = currentMatch;

  if (m.step === STEP_INTRO) {
    $("btnStartVote").onclick = startVoting;
    $("btnStartVote").focus({ preventScroll: true });
    return;
  }

  if (m.step === STEP_RESULT) {
    if (!m.revealed) {
      Sound.drum(reducedMotion() ? 0.4 : 1.5);
      later(revealWinner, reducedMotion() ? 400 : 1600);
    }
    return;
  }

  $("pickA").onclick = () => pickWinner("A");
  $("pickB").onclick = () => pickWinner("B");
}

function startVoting() {
  const m = currentMatch;
  if (!m || m.busy || m.step !== STEP_INTRO) return;
  goTo(0, 1);
}

function prevStep() {
  const m = currentMatch;
  if (!m || m.busy || m.step <= STEP_INTRO) return;
  goTo(m.step - 1, -1);
}

function pickWinner(which) {
  const m = currentMatch;
  if (!m || m.busy || m.step < 0 || m.step >= CRITERES.length) return;

  const s = m.step;
  if (m.picks[s] !== which) m.revealed = false;
  m.picks[s] = which;
  m.busy = true;

  const other = which === "A" ? "B" : "A";
  const chosen = $(`pick${which}`);
  chosen.classList.remove("faded");
  chosen.classList.add("chosen");
  $(`pick${other}`).classList.remove("chosen");
  $(`pick${other}`).classList.add("faded");

  const plus = document.createElement("span");
  plus.className = "plus-one";
  plus.textContent = "+1";
  chosen.appendChild(plus);

  Sound.pick();
  renderScoreboard();

  later(() => goTo(s + 1, 1), reducedMotion() ? 200 : 750);
}

function revealWinner() {
  const m = currentMatch;
  m.revealed = true;
  const res = $("modalBody").querySelector(".result");
  if (res) res.classList.add("revealed");
  Sound.fanfare();
  Confetti.burst({ y: innerHeight * 0.4, n: 160 });
  updateFoot();
  $("btnValidate").focus({ preventScroll: true });
}

function renderScoreboard() {
  const m = currentMatch;
  const { scoreA, scoreB } = matchScores(m);
  const bumpA = scoreA > m.shownA;
  const bumpB = scoreB > m.shownB;
  m.shownA = scoreA;
  m.shownB = scoreB;

  const lead = scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : "";
  const segs = CRITERES.map(([title], i) => {
    const p = m.picks[i];
    return `<span class="seg ${p ? "won-" + p : ""} ${i === m.step ? "current" : ""}" title="${escapeHtml(title)}"></span>`;
  }).join("");

  $("scoreboard").innerHTML = `
    <div class="sb-team side-A ${lead === "A" ? "lead" : ""}">
      <span class="sb-name">${escapeHtml(m.a.name)}</span>
      <span class="sb-score ${bumpA ? "bump" : ""}">${scoreA}</span>
    </div>
    <div class="sb-track">${segs}</div>
    <div class="sb-team side-B ${lead === "B" ? "lead" : ""}">
      <span class="sb-score ${bumpB ? "bump" : ""}">${scoreB}</span>
      <span class="sb-name">${escapeHtml(m.b.name)}</span>
    </div>
  `;
}

function updateFoot() {
  const m = currentMatch;
  $("btnPrev").disabled = m.step <= STEP_INTRO;
  $("btnValidate").disabled = !(m.step === STEP_RESULT && m.revealed);

  let hint = "";
  if (m.step === STEP_INTRO) hint = `<kbd>Entrée</kbd> commencer • <kbd>F</kbd> plein écran`;
  else if (m.step === STEP_RESULT) hint = m.revealed ? `<kbd>Entrée</kbd> valider • <kbd>⌫</kbd> corriger un vote` : "Suspense…";
  else hint = `<kbd>←</kbd> / <kbd>→</kbd> voter • <kbd>⌫</kbd> revenir`;
  $("modalStatus").innerHTML = hint;
}

function validateMatch() {
  const m = currentMatch;
  if (!m || m.validated || !m.revealed) return;
  m.validated = true;

  const { a, b, matchIdx } = m;
  const { scoreA, scoreB } = matchScores(m);

  let winner = a;
  let loser = b;
  if (scoreB > scoreA) { winner = b; loser = a; }

  winners.push(winner);

  matchResults.push({
    roundIndex,
    matchIdx,
    aName: a.name,
    bName: b.name,
    scoreA,
    scoreB,
    winnerName: winner.name,
    loserName: loser.name
  });

  // semi / finale pour podium
  const totalMatchesThisRound = Math.floor(currentRound.length / 2);
  if (totalMatchesThisRound === 2) semifinalLosers.push(loser);
  if (totalMatchesThisRound === 1) lastFinal = { winner, loser, scoreA, scoreB, a, b };

  // update UI (score + done + gagnant)
  const matchCard = document.querySelector(`#match-${roundIndex}-${matchIdx}`);
  if (matchCard) {
    matchCard.classList.add("done", "just-done");

    const vsBox = matchCard.querySelector(".vs");
    vsBox.querySelector(".crit-count")?.remove();
    vsBox.querySelector(".winner-badge")?.remove();
    const tag = document.createElement("div");
    tag.className = "done-tag";
    tag.textContent = "Terminé";
    const badge = document.createElement("div");
    badge.className = "winner-badge";
    badge.textContent = `Gagnant : ${winner.name}`;
    vsBox.append(tag, badge);

    const sides = matchCard.querySelectorAll(".side");
    const winIdx = winner === a ? 0 : 1;
    sides[winIdx].classList.add("winner");
    sides[1 - winIdx].classList.add("loser");

    matchCard.querySelector(".match-foot .smallmuted").textContent = "Match terminé";
    matchCard.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const scoreEl = document.querySelector(`#score-${roundIndex}-${matchIdx}`);
  if (scoreEl) scoreEl.textContent = `${scoreA}–${scoreB}`;

  const voteBtn = document.querySelector(`#vote-${roundIndex}-${matchIdx}`);
  if (voteBtn) {
    voteBtn.textContent = "Voté";
    voteBtn.disabled = true;
  }

  closeModal(true);
  toast(`🏅 ${winner.name} se qualifie (${scoreA}–${scoreB})`);

  maybeEnableNextRound();
}

/* -------- Next rounds & podium -------- */
function nextRound() {
  if (winners.length === 1) {
    renderPodium(winners[0]);
    show("screenWinner");
    celebrate();
    return;
  }

  currentRound = [...winners];
  winners = [];
  roundIndex += 1;
  renderRound();
  show("screenRound");
  showRoundBanner();
}

function celebrate() {
  const fast = reducedMotion();
  setTimeout(() => Sound.drum(1.2), fast ? 0 : 200);
  setTimeout(() => {
    Sound.fanfare();
    Confetti.cannons();
    Confetti.burst({ y: innerHeight * 0.3, n: 180 });
  }, fast ? 0 : 1500);
  if (!fast) setTimeout(() => Confetti.cannons(), 2600);
}

function renderPodium(champion) {
  const winnerCard = $("winnerCard");

  const champName = champion?.name || "—";
  const runnerUp = lastFinal?.loser?.name || "—";

  let thirdText = "—";
  if (semifinalLosers.length >= 2) {
    thirdText = `${semifinalLosers[0].name} / ${semifinalLosers[1].name}`;
  } else if (semifinalLosers.length === 1) {
    thirdText = semifinalLosers[0].name;
  }

  const finalScore = lastFinal
    ? `${lastFinal.a.name} vs ${lastFinal.b.name} : ${lastFinal.scoreA}–${lastFinal.scoreB}`
    : "";

  winnerCard.innerHTML = `
    <div class="podium">
      <div class="place second">
        <div class="medal" aria-hidden="true">🥈</div>
        <div class="rank">2ᵉ PLACE</div>
        <div class="pname">${escapeHtml(runnerUp)}</div>
        <div class="muted">Finaliste</div>
      </div>

      <div class="place first">
        <div class="medal" aria-hidden="true">🥇</div>
        <div class="rank">1ʳᵉ PLACE</div>
        <div class="pname">${escapeHtml(champName)}</div>
        <div class="muted">Championne</div>
      </div>

      <div class="place third">
        <div class="medal" aria-hidden="true">🥉</div>
        <div class="rank">3ᵉ PLACE</div>
        <div class="pname">${escapeHtml(thirdText)}</div>
        <div class="muted">Ex æquo (sans petite finale)</div>
      </div>
    </div>

    ${finalScore ? `<p class="muted final-line"><strong>Finale :</strong> ${escapeHtml(finalScore)}</p>` : ""}
  `;
}

/* -------- Utilities -------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* -------- Events -------- */
$("btnAdd").onclick = () => addStartup();
$("btnDemo").onclick = () => {
  startups = [];
  addStartup({name:"FitNow", theme:"Sport", cible:"Étudiants", contrainte:"Plateforme numérique"});
  addStartup({name:"GreenBox", theme:"Nature", cible:"Familles avec jeunes enfants", contrainte:"Moins de 10 €"});
  addStartup({name:"SeniorCare", theme:"Santé", cible:"Retraités", contrainte:"Technologie innovante"});
  addStartup({name:"CityFun", theme:"Divertissement", cible:"Jeunes urbains créatifs", contrainte:"Co-conception avec les utilisateurs"});
};
$("btnClear").onclick = () => { startups = []; renderStartups(); };
$("btnStart").onclick = startTournament;
$("btnNextRound").onclick = nextRound;
$("btnBack").onclick = () => show("screenSetup");
$("btnReset").onclick = () => location.reload();
$("btnRestart").onclick = () => location.reload();
$("btnBackSetup").onclick = () => show("screenSetup");

$("btnClose").onclick = () => closeModal();
$("btnCancel").onclick = () => closeModal();
$("btnPrev").onclick = prevStep;
$("btnValidate").onclick = validateMatch;
$("btnSound").onclick = toggleSound;
$("btnSoundTop").onclick = toggleSound;
$("btnFullscreen").onclick = toggleFullscreen;
$("btnFullscreenTop").onclick = toggleFullscreen;
$("roundBanner").onclick = () => $("roundBanner").classList.add("hidden");

// Raccourcis clavier pendant le vote (pratique en projection / avec une télécommande)
document.addEventListener("keydown", (e) => {
  if (!isModalOpen() || !currentMatch) return;
  const m = currentMatch;
  const k = e.key;

  if (k === "Escape") { closeModal(); return; }
  if (k === "f" || k === "F") { toggleFullscreen(); return; }
  if (k === "Backspace") { e.preventDefault(); prevStep(); return; }

  if (m.step === STEP_INTRO && (k === "Enter" || k === " ")) {
    e.preventDefault();
    startVoting();
  } else if (m.step >= 0 && m.step < CRITERES.length) {
    if (k === "ArrowLeft" || k === "1" || k === "a" || k === "A") { e.preventDefault(); pickWinner("A"); }
    if (k === "ArrowRight" || k === "2" || k === "b" || k === "B") { e.preventDefault(); pickWinner("B"); }
  } else if (m.step === STEP_RESULT && k === "Enter") {
    e.preventDefault();
    validateMatch();
  }
});

/* init */
syncSoundButtons();
addStartup();
addStartup();
renderStartups();
