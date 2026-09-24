/**
 * Nathan — Adaptive Weekly Workout Coach
 * Week 1 anchor: Wed Sep 23 2026 (got off 8am MT, 48/96 fire)
 * Equipment rule: only well-known moves using his own gear (no ab wheel, cable, band, landmine, kettlebell, med ball, slider, sled, etc.)
 * Pillars: physique, hunting hike, ultra 100k volume, personal PT test marks, beast core
 */

(function () {
  "use strict";

  const WEEK_ID = "2026-W1-sep23";
  const WEEK_START = new Date(2026, 8, 23); // Wed Sep 23 2026 local
  const STORAGE_KEY = "nc-adaptive-coach-v1";
  const BENCH_KEY = "nc-adaptive-coach-benchmarks-v1";

  /** Benchmark metric catalog — higherBetter false = lower time is better */
  const BENCH_METRICS = [
    {
      id: "back_squat",
      group: "strength",
      name: "Back Squat",
      unit: "lb",
      input: "number",
      higherBetter: true,
      baseline: 315,
      goal: 405,
      seedNote: "Baseline",
    },
    {
      id: "bench",
      group: "strength",
      name: "Bench Press",
      unit: "lb",
      input: "number",
      higherBetter: true,
      baseline: 275,
      goal: 315,
      seedNote: "Baseline",
    },
    {
      id: "deadlift",
      group: "strength",
      name: "Deadlift",
      unit: "lb",
      input: "number",
      higherBetter: true,
      baseline: 345,
      goal: 405,
      seedNote: "Baseline",
    },
    {
      id: "longest_easy",
      group: "run",
      name: "Longest Easy Run",
      unit: "mi",
      input: "number",
      higherBetter: true,
      baseline: 10,
      goal: 25,
      seedNote: "Baseline continuous · ultra primary",
    },
    {
      id: "mile",
      group: "run",
      name: "Mile (rare check)",
      unit: "time",
      input: "time",
      higherBetter: false,
      baseline: 450, // 7:30
      goal: 420, // stretch 7:00
      seedNote: "Baseline ~7:30 · occasional TEST only",
    },
    {
      id: "fire_195",
      group: "run",
      name: "1.95 mi (rare check)",
      unit: "time",
      input: "time",
      higherBetter: false,
      baseline: null,
      goal: 720, // 12:00
      seedNote: null,
    },
    {
      id: "other_run",
      group: "run",
      name: "Other Distance",
      unit: "note+value",
      input: "number",
      higherBetter: true,
      baseline: null,
      goal: null,
      seedNote: null,
      freeform: true,
    },
    {
      id: "hr_pushups",
      group: "pt",
      name: "HR Push-Ups / 2 min",
      unit: "reps",
      input: "number",
      higherBetter: true,
      baseline: 40,
      goal: 70,
      seedNote: "Baseline",
    },
    {
      id: "dh_pullups",
      group: "pt",
      name: "Dead-Hang Pull-Ups",
      unit: "reps",
      input: "number",
      higherBetter: true,
      baseline: 21,
      goal: 30,
      seedNote: "Baseline",
    },
    {
      id: "plank",
      group: "pt",
      name: "Plank",
      unit: "sec",
      input: "number",
      higherBetter: true,
      baseline: 180,
      goal: 180,
      seedNote: "Maxed 3:00",
      maxed: true,
    },
  ];

  const BENCH_GROUPS = [
    { id: "strength", title: "Strength 1RMs", blurb: "Log your best single (tested or estimated 1RM) for back squat, bench, and deadlift. Active workouts use these to suggest working weights." },
    { id: "run", title: "Running marks", blurb: "Longest easy run comes first. Mile and 1.95 checks are rare check-ins only." },
    { id: "pt", title: "Personal PT marks", blurb: "Your own push-up, pull-up, and plank targets — checked occasionally, not every week." },
  ];

  const DAYS = [
    { key: "wed", label: "Wed", full: "Wednesday", offset: 0 },
    { key: "thu", label: "Thu", full: "Thursday", offset: 1 },
    { key: "fri", label: "Fri", full: "Friday", offset: 2 },
    { key: "sat", label: "Sat", full: "Saturday", offset: 3 },
    { key: "sun", label: "Sun", full: "Sunday", offset: 4 },
    { key: "mon", label: "Mon", full: "Monday", offset: 5 },
    { key: "tue", label: "Tue", full: "Tuesday", offset: 6 },
  ];

  const SLOT_META = {
    strength_a: {
      id: "strength_a",
      name: "Strength — squat and press",
      short: "Squat & press",
      blurb: "Heavy squat and press work for strength and an athletic look, plus core that protects your low back.",
    },
    strength_b: {
      id: "strength_b",
      name: "Strength — hinge and pull",
      short: "Hinge & pull",
      blurb: "Deadlift and rowing strength, personal pull-up and push-up practice, plus core that fights twisting.",
    },
    speed_run: {
      id: "speed_run",
      name: "Easy run",
      short: "Easy run",
      blurb: "An easy run you can talk through the whole way. It builds Black Canyon fitness and is never a speed day.",
    },
    easy_hike: {
      id: "easy_hike",
      name: "Hills and hike legs",
      short: "Hills & hike",
      blurb: "Incline, trail, or Hyper Pro work for ultra climbs and multi-day hunting legs.",
    },
    long_run: {
      id: "long_run",
      name: "Long easy run",
      short: "Long easy",
      blurb: "Your main ultra session: a long, easy run at a pace where you can talk in full sentences.",
    },
    recovery: {
      id: "recovery",
      name: "Active recovery",
      short: "Stretch & move",
      blurb: "Deep stretching and light movement so strength and ultra days stay sharp.",
    },
    flex: {
      id: "flex",
      name: "Flex day",
      short: "Catch-up or core",
      blurb: "Catch up a missed strength flavor, add another easy run, or do a focused core session.",
    },
  };

  const SLOT_ORDER = [
    "strength_a",
    "strength_b",
    "speed_run",
    "easy_hike",
    "long_run",
    "recovery",
    "flex",
  ];


  /** Plain-English effort from RPE codes (shown to users instead of raw RPE). */
  function plainEffort(rpe) {
    const s = String(rpe || "").trim();
    if (s === "2" || s === "2–3" || s === "2-3") return "Easy recovery";
    if (s === "3") return "Easy — conversational";
    if (s === "3–4" || s === "3-4") return "Easy — conversational";
    if (s === "4–5" || s === "4-5") return "Steady effort";
    if (s === "5") return "Steady effort";
    if (s === "5–6" || s === "5-6") return "Moderate work";
    if (s === "6–7" || s === "6-7") return "Solid effort";
    if (s === "7") return "Hard effort";
    if (s === "7–8" || s === "7-8") return "Hard effort";
    if (s === "9–10" || s === "9-10") return "Max effort — test day";
    if (s === "10") return "All-out";
    return "Effort " + s;
  }

  function plainDuration(min) {
    return "About " + min + " minutes";
  }

  function plainLocation(loc) {
    const s = String(loc || "");
    if (/Fire Station/i.test(s)) return "Fire station";
    if (/Trail/i.test(s) && /Outdoor/i.test(s)) return "Trail / outdoors";
    if (/Outdoor/i.test(s) && /Wahoo/i.test(s)) return "Outside or treadmill";
    if (/Wahoo/i.test(s) && /Hyper/i.test(s)) return "Home gym";
    if (/Wahoo/i.test(s) && /Outdoor/i.test(s)) return "Outside or treadmill";
    if (/Wahoo/i.test(s)) return "Treadmill / home";
    if (/Outdoor/i.test(s)) return "Outdoors";
    if (/Home/i.test(s)) return "Home gym";
    return s;
  }

  function plainLength(lc) {
    if (lc === "short") return "Quick session";
    if (lc === "medium") return "Full session";
    if (lc === "long") return "Long session";
    return lc || "";
  }

  function slotCardLabel(meta, isTest) {
    const label = meta.name;
    return (isTest ? "Test day · " : "") + label;
  }

  function sessionMetaLine(workout) {
    return (
      plainDuration(workout.durationMin) +
      " · " +
      plainEffort(workout.rpe) +
      " · " +
      plainLocation(workout.location)
    );
  }


  /** Current 1RM from Progress (best entry), else catalog baseline. */
  function getOneRM(metricId) {
    // Prefer editable working 1RM (Progress editor); fall back to best logged / baseline.
    if (typeof getWorking1RM === "function") {
      const working = getWorking1RM(metricId);
      if (working != null) return working;
    }
    const metric = getMetric(metricId);
    if (!metric || metric.unit !== "lb") return null;
    const best = bestEntry(metric);
    if (best && best.value != null) return Number(best.value);
    if (metric.baseline != null) return Number(metric.baseline);
    return null;
  }

  /** Map an exercise name to a Progress strength metric id. */
  function inferLiftMetricId(name) {
    const n = String(name || "").toLowerCase();
    // Mobility / openers / holds never map to a barbell 1RM
    if (/opener|thoracic|mobility|stretch|hold|couch|pigeon/.test(n)) return null;
    if (/front\s*squat|back\s*squat|\bsquat\b/.test(n) && !/split|goblet|hold|pulse|jump/.test(n)) return "back_squat";
    // Barbell bench family only — skip DB/incline DB (no reliable barbell-% conversion)
    if (/(incline\s*)?(db|dumbbell)/.test(n)) return null;
    if (/bench|floor\s*press/.test(n) && !/dip/.test(n)) return "bench";
    if (/deadlift|\brdl\b|romanian/.test(n)) return "deadlift";
    return null;
  }

  /** Round pounds to nearest 5 lb (barbell plate friendly). */
  function roundTo5(lb) {
    if (lb == null || Number.isNaN(Number(lb))) return null;
    return Math.round(Number(lb) / 5) * 5;
  }


  /** True for actual max/test attempts — not "% of your 1RM" training prescriptions. */
  function looksLikeMaxAttempt(name, detail) {
    const n = String(name || "");
    const d = String(detail || "");
    const blob = n + " " + d;
    if (/opener\s*\/\s*max|—\s*max|best single|all-out|max set|max reps|time trial|(^|[^a-z])tt\b/i.test(blob)) {
      return true;
    }
    if (/\b1rm\b/i.test(n)) return true;
    if (/\b(1rm or best|best single\s*\/\s*1rm|to (a )?(true or estimated )?1rm|ramp to.*?1rm|build up to a heavy single)\b/i.test(d)) {
      return true;
    }
    return false;
  }


  /**
   * Parse a working % of 1RM from detail/note.
   * Prefers explicit "~75–80%" / "75%" ranges; else estimates from RPE for main lifts.
   */
  function parsePercentOf1RM(detail, note) {
    const blob = String(detail || "") + " " + String(note || "");
    // Explicit percent range or single
    let m = blob.match(/~?\s*(\d{2,3})\s*[–\-]\s*(\d{2,3})\s*%/);
    if (m) {
      const lo = parseInt(m[1], 10);
      const hi = parseInt(m[2], 10);
      return { pct: Math.round((lo + hi) / 2), lo: lo, hi: hi, source: "explicit" };
    }
    m = blob.match(/~?\s*(\d{2,3})\s*%/);
    if (m) {
      const p = parseInt(m[1], 10);
      return { pct: p, lo: p, hi: p, source: "explicit" };
    }
    // RPE → rough % for auto-suggest when no % written
    m = blob.match(/RPE\s*(\d(?:[–\-]\d)?)/i);
    if (m) {
      const r = m[1].replace("-", "–");
      const map = {
        "6": 70,
        "6–7": 72,
        "7": 75,
        "7–8": 80,
        "8": 85,
        "8–9": 90,
        "9": 92,
        "9–10": 95,
      };
      if (map[r] != null) return { pct: map[r], lo: map[r], hi: map[r], source: "rpe" };
    }
    return null;
  }

  /** Suggested working weight from Progress 1RM × %, rounded to 5 lb. */
  function suggestWorkingWeight(item) {
    if (!item || looksLikeMaxAttempt(item.name, item.detail)) {
      return null;
    }
    // Core, holds, carries, and bodyweight moves never pull a barbell 1RM
    if (item.noLoad || item.bw || item.log === "hold" || item.log === "carry") return null;
    const metricId = (item.liftId && LIFT_1RM_META && LIFT_1RM_META[item.liftId])
      ? item.liftId
      : (typeof inferLiftId === "function" ? inferLiftId(item) : null) || inferLiftMetricId(item.name);
    if (!metricId) return null;
    const rm = getOneRM(metricId);
    if (!rm) return null;
    let parsed = null;
    if (item.pct1rm != null && Number(item.pct1rm) > 0) {
      const p = Number(item.pct1rm);
      parsed = { pct: p, lo: p, hi: p, source: "explicit" };
    } else {
      parsed = parsePercentOf1RM(item.detail, item.note);
    }
    if (!parsed && typeof inferPct1rm === "function") {
      const p = inferPct1rm(item, metricId);
      if (p != null) parsed = { pct: p, lo: p, hi: p, source: "default" };
    }
    if (!parsed) return null;
    const weight = roundTo5(rm * (parsed.pct / 100));
    const metric = getMetric(metricId);
    return {
      weight: weight,
      pct: parsed.pct,
      lo: parsed.lo,
      hi: parsed.hi,
      rm: rm,
      metricId: metricId,
      metricName: metric ? metric.name : metricId,
      source: parsed.source,
      adj: 1,
    };
  }

  /** Plain-English prescription line (no raw RPE codes). */
  function plainDetail(item) {
    let d = String(item.detail || "");
    // Replace RPE snippets with effort words
    d = d.replace(/\/?\s*RPE\s*(\d(?:[–\-]\d)?)/gi, function (_, rpe) {
      return " · " + plainEffort(rpe);
    });
    d = d.replace(/\bRPE\s*(\d(?:[–\-]\d)?)/gi, function (_, rpe) {
      return plainEffort(rpe);
    });
    // Only rewrite compact "@ 75%" forms — never remangle "at about N% of your 1RM"
    if (!/of your .*1RM/i.test(d) && !/at about \d/i.test(d)) {
      d = d.replace(/@\s*~?(\d{2,3})\s*[–\-]\s*(\d{2,3})\s*%/g, "at about $1–$2% of your 1RM");
      d = d.replace(/@\s*~?(\d{2,3})\s*%/g, "at about $1% of your 1RM");
    }
    d = d.replace(/\s*·\s*·\s*/g, " · ");
    d = d.replace(/^\s*·\s*/, "");
    return d.trim();
  }

  function plainPercentCoach(suggest) {
    if (!suggest) return "";
    const short =
      suggest.metricId === "back_squat"
        ? "squat"
        : suggest.metricId === "bench"
          ? "bench"
          : suggest.metricId === "deadlift"
            ? "deadlift"
            : String(suggest.metricName || "lift").toLowerCase();
    let line =
      suggest.weight +
      " lb (about " +
      Math.round(suggest.pct) +
      "% of your " +
      suggest.rm +
      " " +
      short +
      ")";
    if (suggest.source === "rpe") {
      line += " — estimated from the prescribed effort when no exact % was listed.";
    }
    return line;
  }


  /**
   * Freak Athlete Hyper Pro (standard model, NOT the Hyper Pro X) — moves that need only the base machine.
   * Sources: freakathlete.co Hyper Pro FAQ ("With the Hyper Pro only"), how-to-use page, and Freak Athlete workout blogs.
   * GHD sit-ups / glute-ham raises (GHD Attachment) and leg extensions / curls (Leg Developer) are add-ons, so they are not programmed.
   * Full research: HYPER_PRO_EXERCISES.md (not published).
   */
  const HP_NOTES = {
    reverseHyper: "Set the Freak Athlete Hyper Pro in GHD mode (or 90-degree back extension mode), then lie face down across the pad with your hips at its edge, hold the footplate handles, and let your legs hang straight down behind you. Squeeze your glutes to lift both legs until they line up with your body, pause for one second, and lower slowly with no swinging. Stop when your legs reach level; kicking higher only arches your low back. Body weight only, smooth and easy to moderate effort. It should feel like a warm pump in your glutes and low back, never a pinch.",
    nordic: "Set the Hyper Pro in Nordic mode at an incline you can control, around 30 to 45 degrees to start (a higher angle is easier). Kneel on the pad with your ankles locked between the rollers and your feet flat on the footplate. Squeeze your glutes and keep a straight line from knees to shoulders, then lower yourself as slowly as you can, aiming for 3 to 5 seconds. When you can't hold it any longer, catch yourself with your hands and push back up to the start. End each set 1 to 2 reps before your form breaks. When every rep of every set feels controlled, drop the incline one notch the next week.",
    reverseNordic: "Set the Hyper Pro in Nordic mode (Freak Athlete's beginner workout uses the 20-degree setting). Kneel on the pad with your ankles locked in the rollers, just like a Nordic curl, and sit tall. Squeeze your glutes so your hips stay straight, then lean your whole body back from the knees as far as you can control, pause for a second, and pull yourself back up with your thighs. Start with a shallow lean and go a little deeper each week. Moderate effort; stop if you feel sharp pain in the knee. Keep your ribs down so your low back does not arch.",
    hipThrust: "Set the Hyper Pro to hip thrust mode: flip the post at the base up to vertical and move the top ankle roller onto it so it becomes your back rest. Sit on the floor with your upper back across the roller, feet flat about shoulder-width apart, and a padded barbell or one heavy dumbbell across your hips. Tuck your chin, drive through your heels, and squeeze your glutes until your body is flat from knees to shoulders, pause for two seconds, then lower under control. The rep ends when your hips are straight, so do not arch your low back to go higher. Pick a load you could lift 2 to 3 more times at the end of each set, and log the weight you used.",
    sideRaise: "Set the Hyper Pro in 45-degree back extension mode and close the gap between the two front pads. Turn sideways so the side of your hip rests on the pads and your feet are locked in the rollers, one foot in front of the other. Cross your arms on your chest, slowly bend sideways toward the floor, then lift back up until your body is a straight line. Keep your top hip stacked over your bottom hip and do not twist. Do all the reps on one side, then switch. Start with a small range and go deeper as it gets comfortable; hold a light dumbbell at your chest once 12 reps per side feels easy, and log that weight.",
  };
  function hyperProReverseHyper(sets, reps, lead, name) {
    return { name: name || "Hyper Pro Reverse Hyper", detail: sets + " sets of " + reps + " reps", note: (lead ? lead + " " : "") + HP_NOTES.reverseHyper, sets: sets, reps: reps, log: "reps", bw: true };
  }
  function hyperProNordicCurl(sets, reps) {
    return { name: "Hyper Pro Nordic Curl (incline, lowering with control)", detail: sets + " sets of " + reps + " reps", note: HP_NOTES.nordic, sets: sets, reps: reps, log: "reps", bw: true };
  }
  function hyperProReverseNordic(sets, reps) {
    return { name: "Hyper Pro Reverse Nordic", detail: sets + " sets of " + reps + " reps", note: HP_NOTES.reverseNordic, sets: sets, reps: reps, log: "reps", bw: true };
  }
  function hyperProHipThrust(sets, reps) {
    return { name: "Hyper Pro Hip Thrust", detail: sets + " sets of " + reps + " reps — stop 2–3 reps before failure", note: HP_NOTES.hipThrust, sets: sets, reps: reps, log: "reps", noLoad: true };
  }
  function hyperProSideRaise(sets, reps) {
    return { name: "Hyper Pro Side Raise (QL Raise)", detail: sets + " sets of " + reps + " reps per side", note: HP_NOTES.sideRaise, sets: sets, reps: reps, log: "reps", noLoad: true };
  }

  /** Concrete workout library — keyed by slot. Multiple options per slot. */
  const WORKOUTS = {
    strength_a: [
      {
        id: "sa-back-squat-press",
        title: "Back squat and bench press",
        durationMin: 75,
        lengthClass: "medium",
        location: "Home · Power rack",
        rpe: "7–8",
        summary: "About 75 minutes of heavy back squats and bench press for strength and an athletic look, then core work that protects your low back for ultra and hunting miles.",
        warmup: [
          "5 minutes of easy walking or jogging on the treadmill",
          "Hip circles and upper-back rotations for 2 minutes",
          "Empty-bar back squat × 10, then ramp sets",
        ],
        blocks: [
          {
            name: "Squat work",
            items: [
              { name: "Back Squat", detail: "5 sets of 5 reps — about 78% of your 1RM — stop 2–3 reps before failure", note: "Hard effort. Use your Progress back-squat max (baseline 315 lb). Quality depth — no pause needed.", liftId: "back_squat", pct1rm: 78, sets: 5, reps: 5 },
              { name: "Front Squat", detail: "3 sets of 5 reps — about 62% of your 1RM", note: "Solid effort. Lighter positional volume after back squat — front squat loads run lighter than back squat.", liftId: "back_squat", pct1rm: 62, sets: 3, reps: 5 },
            ],
          },
          {
            name: "Pressing and physique extras",
            items: [
              { name: "Barbell Bench Press", detail: "4 sets of 6 reps — about 75% of your 1RM — stop 2–3 reps before failure", note: "Hard effort. Uses your Progress bench max (baseline 275 lb). Balanced push for PT marks and an athletic look.", liftId: "bench", pct1rm: 75, sets: 4, reps: 6 },
              { name: "DB Overhead Press (seated FID)", detail: "3 sets of 8 reps", note: "Shoulder cap / athletic look. 25–70 lb DBs." },
              { name: "DB Lateral Raises", detail: "3 sets of 12 reps", note: "Physique: delts. Light–moderate, no swing." },
              { name: "Bicep Curl Bar — EZ Curls", detail: "3 sets of 10 reps", note: "Arms accessory — doesn't interfere with ultra." },
            ],
          },
          {
            name: "Beast core — brace and anti-extension",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "4 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 4, reps: 8, log: "reps", bw: true },
              { name: "Dead Bug", detail: "3 sets of 8 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 3, reps: 8, log: "reps", bw: true },
              { name: "Weighted Front Plank", detail: "3 sets of 45 seconds", note: "Get on your forearms and toes with a 25 or 45 lb plate on your upper back (easiest to set it on while your knees are down). Hold a straight line from head to heels, squeeze your glutes, and pull your elbows toward your toes so it feels hard. Keep your hips level with no sagging or piking. Log the plate weight and the seconds you held.", sets: 3, reps: 45, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: ["Program hard; flag any low-back flare and swap to lighter front squats plus extra dead bugs and planks.", "Hydrate; session ~75 min."],
      },
      {
        id: "sa-short-squat-core",
        title: "Front squat triples and core",
        durationMin: 35,
        lengthClass: "short",
        location: "Home · Rack",
        rpe: "7",
        summary: "A tight 30–35 minute session: front squat triples, pressing, and dense core. Fits a compressed day while still hitting squat strength and low-back armor.",
        warmup: ["2 minutes of easy treadmill walking", "Bodyweight squat × 15", "Easy push-ups × 10"],
        blocks: [
          {
            name: "Main strength",
            items: [
              { name: "Front Squat", detail: "6 sets of 3 reps — about 72% of your 1RM", note: "Hard effort. Crisp triples. Belt optional.", liftId: "back_squat", pct1rm: 72, sets: 6, reps: 3 },
              { name: "Close-Grip Bench or Floor Press", detail: "4 sets of 6 reps — about 75% of your 1RM — stop 2–3 reps before failure", note: "Triceps + lockout for push-up capacity.", liftId: "bench", pct1rm: 75, sets: 4, reps: 6 },
            ],
          },
          {
            name: "Core circuit (3 rounds, moving from one exercise to the next)",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "3 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 3, reps: 8, log: "reps", bw: true },
              { name: "Hanging Knee Raise", detail: "3 sets of 10 reps", note: "Hang from the pull-up bar with a full grip. Without swinging, pull your knees up toward your chest and curl your hips up at the top, then lower slowly. Pause at the bottom of each rep so you are not using momentum.", sets: 3, reps: 10, log: "reps", bw: true },
              { name: "Side Plank", detail: "3 sets of 30 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 30, log: "hold", noLoad: true },
              { name: "Suitcase Carry (one dumbbell)", detail: "3 sets of 40 seconds per side", note: "Hold one heavy dumbbell at your side (start around 70 to 100 lb) and walk tall for the set time, then switch hands. Do not lean toward or away from the weight: keep your shoulders level and your ribs down. Stop the set early if you start to tip. Log the dumbbell weight and the seconds you walked.", sets: 3, reps: 40, log: "carry", noLoad: true },
            ],
          },
          {
            name: "Quick physique finish (optional)",
            items: [
              { name: "DB Lateral Raises", detail: "2 sets of 15 reps", note: "Athletic shoulders without long session tax." },
              { name: "Bicep Curl Bar", detail: "2 sets of 12 reps", note: "Physique pillar micro-dose." },
            ],
          },
        ],
        notes: ["Short option for on-shift or compressed days.", "No goblet squats — front squat only here."],
      },
      {
        id: "sa-long-volume",
        title: "Squat volume and heavy carries",
        durationMin: 90,
        lengthClass: "long",
        location: "Home · Full gym",
        rpe: "7–8",
        summary: "A fuller ~90 minute day — squat volume toward your 405 goal, upper-body work for physique, Hyper Pro hip thrusts for your glutes, and heavy carries for hunting and core strength.",
        warmup: ["5–8 min easy tread", "Empty-bar front squat × 8", "Light dumbbell rear-delt raises × 15"],
        blocks: [
          {
            name: "Squat volume",
            items: [
              { name: "Back Squat", detail: "4 sets of 8 reps — about 68% of your 1RM", note: "Solid effort. Hypertrophy volume toward the 405 goal. Controlled tempo.", liftId: "back_squat", pct1rm: 68, sets: 4, reps: 8 },
              { name: "Bulgarian Split Squat (rear foot elevated)", detail: "3 sets of 8 reps per leg", note: "Rest the top of your back foot on the FID bench or the Hyper Pro hip thrust roller and hold a dumbbell in each hand. Drop your back knee straight down toward the floor, keep your torso tall and your front heel planted, and drive up through your front foot. Moderate to hard effort: finish each set with about 2 reps left. Log the dumbbell weight in each hand.", sets: 3, reps: 8, log: "reps", noLoad: true },
            ],
          },
          {
            name: "Press, posterior chain, and physique",
            items: [
              { name: "Incline DB Bench (FID)", detail: "4 sets of 8 reps — stop 2–3 reps before failure", note: "Upper chest / athletic shelf. Choose DBs you can finish clean — not a % of barbell bench.", sets: 4, reps: 8 },
              hyperProHipThrust(3, 10),
              { name: "DB Lateral + Front Raise combo", detail: "3 sets of 12 reps", note: "Shoulder look without frying recovery." },
              { name: "Bicep Curl Bar — EZ Curls", detail: "3 sets of 10 reps", note: "Arms accessory after main work." },
            ],
          },
          {
            name: "Beast core and heavy carries",
            items: [
              { name: "Farmer Carry (two dumbbells)", detail: "4 sets of 45 seconds", note: "Hold a heavy dumbbell in each hand (start around 70 to 100 lb each) and walk with short, steady steps. Stand tall, keep your shoulders back, and brace your abs like you are about to get bumped. End the set if your grip or posture breaks. Log the weight per hand and the seconds you walked.", sets: 4, reps: 45, log: "carry", noLoad: true },
              { name: "Single-Arm Dumbbell Row (anti-rotation)", detail: "3 sets of 10 reps per side", note: "Put one hand and one knee on the bench and row a heavy dumbbell up to your hip. Keep your shoulders and hips square to the floor and do not let your torso twist as the weight comes up. Fighting that twist is the core work. Log the dumbbell weight.", sets: 3, reps: 10, log: "reps", noLoad: true },
              { name: "Hanging Leg Raise (toes-to-bar when ready)", detail: "3 sets of 8 reps", note: "Hang from the pull-up bar and raise your legs as high as you can control, keeping them as straight as you can. Lower slowly with no swinging. Once you can do 10 clean reps to hip height, start bringing your toes all the way to the bar. Bend your knees if your form breaks.", sets: 3, reps: 8, log: "reps", bw: true },
            ],
          },
        ],
        notes: ["Long option when you have the full 90.", "Hyper Pro = Freak Athlete Hyper Pro."],
      },
    ],

    strength_b: [
      {
        id: "sb-hinge-pt",
        title: "Deadlift, pull-ups, and push-ups",
        durationMin: 80,
        lengthClass: "medium",
        location: "Home · Rack + bar",
        rpe: "7–8",
        summary: "About 80 minutes: deadlift toward 405, personal pull-up and push-up practice, then anti-twist core so your back stays durable for long days on your feet.",
        warmup: [
          "5 min easy tread",
          "Bodyweight hip hinges × 10, then glute bridges × 12",
          "Deadlift ramp: bar → 135 → 225 → work",
        ],
        blocks: [
          {
            name: "Hinge strength",
            items: [
              { name: "Conventional Deadlift", detail: "5 sets of 3 reps — about 78% of your 1RM — stop 2–3 reps before failure", note: "Hard effort. Uses your Progress deadlift max (baseline 345 lb → goal 405). Keep low back neutral; brace hard — don't coddle.", liftId: "deadlift", pct1rm: 78, sets: 5, reps: 3 },
              { name: "Romanian Deadlift (RDL)", detail: "3 sets of 6 reps — about 55% of your 1RM", note: "Hamstring and hinge pattern. Moderate load — leave plenty in the tank after the main pull.", liftId: "deadlift", pct1rm: 55, sets: 3, reps: 6 },
            ],
          },
          {
            name: "Pull-ups, push-ups, and physique",
            items: [
              { name: "Dead-Hang Pull-Ups", detail: "5 sets → total toward 30", note: "Personal target 30. Baseline 21. Full dead hang each rep." },
              { name: "Bent-Over Barbell Row or Chest-Supported", detail: "4 sets of 6 reps", note: "Upper-back thickness · balanced pull for physique + posture." },
              { name: "HR Push-Ups (2-min style practice)", detail: "3 sets — as many clean reps as you can in 45 to 60 seconds", note: "Personal target 70 in 2 minutes (now about 40). Practice density, not a job fitness block. Log the reps you got each set.", sets: 3, bw: true },
              { name: "Rear-Delt Dumbbell Flyes", detail: "3 sets of 15 reps", note: "Bend forward with a flat back and raise light dumbbells out to the sides, squeezing your shoulder blades together. Shoulder health and an athletic upper-back look.", sets: 3, reps: 15 },
              { name: "Bicep Curl Bar — Hammer or EZ Curls", detail: "3 sets of 10 reps", note: "Arms accessory; keep easy on grip before heavy carries." },
            ],
          },
          {
            name: "Beast core — anti-rotation and hanging work",
            items: [
              { name: "Russian Twist with a Dumbbell", detail: "3 sets of 10 reps per side", note: "Sit with your knees bent and heels on the floor, lean back a little with a straight back, and hold one dumbbell (25 to 40 lb) at your chest. Slowly turn your shoulders to one side, then the other, moving with your ribs, not just your arms. Keep it slow and controlled, and stop if your low back complains. Log the dumbbell weight.", sets: 3, reps: 10, log: "reps", noLoad: true },
              { name: "Suitcase Carry (one dumbbell)", detail: "3 sets of 40 seconds per side", note: "Hold one heavy dumbbell at your side (start around 70 to 100 lb) and walk tall for the set time, then switch hands. Do not lean toward or away from the weight: keep your shoulders level and your ribs down. Stop the set early if you start to tip. Log the dumbbell weight and the seconds you walked.", sets: 3, reps: 40, log: "carry", noLoad: true },
              { name: "Hanging Leg Raise (toes-to-bar when ready)", detail: "4 sets of 8 reps", note: "Hang from the pull-up bar and raise your legs as high as you can control, keeping them as straight as you can. Lower slowly with no swinging. Once you can do 10 clean reps to hip height, start bringing your toes all the way to the bar. Bend your knees if your form breaks.", sets: 4, reps: 8, log: "reps", bw: true },
            ],
          },
        ],
        notes: ["Strength B is the PT maxes day.", "If low back nags on DL, cut volume and emphasize RDL + Hyper Pro next session."],
      },
      {
        id: "sb-short-pt-core",
        title: "Pull-ups, push-ups, and core",
        durationMin: 30,
        lengthClass: "short",
        location: "Home or Fire Station",
        rpe: "7–8",
        summary: "Thirty minutes of pull-up and push-up practice plus hanging core. Works at home or the station and still counts as your hinge/pull strength day.",
        warmup: ["Arm circles, then 2 dead hangs from the bar for 20 seconds each", "10 easy push-ups"],
        blocks: [
          {
            name: "Pull-ups and push-ups",
            items: [
              { name: "Dead-Hang Pull-Up Ladder", detail: "1,2,3,4,5… until fail", note: "Rest :45–:60 between rungs. Log total reps." },
              { name: "Push-Ups Every Minute", detail: "12 sets of 8 reps — start a new set at the top of each minute", note: "Leave 2 reps in the tank each minute and rest for whatever is left of the minute. This builds your 2-minute push-up capacity.", sets: 12, reps: 8, bw: true },
              { name: "Bicep Curl Bar — Strict Curls", detail: "3 sets of 10 reps", note: "Elbow health / arm finish." },
            ],
          },
          {
            name: "Core circuit",
            items: [
              { name: "Hanging Knee Raise", detail: "3 sets of 10 reps", note: "Hang from the pull-up bar with a full grip. Without swinging, pull your knees up toward your chest and curl your hips up at the top, then lower slowly. Pause at the bottom of each rep so you are not using momentum.", sets: 3, reps: 10, log: "reps", bw: true },
              { name: "Side Plank", detail: "3 sets of 40 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 40, log: "hold", noLoad: true },
              { name: "Dead Bug", detail: "3 sets of 10 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 3, reps: 10, log: "reps", bw: true },
            ],
          },
        ],
        notes: ["Tag: Fire Station friendly if bar available.", "Short option — still counts as Strength B."],
      },
      {
        id: "sb-hyper-row",
        title: "Hyper Pro hinge and row volume",
        durationMin: 70,
        lengthClass: "medium",
        location: "Home · Hyper Pro + rack",
        rpe: "7",
        summary: "About 70 minutes of Hyper Pro reverse hypers and Nordic curls, Romanian deadlifts, and heavy rows — builds the posterior chain for ultra climbs and hunting without a max deadlift day.",
        warmup: ["Easy tread 5 min", "Hyper Pro back extensions with bodyweight × 15", "Light dumbbell rear-delt raises × 15"],
        blocks: [
          {
            name: "Posterior chain",
            items: [
              hyperProReverseHyper(3, 12, "Warms up your glutes and low back before the hinge work."),
              hyperProNordicCurl(3, 5),
              { name: "Barbell RDL", detail: "4 sets of 6 reps — about 55% of your 1RM", note: "Hinge strength without max deadlift fatigue.", liftId: "deadlift", pct1rm: 55, sets: 4, reps: 6 },
              { name: "Walking Lunges (DB)", detail: "3 sets of 10 reps", note: "Hiking legs accessory." },
            ],
          },
          {
            name: "Pulling strength",
            items: [
              { name: "Pull-Ups (weighted if >10 strict)", detail: "4× max − 2", note: "Start each rep from a dead hang. Once you can do more than 10 strict reps, hold a dumbbell between your feet." },
              { name: "Single-Arm DB Row", detail: "4 sets of 8 reps", note: "Heavy — 70–100+ lb." },
            ],
          },
          {
            name: "Core finish",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "4 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 4, reps: 8, log: "reps", bw: true },
              { name: "Side Plank", detail: "3 sets of 40 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 40, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: ["Equipment: Freak Athlete Hyper Pro."],
      },
    ],

    speed_run: [
      {
        id: "sp-easy-volume",
        title: "Easy conversational run",
        durationMin: 50,
        lengthClass: "medium",
        location: "Outdoor or Wahoo",
        rpe: "3–4",
        summary: "Ultra-first: steady easy miles. Talk in full sentences. Speed comes with volume — no intervals today.",
        warmup: ["3–5 min walk into jog"],
        blocks: [
          {
            name: "Easy aerobic miles",
            items: [
              { name: "40–50 min continuous easy", detail: "About 11:00–12:00 per mile · easy — conversational", note: "Talk in full sentences the whole way. Walk brief hills if needed. Black Canyon base." },
            ],
          },
          {
            name: "Brief post-run extras",
            items: [
              { name: "Dead Bug", detail: "2 sets of 8 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 2, reps: 8, log: "reps", bw: true },
              { name: "Side Plank", detail: "2 sets of 30 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 2, reps: 30, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: [
          "This is an easy run, not speed work.",
          "Daily running stays easy and conversational; all-out fire-pace checks are rare TEST days only.",
        ],
      },
      {
        id: "sp-short-easy",
        title: "Short easy conversational run",
        durationMin: 45,
        lengthClass: "short",
        location: "Outdoor / Trail or Wahoo",
        rpe: "3",
        summary: "A shorter easy run of 35 to 45 minutes. Keep it relaxed enough to talk in full sentences the whole time.",
        warmup: ["Easy start — no strides required"],
        blocks: [
          {
            name: "Easy miles",
            items: [
              { name: "35–45 min very easy", detail: "Easy — conversational · nasal breathing if you can", note: "Keep your ego at home. Time on your feet matters more than pace." },
              { name: "Optional last 10 min hike/walk", detail: "If legs are heavy", note: "Walking still counts toward your time on feet." },
            ],
          },
          {
            name: "Easy flush work",
            items: [
              hyperProReverseHyper(2, 12, "Only if you're home. Easy blood-flow sets after the run.", "Easy Hyper Pro Reverse Hyper (if home)"),
            ],
          },
        ],
        notes: [
          "A good pick on a busy day or when your legs feel heavy.",
          "No intervals or tempo work. Easy volume builds the engine.",
        ],
      },
      {
        id: "sp-trail-volume",
        title: "Easy trail run",
        durationMin: 55,
        lengthClass: "medium",
        location: "Outdoor / Trail",
        rpe: "3–4",
        summary: "Soft-surface easy miles toward the 100k-feet year. Hike the steep bits, keep every minute conversational, and stack time-on-feet.",
        warmup: ["2 min mobility at trailhead"],
        blocks: [
          {
            name: "Easy trail volume",
            items: [
              { name: "45–55 min easy trail jog/hike", detail: "Easy — conversational", note: "Ultra specificity. Power-hike climbs; easy jog flats and downs." },
            ],
          },
          {
            name: "Core finish",
            items: [
              { name: "Dead Bug", detail: "2 sets of 8 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 2, reps: 8, log: "reps", bw: true },
              { name: "Front Plank", detail: "2 sets of 60 seconds", note: "Get on your forearms and toes with your elbows under your shoulders. Hold a straight line from head to heels, squeeze your glutes, and brace your abs so it feels hard the whole time. Keep your hips level with no sagging or piking. Log the seconds you held.", sets: 2, reps: 60, log: "hold", bw: true },
            ],
          },
        ],
        notes: ["Tag: Outdoor / Trail.", "Counts as your easy run for the week."],
      },
    ],

    easy_hike: [
      {
        id: "eh-hyper-hills",
        title: "Hyper Pro and easy hills",
        durationMin: 55,
        lengthClass: "medium",
        location: "Home · Hyper Pro + Wahoo",
        rpe: "5–6",
        summary: "Incline time-on-feet plus Hyper Pro back and knee work (reverse hypers, back extensions, and reverse Nordics for downhill durability) for Black Canyon climbs and multi-day elk or deer hunts. Steady effort you can sustain.",
        warmup: ["5 min flat easy walk/jog"],
        blocks: [
          {
            name: "Aerobic time on feet",
            items: [
              { name: "Wahoo Incline Walk/Jog", detail: "Easy incline walk or jog for about 30 minutes — conversational", note: "Conversational. Builds Black Canyon climbing + hunt fitness together." },
            ],
          },
          {
            name: "Hyper Pro leg work",
            items: [
              hyperProReverseHyper(3, 15),
              { name: "Hyper Pro Back Extension", detail: "3 sets of 12 reps", note: "Set the pad just below your hips on the Freak Athlete Hyper Pro. Lower your chest with a flat back, then squeeze your glutes to come up until your body is in a straight line. Do not over-arch at the top. Hold a plate at your chest once 15 reps feels easy.", sets: 3, reps: 12, log: "reps", noLoad: true },
              hyperProReverseNordic(2, 8),
            ],
          },
          {
            name: "Core support",
            items: [
              { name: "Side Plank", detail: "3 sets of 30 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 30, log: "hold", noLoad: true },
              { name: "Dead Bug", detail: "3 sets of 8 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 3, reps: 8, log: "reps", bw: true },
            ],
          },
        ],
        notes: ["Hyper Pro = Freak Athlete Hyper Pro.", "Easy intent — volume and hills, not speed.", "Supports ultra + hunting pillars."],
      },
      {
        id: "eh-trail-easy",
        title: "Easy trail with light pack",
        durationMin: 60,
        lengthClass: "medium",
        location: "Outdoor / Trail",
        rpe: "4–5",
        summary: "Ultra feet + hunt sim: easy trail with light pack — time-on-feet, hips, patience under load.",
        warmup: ["Mobility 3 min at trailhead"],
        blocks: [
          {
            name: "Trail time",
            items: [
              { name: "45–55 min easy trail", detail: "Steady effort · hike the steep bits", note: "Optional 10–20 lb pack (build toward hunt days). Nasal breathing when possible." },
            ],
          },
          {
            name: "Quick trailhead core",
            items: [
              { name: "Front Plank", detail: "2 sets of 45 seconds", note: "Get on your forearms and toes with your elbows under your shoulders. Hold a straight line from head to heels, squeeze your glutes, and brace your abs so it feels hard the whole time. Keep your hips level with no sagging or piking. Log the seconds you held.", sets: 2, reps: 45, log: "hold", bw: true },
              { name: "Side Plank", detail: "2 sets of 30 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 2, reps: 30, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: ["Tag: Outdoor / Trail.", "Black Canyon volume + hunting crossover — still conversational."],
      },
      {
        id: "eh-short-hyper",
        title: "Short Hyper Pro hills",
        durationMin: 30,
        lengthClass: "short",
        location: "Home",
        rpe: "5",
        summary: "A quick 30 minutes: incline walk, Hyper Pro reverse hypers and reverse Nordics, and carries. Climbing legs, downhill knees, and hunt base when the day is short.",
        warmup: ["2 min march in place"],
        blocks: [
          {
            name: "Hills and Hyper Pro",
            items: [
              { name: "Incline treadmill walk", detail: "Brisk incline treadmill walk for about 12 minutes" },
              hyperProReverseHyper(3, 12),
              hyperProReverseNordic(2, 6),
              { name: "Farmer Carry (two dumbbells)", detail: "3 sets of 45 seconds", note: "Hold a heavy dumbbell in each hand (start around 70 to 100 lb each) and walk with short, steady steps. Stand tall, keep your shoulders back, and brace your abs like you are about to get bumped. End the set if your grip or posture breaks. Log the weight per hand and the seconds you walked.", sets: 3, reps: 45, log: "carry", noLoad: true },
            ],
          },
        ],
        notes: ["Short aerobic + hike-legs option."],
      },
    ],

    long_run: [
      {
        id: "lr-10mi",
        title: "Long easy run — about 10 miles",
        durationMin: 90,
        lengthClass: "long",
        location: "Outdoor or Wahoo",
        rpe: "3–4",
        summary: "Your main ultra session: about 10 continuous easy miles at a pace where you can talk in full sentences. This is Black Canyon volume first.",
        warmup: ["5 min walk + very easy first mile"],
        blocks: [
          {
            name: "Ultra long easy run",
            items: [
              { name: "9–11 miles easy continuous", detail: "About 11:00 per mile average · easy — conversational", note: "Baseline 10 miles around 11:00/mi. Full sentences. Walk brief hills. Fuel if over 75 minutes." },
            ],
          },
          {
            name: "Post-run core (do this)",
            items: [
              { name: "Dead Bug", detail: "3 sets of 8 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 3, reps: 8, log: "reps", bw: true },
              { name: "Side Plank", detail: "2 sets of 40 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 2, reps: 40, log: "hold", noLoad: true },
              { name: "Glute Bridge", detail: "2 sets of 12 reps", note: "Lie on your back with your feet flat and close to your hips. Push through your heels and squeeze your glutes to lift your hips until your body is straight from knees to shoulders, pause for one second, then lower.", sets: 2, reps: 12, log: "reps", bw: true },
            ],
          },
        ],
        notes: [
          "This is the main run of the week — not a speed day.",
          "Mile and fire-pace marks improve from stacking easy volume; use rare TEST days only to check.",
          "Outdoor preferred; Wahoo OK with fan.",
        ],
      },
      {
        id: "lr-progressive",
        title: "Long easy run by time",
        durationMin: 85,
        lengthClass: "long",
        location: "Wahoo or Outdoor",
        rpe: "3–4",
        summary: "Build the long run by time — 80–90 minutes easy and conversational. Progress by lasting longer, not by running faster.",
        warmup: ["Walk 3–5 min"],
        blocks: [
          {
            name: "Time on feet",
            items: [
              { name: "80–90 min continuous easy", detail: "Easy — conversational · stay aerobic", note: "Can mix jog and hike on trails. Add about 5–10 minutes in future weeks when this feels easy." },
            ],
          },
          {
            name: "Core finish",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "3 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 3, reps: 8, log: "reps", bw: true },
              { name: "Side Plank", detail: "2 sets of 40 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 2, reps: 40, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: ["Ultra progressive long — duration climbs over the block.", "No tempo finishers."],
      },
      {
        id: "lr-trail-long",
        title: "Long easy trail run",
        durationMin: 90,
        lengthClass: "long",
        location: "Outdoor / Trail",
        rpe: "3–4",
        summary: "A long easy trail outing for 100k specificity: hike the climbs, jog the flats. Volume first.",
        warmup: ["Easy start from trailhead"],
        blocks: [
          {
            name: "Long trail easy",
            items: [
              { name: "75–95 min easy trail", detail: "Easy — conversational", note: "Power-hike the climbs. Soft surface. Optional light pack later in the block." },
              hyperProReverseHyper(3, 12, "Only if you're home. Easy flush after the run.", "Post-run Hyper Pro Reverse Hyper (if home)"),
            ],
          },
        ],
        notes: ["Black Canyon & hunting feet.", "Tag: Outdoor / Trail."],
      },
      {
        id: "lr-short-bridge",
        title: "Easy hour run",
        durationMin: 60,
        lengthClass: "medium",
        location: "Outdoor / Tread",
        rpe: "3–4",
        summary: "Shorter long-run option when the week is already stacked — still easy volume, still fully conversational.",
        warmup: ["Easy start"],
        blocks: [
          {
            name: "Easy volume",
            items: [
              { name: "60 min easy", detail: "~11:00–12:00/mi", note: "Do not race. Keep for recovery after night shift / heavy strength." },
              hyperProReverseHyper(3, 12, "Only if you're home. Easy flush after the run.", "Post-run Hyper Pro Reverse Hyper (if home)"),
            ],
          },
        ],
        notes: ["Bridge option — still ultra-easy intent."],
      },
    ],
    recovery: [
      {
        id: "rec-hardcore",
        title: "Deep stretch and light movement",
        durationMin: 40,
        lengthClass: "short",
        location: "Home",
        rpe: "2–3",
        summary: "Required weekly recovery: deep stretching, breathing, and light movement. Not a couch day — it keeps strength and ultra days sharp.",
        warmup: ["5 minutes of easy walking"],
        blocks: [
          {
            name: "Mobility flow — rotate and breathe",
            items: [
              { name: "Lunge Stretch with a Twist", detail: "2 sets of 5 reps per side", note: "Step into a long lunge and put both hands on the floor inside your front foot. Rotate and reach the arm on the front-leg side up toward the ceiling, hold for two slow breaths, then switch sides. Deep but controlled.", sets: 2, reps: 5, log: "reps", bw: true },
              { name: "Kneeling Hip Flexor Stretch", detail: "2 sets of 90 seconds per side", note: "Kneel with your back foot up against a wall or the couch and your front foot flat. Squeeze the glute of the back leg and tuck your hips under until you feel a stretch in the front of that hip. Breathe slowly and stay tall.", sets: 2, reps: 90, log: "hold", bw: true },
              { name: "Pigeon Stretch", detail: "2 sets of 60 seconds per side", note: "From your hands and knees, bring one knee forward behind your wrist and slide the other leg straight back. Lower your hips and chest until you feel a stretch in the outside of the front hip. Breathe slowly and ease off if your knee complains.", sets: 2, reps: 60, log: "hold", bw: true },
              { name: "Upper-Back Stretch on the Bench", detail: "2 sets of 8 slow reps", note: "Kneel in front of the FID bench with your elbows on the pad and hands together. Sit your hips back and let your chest sink toward the floor, hold for a breath, and come back up. Bodyweight only.", sets: 2, reps: 8, log: "reps", bw: true },
              { name: "Hamstring Stretch and Deep Squat Hold", detail: "2 sets of 60 seconds", note: "Spend 30 seconds on a standing toe-reach hamstring stretch, then sink into a deep bodyweight squat and hold it for 30 seconds with your chest up. Hold a rack upright for balance if needed. No weight.", sets: 2, reps: 60, log: "hold", bw: true },
            ],
          },
          {
            name: "Light movement and soft core",
            items: [
              hyperProReverseHyper(2, 15, "Recovery pace: slow and easy, just for blood flow.", "Easy Hyper Pro Reverse Hyper"),
              { name: "Cat-Cow and Easy Dead Bugs", detail: "2 sets of 8 reps", note: "On your hands and knees, slowly round your back up and then let it sag, 8 times. Then roll onto your back and do 8 easy, slow dead bugs. Gentle, just to keep the core pattern alive.", sets: 2, reps: 8, log: "reps", bw: true },
              { name: "Nasal breathing walk", detail: "8–10 min", note: "Downshift nervous system." },
            ],
          },
        ],
        notes: ["Required slot — do not skip the week.", "If flared low back: lean into breath + hips, skip deep end-range that aggravates."],
      },
      {
        id: "rec-station",
        title: "Station stretch circuit",
        durationMin: 30,
        lengthClass: "short",
        location: "Fire Station",
        rpe: "2",
        summary: "A 30-minute stretch circuit you can do at the house or station so the recovery slot still gets done.",
        warmup: ["March in place 2 min"],
        blocks: [
          {
            name: "Mobility circuit (2–3 rounds)",
            items: [
              { name: "Hip flexor stretch", detail: "60s/side" },
              { name: "Doorway pec stretch", detail: "45s/side" },
              { name: "Deep squat hold (heels elevated OK)", detail: "60s", note: "Bodyweight only." },
              { name: "Thread-the-Needle Upper-Back Stretch", detail: "5 per side", note: "On your hands and knees, slide one arm under your body along the floor until your shoulder and cheek rest down, hold for a breath, then reach that arm up to the ceiling. Switch sides." },
              { name: "Side Plank (easy)", detail: "20 seconds per side", note: "Prop up on your forearm with hips lifted in a straight line. Easy activation, not a max effort." },
              { name: "Easy walk hallway laps", detail: "3 min" },
            ],
          },
        ],
        notes: ["Tag: Fire Station.", "Still fulfills Active Recovery required slot."],
      },
    ],

    flex: [
      {
        id: "fx-core-density",
        title: "Beast core density",
        durationMin: 35,
        lengthClass: "short",
        location: "Home · Full kit",
        rpe: "7",
        summary: "A focused 35-minute core session to protect your low back: barbell rollouts and weighted planks, heavy suitcase carries, side planks, and Hyper Pro side raises, then hanging leg work and Hyper Pro reverse hypers. Your plain plank is maxed, so this adds load and range instead.",
        warmup: ["3 minutes of easy treadmill walking", "Cat-cow × 8, then 5 slow dead bugs per side to practice bracing"],
        blocks: [
          {
            name: "Anti-extension core",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "5 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 5, reps: 8, log: "reps", bw: true },
              { name: "Weighted Front Plank", detail: "4 sets of 45 seconds", note: "Get on your forearms and toes with a 25 or 45 lb plate on your upper back (easiest to set it on while your knees are down). Hold a straight line from head to heels, squeeze your glutes, and pull your elbows toward your toes so it feels hard. Keep your hips level with no sagging or piking. Log the plate weight and the seconds you held.", sets: 4, reps: 45, log: "hold", noLoad: true },
              { name: "Dead Bug (holding a light dumbbell)", detail: "3 sets of 8 reps per side", note: "Lie on your back holding a 25 lb dumbbell straight over your chest, knees bent over your hips. Press your low back flat into the floor, then slowly straighten one leg toward the floor while you breathe out, and bring it back. Alternate legs. If your low back lifts off the floor, shorten the reach. Log the dumbbell weight.", sets: 3, reps: 8, log: "reps", noLoad: true },
            ],
          },
          {
            name: "Anti-twist and side core",
            items: [
              { name: "Suitcase Carry (one dumbbell)", detail: "4 sets of 40 seconds per side", note: "Hold one heavy dumbbell at your side (start around 70 to 100 lb) and walk tall for the set time, then switch hands. Do not lean toward or away from the weight: keep your shoulders level and your ribs down. Stop the set early if you start to tip. Log the dumbbell weight and the seconds you walked.", sets: 4, reps: 40, log: "carry", noLoad: true },
              { name: "Side Plank", detail: "3 sets of 45 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 45, log: "hold", noLoad: true },
              hyperProSideRaise(3, 10),
            ],
          },
          {
            name: "Hanging and posterior core",
            items: [
              { name: "Hanging Knee Raise to Toes-to-Bar", detail: "5 sets of 6 reps", note: "Hang from the pull-up bar. Start with strict knee raises, move to straight-leg raises when those feel easy, and work toward touching your toes to the bar. Every rep is slow and controlled with no kipping or swinging. Use the hardest version you can do cleanly for every rep.", sets: 5, reps: 6, log: "reps", bw: true },
              hyperProReverseHyper(3, 12),
            ],
          },
        ],
        notes: ["This is the weekly core density option.", "Push these hard with clean form. A strong core is your best insurance for your low back."],
      },
      {
        id: "fx-second-aerobic",
        title: "Extra easy run or incline walk",
        durationMin: 45,
        lengthClass: "short",
        location: "Outdoor or Wahoo",
        rpe: "3–4",
        summary: "Use the flex day for extra easy miles or an incline walk. It adds easy aerobic time without adding stress.",
        warmup: ["None needed — start easy"],
        blocks: [
          {
            name: "Easy aerobic",
            items: [
              { name: "40–50 min very easy jog or incline walk", detail: "Easy — conversational", note: "Conversational or nasal. Ultra volume stack — not a quality day." },
              { name: "Dead Bug and Side Plank", detail: "2 rounds", note: "Each round: 8 slow dead bugs per side with your low back pressed into the floor, then a 30-second side plank on each side." },
            ],
          },
        ],
        notes: ["Use it for extra easy volume, catch-up miles, or gentle recovery aerobic work.", "Speed comes with volume."],
      },
      {
        id: "fx-catchup-strength",
        title: "Catch-up strength circuit",
        durationMin: 50,
        lengthClass: "medium",
        location: "Home",
        rpe: "6–7",
        summary: "A lighter catch-up circuit of squat, hinge, pull-ups, push-ups, and core if you missed a strength flavor earlier in the week.",
        warmup: ["5 min easy", "Empty bar squats × 10"],
        blocks: [
          {
            name: "Strength catch-up circuit (4 rounds)",
            items: [
              { name: "Front Squat", detail: "4 rounds × 6 reps at about 60% of your back-squat 1RM", note: "Easy–solid effort. Not a max day — catch-up flavor only.", liftId: "back_squat", pct1rm: 60, sets: 4, reps: 6 },
              { name: "RDL", detail: "4 rounds × 6 reps at about 65% of your deadlift 1RM", note: "Easy–solid hinge volume for catch-up.", liftId: "deadlift", pct1rm: 65, sets: 4, reps: 6 },
              { name: "Pull-Ups", detail: "max − 2" },
              { name: "Push-Ups", detail: "12–20" },
              { name: "Barbell Rollout (from the knees)", detail: "4 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 4, reps: 8, log: "reps", bw: true },
              { name: "Farmer Carry (two dumbbells)", detail: "4 sets of 40 seconds", note: "Hold a heavy dumbbell in each hand (start around 70 to 100 lb each) and walk with short, steady steps. Stand tall, keep your shoulders back, and brace your abs like you are about to get bumped. End the set if your grip or posture breaks. Log the weight per hand and the seconds you walked.", sets: 4, reps: 40, log: "carry", noLoad: true },
            ],
          },
        ],
        notes: ["Does not replace Strength A/B if those are still open — prefer logging those first.", "No goblet squats."],
      },
    ],
  };


  /**
   * Occasional Test / PR sessions — NOT required weekly slots.
   * Offered sparsely (about every 2–4 weeks) among daily options.
   * Fulfills the mapped slot when selected; prompts result → Progress auto-log.
   */
  const TEST_WORKOUTS = [
    {
      id: "test-bs-1rm",
      slotId: "strength_a",
      metricId: "back_squat",
      title: "Test day · Back squat max",
      durationMin: 60,
      lengthClass: "medium",
      location: "Home · Power rack",
      rpe: "9–10",
      isTest: true,
      summary: "Occasional back-squat max: warm up, then build to a true or estimated 1RM. Log the top single in Progress after you finish.",
      warmup: [
        "5 min easy tread + hip openers",
        "Empty bar × 10, then progressive squat warm-ups",
      ],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Back Squat", detail: "Bar × 10", note: "Groove pattern." },
            { name: "Back Squat", detail: "~50% × 5", note: "Baseline ref ~315." },
            { name: "Back Squat", detail: "~65% × 3", note: "" },
            { name: "Back Squat", detail: "~75% × 2", note: "" },
            { name: "Back Squat", detail: "~85% × 1", note: "" },
            { name: "Back Squat", detail: "~90–93% × 1", note: "If crisp, take another single." },
            { name: "Back Squat — Opener / Max", detail: "1RM or best single", note: "Stop one clean miss early. Goal track: 405." },
          ],
        },
        {
          name: "Light core — keep it brief",
          items: [
            { name: "Dead Bug", detail: "2 sets of 6 reps per side", note: "Lie on your back with your arms pointing at the ceiling and your knees bent over your hips. Press your low back flat into the floor, then slowly lower the opposite arm and leg toward the floor while you breathe out. Come back and switch sides. If your low back lifts off the floor, shorten the reach.", sets: 2, reps: 6, log: "reps", bw: true },
            { name: "Front Plank", detail: "2 sets of 45 seconds", note: "Get on your forearms and toes with your elbows under your shoulders. Hold a straight line from head to heels, squeeze your glutes, and brace your abs so it feels hard the whole time. Keep your hips level with no sagging or piking. Log the seconds you held.", sets: 2, reps: 45, log: "hold", bw: true },
          ],
        },
      ],
      notes: [
        "TEST day — not required every week. Appears occasionally in options.",
        "After you log this session you’ll enter the result into Progress.",
        "No goblet squats.",
      ],
    },
    {
      id: "test-bench-1rm",
      slotId: "strength_a",
      metricId: "bench",
      title: "Test day · Bench max",
      durationMin: 55,
      lengthClass: "medium",
      location: "Home · FID + rack",
      rpe: "9–10",
      isTest: true,
      summary: "Occasional bench max: progressive singles to a heavy single or 1RM. You’ll be prompted to log it in Progress when you finish.",
      warmup: ["Easy push-ups × 10", "Empty bar bench × 10", "Ramp sets"],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Bench Press", detail: "Bar × 10 → 50% × 5 → 65% × 3", note: "Baseline ~275 → goal 315." },
            { name: "Bench Press", detail: "75% × 2 → 85% × 1 → 90% × 1", note: "" },
            { name: "Bench Press — Max", detail: "Best single / 1RM", note: "Spotter or safeties. Clean lockout only." },
          ],
        },
        {
          name: "Optional back-off sets",
          items: [
            { name: "Close-Grip Bench", detail: "2 sets of 6 reps at about 70% of your bench 1RM", note: "Only if joints feel happy after the max.", liftId: "bench", pct1rm: 70, sets: 2, reps: 6 },
          ],
        },
      ],
      notes: ["Occasional TEST — fulfills Strength A when chosen.", "Result prompts into Progress."],
    },
    {
      id: "test-dl-1rm",
      slotId: "strength_b",
      metricId: "deadlift",
      title: "Test day · Deadlift max",
      durationMin: 55,
      lengthClass: "medium",
      location: "Home · Rack / platform",
      rpe: "9–10",
      isTest: true,
      summary: "Occasional deadlift max toward the 405 goal. Keep jump sizes conservative, walk out clean singles, and log the pull in Progress.",
      warmup: ["5 min easy", "Bodyweight hip hinges × 10", "Deadlift ramp sets from the empty bar"],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Conventional Deadlift", detail: "Bar × 5 → 50% × 3 → 65% × 2", note: "Baseline ~345." },
            { name: "Conventional Deadlift", detail: "75% × 1 → 85% × 1 → 90% × 1", note: "Reset every rep." },
            { name: "Deadlift — Max", detail: "Best single / 1RM", note: "Brace hard. Flag low-back flare — don’t grind ugly misses." },
          ],
        },
        {
          name: "Posterior flush",
          items: [
            hyperProReverseHyper(2, 12, "Easy flush after the heavy singles, body weight only."),
          ],
        },
      ],
      notes: ["Occasional TEST — fulfills Strength B.", "Hyper Pro = Freak Athlete Hyper Pro."],
    },
    {
      id: "test-pt-combo",
      slotId: "strength_b",
      metricId: "hr_pushups",
      secondaryMetrics: ["dh_pullups"],
      title: "Test day · Personal PT maxes",
      durationMin: 35,
      lengthClass: "short",
      location: "Home or Fire Station",
      rpe: "9–10",
      isTest: true,
      summary: "Rare personal check: max HR push-ups / 2 min + max dead-hang pull-ups. Not weekly job fitness.",
      warmup: ["2 min easy move", "Dead hang from the bar, 2 × 20 seconds", "10 easy push-ups"],
      blocks: [
        {
          name: "Personal PT max checks",
          items: [
            { name: "Dead-Hang Pull-Ups — Max set", detail: "1 all-out set", note: "Full hang each rep. Baseline 21 → goal 30. Rest 5+ min after." },
            { name: "HR Push-Ups — 2:00 max", detail: "Max reps in 2:00", note: "Personal target 40 → 70 / 2 min. Occasional full test on TEST days." },
          ],
        },
        {
          name: "Short core finish",
          items: [
            { name: "Hanging Knee Raise", detail: "2 sets of 8 reps", note: "Hang from the pull-up bar with a full grip. Without swinging, pull your knees up toward your chest and curl your hips up at the top, then lower slowly. Pause at the bottom of each rep so you are not using momentum.", sets: 2, reps: 8, log: "reps", bw: true },
            { name: "Side Plank", detail: "2 sets of 25 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 2, reps: 25, log: "hold", noLoad: true },
          ],
        },
      ],
      notes: ["Rare personal TEST — not job-fitness programming.", "You’ll be prompted to log push-ups then pull-ups."],
    },
    {
      id: "test-fire-run",
      slotId: "speed_run",
      metricId: "fire_195",
      title: "Test day · Rare 1.95 mile check",
      durationMin: 30,
      lengthClass: "short",
      location: "Home · Wahoo treadmill",
      rpe: "10",
      isTest: true,
      summary: "Rare personal check: 1.95 miles all-out (≤12:00 target). Volume does the work; this just measures it.",
      warmup: ["10 min easy", "3×20s strides", "2 min easy"],
      blocks: [
        {
          name: "All-out time check",
          items: [
            { name: "1.95 mi all-out", detail: "Target ≤12:00", note: "Flat or 0.5% Wahoo. Hard start, settle, finish." },
            { name: "Walk cooldown", detail: "5–8 min", note: "" },
          ],
        },
      ],
      notes: ["Rare test check only. It counts as your easy run for the week when you choose it.", "Speed comes mostly from ultra volume; this is a sparse check.", "Enter finish time when prompted."],
    },
    {
      id: "test-mile",
      slotId: "speed_run",
      metricId: "mile",
      title: "Test day · Rare mile check",
      durationMin: 25,
      lengthClass: "short",
      location: "Outdoor or Wahoo",
      rpe: "10",
      isTest: true,
      summary: "Rare mile check (baseline ~7:30). Expect the time to move from easy volume across the week — not from intervals.",
      warmup: ["8–10 min easy", "4×20s strides"],
      blocks: [
        {
          name: "Mile time check",
          items: [
            { name: "1 mile all-out", detail: "Best time", note: "Even splits if possible." },
            { name: "Easy jog", detail: "5 min", note: "" },
          ],
        },
      ],
      notes: ["Rare test day. It counts as your easy run for the week when you choose it. It is not a weekly speed day."],
    },
  ];

  // ——— State ———
  function defaultState() {
    return {
      weekId: WEEK_ID,
      completed: {}, // slotId -> { workoutId, title, dayKey, ts } — only after Finish
      todayPick: null, // chosen for today (may still be in progress)
      dayAssignments: null, // dayKey -> slotId | null (planned remaining)
      activeSession: null, // mid-workout live log (persisted)
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (parsed.weekId !== WEEK_ID) return defaultState();
      return Object.assign(defaultState(), parsed);
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();

  // ——— Benchmarks (separate key so week reset keeps PRs) ———
  function defaultBenchState() {
    const entries = {};
    BENCH_METRICS.forEach((m) => {
      entries[m.id] = [];
      if (m.baseline != null) {
        entries[m.id].push({
          id: "seed-" + m.id,
          date: "2026-09-23",
          value: m.baseline,
          note: m.seedNote || "Baseline",
          ts: Date.parse("2026-09-23T08:00:00-06:00"),
          seeded: true,
        });
      }
    });
    return { version: 1, entries };
  }

  function loadBench() {
    try {
      const raw = localStorage.getItem(BENCH_KEY);
      if (!raw) {
        const fresh = defaultBenchState();
        localStorage.setItem(BENCH_KEY, JSON.stringify(fresh));
        return fresh;
      }
      const parsed = JSON.parse(raw);
      const base = defaultBenchState();
      // merge: keep user entries; ensure keys exist
      BENCH_METRICS.forEach((m) => {
        if (!parsed.entries) parsed.entries = {};
        if (!Array.isArray(parsed.entries[m.id]) || parsed.entries[m.id].length === 0) {
          parsed.entries[m.id] = base.entries[m.id];
        }
      });
      if (!parsed.working1rm || typeof parsed.working1rm !== "object") {
        parsed.working1rm = {};
      }
      return parsed;
    } catch {
      return defaultBenchState();
    }
  }

  function saveBench(bench) {
    localStorage.setItem(BENCH_KEY, JSON.stringify(bench));
  }

  let bench = loadBench();

  function getMetric(id) {
    return BENCH_METRICS.find((m) => m.id === id);
  }

  /** Working 1RMs used to calculate daily training weights (% of 1RM). */
  const LIFT_1RM_META = {
    back_squat: { metricId: "back_squat", label: "Back squat", short: "squat" },
    bench: { metricId: "bench", label: "Bench press", short: "bench" },
    deadlift: { metricId: "deadlift", label: "Deadlift", short: "deadlift" },
  };
  const DEFAULT_WORKING_1RM = { back_squat: 315, bench: 275, deadlift: 345 };

  function ensureWorking1RM() {
    if (!bench.working1rm || typeof bench.working1rm !== "object") {
      bench.working1rm = {};
    }
    Object.keys(DEFAULT_WORKING_1RM).forEach(function (liftId) {
      const cur = Number(bench.working1rm[liftId]);
      if (!(cur > 0)) {
        const metric = getMetric(LIFT_1RM_META[liftId].metricId);
        const best = metric ? bestEntry(metric) : null;
        bench.working1rm[liftId] =
          best && best.value > 0 ? Number(best.value) : DEFAULT_WORKING_1RM[liftId];
      }
    });
    return bench.working1rm;
  }

  function getWorking1RM(liftId) {
    const map = ensureWorking1RM();
    const v = Number(map[liftId]);
    return v > 0 ? v : null;
  }

  function setWorking1RM(liftId, lbs) {
    if (!LIFT_1RM_META[liftId]) return false;
    const n = Math.round(Number(lbs));
    if (!(n > 0) || n > 1000) return false;
    ensureWorking1RM();
    bench.working1rm[liftId] = n;
    saveBench(bench);
    return true;
  }

  function calcTrainingWeight(liftId, pct) {
    const one = getWorking1RM(liftId);
    if (one == null || pct == null || !(Number(pct) > 0)) return null;
    const w = roundTo5((Number(pct) / 100) * one);
    return w == null ? null : Math.max(5, w);
  }

  function plainLoadLine(liftId, pct, weight) {
    const meta = LIFT_1RM_META[liftId];
    const one = getWorking1RM(liftId);
    if (!meta || one == null || pct == null || weight == null) return "";
    return (
      weight +
      " lb (about " +
      Math.round(Number(pct)) +
      "% of your " +
      one +
      " " +
      meta.short +
      ")"
    );
  }

  function inferLiftId(item) {
    if (item.liftId && LIFT_1RM_META[item.liftId]) return item.liftId;
    const name = String(item.name || "").toLowerCase();
    if (/goblet/.test(name)) return null;
    if (/opener|thoracic|mobility|stretch|couch|pigeon/.test(name)) return null;
    if (/front squat|back squat|(^|\s)squat\b/.test(name) && !/split|jump|hold|pulse/.test(name)) {
      return "back_squat";
    }
    // Don't map dumbbell / incline DB work to barbell bench 1RM
    if (/(incline\s*)?(db|dumbbell)/.test(name)) return null;
    if (/bench|floor press|close-grip bench|close grip bench/.test(name)) return "bench";
    if (/romanian|rdl/.test(name)) return "deadlift";
    if (/deadlift/.test(name)) return "deadlift";
    return null;
  }

  function inferPct1rm(item, liftId) {
    if (item.pct1rm != null && Number(item.pct1rm) > 0) return Number(item.pct1rm);
    const detail = String(item.detail || "");
    const range = detail.match(/~?(\d{2})\s*[–\-]\s*(\d{2})\s*%/);
    if (range) return (parseInt(range[1], 10) + parseInt(range[2], 10)) / 2;
    const single = detail.match(/~?(\d{2})\s*%/);
    if (single) return parseInt(single[1], 10);
    const name = String(item.name || "").toLowerCase();
    if (/front squat/.test(name)) return 70;
    if (/back squat/.test(name)) return 78;
    if (/close-grip|close grip|floor press/.test(name)) return 72;
    if (/bench/.test(name)) return 75;
    if (/romanian|rdl/.test(name)) return 65;
    if (/deadlift/.test(name)) return 80;
    return liftId ? 75 : null;
  }


  function sortedEntries(metricId) {
    const list = (bench.entries[metricId] || []).slice();
    list.sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.ts || 0) - (a.ts || 0);
    });
    return list;
  }

  function bestEntry(metric) {
    const list = bench.entries[metric.id] || [];
    if (!list.length) return null;
    return list.reduce((best, e) => {
      if (!best) return e;
      if (metric.higherBetter) return e.value > best.value ? e : best;
      return e.value < best.value ? e : best;
    }, null);
  }

  function latestEntry(metric) {
    const list = sortedEntries(metric.id);
    return list[0] || null;
  }

  function formatBenchValue(metric, value) {
    if (value == null || Number.isNaN(value)) return "—";
    if (metric.unit === "time") return formatSeconds(value);
    if (metric.unit === "sec") {
      if (value >= 60) return formatSeconds(value);
      return String(value) + "s";
    }
    if (metric.unit === "mi") return trimNum(value) + " mi";
    if (metric.unit === "lb") return trimNum(value) + " lb";
    if (metric.unit === "reps") return trimNum(value);
    return trimNum(value);
  }

  function trimNum(n) {
    const x = Math.round(Number(n) * 100) / 100;
    return Number.isInteger(x) ? String(x) : String(x);
  }

  function formatSeconds(total) {
    total = Math.round(Number(total));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function parseTimeToSeconds(str) {
    const t = String(str).trim();
    if (!t) return null;
    if (/^\d+(\.\d+)?$/.test(t)) {
      // bare number: treat as seconds if > 30, else minutes?
      const n = Number(t);
      if (n > 30) return Math.round(n); // seconds
      return Math.round(n * 60); // minutes
    }
    const m = t.match(/^(\d+)\s*[:m]\s*(\d{1,2})\s*s?$/i) || t.match(/^(\d+):(\d{2})$/);
    if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    const m2 = t.match(/^(\d+)\s*min(?:utes)?(?:\s+(\d+)\s*s(?:ec)?)?$/i);
    if (m2) return parseInt(m2[1], 10) * 60 + (m2[2] ? parseInt(m2[2], 10) : 0);
    return null;
  }

  function goalProgressPct(metric, bestVal) {
    if (bestVal == null || metric.goal == null) return null;
    if (metric.maxed) return 100;
    if (metric.higherBetter) {
      const base = metric.baseline != null ? metric.baseline : 0;
      if (metric.goal <= base) return bestVal >= metric.goal ? 100 : 0;
      const pct = ((bestVal - base) / (metric.goal - base)) * 100;
      return Math.max(0, Math.min(100, Math.round(pct)));
    }
    // lower time better: baseline high → goal low
    const base = metric.baseline != null ? metric.baseline : bestVal * 1.2;
    if (base <= metric.goal) return bestVal <= metric.goal ? 100 : 0;
    const pct = ((base - bestVal) / (base - metric.goal)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  function isBenchImprovement(metric, newVal, oldVal) {
    if (oldVal == null) return true;
    if (metric.higherBetter) return Number(newVal) > Number(oldVal);
    return Number(newVal) < Number(oldVal);
  }

  function addBenchEntry(metricId, dateStr, value, note, opts) {
    opts = opts || {};
    const metric = getMetric(metricId);
    if (!metric) return null;
    const prevBest = bestEntry(metric);
    if (!bench.entries[metricId]) bench.entries[metricId] = [];
    const entry = {
      id: "e-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      date: dateStr,
      value: value,
      note: (note || "").trim(),
      ts: Date.now(),
    };
    bench.entries[metricId].push(entry);
    // Keep working 1RM in sync for % load suggestions
    if (metric.unit === "lb" && LIFT_1RM_META[metricId] && Number(value) > 0) {
      ensureWorking1RM();
      const prevW = Number(bench.working1rm[metricId]) || 0;
      if (Number(value) >= prevW) {
        bench.working1rm[metricId] = Math.round(Number(value));
      }
    }
    saveBench(bench);

    const beat =
      !prevBest || isBenchImprovement(metric, value, prevBest.value);
    const result = {
      metric: metric,
      entry: entry,
      isPr: beat && prevBest != null && isBenchImprovement(metric, value, prevBest.value),
      prevBest: prevBest,
      value: value,
    };
    if (result.isPr && !opts.silent) {
      showPrCelebration(metric, value, prevBest.value);
    }
    return result;
  }

  function showPrCelebration(metric, newVal, oldVal) {
    const el = document.getElementById("pr-toast");
    const msg = document.getElementById("pr-toast-msg");
    if (!el || !msg) return;

    const shortMap = {
      back_squat: "back squat",
      bench: "bench",
      deadlift: "deadlift",
      hr_pushups: "HR push-ups",
      dh_pullups: "dead-hang pull-ups",
      fire_195: "1.95 mi",
      mile: "mile",
      longest_easy: "longest easy",
      plank: "plank",
    };
    const short = shortMap[metric.id] || metric.name.toLowerCase();
    let body;
    if (metric.unit === "time") {
      const delta = Math.round(Number(oldVal) - Number(newVal));
      body = "New " + short + " PR — " + formatSeconds(newVal) + " (−" + formatSeconds(delta) + ")";
    } else if (metric.unit === "lb") {
      const delta = Math.round(Number(newVal) - Number(oldVal));
      body = "New " + short + " PR — " + trimNum(newVal) + " (+" + trimNum(delta) + ")";
    } else if (metric.unit === "reps") {
      const delta = Math.round(Number(newVal) - Number(oldVal));
      body = "New " + short + " PR — " + trimNum(newVal) + " (+" + trimNum(delta) + ")";
    } else if (metric.unit === "mi") {
      const delta = Math.round((Number(newVal) - Number(oldVal)) * 100) / 100;
      body = "New " + short + " PR — " + trimNum(newVal) + " mi (+" + trimNum(delta) + ")";
    } else if (metric.unit === "sec") {
      const delta = Math.round(Number(newVal) - Number(oldVal));
      body = "New " + short + " PR — " + formatSeconds(newVal);
      if (delta) body += " (+" + trimNum(delta) + "s)";
    } else {
      body = "New " + short + " PR — " + formatBenchValue(metric, newVal);
    }

    msg.textContent = body;
    el.classList.remove("hidden");
    void el.offsetWidth;
    el.classList.add("show");
    clearTimeout(showPrCelebration._t);
    showPrCelebration._t = setTimeout(function () {
      el.classList.remove("show");
      setTimeout(function () {
        el.classList.add("hidden");
      }, 280);
    }, 4200);
  }


  function deleteBenchEntry(metricId, entryId) {
    const list = bench.entries[metricId] || [];
    bench.entries[metricId] = list.filter((e) => e.id !== entryId);
    // Re-seed baseline if wiped and metric has baseline
    const metric = getMetric(metricId);
    if (metric && metric.baseline != null && bench.entries[metricId].length === 0) {
      bench.entries[metricId] = defaultBenchState().entries[metricId];
    }
    saveBench(bench);
  }


  // ——— Calendar helpers ———
  function startOfLocalDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function dayOffsetFromWeekStart(date) {
    const start = startOfLocalDay(WEEK_START);
    const cur = startOfLocalDay(date);
    return Math.round((cur - start) / 86400000);
  }

  function getTodayInfo() {
    const now = new Date();
    let offset = dayOffsetFromWeekStart(now);
    // Clamp to week 1 for demo consistency if somehow outside; still work inside week
    if (offset < 0) offset = 0;
    if (offset > 6) offset = 6;
    const day = DAYS[offset];
    return { now, offset, day };
  }

  function formatTodayLabel(date) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "America/Denver",
    });
  }

  // ——— Assignment / reshuffle ———
  function remainingSlots(st) {
    return SLOT_ORDER.filter((id) => !st.completed[id]);
  }

  /** Slots still free to assign across the week (excludes completed + today's chosen-in-progress). */
  function assignableSlots(st) {
    const rem = remainingSlots(st);
    if (st.todayPick && st.todayPick.slotId && !st.completed[st.todayPick.slotId]) {
      return rem.filter((id) => id !== st.todayPick.slotId);
    }
    return rem;
  }

  function ensureAssignments(st) {
    const rem = assignableSlots(st);
    const today = getTodayInfo();
    const needRebuild =
      !st.dayAssignments ||
      Object.keys(st.dayAssignments).length !== 7 ||
      rem.some((s) => !Object.values(st.dayAssignments).includes(s)) ||
      Object.values(st.dayAssignments).some(
        (s) => s && !rem.includes(s) && !st.completed[s] && !(st.todayPick && st.todayPick.slotId === s)
      );

    if (!needRebuild && st.dayAssignments) {
      DAYS.forEach((d) => {
        const sid = st.dayAssignments[d.key];
        if (sid && st.completed[sid]) st.dayAssignments[d.key] = null;
      });
      // Pin today's chosen (not-yet-finished) slot onto today
      if (st.todayPick && st.todayPick.dayKey === today.day.key && !st.completed[st.todayPick.slotId]) {
        st.dayAssignments[today.day.key] = st.todayPick.slotId;
      }
      return st;
    }

    const assign = {};
    DAYS.forEach((d) => (assign[d.key] = null));

    const futureDays = DAYS.filter((d) => d.offset >= today.offset);
    const pastDays = DAYS.filter((d) => d.offset < today.offset).reverse();
    const dayQueue = futureDays.concat(pastDays);

    const slots = rem.slice();
    const todayBlocked = st.todayPick && st.todayPick.dayKey === today.day.key;

    // Chosen-but-not-finished: pin to today visually
    if (todayBlocked && !st.completed[st.todayPick.slotId]) {
      assign[today.day.key] = st.todayPick.slotId;
    }

    let qi = 0;
    slots.forEach((slotId) => {
      while (qi < dayQueue.length) {
        const d = dayQueue[qi++];
        if (todayBlocked && d.key === today.day.key) continue;
        if (assign[d.key]) continue;
        assign[d.key] = slotId;
        break;
      }
    });

    st.dayAssignments = assign;
    return st;
  }

  function reshuffleAfterChoice(st) {
    st.dayAssignments = null;
    return ensureAssignments(st);
  }

  function reshuffleAfterCompletion(st, completedSlotId) {
    st.dayAssignments = null;
    return ensureAssignments(st);
  }

  // ——— Occasional Test / PR options (NOT weekly required) ———
  /** Week index from Week 1 anchor; sparse offer ~ every 2–4 weeks */
  function getProgramWeekIndex() {
    // Single week id for now; future weeks bump WEEK_ID / week counter in state
    if (state.testWeekIndex != null) return state.testWeekIndex;
    return 0; // Week 1
  }

  /**
   * Offer a Test option only on sparse days — not every week, not every day.
   * Cadence: weeks where weekIndex % 3 === 0 (wk 1, 4, 7…) on Wed/Sat;
   * and weeks where weekIndex % 3 === 1 on Fri only.
   * → roughly 2 days every 3 weeks, or ~every 2–4 weeks of exposure.
   */
  function shouldOfferTestToday(today) {
    const w = getProgramWeekIndex();
    const d = today.offset;
    // Week 1 (index 0): no TEST options — lock in ultra volume identity first
    if (w === 0) return false;
    if (w % 3 === 0) return d === 0 || d === 3; // Wed or Sat on later cycle weeks
    if (w % 3 === 1) return d === 2; // Fri only
    return false; // off weeks: no test options
  }

  function pickTestWorkout(rem, today) {
    if (!shouldOfferTestToday(today)) return null;
    const week = getProgramWeekIndex();
    // Ultra-first: do NOT offer timed run tests (1.95 / mile) early.
    // Those stay rare — only after several volume weeks (weekIndex >= 3).
    let pool = TEST_WORKOUTS.filter((tw) => rem.includes(tw.slotId));
    if (week < 3) {
      pool = pool.filter((tw) => tw.metricId !== "fire_195" && tw.metricId !== "mile");
    }
    if (!pool.length) return null;
    // Rotate which test appears so the pool stays fresh
    const idx = (today.offset + week * 3) % pool.length;
    return pool[idx];
  }

  // ——— Recent history (survives week resets) + second day on tired legs ———
  const HISTORY_KEY = "nc-adaptive-coach-history-v1";

  function localDateKey(d) {
    const x = d instanceof Date ? d : new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  }

  function loadHistory() {
    try {
      const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveHistory(arr) {
    // keep the last 60 entries only
    localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(-60)));
  }

  function parseMinutes(t) {
    const s = String(t || "").trim();
    if (!s) return 0;
    if (s.includes(":")) {
      const parts = s.split(":").map((n) => parseFloat(n) || 0);
      if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
      // "95:00" = minutes:seconds; "1:35" = hours:minutes when first part is small
      if (parts[0] < 5) return parts[0] * 60 + parts[1];
      return parts[0] + parts[1] / 60;
    }
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  /** Sum logged cardio distance (miles) and time (minutes) from a session log. */
  function summarizeCardioLogs(logs) {
    let miles = 0;
    let minutes = 0;
    Object.values(logs || {}).forEach((log) => {
      if (!log || log.type !== "cardio") return;
      const d = parseFloat(String(log.distance || "").replace(/[^0-9.]/g, ""));
      if (!isNaN(d)) miles += d;
      minutes += parseMinutes(log.time);
    });
    return { miles, minutes };
  }

  function recordHistory(entry) {
    const arr = loadHistory().filter((e) => !(e.dateKey === entry.dateKey && e.slotId === entry.slotId));
    arr.push(entry);
    saveHistory(arr);
  }

  function removeHistory(dateKey, slotId) {
    saveHistory(loadHistory().filter((e) => !(e.dateKey === dateKey && e.slotId === slotId)));
  }

  /** All finished workouts for a local calendar date (history + this week's completions). */
  function finishedOnDate(dateKey) {
    const out = loadHistory().filter((e) => e.dateKey === dateKey);
    Object.keys(state.completed || {}).forEach((slotId) => {
      const c = state.completed[slotId];
      if (!c || !c.ts) return;
      const dk = c.dateKey || localDateKey(c.ts);
      if (dk !== dateKey) return;
      if (out.some((e) => e.slotId === slotId)) return;
      const sum = summarizeCardioLogs(c.sessionLog);
      out.push({ dateKey: dk, slotId, workoutId: c.workoutId, title: c.title, durationMin: c.durationMin, loggedMiles: sum.miles, loggedMinutes: sum.minutes, ts: c.ts });
    });
    return out.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  const RUN_SLOTS = ["speed_run", "long_run", "flex"];

  /** Does a finished workout count as a big day that leaves the legs tired? Returns a reason or null. */
  function bigDayReason(e) {
    if (!e) return null;
    const planned = Number(e.durationMin) || 0;
    const miles = Number(e.loggedMiles) || 0;
    const mins = Number(e.loggedMinutes) || 0;
    if (e.slotId === "long_run") return "long_run";
    if (e.slotId === "easy_hike" && Math.max(planned, mins) >= 60) return "long_hike";
    if (RUN_SLOTS.includes(e.slotId) && (miles >= 8 || mins >= 90)) return "big_run";
    return null;
  }

  /** Looks at yesterday (local calendar day). Returns { reason, entry } if today is a second day on tired legs. */
  function tiredLegsFromYesterday() {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const entries = finishedOnDate(localDateKey(y));
    for (const e of entries) {
      const reason = bigDayReason(e);
      if (reason) return { reason, entry: e };
    }
    return null;
  }

  function tiredLegsMessage(t) {
    const what =
      t.reason === "long_run"
        ? "you did your long run yesterday"
        : t.reason === "long_hike"
        ? "you did a long hills and hiking session yesterday"
        : "you ran a long way yesterday";
    return (
      "Second day on tired legs: " +
      what +
      ", so this run trains you to keep moving when your legs are already worn out, like the back half of Black Canyon. " +
      "Keep it easy and conversational, walk the steep climbs, and stop if your stride falls apart."
    );
  }

  const TIRED_LEGS_PRESCRIPTION =
    "Hold the planned time, but let the pace be as slow as it needs to be. Time on your feet matters more than speed today.";

  /** Is this an easy-run option that should carry the tired-legs note? */
  function isEasyRunOption(slotId, workout) {
    if (!workout || workout.isTest) return false;
    if (slotId === "speed_run") return true;
    return workout.id === "fx-second-aerobic";
  }

  // ——— Today's options ———
  function pickOptionsForToday(st) {
    st = ensureAssignments(st);
    const today = getTodayInfo();
    const rem = remainingSlots(st);

    if (st.todayPick && st.todayPick.dayKey === today.day.key) {
      const finished = !!st.completed[st.todayPick.slotId];
      if (finished) return { done: true, pick: st.todayPick, options: [] };
      return { done: false, inProgress: true, pick: st.todayPick, options: [] };
    }

    if (rem.length === 0) {
      return { done: true, pick: null, options: [], weekComplete: true };
    }

    // Candidate slots: today's assignment first, then other remaining
    const assigned = st.dayAssignments[today.day.key];
    const ordered = [];
    if (assigned && rem.includes(assigned)) ordered.push(assigned);
    rem.forEach((s) => {
      if (!ordered.includes(s)) ordered.push(s);
    });

    // Prefer diversity: try to include a short option overall
    const options = [];
    const usedWorkouts = new Set();

    function addOption(slotId, preferShort) {
      if (options.length >= 3) return;
      if (options.some((o) => o.slotId === slotId)) return;
      const pool = WORKOUTS[slotId] || [];
      let workout = null;
      if (preferShort) {
        workout = pool.find((w) => w.lengthClass === "short" && !usedWorkouts.has(w.id));
      }
      if (!workout) {
        // Prefer not-yet-used; rotate by day offset
        const idx = today.offset % pool.length;
        workout =
          pool.find((w, i) => i >= idx && !usedWorkouts.has(w.id)) ||
          pool.find((w) => !usedWorkouts.has(w.id)) ||
          pool[0];
      }
      if (!workout) return;
      usedWorkouts.add(workout.id);
      options.push({ slotId, workout });
    }

    // First: assigned slot (or first remaining)
    addOption(ordered[0], false);

    // Second: different slot — prefer a short workout somewhere
    if (ordered[1]) addOption(ordered[1], true);
    // Third
    if (ordered[2]) addOption(ordered[2], options.every((o) => o.workout.lengthClass !== "short"));

    // Guarantee at least one short if we have room and any remaining slot has a short
    if (options.length > 0 && !options.some((o) => o.workout.lengthClass === "short")) {
      for (const slotId of ordered) {
        const shortW = (WORKOUTS[slotId] || []).find((w) => w.lengthClass === "short");
        if (shortW) {
          // Replace last option's workout with short variant of same or different slot
          if (options.length < 3 && !options.some((o) => o.slotId === slotId)) {
            usedWorkouts.add(shortW.id);
            options.push({ slotId, workout: shortW });
          } else {
            const last = options[options.length - 1];
            const shortSame = (WORKOUTS[last.slotId] || []).find((w) => w.lengthClass === "short");
            if (shortSame) {
              last.workout = shortSame;
            }
          }
          break;
        }
      }
    }

    // Always show 2–3
    while (options.length < 2 && ordered.length > options.length) {
      addOption(ordered[options.length], false);
    }

    // Occasional Test / PR option (sparse — not a required weekly slot)
    const testW = pickTestWorkout(rem, today);
    if (testW) {
      // Prefer replacing the last non-short card, or append if < 3
      const testOpt = { slotId: testW.slotId, workout: testW, isTest: true };
      const existingIdx = options.findIndex((o) => o.slotId === testW.slotId);
      if (existingIdx >= 0) {
        options[existingIdx] = testOpt;
      } else if (options.length < 3) {
        options.push(testOpt);
      } else {
        options[options.length - 1] = testOpt;
      }
    }

    const tired = tiredLegsFromYesterday();
    if (tired) {
      options.forEach((o) => {
        if (isEasyRunOption(o.slotId, o.workout)) o.tiredLegs = tiredLegsMessage(tired);
      });
    }
    return { done: false, options, rem, tiredLegs: tired };
  }

  // ——— Actions / active session ———
  const LEGACY_WORKOUT_IDS = { "sp-b2b-easy": "sp-short-easy" }; // renamed id; keeps old saved state loading

  function findWorkout(slotId, workoutId) {
    if (LEGACY_WORKOUT_IDS[workoutId]) workoutId = LEGACY_WORKOUT_IDS[workoutId];
    let w = (WORKOUTS[slotId] || []).find((x) => x.id === workoutId);
    if (!w) w = TEST_WORKOUTS.find((x) => x.id === workoutId);
    return w || null;
  }

  /** How a set is logged: "reps" (weight × reps), "hold" (seconds), or "carry" (weight × seconds). */
  function exerciseLogKind(item) {
    if (!item) return "reps";
    if (item.log === "hold" || item.log === "carry" || item.log === "reps") return item.log;
    const n = String(item.name || "").toLowerCase();
    const d = String(item.detail || "").toLowerCase();
    if (/\bcarry\b|\bcarries\b/.test(n)) return "carry";
    if (/plank|\bhold\b|\bhang\b/.test(n) && /\bsec|seconds|\d+\s*s\b/.test(d)) return "hold";
    return "reps";
  }

  function parseExerciseSpec(item) {
    const name = item.name || "";
    const detail = item.detail || "";
    const blob = (name + " " + detail + " " + (item.note || "")).toLowerCase();
    const isMax = looksLikeMaxAttempt(name, detail);

    // Prefer explicit sets/reps on the item (plain-English data model)
    let setCount = item.sets != null ? Math.min(12, parseInt(item.sets, 10) || 0) : 0;
    let targetReps = item.reps != null ? String(item.reps) : "";

    if (!setCount) {
      // "4 sets of 5 reps" / "4 sets of 5"
      const plain = detail.match(/(\d+)\s*sets?\s+of\s+(\d+)/i);
      const setMatch = detail.match(/(\d+)\s*[×xX]\s*(\d+)/);
      const setsOnly = detail.match(/(\d+)\s*sets?\b/i);
      if (plain) {
        setCount = Math.min(12, parseInt(plain[1], 10) || 3);
        targetReps = plain[2];
      } else if (setMatch) {
        setCount = Math.min(12, parseInt(setMatch[1], 10) || 3);
        targetReps = setMatch[2];
      } else if (setsOnly) {
        setCount = Math.min(12, parseInt(setsOnly[1], 10) || 3);
      } else {
        // Ramp lines like "~50% × 5" / "85% × 1" (TEST build-ups)
        const pctReps = detail.match(/~?\d{1,3}(?:\s*[–\-]\s*\d{1,3})?\s*%\s*[×xX]\s*(\d+)/);
        if (pctReps) {
          setCount = 1;
          if (!targetReps) targetReps = pctReps[1];
        }
      }
    }

    const liftId = isMax ? null : inferLiftId(item);
    const pct1rm = liftId ? inferPct1rm(item, liftId) : null;
    const logKind = exerciseLogKind(item);

    const isCardio =
      !setCount &&
      (/\b(\d+\s*[–\-]\s*\d+\s*min|\d+\s*min|continuous|\/mi|easy trail|easy aerobic|time-on-feet|all-out|treadmill walk|incline)\b/i.test(
        blob
      ) ||
        /\b(jog|run|trail|hike|walk|mile|mi\b|aerobic)\b/i.test(name));

    if (setCount > 0) {
      return {
        type: "sets",
        setCount: setCount,
        targetReps: targetReps,
        isMax: !!isMax,
        liftId: item.noLoad || item.bw || logKind !== "reps" ? null : liftId,
        pct1rm: item.noLoad || item.bw || logKind !== "reps" ? null : pct1rm,
        logKind: logKind,
        bw: !!item.bw,
      };
    }
    if (/ladder|emom|all-out set|max in/i.test(blob) || isMax) {
      if (isCardio || /mi\b|mile|min|time/i.test(detail)) {
        return { type: "cardio", isMax: !!isMax };
      }
      return { type: "sets", setCount: 1, targetReps: "", isMax: !!isMax, liftId: null, pct1rm: null };
    }
    if (isCardio) return { type: "cardio", isMax: !!isMax };
    return { type: "simple", isMax: !!isMax };
  }

  function buildActiveSession(slotId, workout, today) {
    const logs = {};
    (workout.blocks || []).forEach((block, bi) => {
      (block.items || []).forEach((item, ii) => {
        const key = bi + "-" + ii;
        const spec = parseExerciseSpec(item);
        if (spec.type === "sets") {
          const sug = !spec.isMax ? suggestWorkingWeight(item) : null;
          const suggested = sug ? sug.weight : null;
          const loadLine = sug ? plainPercentCoach(sug) : "";
          const sets = [];
          for (let n = 0; n < spec.setCount; n++) {
            sets.push({
              done: false,
              weight: suggested != null ? String(suggested) : "",
              reps: spec.targetReps || "",
              suggested: suggested != null ? String(suggested) : "",
              overridden: false,
            });
          }
          logs[key] = {
            type: "sets",
            sets: sets,
            exerciseDone: false,
            isMax: !!spec.isMax,
            targetReps: spec.targetReps || "",
            liftId: sug ? sug.metricId : spec.liftId || null,
            pct1rm: sug ? sug.pct : spec.pct1rm,
            loadLine: loadLine,
            suggest: sug,
            suggestedWeight: suggested != null ? String(suggested) : "",
            logKind: spec.logKind || "reps",
            bw: !!spec.bw,
          };
        } else if (spec.type === "cardio") {
          logs[key] = {
            type: "cardio",
            done: false,
            distance: "",
            time: "",
            pace: "",
            isMax: !!spec.isMax,
          };
        } else {
          logs[key] = { type: "simple", done: false, isMax: !!spec.isMax };
        }
      });
    });
    return {
      dayKey: today.day.key,
      slotId: slotId,
      workoutId: workout.id,
      title: workout.title,
      startedAt: Date.now(),
      warmup: (workout.warmup || []).map(function () {
        return false;
      }),
      logs: logs,
      testLogged: {},
      isTest: !!workout.isTest,
      metricId: workout.metricId || null,
      secondaryMetrics: workout.secondaryMetrics || [],
    };
  }

  /** Refresh suggested loads from current working 1RMs; keep user overrides. */
  function refreshSessionSuggestedLoads(sess) {
    if (!sess || !sess.logs) return sess;
    const workout = findWorkout(sess.slotId, sess.workoutId);
    if (!workout) return sess;
    (workout.blocks || []).forEach(function (block, bi) {
      (block.items || []).forEach(function (item, ii) {
        const key = bi + "-" + ii;
        const log = sess.logs[key];
        if (!log || log.type !== "sets" || log.isMax) return;
        const sug = suggestWorkingWeight(item);
        if (!sug) return;
        log.suggest = sug;
        log.liftId = sug.metricId;
        log.pct1rm = sug.pct;
        log.loadLine = plainPercentCoach(sug);
        log.suggestedWeight = String(sug.weight);
        (log.sets || []).forEach(function (set) {
          const wasSuggested =
            !set.overridden &&
            (set.weight === "" ||
              set.weight === set.suggested ||
              set.weight === log.suggestedWeight);
          set.suggested = String(sug.weight);
          if (wasSuggested) {
            set.weight = String(sug.weight);
            set.overridden = false;
          }
        });
      });
    });
    return sess;
  }

  function sessionHasProgress(sess) {
    if (!sess) return false;
    if ((sess.warmup || []).some(Boolean)) return true;
    const logs = sess.logs || {};
    return Object.keys(logs).some(function (k) {
      const log = logs[k];
      if (!log) return false;
      if (log.type === "sets") {
        if (log.exerciseDone) return true;
        return (log.sets || []).some(function (s) {
          if (s.done) return true;
          // Prefill from %1RM does not count as user progress
          const sug = s.suggested != null ? String(s.suggested) : (log.suggestedWeight || "");
          const w = s.weight != null ? String(s.weight).trim() : "";
          if (w && w !== String(sug).trim()) return true;
          if (s.overridden) return true;
          if (s.reps && String(s.reps).trim() && s.reps !== log.targetReps) return true;
          return false;
        });
      }
      if (log.type === "cardio") {
        return !!(log.done || (log.distance && String(log.distance).trim()) || (log.time && String(log.time).trim()) || (log.pace && String(log.pace).trim()));
      }
      return !!log.done;
    });
  }

  function countSessionProgress(sess, workout) {
    let total = (workout.warmup || []).length;
    let done = (sess.warmup || []).filter(Boolean).length;
    (workout.blocks || []).forEach(function (block, bi) {
      (block.items || []).forEach(function (item, ii) {
        total += 1;
        const log = (sess.logs || {})[bi + "-" + ii];
        if (!log) return;
        if (log.type === "sets") {
          const allSets = (log.sets || []).length > 0 && (log.sets || []).every(function (s) { return s.done; });
          if (log.exerciseDone || allSets) done += 1;
        } else if (log.done) done += 1;
      });
    });
    return { done: done, total: total };
  }

  function chooseAndStartWorkout(slotId, workout) {
    const today = getTodayInfo();
    if (
      state.activeSession &&
      sessionHasProgress(state.activeSession) &&
      (state.activeSession.workoutId !== workout.id || state.activeSession.slotId !== slotId)
    ) {
      if (!confirm("You have an in-progress workout logged. Switch and abandon that progress?")) return;
    }

    state.todayPick = {
      dayKey: today.day.key,
      slotId: slotId,
      workoutId: workout.id,
      title: workout.title,
      durationMin: workout.durationMin,
      slotName: SLOT_META[slotId].name,
      isTest: !!workout.isTest,
      metricId: workout.metricId || null,
      status: "active",
    };
    // Do NOT mark completed yet — only lock choice + reshuffle remaining week slots
    state.activeSession = buildActiveSession(slotId, workout, today);
    state = reshuffleAfterChoice(state);
    saveState(state);
    closeModal();
    render();
    showActiveWorkout();
  }

  function finishWorkout() {
    const sess = state.activeSession;
    if (!sess) return;
    const today = getTodayInfo();
    const workout = findWorkout(sess.slotId, sess.workoutId);
    if (!workout) return;

    const finishedAt = Date.now();
    const cardioSum = summarizeCardioLogs(sess.logs);
    recordHistory({
      dateKey: localDateKey(finishedAt),
      slotId: sess.slotId,
      workoutId: workout.id,
      title: workout.title,
      durationMin: workout.durationMin,
      loggedMiles: cardioSum.miles,
      loggedMinutes: cardioSum.minutes,
      ts: finishedAt,
    });
    state.completed[sess.slotId] = {
      workoutId: workout.id,
      title: workout.title,
      dateKey: localDateKey(finishedAt),
      dayKey: today.day.key,
      dayLabel: today.day.label,
      ts: finishedAt,
      durationMin: workout.durationMin,
      isTest: !!workout.isTest,
      sessionLog: sess.logs,
    };
    if (state.todayPick) state.todayPick.status = "finished";
    const metricQueue = [];
    if (workout.isTest && workout.metricId && !sess.testLogged[workout.metricId]) {
      metricQueue.push(workout.metricId);
    }
    (workout.secondaryMetrics || []).forEach(function (m) {
      if (!sess.testLogged[m]) metricQueue.push(m);
    });
    state.activeSession = null;
    state = reshuffleAfterCompletion(state, sess.slotId);
    saveState(state);
    hideActiveWorkout();
    render();
    if (metricQueue.length) {
      setTimeout(function () {
        promptTestResults(metricQueue, 0, workout.title);
      }, 280);
    }
  }

  function abandonActiveWorkout(opts) {
    opts = opts || {};
    const sess = state.activeSession;
    if (!sess) {
      // Clear choice with no session
      if (state.todayPick && !state.completed[state.todayPick.slotId]) {
        if (!opts.skipConfirm && !confirm("Clear today's workout choice?")) return false;
        state.todayPick = null;
        state.dayAssignments = null;
        state = ensureAssignments(state);
        saveState(state);
        hideActiveWorkout();
        render();
      }
      return true;
    }
    if (!opts.skipConfirm) {
      const msg = sessionHasProgress(sess)
        ? "Abandon this workout? Mid-session logs will be lost."
        : "Leave this workout without finishing?";
      if (!confirm(msg)) return false;
    }
    const slotId = sess.slotId;
    state.activeSession = null;
    if (state.todayPick && state.todayPick.slotId === slotId && !state.completed[slotId]) {
      state.todayPick = null;
    }
    state.dayAssignments = null;
    state = ensureAssignments(state);
    saveState(state);
    hideActiveWorkout();
    render();
    return true;
  }

  function promptTestResults(metricIds, index, sessionTitle) {
    if (!metricIds || index >= metricIds.length) return;
    const metricId = metricIds[index];
    const metric = getMetric(metricId);
    if (!metric) {
      promptTestResults(metricIds, index + 1, sessionTitle);
      return;
    }
    openBenchModal(metricId, {
      note: "Test day · " + (sessionTitle || "PR attempt"),
      afterSave: function () {
        if (state.activeSession) {
          state.activeSession.testLogged[metricId] = true;
          saveState(state);
        }
        promptTestResults(metricIds, index + 1, sessionTitle);
      },
      headline: index === 0 ? "Log test result" : "Log next result",
    });
  }

  function logTestResultNow(metricId, sessionTitle) {
    if (!metricId) return;
    openBenchModal(metricId, {
      note: "Test day · " + (sessionTitle || "PR attempt"),
      afterSave: function () {
        if (state.activeSession) {
          state.activeSession.testLogged[metricId] = true;
          saveState(state);
          renderActiveWorkout();
        }
      },
      headline: "Log top result",
    });
  }

  function undoToday() {
    const today = getTodayInfo();
    if (!state.todayPick || state.todayPick.dayKey !== today.day.key) return;
    const slotId = state.todayPick.slotId;
    const finished = !!state.completed[slotId];
    if (state.activeSession && sessionHasProgress(state.activeSession)) {
      if (!confirm("Undo today? In-progress workout logs will be cleared.")) return;
    } else if (finished) {
      if (!confirm("Undo today's finished workout? It will return to the week board as incomplete.")) return;
    }
    if (finished) {
      const c = state.completed[slotId];
      removeHistory((c && c.dateKey) || localDateKey(new Date()), slotId);
    }
    delete state.completed[slotId];
    state.todayPick = null;
    state.activeSession = null;
    state.dayAssignments = null;
    state = ensureAssignments(state);
    saveState(state);
    hideActiveWorkout();
    render();
  }

  function resetWeek() {
    if (state.activeSession && sessionHasProgress(state.activeSession)) {
      if (!confirm("Reset Week 1? In-progress workout and all completions will be cleared.")) return;
    } else if (!confirm("Reset Week 1? All completions will be cleared.")) {
      return;
    }
    state = defaultState();
    state = ensureAssignments(state);
    saveState(state);
    hideActiveWorkout();
    render();
  }

  function showActiveWorkout() {
    document.getElementById("app").classList.add("active-mode");
    document.querySelectorAll(".view").forEach(function (v) {
      const on = v.id === "view-active";
      v.classList.toggle("active", on);
      if (on) v.removeAttribute("hidden");
      else v.setAttribute("hidden", "");
    });
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    renderActiveWorkout();
  }

  function hideActiveWorkout() {
    document.getElementById("app").classList.remove("active-mode");
    const active = document.getElementById("view-active");
    if (active) {
      active.classList.remove("active");
      active.setAttribute("hidden", "");
    }
    // Restore Today tab
    document.querySelectorAll(".tab").forEach(function (t) {
      const on = t.getAttribute("data-view") === "today";
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".view").forEach(function (v) {
      if (v.id === "view-active") return;
      const on = v.id === "view-today";
      v.classList.toggle("active", on);
      if (on) v.removeAttribute("hidden");
      else v.setAttribute("hidden", "");
    });
  }

  function persistActiveFromDom() {
    const sess = state.activeSession;
    if (!sess) return;
    const body = document.getElementById("active-body");
    if (!body) return;
    body.querySelectorAll("[data-warmup-idx]").forEach(function (el) {
      const i = parseInt(el.getAttribute("data-warmup-idx"), 10);
      if (!isNaN(i)) sess.warmup[i] = !!el.checked;
    });
    body.querySelectorAll(".log-ex").forEach(function (ex) {
      const key = ex.getAttribute("data-log-key");
      if (!key || !sess.logs[key]) return;
      const log = sess.logs[key];
      if (log.type === "sets") {
        ex.querySelectorAll(".set-row").forEach(function (row) {
          const si = parseInt(row.getAttribute("data-set-idx"), 10);
          if (isNaN(si) || !log.sets[si]) return;
          const w = row.querySelector('[data-field="weight"]');
          const r = row.querySelector('[data-field="reps"]');
          const c = row.querySelector(".set-check");
          const newW = w ? w.value : "";
          const sugW = log.sets[si].suggested != null ? String(log.sets[si].suggested) : (log.suggestedWeight || "");
          if (newW !== (log.sets[si].weight || "") && newW !== sugW) {
            log.sets[si].overridden = true;
          }
          log.sets[si].weight = newW;
          log.sets[si].reps = r ? r.value : "";
          log.sets[si].done = c ? c.classList.contains("on") : false;
          if (w) {
            const suggested = log.sets[si].suggested || log.suggestedWeight || "";
            log.sets[si].overridden =
              String(w.value).trim() !== "" &&
              String(w.value).trim() !== String(suggested).trim();
          }
        });
        const doneBtn = ex.querySelector(".btn-ex-done");
        log.exerciseDone = doneBtn ? doneBtn.classList.contains("on") : false;
      } else if (log.type === "cardio") {
        const d = ex.querySelector('[data-field="distance"]');
        const t = ex.querySelector('[data-field="time"]');
        const p = ex.querySelector('[data-field="pace"]');
        log.distance = d ? d.value : "";
        log.time = t ? t.value : "";
        log.pace = p ? p.value : "";
        const doneBtn = ex.querySelector(".btn-ex-done");
        log.done = doneBtn ? doneBtn.classList.contains("on") : false;
      } else {
        const doneBtn = ex.querySelector(".btn-ex-done");
        log.done = doneBtn ? doneBtn.classList.contains("on") : false;
      }
    });
    saveState(state);
  }

  function renderActiveWorkout() {
    const sess = state.activeSession;
    const body = document.getElementById("active-body");
    if (!sess || !body) return;
    const workout = findWorkout(sess.slotId, sess.workoutId);
    if (!workout) return;
    const meta = SLOT_META[sess.slotId];
    document.getElementById("active-slot").textContent = slotCardLabel(meta, !!workout.isTest);
    document.getElementById("active-title").textContent = workout.title;
    document.getElementById("active-meta").textContent = sessionMetaLine(workout);
    const prog = countSessionProgress(sess, workout);
    document.getElementById("active-progress-line").textContent =
      prog.done + " / " + prog.total + " items logged";

    let html = "";
    if (workout.warmup && workout.warmup.length) {
      html += '<div class="active-block"><h4>Warm-up</h4>';
      workout.warmup.forEach(function (w, i) {
        const checked = sess.warmup[i] ? " checked" : "";
        const doneCls = sess.warmup[i] ? " done" : "";
        html +=
          '<label class="warmup-check' +
          doneCls +
          '"><input type="checkbox" data-warmup-idx="' +
          i +
          '"' +
          checked +
          " /><span>" +
          escapeHtml(w) +
          "</span></label>";
      });
      html += "</div>";
    }

    (workout.blocks || []).forEach(function (block, bi) {
      html += '<div class="active-block"><h4>' + escapeHtml(block.name) + "</h4>";
      (block.items || []).forEach(function (item, ii) {
        const key = bi + "-" + ii;
        const log = sess.logs[key] || { type: "simple", done: false };
        const complete =
          log.type === "sets"
            ? log.exerciseDone || ((log.sets || []).length && (log.sets || []).every(function (s) { return s.done; }))
            : !!log.done;
        html +=
          '<div class="log-ex' +
          (complete ? " complete" : "") +
          '" data-log-key="' +
          key +
          '" data-log-type="' +
          log.type +
          '">';
        html +=
          '<div class="log-ex-head"><div class="log-ex-name">' +
          escapeHtml(item.name) +
          '</div><div class="log-ex-detail">' +
          escapeHtml(plainDetail(item)) +
          "</div></div>";
        if (item.note) {
          html += '<div class="log-ex-note">' + escapeHtml(item.note) + "</div>";
        }
        const coachLine =
          log.loadLine ||
          (log.suggest ? plainPercentCoach(log.suggest) : "") ||
          (function () {
            const s = suggestWorkingWeight(item);
            return s && !log.isMax ? plainPercentCoach(s) : "";
          })();
        if (coachLine && !log.isMax) {
          html +=
            '<div class="log-ex-note pct-coach">' +
            escapeHtml(coachLine) +
            "</div>";
        } else if (!log.isMax && log.type === "sets" && (log.liftId || inferLiftId(item))) {
          // Lift is known but no working 1RM / % available — nudge Progress editor
          html +=
            '<div class="log-ex-note pct-coach missing-1rm">' +
            "Set a working 1RM in Progress to auto-fill this weight." +
            "</div>";
        }

        if (log.type === "sets") {
          const kind = log.logKind || exerciseLogKind(item);
          const bw = log.bw != null ? !!log.bw : !!item.bw;
          const valLabel = kind === "reps" ? "Reps" : "Seconds";
          const valPh = kind === "reps" ? "reps" : "sec";
          const wLabel = bw
            ? ""
            : kind === "carry"
              ? /farmer|two dumbbells/i.test(item.name || "") ? "Lb per hand" : "Dumbbell lb"
              : kind === "hold"
                ? "Added lb"
                : "Weight (lb)";
          const wPh = kind === "hold" ? "opt." : "lb";
          html += '<div class="set-rows set-rows-' + kind + '">';
          html +=
            '<div class="set-row set-head" aria-hidden="true"><span></span><span>' +
            escapeHtml(wLabel) +
            "</span><span>" +
            escapeHtml(valLabel) +
            "</span><span></span></div>";
          (log.sets || []).forEach(function (set, si) {
            const weightCell = bw
              ? '<span class="set-bw">Body weight</span>'
              : '<input type="text" inputmode="decimal" data-field="weight" placeholder="' +
                wPh +
                '" value="' +
                escapeHtml(set.weight || "") +
                '" aria-label="' +
                escapeHtml(wLabel) +
                '" />';
            html +=
              '<div class="set-row" data-set-idx="' +
              si +
              '"><span class="set-label">Set ' +
              (si + 1) +
              "</span>" +
              weightCell +
              '<input type="text" inputmode="numeric" data-field="reps" placeholder="' +
              valPh +
              '" value="' +
              escapeHtml(set.reps || "") +
              '" aria-label="' +
              valLabel +
              '" /><button type="button" class="set-check' +
              (set.done ? " on" : "") +
              '" data-action="toggle-set" aria-label="Mark set done">' +
              (set.done ? "✓" : "○") +
              "</button></div>";
          });
          html += "</div>";
          html +=
            '<button type="button" class="btn-ex-done' +
            (log.exerciseDone ? " on" : "") +
            '" data-action="toggle-ex-done">' +
            (log.exerciseDone ? "Exercise done ✓" : "Mark exercise done") +
            "</button>";
        } else if (log.type === "cardio") {
          html += '<div class="cardio-fields">';
          html +=
            '<label>Distance<input type="text" inputmode="decimal" data-field="distance" placeholder="mi" value="' +
            escapeHtml(log.distance || "") +
            '" /></label>';
          html +=
            '<label>Time<input type="text" inputmode="numeric" data-field="time" placeholder="mm:ss" value="' +
            escapeHtml(log.time || "") +
            '" /></label>';
          html +=
            '<label>Pace<input type="text" data-field="pace" placeholder="/mi" value="' +
            escapeHtml(log.pace || "") +
            '" /></label>';
          html += "</div>";
          html +=
            '<button type="button" class="btn-ex-done' +
            (log.done ? " on" : "") +
            '" data-action="toggle-ex-done">' +
            (log.done ? "Segment complete ✓" : "Mark segment complete") +
            "</button>";
        } else {
          html +=
            '<div class="simple-check-row"><button type="button" class="btn-ex-done' +
            (log.done ? " on" : "") +
            '" data-action="toggle-ex-done">' +
            (log.done ? "Done ✓" : "Mark done") +
            "</button></div>";
        }

        // TEST max: log top result when finishing that lift
        if (workout.isTest && log.isMax && workout.metricId) {
          const already = sess.testLogged[workout.metricId];
          html +=
            '<button type="button" class="btn-log-test" data-action="log-test" data-metric="' +
            escapeHtml(workout.metricId) +
            '">' +
            (already ? "Result logged · edit in Progress" : "Log top result → Progress") +
            "</button>";
        }
        html += "</div>";
      });
      html += "</div>";
    });

    if (workout.notes && workout.notes.length) {
      html += '<div class="active-block"><h4>Notes</h4><ul class="notes-list">';
      workout.notes.forEach(function (n) {
        html += "<li>" + escapeHtml(n) + "</li>";
      });
      html += "</ul></div>";
    }

    body.innerHTML = html;
  }

  // ——— Render ———
  let pendingSelect = null;

  function $(sel) {
    return document.querySelector(sel);
  }

  function render() {
    state = ensureAssignments(state);
    saveState(state);

    const today = getTodayInfo();
    $("#week-label").textContent = "Week 1 · Ultra volume first";
    $("#today-date").textContent = formatTodayLabel(today.now) + " · MT";

    const doneCount = Object.keys(state.completed).length;
    $("#week-progress").textContent = doneCount + " of 7 workouts done this week";
    $("#progress-fill").style.width = (doneCount / 7) * 100 + "%";

    renderToday();
    renderWeek();
    renderProgress();
    renderGoals();
    renderProfileBody();
  }

  function renderToday() {
    const list = $("#options-list");
    const doneWrap = $("#today-done");
    const result = pickOptionsForToday(state);
    const badge = document.getElementById("done-badge");

    if (result.weekComplete) {
      list.innerHTML = "";
      doneWrap.classList.remove("hidden");
      doneWrap.querySelector(".done-card").classList.remove("in-progress");
      if (badge) {
        badge.textContent = "Logged";
        badge.classList.remove("in-progress");
      }
      $("#done-title").textContent = "Week 1 complete";
      $("#done-meta").textContent = "All seven workouts for the week are done. Great work.";
      $("#btn-undo").classList.add("hidden");
      $("#today-sub").textContent = "Everything for this week is finished.";
      return;
    }

    if (result.inProgress && result.pick) {
      list.innerHTML = "";
      doneWrap.classList.remove("hidden");
      doneWrap.querySelector(".done-card").classList.add("in-progress");
      if (badge) {
        badge.textContent = "In progress";
        badge.classList.add("in-progress");
      }
      $("#btn-undo").classList.remove("hidden");
      $("#done-title").textContent = result.pick.title;
      $("#done-meta").textContent =
        result.pick.slotName +
        " · " +
        plainDuration(result.pick.durationMin) +
        " · keep going, then tap Finish when you're done" +
        (result.pick.isTest ? " · test day" : "");
      $("#today-sub").textContent = "Session started — log as you go, then finish the workout.";
      // Inject continue button if missing
      let actions = doneWrap.querySelector(".done-actions");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "done-actions";
        const undo = $("#btn-undo");
        undo.parentNode.insertBefore(actions, undo);
        actions.appendChild(undo);
      }
      let cont = document.getElementById("btn-continue-workout");
      if (!cont) {
        cont = document.createElement("button");
        cont.type = "button";
        cont.id = "btn-continue-workout";
        cont.className = "btn-primary";
        cont.textContent = "Continue workout";
        actions.insertBefore(cont, actions.firstChild);
        cont.addEventListener("click", function () {
          const pick = state.todayPick;
          if (!pick) return;
          if (!state.activeSession) {
            const w = findWorkout(pick.slotId, pick.workoutId);
            if (w) state.activeSession = buildActiveSession(pick.slotId, w, getTodayInfo());
            saveState(state);
          }
          showActiveWorkout();
        });
      }
      cont.classList.remove("hidden");
      $("#btn-undo").textContent = "Abandon / change today";
      return;
    }

    if (result.done && result.pick) {
      list.innerHTML = "";
      doneWrap.classList.remove("hidden");
      doneWrap.querySelector(".done-card").classList.remove("in-progress");
      if (badge) {
        badge.textContent = "Finished";
        badge.classList.remove("in-progress");
      }
      const cont = document.getElementById("btn-continue-workout");
      if (cont) cont.classList.add("hidden");
      $("#btn-undo").classList.remove("hidden");
      $("#btn-undo").textContent = "Undo / change today";
      $("#done-title").textContent = result.pick.title;
      $("#done-meta").textContent =
        result.pick.slotName +
        " · " +
        plainDuration(result.pick.durationMin) +
        " · done for today · the rest of the week reshuffled" +
        (result.pick.isTest ? " · test day" : "");
      $("#today-sub").textContent = result.pick.isTest
        ? "Test day finished. Check Progress for your new mark."
        : result.pick.slotId === "long_run"
        ? "Done for today. If you feel up to it, an easy run tomorrow would make a good second day on tired legs. That is only a suggestion, so pick whatever fits tomorrow."
        : "Done for today. Come back tomorrow for fresh options.";
      return;
    }

    doneWrap.classList.add("hidden");
    const cont = document.getElementById("btn-continue-workout");
    if (cont) cont.classList.add("hidden");
    $("#today-sub").textContent =
      result.options.length +
      " choices today — tap one to start. Choosing locks today and reshuffles the rest of the week.";

    list.innerHTML = result.options
      .map(({ slotId, workout, tiredLegs }) => {
        const meta = SLOT_META[slotId];
        const isTest = !!workout.isTest;
        return (
          '<button type="button" class="option-card ' +
          workout.lengthClass +
          (isTest ? " test" : "") +
          '" data-slot="' +
          slotId +
          '" data-workout="' +
          workout.id +
          '" data-test="' +
          (isTest ? "1" : "0") +
          '">' +
          '<div class="option-top">' +
          '<span class="option-slot">' +
          escapeHtml(slotCardLabel(meta, isTest)) +
          "</span>" +
          '<span class="option-dur">' +
          escapeHtml(plainDuration(workout.durationMin)) +
          "</span>" +
          "</div>" +
          '<div class="option-title">' +
          escapeHtml(workout.title) +
          "</div>" +
          '<p class="option-blurb">' +
          escapeHtml(workout.summary) +
          "</p>" +
          (tiredLegs ? '<p class="option-tired-legs">' + escapeHtml(tiredLegs) + "</p>" : "") +
          '<div class="option-tags">' +
          (isTest ? '<span class="tag test-tag">Test / PR day</span>' : "") +
          (tiredLegs ? '<span class="tag tired-tag">Second day on tired legs</span>' : "") +
          '<span class="tag loc">' +
          escapeHtml(plainLocation(workout.location)) +
          "</span>" +
          '<span class="tag rpe">' +
          escapeHtml(plainEffort(workout.rpe)) +
          "</span>" +
          '<span class="tag">' +
          escapeHtml(plainLength(workout.lengthClass)) +
          "</span>" +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    list.querySelectorAll(".option-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        const slotId = btn.getAttribute("data-slot");
        const wid = btn.getAttribute("data-workout");
        const workout = findWorkout(slotId, wid);
        if (!workout) return;
        openModal(slotId, workout);
      });
    });
  }

  function renderWeek() {
    const list = $("#slots-list");
    const today = getTodayInfo();
    state = ensureAssignments(state);

    const pillarNote = document.getElementById("week-pillars");
    if (pillarNote) {
      pillarNote.textContent =
        "Built around your goals: athletic look, hunting fitness, ultra volume, personal PT marks, and strong core.";
    }

    list.innerHTML = SLOT_ORDER.map((slotId) => {
      const meta = SLOT_META[slotId];
      const done = state.completed[slotId];
      let status = "remaining";
      let statusIcon = "○";
      let dayLabel = "—";
      let detail = meta.blurb;

      if (done) {
        status = "done";
        statusIcon = "✓";
        dayLabel = done.dayLabel || "Done";
        detail = done.title + " · " + done.durationMin + " min";
      } else if (
        state.todayPick &&
        state.todayPick.slotId === slotId &&
        state.todayPick.dayKey === today.day.key
      ) {
        status = "scheduled";
        statusIcon = "▶";
        dayLabel = today.day.label;
        if (state.activeSession && state.activeSession.slotId === slotId) {
          detail = "Started — finish to complete · " + (state.todayPick.title || meta.blurb);
        } else {
          detail = "Chosen today — open Active Workout to log · " + (state.todayPick.title || meta.blurb);
        }
      } else {
        const dayKey = Object.keys(state.dayAssignments || {}).find(
          (k) => state.dayAssignments[k] === slotId
        );
        if (dayKey) {
          const d = DAYS.find((x) => x.key === dayKey);
          dayLabel = d ? d.label : dayKey;
          if (d && d.offset === today.offset) {
            status = "scheduled";
            statusIcon = "▶";
            detail = "Available in today's choices — " + meta.blurb;
          } else if (d && d.offset > today.offset) {
            status = "scheduled";
            statusIcon = "·";
            detail = "On the board later this week — " + meta.blurb;
          } else {
            status = "remaining";
            statusIcon = "!";
            detail = "Catch-up window — " + meta.blurb;
          }
        }
      }

      return (
        '<div class="slot-row ' +
        status +
        (dayLabel === today.day.label && !done ? " today" : "") +
        '">' +
        '<div class="slot-status ' +
        status +
        '">' +
        statusIcon +
        "</div>" +
        '<div class="slot-info"><h3>' +
        escapeHtml(meta.name) +
        "</h3><p>" +
        escapeHtml(detail) +
        "</p></div>" +
        '<div class="slot-day">' +
        escapeHtml(dayLabel) +
        "</div>" +
        "</div>"
      );
    }).join("");
  }

  function renderProgress() {
    const root = $("#progress-content");
    if (!root) return;

    ensureWorking1RM();
    const oneRmCard =
      '<article class="bench-card onerm-card">' +
      '<div class="bench-card-head"><div><h3>Working 1RMs</h3>' +
      '<span class="bench-unit">used to calculate daily training weights</span></div></div>' +
      '<p class="sub" style="margin-bottom:10px">Edit these anytime. Strength sets in Active Workout auto-fill from a % of these numbers (rounded to 5 lb). Saving a new personal best in Progress also bumps the matching working 1RM upward.</p>' +
      '<div class="onerm-grid">' +
      Object.keys(LIFT_1RM_META)
        .map(function (liftId) {
          const meta = LIFT_1RM_META[liftId];
          const val = getWorking1RM(liftId) || "";
          const metric = getMetric(liftId);
          const goal = metric && metric.goal != null ? metric.goal : "—";
          return (
            '<label class="onerm-field">' +
            "<span>" +
            escapeHtml(meta.label) +
            ' <em>goal ' +
            escapeHtml(String(goal)) +
            " lb</em></span>" +
            '<div class="onerm-input-row">' +
            '<input type="number" inputmode="numeric" min="45" max="1000" step="5" data-onerm="' +
            liftId +
            '" value="' +
            escapeHtml(String(val)) +
            '" aria-label="' +
            escapeHtml(meta.label) +
            ' 1RM" />' +
            "<span>lb</span></div></label>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="bench-actions onerm-actions" style="margin-top:12px">' +
      '<button type="button" class="btn-bench primary" id="btn-save-onerm">Save working 1RMs</button>' +
      '<button type="button" class="btn-bench" id="btn-refresh-onerm-session"' +
      (state.activeSession ? "" : " disabled") +
      ">" +
      (state.activeSession ? "Refresh loads in current workout" : "No workout in progress") +
      "</button>" +
      '</div><p class="onerm-status" id="onerm-status" aria-live="polite"></p></article>';

    root.innerHTML =
      oneRmCard +
      BENCH_GROUPS.map((g) => {
      const metrics = BENCH_METRICS.filter((m) => m.group === g.id);
      const cards = metrics
        .map((metric) => {
          const best = bestEntry(metric);
          const latest = latestEntry(metric);
          const hist = sortedEntries(metric.id).slice(0, 6);
          const pct = goalProgressPct(metric, best ? best.value : null);
          const meterClass =
            (metric.higherBetter ? "" : " toward-lower") + (metric.maxed ? " maxed" : "");
          let pctPill = "";
          if (pct != null) {
            const cls = metric.maxed || pct >= 100 ? "done" : pct < 40 ? "low" : "";
            pctPill =
              '<span class="pct-pill ' +
              cls +
              '">' +
              (metric.maxed ? "Goal reached" : pct + "% of the way to goal") +
              "</span>";
          } else if (metric.freeform) {
            pctPill = '<span class="pct-pill">Log anything</span>';
          }

          const histHtml = hist.length
            ? '<ul class="bench-history">' +
              hist
                .map((e) => {
                  return (
                    "<li>" +
                    '<span class="h-date">' +
                    escapeHtml(e.date.slice(5)) +
                    "</span>" +
                    "<span>" +
                    escapeHtml(e.note || (e.seeded ? "baseline" : "")) +
                    "</span>" +
                    '<span class="h-val">' +
                    escapeHtml(formatBenchValue(metric, e.value)) +
                    "</span>" +
                    (e.seeded
                      ? ""
                      : '<button type="button" class="h-del" data-del-metric="' +
                        metric.id +
                        '" data-del-id="' +
                        e.id +
                        '" aria-label="Delete">✕</button>') +
                    (e.note && !e.seeded
                      ? '<span class="h-note">' + escapeHtml(e.note) + "</span>"
                      : "") +
                    "</li>"
                  );
                })
                .join("") +
              "</ul>"
            : '<p class="bench-empty">No entries yet — tap Log to add one.</p>';

          const goalLabel =
            metric.goal != null
              ? formatBenchValue(metric, metric.goal)
              : metric.freeform
                ? "—"
                : "—";

          return (
            '<article class="bench-card" data-metric="' +
            metric.id +
            '">' +
            '<div class="bench-card-head">' +
            "<div><h3>" +
            escapeHtml(metric.name) +
            '</h3><span class="bench-unit">' +
            escapeHtml(
              metric.unit === "time"
                ? "mm:ss"
                : metric.unit === "note+value"
                  ? "value + note"
                  : metric.unit
            ) +
            "</span></div>" +
            pctPill +
            "</div>" +
            '<div class="bench-stats">' +
            '<div class="bench-stat best"><span class="lbl">Best</span><span class="val">' +
            escapeHtml(best ? formatBenchValue(metric, best.value) : "—") +
            "</span></div>" +
            '<div class="bench-stat"><span class="lbl">Latest</span><span class="val">' +
            escapeHtml(latest ? formatBenchValue(metric, latest.value) : "—") +
            "</span></div>" +
            '<div class="bench-stat goal"><span class="lbl">Goal</span><span class="val">' +
            escapeHtml(goalLabel) +
            "</span></div>" +
            "</div>" +
            (pct != null
              ? '<div class="bench-meter' +
                meterClass +
                '" aria-hidden="true"><span style="width:' +
                pct +
                '%"></span></div>'
              : "") +
            '<div class="bench-meta-row"><span>' +
            (latest
              ? "Last logged " + escapeHtml(latest.date)
              : "Not logged yet") +
            '</span></div>' +
            '<div class="bench-actions">' +
            '<button type="button" class="btn-bench primary" data-log="' +
            metric.id +
            '">' +
            (metric.unit === "lb" ? "Log 1RM" : "Log entry") +
            "</button>" +
            "</div>" +
            histHtml +
            "</article>"
          );
        })
        .join("");

      return (
        '<div class="bench-group">' +
        '<p class="bench-section-title">' +
        escapeHtml(g.title) +
        "</p>" +
        '<p class="sub" style="margin-bottom:10px">' +
        escapeHtml(g.blurb) +
        "</p>" +
        cards +
        "</div>"
      );
    }).join("");

    function setOneRmStatus(msg, isErr) {
      const el = document.getElementById("onerm-status");
      if (!el) return;
      el.textContent = msg || "";
      el.classList.toggle("err", !!isErr);
      el.classList.toggle("ok", !!msg && !isErr);
    }
    const saveOne = document.getElementById("btn-save-onerm");
    if (saveOne) {
      const doSave = function () {
        let ok = true;
        root.querySelectorAll("[data-onerm]").forEach(function (inp) {
          const liftId = inp.getAttribute("data-onerm");
          if (!setWorking1RM(liftId, inp.value)) ok = false;
        });
        if (!ok) {
          setOneRmStatus("Enter valid 1RMs in pounds (45–1000).", true);
          return;
        }
        if (state.activeSession) {
          refreshSessionSuggestedLoads(state.activeSession);
          saveState(state);
          if (document.getElementById("view-active") && !document.getElementById("view-active").hidden) {
            renderActiveWorkout();
          }
          setOneRmStatus("Saved. Active workout loads refreshed (your overrides kept).", false);
        } else {
          setOneRmStatus("Saved. New sessions will use these working 1RMs.", false);
        }
        // Re-render to sync displayed values, then restore status
        const msg = document.getElementById("onerm-status")
          ? document.getElementById("onerm-status").textContent
          : "";
        const wasErr = document.getElementById("onerm-status")
          ? document.getElementById("onerm-status").classList.contains("err")
          : false;
        renderProgress();
        setOneRmStatus(msg, wasErr);
      };
      saveOne.addEventListener("click", doSave);
      root.querySelectorAll("[data-onerm]").forEach(function (inp) {
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            doSave();
          }
        });
      });
    }
    const refreshOne = document.getElementById("btn-refresh-onerm-session");
    if (refreshOne) {
      refreshOne.addEventListener("click", function () {
        if (!state.activeSession) {
          setOneRmStatus("No workout in progress to refresh.", true);
          return;
        }
        refreshSessionSuggestedLoads(state.activeSession);
        saveState(state);
        renderActiveWorkout();
        setOneRmStatus("Loads refreshed from working 1RMs. Numbers you already changed were kept.", false);
      });
    }

    root.querySelectorAll("[data-log]").forEach((btn) => {
      btn.addEventListener("click", () => openBenchModal(btn.getAttribute("data-log")));
    });
    root.querySelectorAll("[data-del-metric]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mid = btn.getAttribute("data-del-metric");
        const eid = btn.getAttribute("data-del-id");
        if (!confirm("Delete this entry?")) return;
        deleteBenchEntry(mid, eid);
        renderProgress();
      });
    });
  }

  let pendingBenchMetricId = null;

  function todayDateInputValue() {
    const now = new Date();
    // America/Denver calendar date
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Denver",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year").value;
    const m = parts.find((p) => p.type === "month").value;
    const d = parts.find((p) => p.type === "day").value;
    return y + "-" + m + "-" + d;
  }

  let benchAfterSave = null;

  function openBenchModal(metricId, opts) {
    opts = opts || {};
    const metric = getMetric(metricId);
    if (!metric) return;
    pendingBenchMetricId = metricId;
    benchAfterSave = typeof opts.afterSave === "function" ? opts.afterSave : null;
    $("#bench-metric-id").value = metricId;
    $("#bench-modal-title").textContent = metric.name;
    const eye = $("#bench-modal") && $("#bench-modal").querySelector(".eyebrow");
    if (eye) eye.textContent = opts.headline || "Log entry";
    $("#bench-date").value = todayDateInputValue();
    $("#bench-note").value = opts.note || "";
    $("#bench-value").value = "";
    $("#bench-time").value = "";

    const isTime = metric.input === "time";
    $("#bench-time-wrap").hidden = !isTime;
    $("#bench-value-wrap").hidden = isTime;

    if (isTime) {
      $("#bench-value-label").textContent = "Time";
      $("#bench-time").required = true;
      $("#bench-value").required = false;
      $("#bench-time").placeholder = metric.id === "fire_195" ? "12:00" : "7:30";
    } else {
      $("#bench-time").required = false;
      $("#bench-value").required = true;
      if (metric.unit === "lb") $("#bench-value-label").textContent = "Your 1RM or best single (lb)";
      else if (metric.unit === "mi") $("#bench-value-label").textContent = "Distance (miles)";
      else if (metric.unit === "reps") $("#bench-value-label").textContent = "Reps";
      else if (metric.unit === "sec") $("#bench-value-label").textContent = "Seconds";
      else $("#bench-value-label").textContent = "Value";
      if (metric.freeform) {
        $("#bench-value-label").textContent = "Value (mi, min, or reps)";
        $("#bench-note").placeholder = "e.g. 5k road · 28:10";
      }
    }

    const saveBtn = $("#btn-bench-save");
    if (saveBtn) saveBtn.textContent = opts.note && /Test day/i.test(opts.note) ? "Save to Progress" : "Save entry";

    $("#bench-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeBenchModal() {
    $("#bench-modal").classList.add("hidden");
    document.body.style.overflow = "";
    pendingBenchMetricId = null;
    benchAfterSave = null;
  }

  function saveBenchFromForm() {
    const metricId = $("#bench-metric-id").value || pendingBenchMetricId;
    const metric = getMetric(metricId);
    if (!metric) return;
    const dateStr = $("#bench-date").value;
    if (!dateStr) {
      alert("Pick a date.");
      return;
    }
    let value = null;
    if (metric.input === "time") {
      value = parseTimeToSeconds($("#bench-time").value);
      if (value == null || value <= 0) {
        alert("Enter time as mm:ss (e.g. 7:30 or 12:00).");
        return;
      }
    } else {
      const raw = $("#bench-value").value.trim().replace(/,/g, "");
      value = Number(raw);
      if (!raw || Number.isNaN(value) || value < 0) {
        alert("Enter a valid number.");
        return;
      }
    }
    const note = $("#bench-note").value;
    if (metric.freeform && !note.trim()) {
      alert("Add a short note (distance name / context) for Other Distance.");
      return;
    }
    addBenchEntry(metricId, dateStr, value, note);
    const next = benchAfterSave;
    benchAfterSave = null;
    closeBenchModal();
    renderProgress();
    if (typeof next === "function") {
      setTimeout(next, 200);
    }
  }

  function renderGoals() {
    const el = $("#goals-content");
    el.innerHTML = `
      <div class="goal-card">
        <h3>Five North-Star Pillars</h3>
        <div class="goal-row"><span>1 · Physique</span><strong>Athletic look · arms/delts/upper back</strong></div>
        <div class="goal-row"><span>2 · Hunting</span><strong>Multi-day elk/deer hike capacity</strong></div>
        <div class="goal-row"><span>3 · Ultra</span><strong>Black Canyon 100k · easy volume first</strong></div>
        <div class="goal-row"><span>4 · PT marks</span><strong>Personal test targets (occasional checks)</strong></div>
        <div class="goal-row"><span>5 · Beast Core</span><strong>Armor low back · minimize pain</strong></div>
        <p class="goal-note" style="margin-top:10px">Running identity = ultra volume. Speed for timed checks comes mostly from that base — rare TEST days only. Not programming “job fitness.” Flag low-back flares; don’t over-coddle by default.</p>
      </div>
      <div class="goal-card">
        <h3>Race, Role &amp; Schedule</h3>
        <div class="goal-row"><span>Athlete</span><strong>Nathan · 37 · 215 lbs</strong></div>
        <div class="goal-row"><span>Schedule</span><strong>48/96 fire</strong></div>
        <div class="goal-row"><span>Week 1 start</span><strong>Wed Sep 23 2026 8am MT off</strong></div>
        <div class="goal-row"><span>Session length</span><strong>30–90 min</strong></div>
      </div>
      <div class="goal-card">
        <h3>Personal PT / Strength Targets</h3>
        <p class="goal-note" style="margin-bottom:8px">Tracked in Progress. Timed run checks are rare — volume does the work.</p>
        <div class="goal-row"><span>Longest easy (primary)</span><strong>Build past 10 mi</strong></div>
        <div class="goal-row"><span>1.95 mi (rare check)</span><strong>≤12:00</strong></div>
        <div class="goal-row"><span>Mile (rare check)</span><strong>~7:30 → faster via volume</strong></div>
        <div class="goal-row"><span>HR push-ups / 2 min</span><strong>70 <small style="color:var(--text-dim)">(now ~40)</small></strong></div>
        <div class="goal-row"><span>Dead-hang pull-ups</span><strong>30 <small style="color:var(--text-dim)">(now ~21)</small></strong></div>
        <div class="goal-row"><span>Deadlift</span><strong>405 <small style="color:var(--text-dim)">(now ~345)</small></strong></div>
        <div class="goal-row"><span>Bench</span><strong>315 <small style="color:var(--text-dim)">(now ~275)</small></strong></div>
        <div class="goal-row"><span>Back squat</span><strong>405 <small style="color:var(--text-dim)">(now ~315)</small></strong></div>
        <div class="goal-row"><span>Plank</span><strong>3 min maxed → weighted planks, rollouts, hanging</strong></div>
      </div>
      <div class="goal-card">
        <h3>Ultra Aerobic · How We Run</h3>
        <div class="goal-row"><span>10 mi continuous</span><strong>~11:00 / mi easy</strong></div>
        <div class="goal-row"><span>Daily run identity</span><strong>Conversational volume</strong></div>
        <div class="goal-row"><span>Speed / intervals</span><strong>Not a weekly focus</strong></div>
        <p class="goal-note" style="margin-top:10px">The long easy run, hills and hike legs, and easy runs stack Black Canyon fitness with hunting time on feet. You pick each day in any order. When an easy run lands the day after a long run, the app flags it as a second day on tired legs. “The speed will come with volume.”</p>
      </div>
      <div class="goal-card">
        <h3>Physique (without killing endurance)</h3>
        <p class="goal-note">Hypertrophy-friendly accessories on Strength A/B: lateral raises, curl bar arms, rear-delt dumbbell flyes, balanced push-pull. Kept after main strength/PT so they don't cannibalize long ultra volume.</p>
      </div>
      <div class="goal-card">
        <h3>Beast Core (back-pain insurance)</h3>
        <p class="goal-note">Resist arching with barbell rollouts from the knees, weighted front planks, and dead bugs. Resist twisting with single-arm dumbbell rows and Russian twists. Resist leaning with side planks and one-dumbbell suitcase carries. Build grip and posture with heavy farmer carries, and hang from the bar for knee raises working toward toes-to-bar. Freak Athlete Hyper Pro back extensions, reverse hypers, and side raises round it out. Core finishers come after strength days, plus the flex-day core session.</p>
      </div>
    `;
  }

  function renderProfileBody() {
    $("#profile-body").innerHTML = `
      <div class="block">
        <h4>Athlete</h4>
        <p class="goal-note">Nathan · 37 · 215 lbs</p>
      </div>
      <div class="block">
        <h4>Equipment</h4>
        <div class="equip-grid">
          <span class="equip-chip">Wahoo treadmill (courses / elevation)</span>
          <span class="equip-chip">Full power rack + FID bench</span>
          <span class="equip-chip">425 lb plates</span>
          <span class="equip-chip">Pull-up bar</span>
          <span class="equip-chip">Adjustable DBs 25–125</span>
          <span class="equip-chip">Freak Athlete Hyper Pro</span>
          <span class="equip-chip">Bicep curl bar</span>
        </div>
      </div>
      <div class="block">
        <h4>Locations</h4>
        <p class="goal-note">Home · Outdoor / trail · Fire station — workouts tagged when useful.</p>
      </div>
      <div class="block">
        <h4>Programming rules</h4>
        <ul class="notes-list">
          <li>Five goals: athletic look, hunting fitness, Black Canyon 100k volume, personal PT marks, and a strong core</li>
          <li>Squats are back squat or front squat only (no goblet squats)</li>
          <li>Hyper Pro means the standard Freak Athlete Hyper Pro (not the Hyper Pro X); only moves the base machine does are programmed</li>
          <li>Only well-known exercises that use the equipment above</li>
          <li>Split squats and lunges are fine; arm and shoulder extras belong after main strength work</li>
          <li>One active recovery / deep stretch day is required every week</li>
        </ul>
      </div>
    `;
  }

  function openModal(slotId, workout) {
    pendingSelect = { slotId, workout };
    const meta = SLOT_META[slotId];
    $("#modal-slot").textContent = slotCardLabel(meta, !!workout.isTest);
    $("#modal-title").textContent = workout.title;
    $("#modal-meta").textContent = sessionMetaLine(workout);
    const selBtn = $("#btn-select");
    if (selBtn) {
      selBtn.textContent = workout.isTest
        ? "Start this test"
        : "Start this workout";
    }

    let html = "";
    const tired = isEasyRunOption(slotId, workout) ? tiredLegsFromYesterday() : null;
    if (tired) {
      html +=
        '<div class="tired-legs-note"><p>' +
        escapeHtml(tiredLegsMessage(tired)) +
        "</p><p>" +
        escapeHtml(TIRED_LEGS_PRESCRIPTION) +
        "</p></div>";
    }
    if (workout.warmup && workout.warmup.length) {
      html += '<div class="block"><h4>Warm-up</h4><ul class="warmup-list">';
      workout.warmup.forEach((w) => {
        html += "<li>" + escapeHtml(w) + "</li>";
      });
      html += "</ul></div>";
    }
    (workout.blocks || []).forEach((block) => {
      html += '<div class="block"><h4>' + escapeHtml(block.name) + "</h4>";
      (block.items || []).forEach((item) => {
        html +=
          '<div class="exercise"><div class="exercise-name">' +
          escapeHtml(item.name) +
          '</div><div class="exercise-detail">' +
          escapeHtml(plainDetail(item)) +
          "</div>";
        if (item.note) {
          html += '<div class="exercise-note">' + escapeHtml(item.note) + "</div>";
        }
        const sugM = suggestWorkingWeight(item);
        if (sugM && !/1rm|best single|—\s*max/i.test(item.name + " " + (item.detail || ""))) {
          html +=
            '<div class="exercise-note pct-coach">' +
            escapeHtml(plainPercentCoach(sugM)) +
            "</div>";
        }
        html += "</div>";
      });
      html += "</div>";
    });
    if (workout.notes && workout.notes.length) {
      html += '<div class="block"><h4>Notes</h4><ul class="notes-list">';
      workout.notes.forEach((n) => {
        html += "<li>" + escapeHtml(n) + "</li>";
      });
      html += "</ul></div>";
    }
    $("#modal-body").innerHTML = html;
    $("#modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#modal").classList.add("hidden");
    document.body.style.overflow = "";
    pendingSelect = null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ——— Sanity: banned equipment / obscure moves (rules list) ———
  const BANNED_MOVE_PATTERNS = /ab\s*wheel|ab[\s-]*roller|hip\s*dip|copenhagen|pallof|landmine|cable|\bband\b|kettlebell|med(icine)?\s*ball|slider|stability\s*ball|\bsled\b|\btrx\b|stir[\s-]the[\s-]pot|body\s*saw|jefferson|hollow|dragon\s*flag|mcgill|get-up|windshield/i;
  function assertNoBannedMoves() {
    const all = [];
    Object.keys(WORKOUTS).forEach(function (k) { all.push.apply(all, WORKOUTS[k]); });
    all.push.apply(all, TEST_WORKOUTS);
    all.forEach(function (w) {
      (w.warmup || []).forEach(function (line) {
        if (BANNED_MOVE_PATTERNS.test(line)) console.error("CONTENT ERROR: banned warm-up item:", line);
      });
      (w.blocks || []).forEach(function (b) {
        (b.items || []).forEach(function (item) {
          if (BANNED_MOVE_PATTERNS.test((item.name || "") + " " + (item.note || ""))) {
            console.error("CONTENT ERROR: banned exercise:", item.name);
          }
        });
      });
    });
  }

  // ——— Sanity: ban goblet ———
  function assertNoGoblet() {
    Object.values(WORKOUTS).flat().forEach((w) => {
      (w.blocks || []).forEach((b) => {
        (b.items || []).forEach((item) => {
          if (/goblet\s*squat/i.test(item.name || "")) {
            console.error("CONTENT ERROR: goblet squat exercise:", item.name);
          }
        });
      });
    });
  }

  // ——— Events ———
  function bind() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        if (document.getElementById("app").classList.contains("active-mode")) {
          // Leaving active view via tabs — confirm if mid-log, then just hide (keep session)
          if (state.activeSession && sessionHasProgress(state.activeSession)) {
            if (!confirm("Leave active workout? Progress is saved — you can Continue from Today.")) return;
          }
          persistActiveFromDom();
          hideActiveWorkout();
        }
        const view = tab.getAttribute("data-view");
        document.querySelectorAll(".tab").forEach((t) => {
          t.classList.toggle("active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        document.querySelectorAll(".view").forEach((v) => {
          if (v.id === "view-active") return;
          const on = v.id === "view-" + view;
          v.classList.toggle("active", on);
          if (on) v.removeAttribute("hidden");
          else v.setAttribute("hidden", "");
        });
      });
    });

    $("#btn-select").addEventListener("click", () => {
      if (!pendingSelect) return;
      chooseAndStartWorkout(pendingSelect.slotId, pendingSelect.workout);
    });

    $("#modal").querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    $("#btn-profile").addEventListener("click", () => {
      $("#profile-modal").classList.remove("hidden");
      document.body.style.overflow = "hidden";
    });
    $("#profile-modal").querySelectorAll("[data-close-profile]").forEach((el) => {
      el.addEventListener("click", () => {
        $("#profile-modal").classList.add("hidden");
        document.body.style.overflow = "";
      });
    });

    $("#btn-undo").addEventListener("click", undoToday);
    $("#btn-reset-week").addEventListener("click", resetWeek);

    const btnBack = $("#btn-active-back");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        persistActiveFromDom();
        hideActiveWorkout();
        render();
      });
    }
    const btnAbandon = $("#btn-active-abandon");
    if (btnAbandon) {
      btnAbandon.addEventListener("click", () => {
        abandonActiveWorkout();
      });
    }
    const btnFinish = $("#btn-finish-workout");
    if (btnFinish) {
      btnFinish.addEventListener("click", () => {
        persistActiveFromDom();
        if (!confirm("Finish workout? This marks the weekly slot complete.")) return;
        finishWorkout();
      });
    }

    const activeBody = $("#active-body");
    if (activeBody) {
      activeBody.addEventListener("click", (e) => {
        const t = e.target.closest("[data-action]");
        if (!t || !state.activeSession) return;
        const action = t.getAttribute("data-action");
        if (action === "toggle-set") {
          t.classList.toggle("on");
          t.textContent = t.classList.contains("on") ? "✓" : "○";
          persistActiveFromDom();
          // auto-mark exercise done if all sets checked
          const ex = t.closest(".log-ex");
          if (ex) {
            const sets = ex.querySelectorAll(".set-check");
            const all = sets.length && Array.prototype.every.call(sets, (s) => s.classList.contains("on"));
            const doneBtn = ex.querySelector(".btn-ex-done");
            if (all && doneBtn && !doneBtn.classList.contains("on")) {
              doneBtn.classList.add("on");
              doneBtn.textContent =
                ex.getAttribute("data-log-type") === "cardio"
                  ? "Segment complete ✓"
                  : "Exercise done ✓";
              persistActiveFromDom();
            }
          }
          renderActiveWorkout();
        } else if (action === "toggle-ex-done") {
          t.classList.toggle("on");
          const typ = t.closest(".log-ex").getAttribute("data-log-type");
          if (typ === "cardio") {
            t.textContent = t.classList.contains("on") ? "Segment complete ✓" : "Mark segment complete";
          } else if (typ === "sets") {
            t.textContent = t.classList.contains("on") ? "Exercise done ✓" : "Mark exercise done";
          } else {
            t.textContent = t.classList.contains("on") ? "Done ✓" : "Mark done";
          }
          persistActiveFromDom();
          renderActiveWorkout();
        } else if (action === "log-test") {
          persistActiveFromDom();
          const mid = t.getAttribute("data-metric");
          const title = state.activeSession.title;
          logTestResultNow(mid, title);
        }
      });
      activeBody.addEventListener("change", (e) => {
        if (e.target.matches("[data-warmup-idx]")) {
          persistActiveFromDom();
          renderActiveWorkout();
        }
      });
      let persistTimer = null;
      activeBody.addEventListener("input", () => {
        clearTimeout(persistTimer);
        persistTimer = setTimeout(() => {
          persistActiveFromDom();
          const sess = state.activeSession;
          const workout = sess && findWorkout(sess.slotId, sess.workoutId);
          if (sess && workout) {
            const prog = countSessionProgress(sess, workout);
            const line = document.getElementById("active-progress-line");
            if (line) line.textContent = prog.done + " / " + prog.total + " items logged";
          }
        }, 200);
      });
    }

    const benchModal = $("#bench-modal");
    if (benchModal) {
      benchModal.querySelectorAll("[data-close-bench]").forEach((el) => {
        el.addEventListener("click", closeBenchModal);
      });
      $("#btn-bench-save").addEventListener("click", saveBenchFromForm);
      $("#bench-form").addEventListener("submit", (e) => {
        e.preventDefault();
        saveBenchFromForm();
      });
    }
  }

  // init
  assertNoGoblet();
  assertNoBannedMoves();
  bind();
  state = ensureAssignments(state);
  saveState(state);
  render();
  // Resume mid-session after refresh
  if (state.activeSession && state.todayPick && !state.completed[state.todayPick.slotId]) {
    showActiveWorkout();
  }
})();
