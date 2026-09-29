/* =========================================================
   James Mankee Fitness — Free Training Split Generator
   ========================================================= */

/* ---------- MAILCHIMP CONFIG ----------
   Replace with your own embedded-form action URL.
   Find it in Mailchimp: Audience > Signup forms > Embedded form,
   grab the <form action="..."> URL. It looks like:
   https://xxxx.usXX.list-manage.com/subscribe/post?u=XXXXXXXX&id=XXXXXXXX
   No API key needed — this is the public form-post endpoint.
--------------------------------------------------------- */
const MAILCHIMP_ACTION_URL = "https://YOUR-SUBDOMAIN.usXX.list-manage.com/subscribe/post?u=YOUR_U&id=YOUR_ID";

/* Set your booking / application link for the coaching CTA */
const APPLY_URL = "#";

/* Your WhatsApp link for the "Talk to me" button in the coaching notes.
   Format: https://wa.me/<countrycode><number> with no spaces, +, or leading 0
   e.g. UK 07123 456789 -> https://wa.me/447123456789
   Optionally add a prefilled message: https://wa.me/447123456789?text=Hi%20James */
const WHATSAPP_URL = "#";

/* ---------- STATE ---------- */
const state = {
  goal: null,
  experience: null,
  days: null,
  time: null,
  equipment: null,
  injuries: [],
  age: null,
  gender: null,
  fname: "",
  email: ""
};

const TOTAL_STEPS = 8;
let currentStep = 1;

/* ---------- ELEMENTS ---------- */
const screenHero = document.getElementById("screen-hero");
const screenQuiz = document.getElementById("screen-quiz");
const screenResult = document.getElementById("screen-result");
const btnStart = document.getElementById("btn-start");
const btnNext = document.getElementById("btn-next");
const btnBack = document.getElementById("btn-back");
const quizForm = document.getElementById("quiz-form");
const progressFill = document.getElementById("progress-fill");
const stepCount = document.getElementById("step-count");
const btnApply = document.getElementById("btn-apply");
const btnWhatsapp = document.getElementById("btn-whatsapp");
const resultDaysEl = document.getElementById("result-days");

btnApply.href = APPLY_URL;
btnWhatsapp.href = WHATSAPP_URL;

/* ---------- NAVIGATION ---------- */
btnStart.addEventListener("click", () => {
  screenHero.classList.remove("is-active");
  screenQuiz.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderStep();
});

btnNext.addEventListener("click", () => goToStep(currentStep + 1));
btnBack.addEventListener("click", () => goToStep(currentStep - 1));

