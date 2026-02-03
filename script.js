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

// Résultats par match (pour affichage score + état terminé)
let matchResults = []; // { roundIndex, matchIdx, aName, bName, scoreA, scoreB, winnerName, loserName }
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
    div.className = "card";
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

/* -------- Tournament -------- */
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
}

function renderRound() {
  $("roundTitle").textContent = `TOUR ${roundIndex}`;
  $("btnNextRound").disabled = true;

  const m = $("matches");
  m.innerHTML = "";
  winners = [];

  for (let i = 0; i < currentRound.length; i += 2) {
    const a = currentRound[i];
    const b = currentRound[i + 1];

    const wrap = document.createElement("div");
    wrap.className = "match";
    wrap.id = `match-${roundIndex}-${i}`;

    if (!b) {
      winners.push(a);
      wrap.innerHTML = `
        <div class="match-grid">
          <div class="side">
            <div class="name">${escapeHtml(a.name)}</div>
            ${miniBadges(a)}
          </div>
          <div class="vs">
            <div class="label">BYE</div>
            <div class="smallmuted">Passe automatiquement</div>
            <div class="score-pill">—</div>
          </div>
          <div class="side">
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
  : `<div class="smallmuted">5 critères</div>`;


    wrap.innerHTML = `
      <div class="match-grid">
        <div class="side">
          <div class="name">${escapeHtml(a.name)}</div>
          ${miniBadges(a)}
        </div>

        <div class="vs">
          <div class="label">VS</div>
          <div class="score-pill" id="score-${roundIndex}-${i}">${scoreText}</div>
          ${doneTag}
        </div>

        <div class="side">
          <div class="name">${escapeHtml(b.name)}</div>
          ${miniBadges(b)}
        </div>
      </div>

      <div class="match-foot">
        <div class="smallmuted">${existing ? "Match terminé" : "Clique pour voter sur ce duel"}</div>
        <button class="btn primary" type="button" id="vote-${roundIndex}-${i}" ${existing ? "disabled" : ""}>
          ${existing ? "Voté" : "Voter"}
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
    ? `<span class="chip contrainte" style="padding:10px 12px; min-width:160px">
         <span>${escapeHtml(con)}</span>
         <img alt="" src="${iconForContrainte(con)}">
       </span>`
    : "";

  return `
    <div class="mini">
      <span class="chip theme" style="padding:10px 12px; min-width:160px">
        <span>${escapeHtml(s.theme)}</span>
        <img alt="" src="${iconForTheme(s.theme)}">
      </span>
      <span class="chip cible" style="padding:10px 12px; min-width:160px">
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

  if (playedThisRound >= totalNeedVote) {
    $("btnNextRound").disabled = false;
  }
}

/* -------- Vote (slideshow) -------- */
function openVote(a, b, matchIdx) {
  currentMatch = {
    a, b, matchIdx,
    step: 0,
    scoreA: 0,
    scoreB: 0,
    picks: new Array(CRITERES.length).fill(null)
  };

  $("modalSubtitle").textContent = `${a.name} vs ${b.name}`;
  $("modal").classList.remove("hidden");

  renderVoteSlide();
  $("btnValidate").disabled = true;
  $("modalStatus").textContent = "";
}

function renderVoteSlide() {
  const { a, b, step, scoreA, scoreB } = currentMatch;
  const [title, question] = CRITERES[step];

  const dots = CRITERES.map((_, i) => `<span class="dot ${i<=step ? "on":""}"></span>`).join("");

  $("modalBody").innerHTML = `
    <div class="progress">
      <span>Critère ${step + 1}/5</span>
      <span style="opacity:.6">•</span>
      <span>${escapeHtml(title)}</span>
      <span style="opacity:.6">•</span>
      <span>Score: ${scoreA}–${scoreB}</span>
      <span style="opacity:.6">•</span>
      <span>${dots}</span>
    </div>

    <div class="vote-slide" style="margin-top:12px">
      <div class="question">
        <div class="kicker">${escapeHtml(title)}</div>
        <div class="q">${escapeHtml(question)}</div>
      </div>

      <div class="pick" id="pickA" role="button" tabindex="0">
        <div>
          <div class="name">${escapeHtml(a.name)}</div>
          ${miniBadges(a)}
        </div>
        <div class="smallmuted">Cliquer pour attribuer le point</div>
      </div>

      <div class="pick" id="pickB" role="button" tabindex="0">
        <div>
          <div class="name">${escapeHtml(b.name)}</div>
          ${miniBadges(b)}
        </div>
        <div class="smallmuted">Cliquer pour attribuer le point</div>
      </div>
    </div>
  `;

  $("pickA").onclick = () => pickWinner("A");
  $("pickB").onclick = () => pickWinner("B");
  $("modalStatus").textContent = "";
}

function pickWinner(which) {
  const s = currentMatch.step;
  if (currentMatch.picks[s]) return;

  currentMatch.picks[s] = which;
  if (which === "A") currentMatch.scoreA += 1;
  else currentMatch.scoreB += 1;

  if (currentMatch.step < CRITERES.length - 1) {
    currentMatch.step += 1;
    renderVoteSlide();
    return;
  }

  $("modalStatus").textContent = `Vote terminé — Score final : ${currentMatch.scoreA}–${currentMatch.scoreB}`;
  $("btnValidate").disabled = false;
}

function validateMatch() {
  const { a, b, scoreA, scoreB, matchIdx } = currentMatch;

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

  // ✅ Ajouter/mettre à jour le badge "Gagnant" dans la carte du match
const vsBox = document.querySelector(`#match-${roundIndex}-${matchIdx} .vs`);
if (vsBox) {
  // Supprime un ancien badge gagnant s'il existe
  const oldWinner = vsBox.querySelector(".winner-badge");
  if (oldWinner) oldWinner.remove();

  // Ajoute le nouveau badge
  const badge = document.createElement("div");
  badge.className = "winner-badge";
  badge.textContent = `Gagnant : ${winner.name}`;
  vsBox.appendChild(badge);
}

  // semi / finale pour podium
  const totalMatchesThisRound = Math.floor(currentRound.length / 2);
  if (totalMatchesThisRound === 2) semifinalLosers.push(loser);
  if (totalMatchesThisRound === 1) lastFinal = { winner, loser, scoreA, scoreB, a, b };

  // update UI (score + done)
  const scoreEl = document.querySelector(`#score-${roundIndex}-${matchIdx}`);
  if (scoreEl) scoreEl.textContent = `${scoreA}–${scoreB}`;

  const matchCard = document.querySelector(`#match-${roundIndex}-${matchIdx}`);
  if (matchCard) matchCard.classList.add("done");

  const voteBtn = document.querySelector(`#vote-${roundIndex}-${matchIdx}`);
  if (voteBtn) {
    voteBtn.textContent = "Voté";
    voteBtn.disabled = true;
  }

  $("modal").classList.add("hidden");
  toast(`Gagnant : ${winner.name} (${scoreA}–${scoreB})`);

  maybeEnableNextRound();
}

/* -------- Next rounds & podium -------- */
function nextRound() {
  if (winners.length === 1) {
    renderPodium(winners[0]);
    show("screenWinner");
    return;
  }

  currentRound = [...winners];
  winners = [];
  roundIndex += 1;
  renderRound();
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
$("btnBack").onclick = () => show("screenSetup"); // ✅ texte "Retour" côté UI (bouton reste le même id)
$("btnReset").onclick = () => location.reload();
$("btnRestart").onclick = () => location.reload();
$("btnBackSetup").onclick = () => show("screenSetup");

$("btnClose").onclick = () => $("modal").classList.add("hidden");
$("btnCancel").onclick = () => $("modal").classList.add("hidden");
$("btnValidate").onclick = validateMatch;

/* init */
addStartup();
addStartup();
renderStartups();
