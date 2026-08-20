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

btnApply.href = APPLY_URL;

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
    FNAME: data.fname,
    GOAL: data.goal,
    EXPERIEN: data.experience,
    DAYSWK: data.days,
    EQUIP: data.equipment,
    INJURIES: data.injuries.join(", "),
    AGE: data.age,
    GENDER: data.gender
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

const SCHEME_BY_GOAL = {
  fat_loss:     { main: "3-4 x 8-10", accessory: "3 x 12-15", tempo: "controlled, short rest" },
  muscle_gain:  { main: "4 x 6-10",  accessory: "3-4 x 10-15", tempo: "controlled" },
  strength:     { main: "4-5 x 3-6", accessory: "3 x 8-10",   tempo: "explosive, full rest" },
  general:      { main: "3 x 8-12",  accessory: "3 x 12-15",  tempo: "moderate" }
};

const EXERCISE_COUNT_BY_TIME = {
  "30_45": 4,
  "45_60": 5,
  "60_75": 6,
  "75_plus": 7
};

/* Exercise pools keyed by [equipment][pattern] */
const POOL = {
  full_gym: {
    squat: ["Barbell Back Squat", "Leg Press", "Hack Squat"],
    hinge: ["Barbell Deadlift", "Romanian Deadlift", "Hip Thrust"],
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
    squat: ["DB Goblet Squat", "DB Bulgarian Split Squat"],
    hinge: ["DB Romanian Deadlift", "Single-Leg RDL", "DB Hip Thrust"],
    hpush: ["DB Floor Press", "Push-Ups"],
    hpull: ["DB Row", "Band Row"],
    vpush: ["DB Shoulder Press"],
    vpull: ["Band Pulldown", "Pull-Ups (if bar available)"],
    lunge: ["DB Walking Lunge", "Step-Ups"],
    core: ["DB Deadbug", "Plank", "Russian Twist"],
    arms: ["DB Curl", "DB Overhead Tricep Extension"],
    cond: ["Jump Rope Intervals", "DB Complex", "Bodyweight Circuit"]
  },
  bodyweight: {
    squat: ["Bodyweight Squat", "Jump Squat"],
    hinge: ["Single-Leg Glute Bridge", "Hip Thrust"],
    hpush: ["Push-Ups", "Decline Push-Ups"],
    hpull: ["Inverted Row", "Towel Row"],
    vpush: ["Pike Push-Up"],
    vpull: ["Pull-Ups (if available)", "Doorway Row"],
    lunge: ["Walking Lunge", "Bulgarian Split Squat (Bodyweight)"],
    core: ["Plank", "Hollow Hold", "Mountain Climbers"],
    arms: ["Diamond Push-Ups", "Chin-Ups (if bar available)"],
    cond: ["Burpees", "Jump Rope", "Bodyweight HIIT Circuit"]
  }
};

function pick(arr, idx) { return arr[idx % arr.length]; }

const INJURY_EXCLUDE_KEYWORDS = {
  lower_back: ["Deadlift", "Back Squat"],
  knees: ["Jump Squat", "Bulgarian Split Squat", "Walking Lunge"],
  shoulders: ["Overhead Press", "Pike Push-Up", "Handstand"]
};

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
function buildSession(patterns, equipment, goal, count, injuries) {
  const scheme = SCHEME_BY_GOAL[goal];
  const pool = POOL[equipment];
  const exercises = [];
  let rotate = Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const pattern = safePattern(patterns[i % patterns.length], injuries);
    const options = poolForInjuries(pool[pattern] || pool.core, injuries);
    const name = pick(options, rotate + i);
    const isMain = i < 2;
    exercises.push({
      name,
      scheme: isMain ? scheme.main : scheme.accessory
    });
  }

  if (goal === "fat_loss" && count >= 4) {
    exercises.push({ name: pick(pool.cond, rotate), scheme: "10-15 min finisher" });
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
    notes.push("You're new to structured training — focus every session on technique first, weight second. The scheme below is a target to build into, not day one.");
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
  plan.days.forEach((day, i) => {
    const exercises = buildSession(day.patterns, data.equipment, data.goal, exCount, data.injuries);
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <div class="day-card-head">
        <span class="day-num">${String(i + 1).padStart(2, "0")}</span>
        <span class="day-title">${day.title}</span>
        <span class="day-sub">${exercises.length} EXERCISES</span>
      </div>
      <div class="day-body">
        ${exercises.map((ex) => `
          <div class="ex-row">
            <span class="ex-name">${ex.name}</span>
            <span class="ex-scheme">${ex.scheme}</span>
          </div>`).join("")}
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
      <div class="day-card-head">
        <span class="day-num">${String(plan.days.length + 1).padStart(2, "0")}&ndash;07</span>
        <span class="day-title">Rest / Active Recovery</span>
      </div>
      <div class="rest-day">Walk, stretch, or light cardio. Recovery is where the training actually pays off.</div>
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