function goToStep(n) {
  if (n < 1) return;
  if (n > TOTAL_STEPS) return;
  if (n > currentStep && !stepIsValid(currentStep)) {
    flashInvalid(currentStep);
    return;
  }
  document.querySelector(`.q-step[data-step="${currentStep}"]`).classList.remove("is-active");
  currentStep = n;
  document.querySelector(`.q-step[data-step="${currentStep}"]`).classList.add("is-active");
  renderStep();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStep() {
  progressFill.style.width = (currentStep / TOTAL_STEPS) * 100 + "%";
  stepCount.textContent = `STEP ${currentStep} / ${TOTAL_STEPS}`;
  btnBack.style.visibility = currentStep === 1 ? "hidden" : "visible";

  const isLast = currentStep === TOTAL_STEPS;
  btnNext.style.display = isLast ? "none" : "inline-flex";
}

function flashInvalid(step) {
  const stepEl = document.querySelector(`.q-step[data-step="${step}"]`);
  stepEl.style.animation = "none";
  requestAnimationFrame(() => { stepEl.style.animation = "shake 0.3s ease"; });
}

/* shake keyframes injected once */
const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes shake {0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}`;
document.head.appendChild(styleTag);

function stepIsValid(step) {
  switch (step) {
    case 1: return !!state.goal;
    case 2: return !!state.experience;
    case 3: return !!state.days;
    case 4: return !!state.time;
    case 5: return !!state.equipment;
    case 6: return state.injuries.length > 0;
    case 7: return !!state.age && !!state.gender;
    default: return true;
  }
}

/* ---------- OPTION CARD SELECTION ---------- */
document.querySelectorAll(".options").forEach((group) => {
  const field = group.dataset.field;
  const isMulti = group.dataset.multi === "true";

  group.querySelectorAll(".option-card").forEach((card) => {
    card.addEventListener("click", () => {
      const value = card.dataset.value;

      if (isMulti) {
        if (value === "none") {
          group.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
          card.classList.add("is-selected");
          state[field] = ["none"];
        } else {
          group.querySelector('[data-value="none"]').classList.remove("is-selected");
          card.classList.toggle("is-selected");
          const selected = Array.from(group.querySelectorAll(".option-card.is-selected")).map((c) => c.dataset.value);
          state[field] = selected.filter((v) => v !== "none");
          if (state[field].length === 0) state[field] = [];
        }
      } else {
        group.querySelectorAll(".option-card").forEach((c) => c.classList.remove("is-selected"));
        card.classList.add("is-selected");
        state[field] = value;
        // auto-advance for single-choice steps after a short beat
        setTimeout(() => {
          const stepEl = card.closest(".q-step");
          const stepNum = parseInt(stepEl.dataset.step, 10);
          if (stepNum < TOTAL_STEPS) goToStep(stepNum + 1);
        }, 180);
      }
    });
  });
});

/* ---------- FORM SUBMIT (final step) ---------- */
quizForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.fname = document.getElementById("input-name").value.trim();
  state.email = document.getElementById("input-email").value.trim();

  if (!state.fname || !state.email) return;
  if (state.injuries.length === 0) state.injuries = ["none"];

  submitToMailchimp(state);
  showResult(state);
});

function submitToMailchimp(data) {
  if (MAILCHIMP_ACTION_URL.includes("YOUR-SUBDOMAIN")) {
    console.warn("Mailchimp not configured yet — skipping subscribe. See MAILCHIMP_ACTION_URL in app.js.");
    return;
  }
  const form = document.createElement("form");
  form.action = MAILCHIMP_ACTION_URL;
  form.method = "POST";
  form.target = "mc-hidden-iframe";

  const fields = {
    EMAIL: data.email,
    FNAME: data.fname
  };
  Object.entries(fields).forEach(([key, val]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key; // Mailchimp merge tag name, e.g. EMAIL, FNAME
    input.value = val || "";
    form.appendChild(input);
  });

  let iframe = document.getElementById("mc-hidden-iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.name = "mc-hidden-iframe";
    iframe.id = "mc-hidden-iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

/* =========================================================
   SPLIT GENERATION ENGINE
   ========================================================= */

const GOAL_LABEL = {
  fat_loss: "Fat Loss",
  muscle_gain: "Muscle Building",
  strength: "Strength",
  general: "General Fitness"
};

/* Sets kept low per movement (2 accessory / 3 main, max) — volume comes from
   more exercises, not more sets each. See EXERCISE_COUNT_BY_TIME below. */
const SCHEME_BY_GOAL = {
  fat_loss:     { main: "3 x 8-10", accessory: "2 x 12-15", tempo: "controlled, short rest" },
  muscle_gain:  { main: "3 x 6-10", accessory: "2 x 10-15", tempo: "controlled" },
  strength:     { main: "3 x 3-6",  accessory: "2 x 8-10",  tempo: "explosive, full rest" },
  general:      { main: "3 x 8-12", accessory: "2 x 12-15", tempo: "moderate" }
};

/* With 2 main exercises at 3 sets + the rest at 2 sets, these land close to
   a 17-set session at 60-75 min and scale proportionally either side. */
const EXERCISE_COUNT_BY_TIME = {
  "30_45": 6,
  "45_60": 7,
  "60_75": 8,
  "75_plus": 9
};

/* Exercise pools keyed by [equipment][pattern] */
const POOL = {
  full_gym: {
    squat: ["Barbell Back Squat", "Leg Press", "Hack Squat"],
    hinge: ["Barbell Deadlift", "Romanian Deadlift", "Hip Thrust", "Cable Pull-Through"],
    hpush: ["Barbell Bench Press", "DB Bench Press", "Machine Chest Press"],
    hpull: ["Barbell Row", "Seated Cable Row", "Chest-Supported Row"],
    vpush: ["Overhead Press", "DB Shoulder Press", "Machine Shoulder Press"],
    vpull: ["Lat Pulldown", "Pull-Ups", "Assisted Pull-Up"],
    lunge: ["Walking Lunges", "Bulgarian Split Squat", "Leg Extension"],
    core: ["Cable Crunch", "Hanging Leg Raise", "Plank"],
    arms: ["Cable Curl", "Tricep Pushdown", "EZ Bar Curl", "Overhead Tricep Extension"],
    cond: ["Assault Bike Intervals", "Rower Intervals", "Sled Push"]
  },
  home: {
    squat: ["DB Goblet Squat", "DB Bulgarian Split Squat", "DB Box Squat"],
    hinge: ["DB Romanian Deadlift", "Single-Leg RDL", "DB Hip Thrust", "DB Glute Bridge"],
    hpush: ["DB Floor Press", "Push-Ups"],
    hpull: ["DB Row", "Band Row"],
    vpush: ["DB Shoulder Press", "DB Arnold Press"],
    vpull: ["Band Pulldown", "Pull-Ups (if bar available)"],
    lunge: ["DB Walking Lunge", "Step-Ups"],
    core: ["DB Deadbug", "Plank", "Russian Twist"],
    arms: ["DB Curl", "DB Overhead Tricep Extension"],
    cond: ["Jump Rope Intervals", "DB Complex", "Bodyweight Circuit"]
  },
  bodyweight: {
    squat: ["Bodyweight Squat", "Jump Squat", "Box Squat (Bodyweight)"],
    hinge: ["Single-Leg Glute Bridge", "Hip Thrust"],
    hpush: ["Push-Ups", "Decline Push-Ups"],
    hpull: ["Inverted Row", "Towel Row"],
    vpush: ["Pike Push-Up", "Kneeling Pike Push-Up"],
    vpull: ["Pull-Ups (if available)", "Doorway Row"],
    lunge: ["Walking Lunge", "Bulgarian Split Squat (Bodyweight)"],
    core: ["Plank", "Hollow Hold", "Mountain Climbers"],
    arms: ["Diamond Push-Ups", "Chin-Ups (if bar available)"],
    cond: ["Burpees", "Jump Rope", "Bodyweight HIIT Circuit"]
  }
};

function pick(arr, idx) { return arr[idx % arr.length]; }

/* Primary is picked from `preferredOptions` (may be narrowed for
   experience level); alt is picked from the wider `fullOptions` so a
   deprioritised-but-safe move (e.g. the barbell version) can still show
   up as the listed alternative. Always distinct when possible — alt is
   null only when there's truly nothing else to offer. `usedNames` steers
   the primary away from exercises already used earlier in the same
   session (patterns cycle back around once a session has more exercises
   than the pattern list is long), falling back to a repeat only if every
   option in the pool is already in use. */
function pickPrimaryAndAlt(fullOptions, preferredOptions, idx, usedNames) {
  const fresh = preferredOptions.filter((o) => !usedNames.has(o));
  const primaryPool = fresh.length > 0 ? fresh : preferredOptions;
  const primary = pick(primaryPool, idx);
  const altPool = fullOptions.filter((o) => o !== primary);
  const alt = altPool.length > 0 ? pick(altPool, idx + 1) : null;
  return { primary, alt };
}

const PATTERN_CUE = {
  squat: "Your main lower-body lift for the day — control the descent and drive through the whole foot.",
  hinge: "Load the hips, not the lower back — think ‘push the floor away’ as you stand tall.",
  hpush: "Keep the shoulder blades pinned and drive in a straight line, don't let the elbows flare.",
  hpull: "Row from the shoulder blade first, not just the elbow — squeeze hard at the top.",
  vpush: "Brace the core before you press overhead — no leaning back to finish the rep.",
  vpull: "Pull the elbows down and back, not just in — think ‘chest to the bar’.",
  lunge: "Single-leg work exposes weaknesses fast — go slow and stay balanced before adding load.",
  core: "Quality over quantity here — every rep controlled, not rushed.",
  arms: "Isolation work — this is about the pump, not the number on the bar.",
  cond: "Short and hard — this finishes the session, it isn't another main lift."
};

const REST_TABLE = {
  strength: { main: 180, accessory: 75 },
  muscle_gain: { main: 120, accessory: 60 },
  fat_loss: { main: 90, accessory: 45 },
  general: { main: 100, accessory: 60 }
};
function restSecondsFor(goal, isMain) {
  const g = REST_TABLE[goal] || REST_TABLE.general;
  return isMain ? g.main : g.accessory;
}
function formatRest(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

const INJURY_EXCLUDE_KEYWORDS = {
  lower_back: ["Deadlift", "RDL", "Back Squat"],
  knees: ["Jump Squat", "Bulgarian Split Squat", "Walking Lunge"],
  shoulders: ["Overhead Press", "Pike Push-Up", "Handstand"]
};

/* Free-weight barbell compounds (and a few technically-demanding
   bodyweight moves) carry the steepest learning curve in the gym.
   Under 6 months in, we'd rather put someone on the machine/dumbbell
   version and let the barbell lift surface as the listed alternative —
   not hide it, just not lead with it. */
const BEGINNER_DEPRIORITIZE_KEYWORDS = [
  "Barbell Back Squat",
  "Barbell Deadlift",
  "Romanian Deadlift",
  "RDL",
  "Barbell Bench Press",
  "Barbell Row",
  "Overhead Press",
  "Bulgarian Split Squat",
  "Jump Squat",
  "Pull-Ups",
  "Chin-Ups"
];

function poolForExperience(list, experience) {
  if (experience !== "beginner") return list;
  const friendly = list.filter((name) => !BEGINNER_DEPRIORITIZE_KEYWORDS.some((kw) => name.includes(kw)));
  return friendly.length > 0 ? friendly : list;
}

/* Some patterns are inherently risky for a flagged injury regardless of
   which named exercise gets picked (e.g. any overhead press for a bad
   shoulder) — redirect the whole pattern to a safer one instead of just
   filtering names, so a thin equipment pool can't fall back to the risky move. */
const PATTERN_SUBSTITUTE = {
  shoulders: { vpush: "hpush", vpull: "hpull" },
  knees: { lunge: "squat" }
};

function safePattern(pattern, injuries) {
  for (const injury of injuries) {
    const sub = PATTERN_SUBSTITUTE[injury] && PATTERN_SUBSTITUTE[injury][pattern];
    if (sub) return sub;
  }
  return pattern;
}

/* Remove exercises that conflict with flagged injuries; fall back to the
   full list if filtering would leave nothing to pick from. */
function poolForInjuries(list, injuries) {
  const excluded = injuries
    .filter((i) => i !== "none")
    .flatMap((i) => INJURY_EXCLUDE_KEYWORDS[i] || []);
  if (excluded.length === 0) return list;
  const filtered = list.filter((name) => !excluded.some((kw) => name.includes(kw)));
  return filtered.length > 0 ? filtered : list;
}

/* Build a session from a list of movement patterns */
function buildSession(patterns, equipment, goal, count, injuries, experience) {
  const scheme = SCHEME_BY_GOAL[goal];
  const pool = POOL[equipment];
  const exercises = [];
  const usedNames = new Set();
  let rotate = Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const pattern = safePattern(patterns[i % patterns.length], injuries);
    const safeOptions = poolForInjuries(pool[pattern] || pool.core, injuries);
    const preferredOptions = poolForExperience(safeOptions, experience);
    const { primary, alt } = pickPrimaryAndAlt(safeOptions, preferredOptions, rotate + i, usedNames);
    usedNames.add(primary);
    const isMain = i < 2;
    exercises.push({
      name: primary,
      alt,
      scheme: isMain ? scheme.main : scheme.accessory,
      cue: PATTERN_CUE[pattern] || PATTERN_CUE.core,
      restSeconds: restSecondsFor(goal, isMain),
      isFinisher: false
    });
  }

  if (goal === "fat_loss" && count >= 4) {
    exercises.push({
      name: pick(pool.cond, rotate),
      alt: null,
      scheme: "10-15 min finisher",
      cue: PATTERN_CUE.cond,
      restSeconds: null,
      isFinisher: true
    });
  }

  return exercises;
}

const PATTERNS_FULL_BODY = ["squat", "hpush", "hinge", "hpull", "vpush", "core"];
const PATTERNS_UPPER = ["hpush", "hpull", "vpush", "vpull", "arms", "core"];
const PATTERNS_LOWER = ["squat", "hinge", "lunge", "core", "squat", "hinge"];
const PATTERNS_PUSH = ["hpush", "vpush", "squat", "arms", "core"];
const PATTERNS_PULL = ["hpull", "vpull", "hinge", "arms", "core"];
const PATTERNS_LEGS = ["squat", "hinge", "lunge", "core", "lunge"];

function getSplitPlan(daysNum) {
  switch (daysNum) {
    case 2:
      return {
        name: "Full Body Split",
        days: [
          { title: "Full Body A", patterns: PATTERNS_FULL_BODY },
          { title: "Full Body B", patterns: [...PATTERNS_FULL_BODY].reverse() }
        ]
      };
    case 3:
      return {
        name: "Full Body Split",
        days: [
          { title: "Full Body A", patterns: PATTERNS_FULL_BODY },
          { title: "Full Body B", patterns: [...PATTERNS_FULL_BODY].reverse() },
          { title: "Full Body C", patterns: ["hinge", "hpull", "squat", "vpush", "core"] }
        ]
      };
    case 4:
      return {
        name: "Upper / Lower Split",
        days: [
          { title: "Upper A", patterns: PATTERNS_UPPER },
          { title: "Lower A", patterns: PATTERNS_LOWER },
          { title: "Upper B", patterns: [...PATTERNS_UPPER].reverse() },
          { title: "Lower B", patterns: [...PATTERNS_LOWER].reverse() }
        ]
      };
    case 5:
      return {
        name: "Upper / Lower / Push / Pull / Legs",
        days: [
          { title: "Upper", patterns: PATTERNS_UPPER },
          { title: "Lower", patterns: PATTERNS_LOWER },
          { title: "Push", patterns: PATTERNS_PUSH },
          { title: "Pull", patterns: PATTERNS_PULL },
          { title: "Legs", patterns: PATTERNS_LEGS }
        ]
      };
    case 6:
      return {
        name: "Push / Pull / Legs (x2)",
        days: [
          { title: "Push A", patterns: PATTERNS_PUSH },
          { title: "Pull A", patterns: PATTERNS_PULL },
          { title: "Legs A", patterns: PATTERNS_LEGS },
          { title: "Push B", patterns: [...PATTERNS_PUSH].reverse() },
          { title: "Pull B", patterns: [...PATTERNS_PULL].reverse() },
          { title: "Legs B", patterns: [...PATTERNS_LEGS].reverse() }
        ]
      };
    default:
      return { name: "Full Body Split", days: [{ title: "Full Body A", patterns: PATTERNS_FULL_BODY }] };
  }
}

function buildNotes(data) {
  const notes = [];
  if (data.injuries.includes("lower_back")) {
    notes.push("Lower back flagged — heavy spinal-loading hinges (deadlifts, back squats) have been swapped for hip thrusts and machine-based work. Build a pain-free base before reintroducing them.");
  }
  if (data.injuries.includes("knees")) {
    notes.push("Knees flagged — deep lunge and jump patterns have been reduced in favour of controlled, machine-supported leg work.");
  }
  if (data.injuries.includes("shoulders")) {
    notes.push("Shoulders flagged — go lighter and stop short of pain on any overhead pressing. Swap for landmine or neutral-grip presses if anything pinches.");
  }
  if (data.age === "50_plus") {
    notes.push("Prioritise a longer warm-up and a couple of extra minutes of mobility work before each session — recovery and joint prep matter more as intensity goes up.");
  }
  if (data.experience === "beginner") {
    notes.push("New to training — we've led with machine and dumbbell versions of the main lifts instead of barbell (easier to learn, less to coordinate at once). The barbell version is still listed as your alternative for once you're ready to progress to it.");
    notes.push("Focus every session on technique and control first, weight second — the rep ranges below are a target to build into, not day one.");
  }
  notes.push("This is a starting template, not a diagnosis or medical advice — check with a professional about any pain that doesn't resolve.");
  return notes;
}

function showResult(data) {
  screenQuiz.classList.remove("is-active");
  screenResult.classList.add("is-active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  const plan = getSplitPlan(parseInt(data.days, 10));
  const exCount = EXERCISE_COUNT_BY_TIME[data.time];

  document.getElementById("result-split-name").innerHTML =
    `${data.fname ? data.fname.toUpperCase() + "'S " : ""}<span class="accent">${plan.name.toUpperCase()}</span>`;

  document.getElementById("result-summary").textContent =
    `Built for ${GOAL_LABEL[data.goal]} at ${data.days} days a week, ${sessionLenLabel(data.time)} per session, using ${equipLabel(data.equipment)}.`;

  const notes = buildNotes(data);
  const notesBox = document.getElementById("result-notes-box");
  const notesList = document.getElementById("result-notes");
  notesList.innerHTML = "";
  notes.forEach((n) => {
    const li = document.createElement("li");
    li.textContent = n;
    notesList.appendChild(li);
  });
  notesBox.style.display = "block";

  const daysWrap = document.getElementById("result-days");
  daysWrap.innerHTML = "";
  const logStore = getLogStore();

  plan.days.forEach((day, i) => {
    const exercises = buildSession(day.patterns, data.equipment, data.goal, exCount, data.injuries, data.experience);
    const totalSets = exercises
      .filter((ex) => !ex.isFinisher)
      .reduce((sum, ex) => sum + (parseInt(ex.scheme, 10) || 0), 0);

    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <button type="button" class="day-card-head">
        <span class="day-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="day-title">${day.title}</span>
        <span class="day-sub">${totalSets} SETS</span>
        <span class="chevron day-chevron">&#9660;</span>
      </button>
      <div class="day-body">
        ${exercises.map((ex, j) => renderExerciseCard(ex, j, logStore)).join("")}
      </div>
    `;
    daysWrap.appendChild(card);
  });

  // rest day cards to fill out a 7-day week visually
  const restCount = 7 - plan.days.length;
  if (restCount > 0) {
    const rest = document.createElement("div");
    rest.className = "day-card";
    rest.innerHTML = `
      <button type="button" class="day-card-head">
        <span class="day-num">${String(plan.days.length + 1).padStart(2, "0")}&ndash;07</span>
        <span class="day-title">Rest / Active Recovery</span>
        <span class="chevron day-chevron">&#9660;</span>
      </button>
      <div class="day-body">
        <div class="rest-day">Walk, stretch, or light cardio. Recovery is where the training actually pays off.</div>
      </div>
    `;
    daysWrap.appendChild(rest);
  }
}

