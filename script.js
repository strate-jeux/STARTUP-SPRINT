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
const ICONS = {
  theme: {
    "Sport": "assets/items/theme-sport.png",
    "Divertissement": "assets/items/theme-divertissement.png",
    "Santé": "assets/items/theme-sante.png",
    "Quotidien": "assets/items/theme-quotidien.png",
    "Nature": "assets/items/theme-nature.png",
  },
  cible: {
    "Retraités": "assets/items/cible-retraites.png",
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

// -------- Tournoi --------
let currentRound = [];
let roundIndex = 1;
let winners = [];

// Duel affiché un à la fois
let matchPairs = [];   // [{ a, b|null, idx }]
let matchCursor = 0;
let uiPhase = "preview"; // 'preview' | 'vote' | 'result' | 'bye'
let voteState = null;    // { a, b, step, scoreA, scoreB }
let pendingResult = null; // { winner, loser, scoreA, scoreB, a, b }

// Historique (podium)
let matchResults = [];
let semifinalLosers = [];
let lastFinal = null;

const $ = (id) => document.getElementById(id);

function show(screenId) {
  ["screenSetup", "screenRound", "screenWinner"].forEach((s) => $(s).classList.add("hidden"));
  $(screenId).classList.remove("hidden");
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 1700);
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
  renderStartups();
}

function iconForTheme(theme) { return ICONS.theme[theme] || ""; }
function iconForCible(cible) { return ICONS.cible[cible] || ""; }
function iconForContrainte(con) { return ICONS.contrainte[con] || ""; }

function optionChip(value, selected, icon) {
  return `
    <button class="option-chip ${selected ? "selected" : ""}" type="button" data-value="${escapeHtml(value)}">
      ${icon ? `<img alt="" src="${icon}">` : ""}
      <span>${escapeHtml(value)}</span>
    </button>
  `;
}

function renderStartups() {
  const list = $("startupList");
  list.innerHTML = "";

  startups.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <div class="card-head">
        <div class="card-index">START-UP #${i + 1}</div>
        <button class="icon-btn danger" type="button" data-del="${i}" aria-label="Supprimer" title="Supprimer">✕</button>
      </div>

      <label>Nom</label>
      <input placeholder="Nom de la start-up" value="${escapeHtml(s.name)}">

      <label>Thème</label>
      <div class="option-row" data-group="theme">
        ${THEMES.map(t => optionChip(t, t === s.theme, iconForTheme(t))).join("")}
      </div>

      <label>Cible</label>
      <div class="option-row" data-group="cible">
        ${CIBLES.map(c => optionChip(c, c === s.cible, iconForCible(c))).join("")}
      </div>

      <label>Contrainte (facultatif)</label>
      <div class="option-row" data-group="contrainte">
        ${CONTRAINTES.map(c => optionChip(c, c === s.contrainte, iconForContrainte(c))).join("")}
      </div>
    `;

    div.querySelector("[data-del]").onclick = () => {
      startups.splice(i, 1);
      renderStartups();
    };

    div.querySelector("input").oninput = (e) => { s.name = e.target.value; };

    div.querySelectorAll(".option-row").forEach((row) => {
      const group = row.dataset.group;
      row.querySelectorAll(".option-chip").forEach((btn) => {
        btn.onclick = () => {
          s[group] = btn.dataset.value;
          renderStartups();
        };
      });
    });

    list.appendChild(div);
  });
}

/* -------- Tournament -------- */
function startTournament() {
  const valid = startups
    .map(s => ({ ...s, name: (s.name || "").trim() }))
    .filter(s => s.name.length > 0);

  if (valid.length < 2) {
    toast("Ajoute au moins 2 start-ups avec un nom.");
    return;
  }

  currentRound = shuffle([...valid]);
  matchResults = [];
  semifinalLosers = [];
  lastFinal = null;
  roundIndex = 1;

  beginRound();
  show("screenRound");
}

function buildMatchPairs(round) {
  const pairs = [];
  for (let i = 0; i < round.length; i += 2) {
    pairs.push({ a: round[i], b: round[i + 1] || null, idx: i });
  }
  return pairs;
}

function beginRound() {
  matchPairs = buildMatchPairs(currentRound);
  winners = [];
  matchCursor = 0;
  goToCursorOrRoundEnd();
}

function goToCursorOrRoundEnd() {
  if (matchCursor >= matchPairs.length) {
    finishRound();
    return;
  }
  const pair = matchPairs[matchCursor];
  if (!pair.b) {
    winners.push(pair.a);
    uiPhase = "bye";
    renderMatchScreen();
    return;
  }
  uiPhase = "preview";
  renderMatchScreen();
}

function finishRound() {
  if (winners.length === 1) {
    renderPodium(winners[0]);
    show("screenWinner");
    return;
  }
  currentRound = [...winners];
  roundIndex += 1;
  beginRound();
}

function continueToNext() {
  matchCursor += 1;
  goToCursorOrRoundEnd();
}

function startVote() {
  const pair = matchPairs[matchCursor];
  voteState = { a: pair.a, b: pair.b, step: 0, scoreA: 0, scoreB: 0 };
  uiPhase = "vote";
  renderMatchScreen();
}

function pickVoteWinner(which) {
  if (which === "A") voteState.scoreA += 1; else voteState.scoreB += 1;

  if (voteState.step < CRITERES.length - 1) {
    voteState.step += 1;
    renderMatchScreen();
    return;
  }

  const { a, b, scoreA, scoreB } = voteState;
  let winner = a, loser = b;
  if (scoreB > scoreA) { winner = b; loser = a; }

  const pair = matchPairs[matchCursor];
  matchResults.push({
    roundIndex, matchIdx: pair.idx,
    aName: a.name, bName: b.name, scoreA, scoreB,
    winnerName: winner.name, loserName: loser.name
  });
  winners.push(winner);

  const totalMatchesThisRound = matchPairs.filter(p => p.b).length;
  if (totalMatchesThisRound === 2) semifinalLosers.push(loser);
  if (totalMatchesThisRound === 1) lastFinal = { winner, loser, scoreA, scoreB, a, b };

  pendingResult = { winner, loser, scoreA, scoreB, a, b };
  uiPhase = "result";
  renderMatchScreen();
}

/* -------- Rendu du duel (un à la fois) -------- */
function duelAttrs(s) {
  const items = [
    { cat: "theme", label: s.theme, icon: iconForTheme(s.theme) },
    { cat: "cible", label: s.cible, icon: iconForCible(s.cible) },
  ];
  if (s.contrainte !== "Aucune") {
    items.push({ cat: "contrainte", label: s.contrainte, icon: iconForContrainte(s.contrainte) });
  }
  return `
    <div class="duel-attrs">
      ${items.map(it => `
        <div class="duel-attr ${it.cat}">
          ${it.icon ? `<img alt="" src="${it.icon}">` : ""}
          <span>${escapeHtml(it.label)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderMatchScreen() {
  const stage = $("roundStage");
  const pair = matchPairs[matchCursor];

  if (uiPhase === "bye") {
    stage.innerHTML = `
      <div class="round-kicker">TOUR ${roundIndex}</div>
      <h1>${escapeHtml(pair.a.name)} passe au tour suivant</h1>
      <p class="muted">Aucun adversaire ce tour-ci pour cette start-up.</p>
      <button class="btn primary big" id="btnContinue" type="button">Continuer</button>
    `;
    $("btnContinue").onclick = continueToNext;
    return;
  }

  if (uiPhase === "preview") {
    const totalMatches = matchPairs.filter(p => p.b).length;
    const matchNumber = matchPairs.slice(0, matchCursor + 1).filter(p => p.b).length;
    stage.innerHTML = `
      <div class="round-kicker">TOUR ${roundIndex} — MATCH ${matchNumber}/${totalMatches}</div>
      <div class="duel-grid">
        <div class="duel-side left">
          <div class="duel-name">${escapeHtml(pair.a.name)}</div>
          ${duelAttrs(pair.a)}
        </div>
        <div class="vs-badge">VS</div>
        <div class="duel-side right">
          <div class="duel-name">${escapeHtml(pair.b.name)}</div>
          ${duelAttrs(pair.b)}
        </div>
      </div>
      <button class="btn primary big" id="btnStartVote" type="button">⚡ Commencer le vote</button>
    `;
    $("btnStartVote").onclick = startVote;
    return;
  }

  if (uiPhase === "vote") {
    const { a, b, step, scoreA, scoreB } = voteState;
    const [title, question] = CRITERES[step];
    const dots = CRITERES.map((_, i) => `<span class="vote-dot ${i < step ? "done" : i === step ? "current" : ""}"></span>`).join("");

    stage.innerHTML = `
      <div class="round-kicker">TOUR ${roundIndex} • Critère ${step + 1}/${CRITERES.length}</div>
      <div class="vote-score"><span class="score-a">${scoreA}</span><span class="score-sep">–</span><span class="score-b">${scoreB}</span></div>
      <div class="vote-dots">${dots}</div>
      <h1 class="vote-title">${escapeHtml(title)}</h1>
      <p class="muted vote-question">${escapeHtml(question)}</p>
      <div class="vote-pills">
        <button class="vote-pill left" type="button" id="pickA">${escapeHtml(a.name)}</button>
        <button class="vote-pill right" type="button" id="pickB">${escapeHtml(b.name)}</button>
      </div>
    `;
    $("pickA").onclick = () => pickVoteWinner("A");
    $("pickB").onclick = () => pickVoteWinner("B");
    return;
  }

  if (uiPhase === "result") {
    const { winner, scoreA, scoreB } = pendingResult;
    const isLastInRound = matchCursor + 1 >= matchPairs.length;
    const nextLabel = isLastInRound
      ? (winners.length === 1 ? "Voir le résultat final" : "Voir le tour suivant")
      : "Match suivant";

    stage.innerHTML = `
      <div class="round-kicker">TOUR ${roundIndex}</div>
      <div class="result-trophy">🏆</div>
      <h1>${escapeHtml(winner.name)} remporte ce duel</h1>
      <p class="muted">Score final : ${scoreA}–${scoreB}</p>
      <button class="btn primary big" id="btnContinue" type="button">${nextLabel}</button>
    `;
    $("btnContinue").onclick = continueToNext;
    return;
  }
}

/* -------- Podium -------- */
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
        <div class="rank">2ᵉ PLACE</div>
        <div class="pname">${escapeHtml(runnerUp)}</div>
        <div class="muted">Finaliste</div>
      </div>

      <div class="place first">
        <div class="rank">1ʳᵉ PLACE</div>
        <div class="pname">${escapeHtml(champName)}</div>
        <div class="muted">Championne</div>
      </div>

      <div class="place third">
        <div class="rank">3ᵉ PLACE</div>
        <div class="pname">${escapeHtml(thirdText)}</div>
        <div class="muted">Ex æquo (sans petite finale)</div>
      </div>
    </div>

    ${finalScore ? `<p class="muted" style="margin-top:14px"><strong>Finale :</strong> ${escapeHtml(finalScore)}</p>` : ""}
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
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------- Events -------- */
$("btnAdd").onclick = () => addStartup();
$("btnDemo").onclick = () => {
  startups = [];
  addStartup({ name: "FitNow", theme: "Sport", cible: "Étudiants", contrainte: "Plateforme numérique" });
  addStartup({ name: "GreenBox", theme: "Nature", cible: "Familles avec jeunes enfants", contrainte: "Moins de 10 €" });
  addStartup({ name: "SeniorCare", theme: "Santé", cible: "Retraités", contrainte: "Technologie innovante" });
  addStartup({ name: "CityFun", theme: "Divertissement", cible: "Jeunes urbains créatifs", contrainte: "Co-conception avec les utilisateurs" });
};
$("btnClear").onclick = () => { startups = []; renderStartups(); };
$("btnStart").onclick = startTournament;
$("btnBack").onclick = () => show("screenSetup");
$("btnReset").onclick = () => location.reload();
$("btnRestart").onclick = () => location.reload();
$("btnBackSetup").onclick = () => show("screenSetup");

/* init */
addStartup();
addStartup();
renderStartups();