function sessionLenLabel(v) {
  return { "30_45": "30–45 min", "45_60": "45–60 min", "60_75": "60–75 min", "75_plus": "75+ min" }[v];
}
function equipLabel(v) {
  return { full_gym: "a full gym", home: "a home setup", bodyweight: "bodyweight only" }[v];
}

/* =========================================================
   EXERCISE CARD RENDERING + INTERACTIONS
   ========================================================= */

const LOG_KEY = "jmf_split_log_v1";

function getLogStore() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function renderExerciseCard(ex, index, logStore) {
  const expanded = index === 0;
  const logged = logStore[ex.name];

  const altBlock = ex.alt
    ? `
      <p class="alt-label">USE, IN ORDER OF PREFERENCE</p>
      <div class="alt-row">
        <span class="alt-badge primary">1</span>
        <span class="alt-name primary">${ex.name}</span>
      </div>
      <div class="alt-row">
        <span class="alt-badge">2</span>
        <span class="alt-name">${ex.alt}</span>
      </div>`
    : "";

  const restBlock = !ex.isFinisher
    ? `
      <div class="rest-row">
        <span class="rest-label">REST&nbsp;<span class="rest-value">${formatRest(ex.restSeconds)}</span></span>
        <button type="button" class="btn btn-rest" data-seconds="${ex.restSeconds}">START REST TIMER</button>
      </div>`
    : "";

  const logBlock = !ex.isFinisher
    ? `
      <div class="log-box" data-exercise="${ex.name.replace(/"/g, "&quot;")}">
        <p class="log-label">LOG YOUR BEST SET</p>
        <div class="log-fields">
          <label class="log-field"><span>REPS</span><input type="number" inputmode="numeric" class="log-reps" placeholder="10" value="${logged ? logged.reps : ""}"></label>
          <label class="log-field"><span>LOAD</span><input type="text" class="log-load" placeholder="kg" value="${logged ? logged.load : ""}"></label>
          <button type="button" class="btn btn-primary btn-save-log">SAVE</button>
        </div>
      </div>`
    : "";

  return `
    <div class="ex-card ${expanded ? "is-expanded" : ""}">
      <button type="button" class="ex-row-head">
        <span class="ex-index">${index + 1}</span>
        <span class="ex-name">${ex.name}</span>
        <span class="ex-scheme">${ex.scheme}</span>
        <span class="chevron">${expanded ? "&#9660;" : "&#9656;"}</span>
      </button>
      <div class="ex-detail">
        <p class="ex-cue">${ex.cue}</p>
        ${altBlock}
        ${restBlock}
        ${logBlock}
      </div>
    </div>
  `;
}

function startRestTimer(btn) {
  if (btn.dataset.running === "1") return;
  let seconds = parseInt(btn.dataset.seconds, 10);
  btn.dataset.running = "1";
  btn.classList.add("is-running");
  btn.textContent = formatRest(seconds);
  const interval = setInterval(() => {
    seconds -= 1;
    if (seconds <= 0) {
      clearInterval(interval);
      btn.textContent = "START REST TIMER";
      btn.classList.remove("is-running");
      btn.dataset.running = "0";
    } else {
      btn.textContent = formatRest(seconds);
    }
  }, 1000);
}

function saveLog(btn) {
  const box = btn.closest(".log-box");
  const exerciseName = box.dataset.exercise;
  const reps = box.querySelector(".log-reps").value;
  const load = box.querySelector(".log-load").value;

  const store = getLogStore();
  store[exerciseName] = { reps, load, savedAt: Date.now() };
  localStorage.setItem(LOG_KEY, JSON.stringify(store));

  const original = btn.textContent;
  btn.textContent = "SAVED";
  setTimeout(() => { btn.textContent = original; }, 1400);
}

resultDaysEl.addEventListener("click", (e) => {
  const dayHead = e.target.closest(".day-card-head");
  if (dayHead) {
    const body = dayHead.nextElementSibling;
    body.classList.toggle("is-collapsed");
    dayHead.querySelector(".day-chevron").innerHTML = body.classList.contains("is-collapsed") ? "&#9656;" : "&#9660;";
    return;
  }

  const exHead = e.target.closest(".ex-row-head");
  if (exHead) {
    const card = exHead.closest(".ex-card");
    card.classList.toggle("is-expanded");
    exHead.querySelector(".chevron").innerHTML = card.classList.contains("is-expanded") ? "&#9660;" : "&#9656;";
    return;
  }

  const restBtn = e.target.closest(".btn-rest");
  if (restBtn) {
    startRestTimer(restBtn);
    return;
  }

  const saveBtn = e.target.closest(".btn-save-log");
  if (saveBtn) {
    saveLog(saveBtn);
  }
});
