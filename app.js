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
    if (min > 90) {
      const m5 = Math.round(min / 5) * 5;
      const h = Math.floor(m5 / 60);
      const r = m5 % 60;
      return "About " + h + (h === 1 ? " hour" : " hours") + (r ? " " + r + " minutes" : "");
    }
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
   * Freak Athlete Hyper Pro (standard model, NOT the Hyper Pro X). Nathan owns the GHD Attachment and the Leg Developer
   * (NOT the Belt Squat Attachment or Upper Body Kit), so belt squats, loaded calf raises, rows/face pulls on the kit are never programmed.
   * Sources: freakathlete.co Hyper Pro FAQ ("With the Hyper Pro only"), how-to-use page, and Freak Athlete workout blogs.
   * Full research: HYPER_PRO_EXERCISES.md (not published).
   */
  const HP_NOTES = {
    reverseHyper: "Set the Freak Athlete Hyper Pro in 90-degree back extension mode and attach the GHD Attachment pad. Use the footplate handles to climb on, lie face down with your hips at the top edge of the GHD pad, keep holding the handles, and let your legs hang straight down behind you for the full range. Squeeze your glutes to lift both legs until they line up with your body, pause for one second, and lower slowly all the way down with no swinging. Stop when your legs reach level; kicking higher only arches your low back. Body weight only, smooth and easy to moderate effort. It should feel like a warm pump in your glutes and low back, never a pinch.",
    nordic: "Set the Hyper Pro in Nordic mode at an incline you can control, around 30 to 45 degrees to start (a higher angle is easier). Kneel on the pad with your ankles locked between the rollers and your feet flat on the footplate. Squeeze your glutes and keep a straight line from knees to shoulders, then lower yourself as slowly as you can, aiming for 3 to 5 seconds. When you can't hold it any longer, catch yourself with your hands and push back up to the start. End each set 1 to 2 reps before your form breaks. When every rep of every set feels controlled, drop the incline one notch the next week.",
    reverseNordic: "Set the Hyper Pro in Nordic mode (Freak Athlete's beginner workout uses the 20-degree setting). Kneel on the pad with your ankles locked in the rollers, just like a Nordic curl, and sit tall. Squeeze your glutes so your hips stay straight, then lean your whole body back from the knees as far as you can control, pause for a second, and pull yourself back up with your thighs. Start with a shallow lean and go a little deeper each week. Moderate effort; stop if you feel sharp pain in the knee. Keep your ribs down so your low back does not arch.",
    hipThrust: "Set the Hyper Pro to hip thrust mode: flip the post at the base up to vertical and move the top ankle roller onto it so it becomes your back rest. Sit on the floor with your upper back across the roller, feet flat about shoulder-width apart, and a padded barbell or one heavy dumbbell across your hips. Tuck your chin, drive through your heels, and squeeze your glutes until your body is flat from knees to shoulders, pause for two seconds, then lower under control. The rep ends when your hips are straight, so do not arch your low back to go higher. Pick a load you could lift 2 to 3 more times at the end of each set, and log the weight you used.",
    gluteHam: "Set the Hyper Pro in GHD mode with the GHD Attachment pad, and slide the pad so your knees sit just behind its back edge with your feet flat on the footplate and locked between the rollers. Start with your body straight and level with the floor, then pull yourself up by digging your toes into the footplate and curling with your hamstrings until you are upright, keeping your hips straight the whole time. Lower back down slowly over about 3 seconds. Easier version: raise the machine's incline, use a shorter range, or lower slowly and push off the floor with your hands to get back up. Harder version: full range at a flatter angle, a slower lowering, then a light plate held at your chest. End each set 1 to 2 reps before your hips start to bend.",
    sorensen: "Set the Hyper Pro in 90-degree back extension mode with the GHD Attachment pad, and slide it so your hip bones are just past the front edge with your ankles locked in the rollers. Cross your arms on your chest and hold your body in one straight line, level with the floor, from head to heels. Squeeze your glutes and keep your ribs down so your low back does not sag or arch. Start with 30 to 40 second holds, add 5 to 10 seconds each week, and hold a plate at your chest once 90 seconds is easy. If your low back complains, put your hands on the floor for help and shorten the hold. Log the seconds and any added plate.",
    ghdSitUp: "Set the Hyper Pro in GHD mode with the GHD Attachment pad, sit on the pad with your hips just past its edge, and lock your feet in the rollers with your knees slightly bent. Cross your arms on your chest, lean back under control only until your body is about level with the floor, stopping well short of full extension, then sit up by pulling with your abs and hips. Keep it smooth and moderate, with no bouncing or throwing your arms. Skip this exercise and do a side plank instead if your low back is flaring or you feel nerve pain down your leg.",
    legExtension: "Attach the Leg Developer to the front of the Hyper Pro and lock its clamp, then slide plates onto the weight horn. Sit on the flat pad with your knees at its front edge, the tops of your ankles behind the lower ankle roller, and hold the handles to stay seated. Straighten your knees until your legs are straight, squeeze your thighs for one second, then lower over 2 to 3 seconds. Pick a plate load you could lift 2 to 3 more times at the end of each set, and log the total plate weight you loaded. This builds your quads and knees for long downhill hiking.",
    hamCurl: "Attach the Leg Developer to the front of the Hyper Pro and lock its clamp, then slide plates onto the weight horn. Lie face down on the pad with your knees just past its edge and your heels under the roller pad, and hold the frame. Keep your hips pressed into the pad and curl your heels toward your glutes, squeeze for one second, then lower over 2 to 3 seconds without letting the weight drop. Pick a plate load you could lift 2 to 3 more times at the end of each set, and log the total plate weight you loaded.",
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
    return { name: "Hyper Pro Hip Thrust", detail: sets + " sets of " + reps + " reps. Stop each set when you could still do 2 to 3 more reps.", note: HP_NOTES.hipThrust, sets: sets, reps: reps, log: "reps", noLoad: true };
  }
  function hyperProSideRaise(sets, reps) {
    return { name: "Hyper Pro Side Raise (QL Raise)", detail: sets + " sets of " + reps + " reps per side", note: HP_NOTES.sideRaise, sets: sets, reps: reps, log: "reps", noLoad: true };
  }

  function hyperProGluteHamRaise(sets, reps) {
    return { name: "Hyper Pro Glute-Ham Raise (GHD Attachment)", detail: sets + " sets of " + reps + " reps", note: HP_NOTES.gluteHam, sets: sets, reps: reps, log: "reps", bw: true };
  }
  function hyperProSorensenHold(sets, secs) {
    return { name: "Hyper Pro Sorensen Hold (back extension hold)", detail: sets + " sets of " + secs + " seconds", note: HP_NOTES.sorensen, sets: sets, reps: secs, log: "hold", noLoad: true };
  }
  function hyperProGhdSitUp(sets, reps) {
    return { name: "Hyper Pro GHD Sit-Up (partial range)", detail: sets + " sets of " + reps + " reps", note: HP_NOTES.ghdSitUp, sets: sets, reps: reps, log: "reps", bw: true };
  }
  function hyperProLegExtension(sets, reps) {
    return { name: "Hyper Pro Leg Extension (Leg Developer)", detail: sets + " sets of " + reps + " reps. Stop each set when you could still do 2 to 3 more reps.", note: HP_NOTES.legExtension, sets: sets, reps: reps, log: "reps", noLoad: true };
  }
  function hyperProHamstringCurl(sets, reps) {
    return { name: "Hyper Pro Hamstring Curl (Leg Developer)", detail: sets + " sets of " + reps + " reps. Stop each set when you could still do 2 to 3 more reps.", note: HP_NOTES.hamCurl, sets: sets, reps: reps, log: "reps", noLoad: true };
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
        summary: "About 75 minutes of heavy back squats and bench press for strength and an athletic look, Leg Developer hamstring curls to balance your knees, then core work that protects your low back for ultra and hunting miles.",
        warmup: [
          "5 minutes of easy walking or jogging on the treadmill",
          "Hip circles and upper-back rotations for 2 minutes",
          "10 back squats with the empty bar, then a few lighter sets building up to your working weight",
        ],
        blocks: [
          {
            name: "Squat and hamstring work",
            items: [
              { name: "Back Squat", detail: "5 sets of 5 reps at about 78% of your 1RM. Stop each set when you could still do 2 to 3 more reps.", note: "Hard effort. The weight comes from your back-squat max in Progress (starting point 315 lb). Squat to full depth; no pause is needed at the bottom.", liftId: "back_squat", pct1rm: 78, sets: 5, reps: 5 },
              hyperProHamstringCurl(3, 12),
            ],
          },
          {
            name: "Pressing and physique extras",
            items: [
              { name: "Barbell Bench Press", detail: "4 sets of 6 reps at about 75% of your 1RM. Stop each set when you could still do 2 to 3 more reps.", note: "Hard effort. The weight comes from your bench max in Progress (starting point 275 lb). Balanced pressing for your push-up marks and an athletic look.", liftId: "bench", pct1rm: 75, sets: 4, reps: 6 },
              { name: "Seated Dumbbell Overhead Press (adjustable bench)", detail: "3 sets of 8 reps", note: "Builds rounded shoulders for an athletic look. Use dumbbells somewhere between 25 and 70 lb.", sets: 3, reps: 8 },
              { name: "Dumbbell Lateral Raises", detail: "3 sets of 12 reps", note: "Builds the sides of your shoulders. Use a light to moderate weight and do not swing.", sets: 3, reps: 12 },
              { name: "EZ-Bar Biceps Curls", detail: "3 sets of 10 reps", note: "Extra arm work that does not interfere with your ultra training.", sets: 3, reps: 10 },
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
        notes: ["Program hard; flag any low-back flare and swap to lighter front squats plus extra dead bugs and planks.", "Drink water throughout. This session takes about 75 minutes."],
      },
      {
        id: "sa-short-squat-core",
        title: "Front squat triples and core",
        durationMin: 35,
        lengthClass: "short",
        location: "Home · Rack",
        rpe: "7",
        summary: "A tight 30 to 35 minute session: front squat triples, pressing, and dense core. Fits a compressed day while still hitting squat strength and low-back armor.",
        warmup: ["2 minutes of easy treadmill walking", "15 bodyweight squats", "10 easy push-ups"],
        blocks: [
          {
            name: "Main strength",
            items: [
              { name: "Front Squat", detail: "6 sets of 3 reps at about 72% of your 1RM.", note: "Hard effort. Keep every set of three crisp and fast. A belt is optional.", liftId: "back_squat", pct1rm: 72, sets: 6, reps: 3 },
              { name: "Close-Grip Bench Press or Floor Press", detail: "4 sets of 6 reps at about 75% of your 1RM. Stop each set when you could still do 2 to 3 more reps.", note: "Builds your triceps and lockout strength, which carries over to push-ups.", liftId: "bench", pct1rm: 75, sets: 4, reps: 6 },
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
              { name: "Dumbbell Lateral Raises", detail: "2 sets of 15 reps", note: "Athletic shoulders without making the session much longer.", sets: 2, reps: 15 },
              { name: "EZ-Bar Biceps Curls", detail: "2 sets of 12 reps", note: "A small dose of arm work for your physique goal.", sets: 2, reps: 12 },
            ],
          },
        ],
        notes: ["Short option for on-shift or compressed days.", "No goblet squats. Front squats only here."],
      },
      {
        id: "sa-long-volume",
        title: "Squat volume and heavy carries",
        durationMin: 90,
        lengthClass: "long",
        location: "Home · Full gym",
        rpe: "7–8",
        summary: "A fuller day of about 90 minutes: squat volume toward your 405 goal, Leg Developer leg extensions for downhill knees, upper-body work for physique, Hyper Pro hip thrusts for your glutes, and heavy carries for hunting and core strength.",
        warmup: ["5 to 8 minutes of easy walking or jogging on the treadmill", "8 front squats with the empty bar", "15 light dumbbell rear-delt raises"],
        blocks: [
          {
            name: "Squat volume",
            items: [
              { name: "Back Squat", detail: "4 sets of 8 reps at about 68% of your 1RM.", note: "Solid effort. Muscle-building volume toward your 405 lb goal. Lower and stand up at a steady, controlled speed.", liftId: "back_squat", pct1rm: 68, sets: 4, reps: 8 },
              { name: "Bulgarian Split Squat (rear foot elevated)", detail: "3 sets of 8 reps per leg", note: "Rest the top of your back foot on the FID bench or the Hyper Pro hip thrust roller and hold a dumbbell in each hand. Drop your back knee straight down toward the floor, keep your torso tall and your front heel planted, and drive up through your front foot. Moderate to hard effort: finish each set with about 2 reps left. Log the dumbbell weight in each hand.", sets: 3, reps: 8, log: "reps", noLoad: true },
              hyperProLegExtension(3, 12),
            ],
          },
          {
            name: "Press, posterior chain, and physique",
            items: [
              { name: "Incline Dumbbell Bench Press (adjustable bench)", detail: "4 sets of 8 reps. Stop each set when you could still do 2 to 3 more reps.", note: "Builds your upper chest. Choose dumbbells you can finish every rep with cleanly; this is not based on a percentage of your barbell bench.", sets: 4, reps: 8 },
              hyperProHipThrust(3, 10),
              { name: "EZ-Bar Biceps Curls", detail: "3 sets of 10 reps", note: "Extra arm work after the main lifts.", sets: 3, reps: 10 },
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
        notes: ["The long option for when you have the full 90 minutes.", "Hyper Pro means your Freak Athlete Hyper Pro."],
      },
    ],

    strength_b: [
      {
        id: "sb-hinge-pt",
        title: "Deadlift, pull-ups, and push-ups",
        durationMin: 80,
        lengthClass: "medium",
        location: "Home · Rack and barbell",
        rpe: "7–8",
        summary: "About 80 minutes: deadlifts toward your 405 lb goal, Hyper Pro Nordic curls for your hamstrings without more low-back load, personal pull-up and push-up practice, then anti-twist core so your back stays durable for long days on your feet.",
        warmup: [
          "5 minutes of easy walking or jogging on the treadmill",
          "10 bodyweight hip hinges, then 12 glute bridges",
          "Deadlift warm-up sets: the empty bar, then 135 lb, then 225 lb, then your working weight",
        ],
        blocks: [
          {
            name: "Hinge strength",
            items: [
              { name: "Conventional Deadlift", detail: "5 sets of 3 reps at about 78% of your 1RM. Stop each set when you could still do 2 to 3 more reps.", note: "Hard effort. The weight comes from your deadlift max in Progress (starting point 345 lb, goal 405 lb). Keep your low back flat and brace hard, but do not baby it.", liftId: "deadlift", pct1rm: 78, sets: 5, reps: 3 },
              hyperProNordicCurl(3, 5),
            ],
          },
          {
            name: "Pull-ups, push-ups, and physique",
            items: [
              { name: "Dead-Hang Pull-Ups", detail: "5 sets, adding up as many total reps as you can toward 30", note: "Your personal target is 30 in one set; your starting point was 21. Start every rep from a full dead hang.", sets: 5 },
              { name: "Bent-Over Barbell Row or Chest-Supported Dumbbell Row", detail: "4 sets of 6 reps", note: "Builds a thicker upper back and balances all the pressing, for your physique and posture.", sets: 4, reps: 6 },
              { name: "Hand-Release Push-Ups (2-minute test practice)", detail: "3 sets of as many clean reps as you can in 45 to 60 seconds", note: "Your personal target is 70 in 2 minutes (you are at about 40 now). This is practice for packing more reps into less time, not a job fitness block. Log the reps you got each set.", sets: 3, bw: true },
              { name: "Rear-Delt Dumbbell Flyes", detail: "3 sets of 15 reps", note: "Bend forward with a flat back and raise light dumbbells out to the sides, squeezing your shoulder blades together. Shoulder health and an athletic upper-back look.", sets: 3, reps: 15 },
              { name: "EZ-Bar Biceps Curls or Hammer Curls", detail: "3 sets of 10 reps", note: "Extra arm work. Keep it easy on your grip before the heavy carries.", sets: 3, reps: 10 },
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
        notes: ["Strength B is the PT maxes day.", "If your low back nags during deadlifts, cut the number of sets and lean on Romanian deadlifts and Hyper Pro work next session."],
      },
      {
        id: "sb-short-pt-core",
        title: "Pull-ups, push-ups, and core",
        durationMin: 30,
        lengthClass: "short",
        location: "Home or Fire Station",
        rpe: "7–8",
        summary: "Thirty minutes of pull-up and push-up practice plus hanging core. Works at home or the station and still counts as your hinge and pull strength day.",
        warmup: ["Arm circles, then 2 dead hangs from the bar for 20 seconds each", "10 easy push-ups"],
        blocks: [
          {
            name: "Pull-ups and push-ups",
            items: [
              { name: "Dead-Hang Pull-Up Ladder", detail: "Do 1 pull-up, then 2, then 3, adding one rep each round until you can't finish a round", note: "Rest 45 to 60 seconds between rounds. Log your total reps." },
              { name: "Push-Ups Every Minute", detail: "12 sets of 8 reps. Start a new set at the top of each minute.", note: "Stop each set when you could still do 2 more reps and rest for whatever is left of the minute. This builds your 2-minute push-up capacity.", sets: 12, reps: 8, bw: true },
              { name: "Strict EZ-Bar Biceps Curls", detail: "3 sets of 10 reps", note: "Keeps your elbows healthy and finishes off your arms.", sets: 3, reps: 10 },
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
        notes: ["Works at the fire station if there is a pull-up bar.", "Short option that still counts as Strength B."],
      },
      {
        id: "sb-hyper-row",
        title: "Hyper Pro hinge and row volume",
        durationMin: 70,
        lengthClass: "medium",
        location: "Home · Hyper Pro and rack",
        rpe: "7",
        summary: "About 70 minutes of full-range Hyper Pro reverse hypers and glute-ham raises on the GHD Attachment, Romanian deadlifts, heavy rows, and a small dose of GHD sit-ups — builds the posterior chain for ultra climbs and hunting without a max deadlift day.",
        warmup: ["5 minutes of easy walking or jogging on the treadmill", "15 bodyweight back extensions on the Hyper Pro", "15 light dumbbell rear-delt raises"],
        blocks: [
          {
            name: "Posterior chain",
            items: [
              hyperProReverseHyper(3, 12, "Warms up your glutes and low back before the hinge work."),
              hyperProGluteHamRaise(3, 6),
              { name: "Barbell Romanian Deadlift", detail: "4 sets of 6 reps at about 55% of your deadlift 1RM.", note: "Builds hinge strength without the fatigue of heavy deadlifts.", liftId: "deadlift", pct1rm: 55, sets: 4, reps: 6 },
              { name: "Dumbbell Walking Lunges", detail: "3 sets of 10 reps per leg", note: "Extra leg work for hiking. Log the dumbbell weight in each hand.", sets: 3, reps: 10 },
            ],
          },
          {
            name: "Pulling strength",
            items: [
              { name: "Pull-Ups (add weight once you can do more than 10 strict reps)", detail: "4 rounds, stopping each round 2 reps short of your max", note: "Start each rep from a dead hang. Once you can do more than 10 strict reps, hold a dumbbell between your feet." },
              { name: "Single-Arm Dumbbell Row", detail: "4 sets of 8 reps per side", note: "Go heavy: 70 to 100 lb or more.", sets: 4, reps: 8 },
            ],
          },
          {
            name: "Core finish",
            items: [
              hyperProGhdSitUp(2, 8),
              { name: "Side Plank", detail: "3 sets of 40 seconds per side", note: "Lie on your side and prop yourself up on your forearm with your elbow right under your shoulder. Lift your hips so your body is a straight line from head to feet, and hold still without letting your hips sag. Do one side, then the other. When the hold feels easy, rest a dumbbell on your top hip and log that weight.", sets: 3, reps: 40, log: "hold", noLoad: true },
            ],
          },
        ],
        notes: ["Equipment: your Freak Athlete Hyper Pro."],
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
        warmup: ["Walk for 3 to 5 minutes, then ease into a jog"],
        blocks: [
          {
            name: "Easy aerobic miles",
            items: [
              { name: "Easy continuous run, 40 to 50 minutes", detail: "About 11 to 12 minutes per mile. Keep it easy enough to talk in full sentences.", note: "Talk in full sentences the whole way. Walk brief hills if needed. Black Canyon base." },
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
        warmup: ["Start easy. No strides needed."],
        blocks: [
          {
            name: "Easy miles",
            items: [
              { name: "Very easy run, 35 to 45 minutes", detail: "Easy enough to talk in full sentences. Breathe through your nose if you can.", note: "Keep your ego at home. Time on your feet matters more than pace." },
              { name: "Optional hike or walk for the last 10 minutes", detail: "Only if your legs feel heavy", note: "Walking still counts toward your time on feet." },
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
        summary: "Easy miles on soft trails toward your 100k. Hike the steep parts, keep every minute conversational, and build time on your feet.",
        warmup: ["2 minutes of loosening up at the trailhead"],
        blocks: [
          {
            name: "Easy trail volume",
            items: [
              { name: "Easy trail jog and hike, 45 to 55 minutes", detail: "Easy enough to talk in full sentences.", note: "This matches what your ultra will feel like. Power-hike the climbs and jog the flats and downhills easily." },
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
        notes: ["Outdoors on a trail.", "Counts as your easy run for the week."],
      },
    ],

    easy_hike: [
      {
        id: "eh-hyper-hills",
        title: "Hyper Pro and easy hills",
        durationMin: 55,
        lengthClass: "medium",
        location: "Home · Hyper Pro and Wahoo treadmill",
        rpe: "5–6",
        summary: "Incline time-on-feet plus Hyper Pro back and knee work (reverse hypers, back extensions, and reverse Nordics for downhill durability) for Black Canyon climbs and multi-day elk or deer hunts. Steady effort you can sustain.",
        warmup: ["5 minutes of easy walking or jogging on flat ground"],
        blocks: [
          {
            name: "Aerobic time on feet",
            items: [
              { name: "Wahoo Incline Walk or Jog", detail: "Easy incline walk or jog for about 30 minutes. Keep it easy enough to talk.", note: "Builds climbing fitness for Black Canyon and your hunts at the same time." },
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
        notes: ["Hyper Pro means your Freak Athlete Hyper Pro.", "Keep it easy: this is for volume and hills, not speed.", "Supports your ultra and hunting goals."],
      },
      {
        id: "eh-trail-easy",
        title: "Easy trail with light pack",
        durationMin: 60,
        lengthClass: "medium",
        location: "Outdoor / Trail",
        rpe: "4–5",
        summary: "An easy trail outing with a light pack that toughens your feet for the ultra and feels like a hunt: time on your feet, strong hips, and patience under load.",
        warmup: ["3 minutes of loosening up at the trailhead"],
        blocks: [
          {
            name: "Trail time",
            items: [
              { name: "Easy trail outing, 45 to 55 minutes", detail: "Steady effort. Hike the steep parts.", note: "Carry an optional 10 to 20 lb pack to build toward hunting days. Breathe through your nose when you can." },
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
        notes: ["Outdoors on a trail.", "Builds volume for Black Canyon and carries over to hunting. Keep it conversational."],
      },
      {
        id: "eh-short-hyper",
        title: "Short Hyper Pro hills",
        durationMin: 30,
        lengthClass: "short",
        location: "Home",
        rpe: "5",
        summary: "A quick 30 minutes: incline walk, Hyper Pro reverse hypers and reverse Nordics, and carries. Climbing legs, downhill knees, and hunt base when the day is short.",
        warmup: ["March in place for 2 minutes"],
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
        notes: ["A short option for aerobic fitness and hiking legs."],
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
        warmup: ["Walk for 5 minutes, then run the first mile very easily"],
        blocks: [
          {
            name: "Ultra long easy run",
            items: [
              { name: "Easy continuous run, 9 to 11 miles", detail: "Average about 11 minutes per mile. Keep it easy enough to talk in full sentences.", note: "Your starting point is 10 miles at about 11 minutes per mile. Walk short hills if you need to. Eat and drink if you are out longer than 75 minutes." },
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
          "Outdoors is best. The Wahoo treadmill is fine with a fan.",
        ],
      },
      {
        id: "lr-progressive",
        title: "Long easy run by time",
        durationMin: 85,
        lengthClass: "long",
        location: "Wahoo or Outdoor",
        rpe: "3–4",
        summary: "Build the long run by time: 80 to 90 minutes, easy and conversational. Progress by lasting longer, not by running faster.",
        warmup: ["Walk for 3 to 5 minutes"],
        blocks: [
          {
            name: "Time on feet",
            items: [
              { name: "Easy continuous run, 80 to 90 minutes", detail: "Easy enough to talk in full sentences. Stay relaxed the whole time.", note: "You can mix jogging and hiking on trails. Add about 5 to 10 minutes in future weeks when this feels easy." },
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
        notes: ["This long run gets longer over the coming weeks to build toward your ultra.", "Do not finish with a fast section."],
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
              { name: "Easy trail run, 75 to 95 minutes", detail: "Easy enough to talk in full sentences.", note: "Power-hike the climbs and stay on soft ground. You can add a light pack in later weeks." },
              hyperProReverseHyper(3, 12, "Only if you're home. Easy flush after the run.", "Post-run Hyper Pro Reverse Hyper (if home)"),
            ],
          },
        ],
        notes: ["Toughens your feet for Black Canyon and hunting.", "Outdoors on a trail."],
      },
      {
        id: "lr-short-bridge",
        title: "Easy hour run",
        durationMin: 60,
        lengthClass: "medium",
        location: "Outdoor / Tread",
        rpe: "3–4",
        summary: "A shorter long-run option for a week that is already full. Still easy volume, and still fully conversational.",
        warmup: ["Easy start"],
        blocks: [
          {
            name: "Easy volume",
            items: [
              { name: "Easy run, 60 minutes", detail: "About 11 to 12 minutes per mile.", note: "Do not race it. Save this one for after a night shift or a heavy strength day." },
              hyperProReverseHyper(3, 12, "Only if you're home. Easy flush after the run.", "Post-run Hyper Pro Reverse Hyper (if home)"),
            ],
          },
        ],
        notes: ["An in-between option. Keep it very easy."],
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
        summary: "Required weekly recovery: deep stretching, breathing, and light movement. It is not a couch day; it keeps your strength and ultra days sharp.",
        warmup: ["5 minutes of easy walking"],
        blocks: [
          {
            name: "Mobility flow: rotate and breathe",
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
              { name: "Walk while breathing through your nose", detail: "8 to 10 minutes", note: "Calms your nervous system down." },
            ],
          },
        ],
        notes: ["Required every week. Do not skip it.", "If your low back is flared up, focus on breathing and hip stretches, and skip any deep stretch that makes it worse."],
      },
      {
        id: "rec-station",
        title: "Station stretch circuit",
        durationMin: 30,
        lengthClass: "short",
        location: "Fire Station",
        rpe: "2",
        summary: "A 30-minute stretch circuit you can do at the house or station so the recovery slot still gets done.",
        warmup: ["March in place for 2 minutes"],
        blocks: [
          {
            name: "Mobility circuit (2 or 3 rounds)",
            items: [
              { name: "Hip Flexor Stretch", detail: "Hold 60 seconds on each side" },
              { name: "Doorway Chest Stretch", detail: "Hold 45 seconds on each side" },
              { name: "Deep Squat Hold (heels raised is fine)", detail: "Hold for 60 seconds", note: "Body weight only." },
              { name: "Thread-the-Needle Upper-Back Stretch", detail: "5 reps on each side", note: "On your hands and knees, slide one arm under your body along the floor until your shoulder and cheek rest down, hold for a breath, then reach that arm up to the ceiling. Switch sides." },
              { name: "Side Plank (easy)", detail: "Hold 20 seconds on each side", note: "Prop yourself up on your forearm with your hips lifted in a straight line. This just wakes your core up; it is not a max effort." },
              { name: "Easy Hallway Walk", detail: "3 minutes of easy laps" },
            ],
          },
        ],
        notes: ["Works at the fire station.", "Still counts as your required recovery session."],
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
        summary: "A focused 35-minute core session to protect your low back: barbell rollouts, Hyper Pro Sorensen holds for back endurance, heavy suitcase carries, side planks, and Hyper Pro side raises, then hanging leg work and Hyper Pro reverse hypers. Your plain plank is maxed, so this adds load and range instead.",
        warmup: ["3 minutes of easy treadmill walking", "8 slow cat-cows, then 5 slow dead bugs on each side to practice bracing"],
        blocks: [
          {
            name: "Anti-extension and back endurance",
            items: [
              { name: "Barbell Rollout (from the knees)", detail: "5 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 5, reps: 8, log: "reps", bw: true },
              hyperProSorensenHold(3, 40),
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
        warmup: ["No warm-up needed. Just start easy."],
        blocks: [
          {
            name: "Easy aerobic",
            items: [
              { name: "Very easy jog or incline walk, 40 to 50 minutes", detail: "Easy enough to talk in full sentences.", note: "Keep it conversational, or easy enough to breathe through your nose. This adds ultra volume; it is not a hard day." },
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
        warmup: ["5 minutes of easy movement", "10 squats with the empty bar"],
        blocks: [
          {
            name: "Strength catch-up circuit (4 rounds)",
            items: [
              { name: "Front Squat", detail: "4 rounds of 6 reps at about 60% of your back-squat 1RM.", note: "Easy to solid effort. Not a max day, just a catch-up dose.", liftId: "back_squat", pct1rm: 60, sets: 4, reps: 6 },
              { name: "Romanian Deadlift", detail: "4 rounds of 6 reps at about 65% of your deadlift 1RM.", note: "Easy to solid hinge volume to catch up.", liftId: "deadlift", pct1rm: 65, sets: 4, reps: 6 },
              { name: "Pull-Ups", detail: "Each round, stop 2 reps short of your max" },
              { name: "Push-Ups", detail: "12 to 20 reps each round" },
              { name: "Barbell Rollout (from the knees)", detail: "4 sets of 8 reps", note: "Put a 45 lb plate (or 25s) on each end of the barbell so it rolls, kneel behind it, and grip it shoulder-width. Squeeze your glutes and brace your abs, then slowly roll the bar forward as far as you can without your low back sagging, and pull it back using your abs. End the set when your hips drop or your back starts to arch. Roll a little farther each week before adding reps.", sets: 4, reps: 8, log: "reps", bw: true },
              { name: "Farmer Carry (two dumbbells)", detail: "4 sets of 40 seconds", note: "Hold a heavy dumbbell in each hand (start around 70 to 100 lb each) and walk with short, steady steps. Stand tall, keep your shoulders back, and brace your abs like you are about to get bumped. End the set if your grip or posture breaks. Log the weight per hand and the seconds you walked.", sets: 4, reps: 40, log: "carry", noLoad: true },
            ],
          },
        ],
        notes: ["This does not replace Strength A or B if those are still open. Do and log those first.", "No goblet squats."],
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
        "5 minutes of easy walking or jogging on the treadmill, plus hip stretches",
        "10 squats with the empty bar, then gradually heavier warm-up sets",
      ],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Back Squat", detail: "10 reps with the empty bar", note: "Grooves the movement.", noLoad: true },
            { name: "Back Squat", detail: "5 reps at about 50% of your 1RM", note: "Your starting point was about 315 lb.", sets: 1, reps: 5, pct1rm: 50 },
            { name: "Back Squat", detail: "3 reps at about 65% of your 1RM", note: "", sets: 1, reps: 3, pct1rm: 65 },
            { name: "Back Squat", detail: "2 reps at about 75% of your 1RM", note: "", sets: 1, reps: 2, pct1rm: 75 },
            { name: "Back Squat", detail: "1 rep at about 85% of your 1RM", note: "", sets: 1, reps: 1, pct1rm: 85 },
            { name: "Back Squat", detail: "1 rep at about 90 to 93% of your 1RM", note: "If it moves fast, take one more single.", sets: 1, reps: 1, pct1rm: 92 },
            { name: "Back Squat — Opener / Max", detail: "1RM or best single", note: "Stop before you miss a rep. Your goal is 405 lb." },
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
      location: "Home · Adjustable bench and rack",
      rpe: "9–10",
      isTest: true,
      summary: "Occasional bench max: progressive singles to a heavy single or 1RM. You’ll be prompted to log it in Progress when you finish.",
      warmup: ["10 easy push-ups", "10 bench presses with the empty bar", "A few gradually heavier warm-up sets"],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Bench Press", detail: "10 reps with the empty bar, then 5 reps at 50% of your 1RM, then 3 reps at 65%", note: "Your starting point was about 275 lb; your goal is 315 lb.", sets: 1, reps: 5, pct1rm: 50 },
            { name: "Bench Press", detail: "2 reps at 75% of your 1RM, then 1 rep at 85%, then 1 rep at 90%", note: "", sets: 1, reps: 2, pct1rm: 75 },
            { name: "Bench Press — Max", detail: "Best single / 1RM", note: "Use a spotter or the safety bars. Only count reps with a clean lockout." },
          ],
        },
        {
          name: "Optional back-off sets",
          items: [
            { name: "Close-Grip Bench", detail: "2 sets of 6 reps at about 70% of your bench 1RM", note: "Only if joints feel happy after the max.", liftId: "bench", pct1rm: 70, sets: 2, reps: 6 },
          ],
        },
      ],
      notes: ["An occasional test day. It counts as Strength A when you choose it.", "You will be asked to log the result in Progress."],
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
      warmup: ["5 minutes of easy movement", "10 bodyweight hip hinges", "Gradually heavier deadlift warm-up sets, starting with the empty bar"],
      blocks: [
        {
          name: "Build up to a heavy single",
          items: [
            { name: "Conventional Deadlift", detail: "5 reps with the empty bar, then 3 reps at 50% of your 1RM, then 2 reps at 65%", note: "Your starting point was about 345 lb.", sets: 1, reps: 3, pct1rm: 50 },
            { name: "Conventional Deadlift", detail: "1 rep at 75% of your 1RM, then 1 rep at 85%, then 1 rep at 90%", note: "Reset your setup before every rep.", sets: 1, reps: 1, pct1rm: 75 },
            { name: "Deadlift — Max", detail: "Best single / 1RM", note: "Brace hard. Stop if your low back flares up, and do not grind out ugly reps." },
          ],
        },
        {
          name: "Posterior flush",
          items: [
            hyperProReverseHyper(2, 12, "Easy flush after the heavy singles, body weight only."),
          ],
        },
      ],
      notes: ["An occasional test day. It counts as Strength B.", "Hyper Pro means your Freak Athlete Hyper Pro."],
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
      summary: "A rare personal check: as many hand-release push-ups as you can in 2 minutes, plus one max set of dead-hang pull-ups. This is not weekly job fitness.",
      warmup: ["2 minutes of easy movement", "Hang from the bar for 20 seconds, twice", "10 easy push-ups"],
      blocks: [
        {
          name: "Personal PT max checks",
          items: [
            { name: "Dead-Hang Pull-Ups — Max set", detail: "1 all-out set", note: "Start every rep from a full hang. Your starting point was 21 and your goal is 30. Rest at least 5 minutes afterward." },
            { name: "Hand-Release Push-Ups — 2-minute max", detail: "Max reps in 2 minutes", note: "You are at about 40 now; your personal target is 70 in 2 minutes. Only do the full test on test days." },
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
      notes: ["A rare personal test, not job fitness programming.", "You’ll be prompted to log push-ups then pull-ups."],
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
      summary: "A rare personal check: 1.95 miles all-out, aiming for 12 minutes or less. Easy volume does the work; this just measures it.",
      warmup: ["10 minutes easy", "3 strides of 20 seconds each (quick but relaxed)", "2 minutes easy"],
      blocks: [
        {
          name: "All-out time check",
          items: [
            { name: "1.95 miles all-out", detail: "Aim for 12 minutes or less", note: "Run on flat ground or the Wahoo treadmill at 0.5% incline. Start hard, settle in, then finish strong." },
            { name: "Cool-down walk", detail: "5 to 8 minutes", note: "" },
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
      summary: "A rare mile check (your starting point was about 7 minutes 30 seconds). Expect the time to improve from easy volume across the week, not from intervals.",
      warmup: ["8 to 10 minutes easy", "4 strides of 20 seconds each (quick but relaxed)"],
      blocks: [
        {
          name: "Mile time check",
          items: [
            { name: "1 mile all-out", detail: "Best time", note: "Even splits if possible." },
            { name: "Easy jog", detail: "5 minutes", note: "" },
          ],
        },
      ],
      notes: ["Rare test day. It counts as your easy run for the week when you choose it. It is not a weekly speed day."],
    },
  ];

  // ——— State ———
  function defaultState() {
    return {
      weekId: currentWeekId(),
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
      if (parsed.weekId !== currentWeekId()) return defaultState();
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

  /** Calendar program week (0 = week of Wed Sep 23, 2026). Weeks run Wednesday to Tuesday. */
  function currentCalendarWeekIndex() {
    return Math.max(0, Math.floor(dayOffsetFromWeekStart(new Date()) / 7));
  }

  /** Week 1 keeps its original id so saved Week 1 progress still loads; later weeks start fresh. */
  function currentWeekId() {
    const idx = currentCalendarWeekIndex();
    return idx === 0 ? WEEK_ID : "2026-prog-week-" + (idx + 1);
  }

  function getTodayInfo() {
    const now = new Date();
    let offset = dayOffsetFromWeekStart(now) - 7 * currentCalendarWeekIndex();
    // Clamp inside the current Wednesday-to-Tuesday week
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
  /** Program week index from the Week 1 anchor (0 = week of Wed Sep 23, 2026). state.testWeekIndex simulates a week. */
  function getProgramWeekIndex() {
    if (state && state.testWeekIndex != null && !isNaN(Number(state.testWeekIndex))) return Number(state.testWeekIndex);
    return currentCalendarWeekIndex();
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
    // No all-out timed run checks during the Black Canyon build (volume first, no fire-pace sessions).
    if (week < 3 || week <= raceWeekIndex()) {
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

  // ——— Black Canyon 100K weekly mileage plan ———
  // Race date confirmed on Aravaipa Running's Black Canyon Ultras page and UltraSignup:
  // 100K on Saturday, February 13, 2027 (the 50K is the next day). Editable on the Goals tab.
  const RACE_DEFAULT_DATE = new Date(2027, 1, 13);
  const RACE = {
    name: "Black Canyon 100K",
    date: RACE_DEFAULT_DATE,
    label: "",
    miles: 62.2,
    confirmed: true,
    source: "Aravaipa Running's Black Canyon Ultras page and UltraSignup",
  };
  const MILES_KEY = "nc-adaptive-coach-miles-v1";
  const RACE_KEY = "nc-adaptive-coach-race-v1";

  function raceLabelFor(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  function raceWeekday() {
    return RACE.date.toLocaleDateString("en-US", { weekday: "long" });
  }
  function isoDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  /** Load the race date (saved on the Goals tab) or fall back to the confirmed date. */
  function loadRaceDate() {
    let d = RACE_DEFAULT_DATE;
    try {
      const raw = localStorage.getItem(RACE_KEY);
      const m = raw && /^(\d{4})-(\d{2})-(\d{2})$/.exec(JSON.parse(raw).date || "");
      if (m) {
        const cand = new Date(+m[1], +m[2] - 1, +m[3]);
        if (!isNaN(cand) && cand > WEEK_START) d = cand;
      }
    } catch {
      d = RACE_DEFAULT_DATE;
    }
    RACE.date = d;
    RACE.label = raceLabelFor(d);
    RACE.edited = isoDate(d) !== isoDate(RACE_DEFAULT_DATE);
    planCache = null;
  }
  function saveRaceDate(str) {
    if (!str) {
      localStorage.removeItem(RACE_KEY);
    } else {
      localStorage.setItem(RACE_KEY, JSON.stringify({ date: str }));
    }
    loadRaceDate();
  }

  const PHASES = {
    base: { label: "Base building", tiredMiles: 4, minEasy: 3 },
    build: { label: "Building volume", tiredMiles: 5, minEasy: 4 },
    block: { label: "Big mileage block", tiredMiles: 6, minEasy: 4 },
    peak: { label: "Peak weeks", tiredMiles: 6.5, minEasy: 4 },
    taper: { label: "Taper", tiredMiles: 4, minEasy: 3 },
    race: { label: "Race week", tiredMiles: 3, minEasy: 3 },
    recovery: { label: "Recovery after the race", tiredMiles: 3, minEasy: 3 },
  };

  /**
   * ===== PLAN DATA (swappable) =====
   * PROVISIONAL numbers: a first-pass miles progression. Another methodology can replace PLAN_META and
   * PLAN_WEEKS without touching the tracker, history, sizing, or UI code, as long as the shape stays the same.
   *
   * PLAN_WEEKS row shape (miles only):
   *   { weekIndex, targetMiles, longRunMiles, isCutback, phase, peakLongDay?, taperPct?, raceWeek?, checkpoint? }
   *   weekIndex 0 = the week of Wed Sep 23, 2026 (weeks run Wednesday to Tuesday).
   *   phase is a key of PHASES (base, build, block, peak, taper, race; recovery is generated after the race).
   *   The LAST row must be race week. getPlanSchedule() anchors that last row to RACE.date, so if the race
   *   date moves the rows shift (peak and taper still land right before race day) and early weeks are smoothed
   *   to the 10 percent rule. Written for the Feb 13, 2027 race, which falls in weekIndex 20.
   */
  const PLAN_META = {
    name: "Black Canyon 100K miles plan",
    provisional: true,
    startWeeklyMiles: 20, // current base is about 15 to 20 miles a week
    // Early-January readiness check: longest single logged run and the average of the last 3 weeks.
    checkpoint: { longestRunMiles: 18, recentAvgMiles: 38, closeLongestMiles: 14, closeAvgMiles: 30 },
  };
  const PLAN_WEEKS = [
    { weekIndex: 0, targetMiles: 20, longRunMiles: 10, isCutback: false, phase: "base" },
    { weekIndex: 1, targetMiles: 22, longRunMiles: 11, isCutback: false, phase: "base" },
    { weekIndex: 2, targetMiles: 24, longRunMiles: 12, isCutback: false, phase: "base" },
    { weekIndex: 3, targetMiles: 19, longRunMiles: 9, isCutback: true, phase: "base" },
    { weekIndex: 4, targetMiles: 26, longRunMiles: 12, isCutback: false, phase: "base" },
    { weekIndex: 5, targetMiles: 28, longRunMiles: 13, isCutback: false, phase: "base" },
    { weekIndex: 6, targetMiles: 30, longRunMiles: 14, isCutback: false, phase: "build" },
    { weekIndex: 7, targetMiles: 24, longRunMiles: 10, isCutback: true, phase: "build" },
    { weekIndex: 8, targetMiles: 33, longRunMiles: 15, isCutback: false, phase: "build" },
    { weekIndex: 9, targetMiles: 36, longRunMiles: 16, isCutback: false, phase: "build" },
    { weekIndex: 10, targetMiles: 39, longRunMiles: 17, isCutback: false, phase: "build" },
    { weekIndex: 11, targetMiles: 31, longRunMiles: 13, isCutback: true, phase: "block" },
    { weekIndex: 12, targetMiles: 42, longRunMiles: 18, isCutback: false, phase: "block" },
    { weekIndex: 13, targetMiles: 45, longRunMiles: 20, isCutback: false, phase: "block" },
    { weekIndex: 14, targetMiles: 48, longRunMiles: 22, isCutback: false, phase: "block" },
    { weekIndex: 15, targetMiles: 38, longRunMiles: 14, isCutback: true, phase: "block", checkpoint: true },
    { weekIndex: 16, targetMiles: 50, longRunMiles: 24, isCutback: false, phase: "peak", peakLongDay: true },
    { weekIndex: 17, targetMiles: 46, longRunMiles: 18, isCutback: false, phase: "peak" },
    { weekIndex: 18, targetMiles: 35, longRunMiles: 14, isCutback: false, phase: "taper", taperPct: 70 },
    { weekIndex: 19, targetMiles: 25, longRunMiles: 10, isCutback: false, phase: "taper", taperPct: 50 },
    { weekIndex: 20, targetMiles: 8, longRunMiles: 62.2, isCutback: false, phase: "race", raceWeek: true },
  ];
  // ===== end PLAN DATA =====
  const TABLE_RACE_WEEK = PLAN_WEEKS.length - 1;
  const START_WEEKLY_MILES = PLAN_META.startWeeklyMiles;

  function weekStartDate(w) {
    return new Date(WEEK_START.getFullYear(), WEEK_START.getMonth(), WEEK_START.getDate() + 7 * w);
  }

  function raceWeekIndex() {
    return Math.floor(dayOffsetFromWeekStart(RACE.date) / 7);
  }

  let planCache = null;
  loadRaceDate();
  /** Full schedule from week 0 through a few recovery weeks after the race, anchored to the race date. */
  function getPlanSchedule() {
    if (planCache) return planCache;
    const rw = raceWeekIndex();
    const shift = rw - TABLE_RACE_WEEK;
    const out = [];
    let lastFull = START_WEEKLY_MILES;
    for (let w = 0; w <= rw + 3; w++) {
      const src = w - shift;
      let row;
      if (src < 0) {
        row = Object.assign({}, PLAN_WEEKS[0], { isCutback: false, checkpoint: false });
      } else if (src <= TABLE_RACE_WEEK) {
        row = Object.assign({}, PLAN_WEEKS[src]);
      } else {
        const after = src - TABLE_RACE_WEEK;
        row = {
          targetMiles: after === 1 ? 6 : after === 2 ? 12 : 18,
          longRunMiles: after === 1 ? 3 : after === 2 ? 6 : 8,
          isCutback: false,
          phase: "recovery",
        };
      }
      // Smoothing: full weeks never jump more than about 10 percent (or 2 to 3 miles at low volume).
      if (!row.isCutback && (row.phase === "base" || row.phase === "build" || row.phase === "block" || row.phase === "peak")) {
        const cap = Math.round(Math.max(lastFull * 1.1, lastFull + 2));
        if (row.targetMiles > cap) {
          row.targetMiles = cap;
          row.longRunMiles = Math.min(row.longRunMiles, Math.round(cap * 0.48));
        }
        lastFull = row.targetMiles;
      }
      row.weekIndex = w;
      row.weekStart = weekStartDate(w);
      out.push(row);
    }
    planCache = out;
    return out;
  }

  function getWeekPlan(w) {
    const sched = getPlanSchedule();
    const rw = raceWeekIndex();
    const idx = Math.max(0, Math.min(w, sched.length - 1));
    const row = Object.assign({}, sched[idx]);
    row.weekIndex = w;
    row.weekStart = weekStartDate(w);
    row.planWeekNumber = w + 1;
    row.totalPlanWeeks = rw + 1;
    row.weeksToRace = rw - w;
    row.phaseLabel = (PHASES[row.phase] || PHASES.base).label;
    return row;
  }

  function fmtNum(n) {
    const v = Math.round((Number(n) || 0) * 10) / 10;
    return v % 1 === 0 ? String(v) : v.toFixed(1);
  }
  function fmtMiles(m) {
    const s = fmtNum(m);
    return s + (s === "1" ? " mile" : " miles");
  }
  function roundHalf(x) {
    return Math.round(x * 2) / 2;
  }
  function clampNum(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }
  function round5(min) {
    return Math.max(5, Math.round(min / 5) * 5);
  }
  function fmtMinutes(min) {
    const m5 = round5(min);
    if (m5 < 90) return m5 + " minutes";
    const h = Math.floor(m5 / 60);
    const r = m5 % 60;
    return h + (h === 1 ? " hour" : " hours") + (r ? " " + r + " minutes" : "");
  }
  /** "about 55 to 60 minutes" for a distance at a pace range in minutes per mile. */
  function timeRangeText(miles, lo, hi) {
    const a = round5(miles * lo);
    const b = round5(miles * hi);
    if (a === b) return "about " + fmtMinutes(a);
    if (b < 90) return "about " + a + " to " + b + " minutes";
    return "about " + fmtMinutes(a) + " to " + fmtMinutes(b);
  }
  function shortDate(d) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  function longDate(d) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  }

  // ——— Miles log (runs, hikes, incline walks; survives week resets) ———
  const MILES_KINDS = {
    run: "Run",
    long: "Long run",
    hills: "Hills or incline session",
    hike: "Hike or hunting hike",
    incline: "Incline or pack walk",
    race: "Race",
  };

  function loadMiles() {
    try {
      const arr = JSON.parse(localStorage.getItem(MILES_KEY) || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }
  function saveMiles(arr) {
    localStorage.setItem(MILES_KEY, JSON.stringify(arr.slice(-1500)));
  }
  function addMilesEntry(entry) {
    const arr = loadMiles();
    entry.id = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    arr.push(entry);
    saveMiles(arr);
    return entry;
  }
  function deleteMilesEntry(id) {
    saveMiles(loadMiles().filter((e) => e.id !== id));
  }
  function removeWorkoutMiles(dateKey, slotId) {
    saveMiles(loadMiles().filter((e) => !(e.source === "workout" && e.dateKey === dateKey && e.slotId === slotId)));
  }
  function milesEntriesForWeek(w) {
    return loadMiles()
      .filter((e) => e.weekIndex === w)
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  }
  function milesForWeek(w, opts) {
    const skipRace = opts && opts.skipRace;
    return Math.round(milesEntriesForWeek(w).reduce((s, e) => s + (skipRace && e.kind === "race" ? 0 : Number(e.miles) || 0), 0) * 10) / 10;
  }

  /** Which sessions add their logged cardio distance to the weekly miles. */
  const MILES_SLOTS = ["speed_run", "long_run", "easy_hike"];
  function workoutCountsMiles(slotId, workout) {
    if (MILES_SLOTS.includes(slotId)) return true;
    return !!workout && workout.id === "fx-second-aerobic";
  }
  function milesKindFor(slotId, workout) {
    if (workout && workout.runPlan && workout.runPlan.kind === "race") return "race";
    if (slotId === "long_run") return "long";
    if (slotId === "easy_hike") return "hills";
    return "run";
  }

  function pendingSessionMiles() {
    const sess = state.activeSession;
    if (!sess) return 0;
    const w = resolveWorkout(sess.slotId, sess.workoutId, sess.runPlan);
    if (!workoutCountsMiles(sess.slotId, w)) return 0;
    return summarizeCardioLogs(sess.logs).miles;
  }

  // ——— Run sizing: fit the remaining run sessions to the weekly target ———
  const RUN_CAPS = { speed_run: 7, flex: 7, easy_hike: 5.5 }; // keeps every non-long session at 90 minutes or less
  const HILLS_MIN = 3;

  function computeWeekSizing() {
    const w = getProgramWeekIndex();
    const plan = getWeekPlan(w);
    const phase = PHASES[plan.phase] || PHASES.base;
    const today = getTodayInfo();
    const logged = milesForWeek(w, { skipRace: plan.phase === "race" });
    const pick = state.todayPick && state.todayPick.dayKey === today.day.key ? state.todayPick : null;
    const pickOpen = pick && !state.completed[pick.slotId];
    // Miles from today's started run count as planned until it is finished and logged.
    let pendingPlanned = 0;
    if (pickOpen && pick.runPlan && pick.runPlan.kind !== "race") {
      pendingPlanned = Math.max(pendingSessionMiles(), Number(pick.runPlan.miles) || 0) + (Number(pick.runPlan.double) || 0);
    }
    const remaining = Math.max(0, plan.targetMiles - logged - pendingPlanned);
    const daysLeft = Math.max(0, 7 - today.offset - (pick ? 1 : 0));

    const nonLong = plan.targetMiles - plan.longRunMiles;
    const flexIsRun = plan.phase === "race" || (plan.phase !== "recovery" && nonLong > 11);
    const order = ["long_run", "speed_run", "easy_hike"].concat(flexIsRun ? ["flex"] : []);
    const open = order.filter((s) => !state.completed[s] && !(pick && pick.slotId === s));
    const counted = open.slice(0, daysLeft);

    const sizes = {};
    const doubles = {};
    let pool = remaining;
    let shortfall = 0;
    let flexNeeded = false;

    if (plan.phase === "race") {
      if (open.includes("long_run")) sizes.long_run = RACE.miles;
      sizes.speed_run = 3;
      sizes.flex = 3;
      sizes.easy_hike = 2;
      return { w, plan, phase, logged, remaining: Math.max(0, plan.targetMiles - logged), daysLeft, open, counted, sizes, doubles, shortfall: 0, behind: false, ahead: logged >= plan.targetMiles, flexIsRun, flexNeeded: true };
    }

    if (counted.includes("long_run")) {
      sizes.long_run = plan.longRunMiles;
      pool -= plan.longRunMiles;
    } else if (open.includes("long_run")) {
      sizes.long_run = plan.longRunMiles;
    }
    const others = counted.filter((s) => s !== "long_run");
    const minEasy = phase.minEasy;
    const ahead = remaining <= 0.25;
    if (others.length) {
      const share = Math.max(0, pool) / others.length;
      let used = 0;
      if (others.includes("easy_hike")) {
        sizes.easy_hike = roundHalf(clampNum(share * 0.85, HILLS_MIN, RUN_CAPS.easy_hike));
        used += sizes.easy_hike;
      }
      const easySlots = others.filter((s) => s !== "easy_hike");
      if (easySlots.length) {
        const each = roundHalf(clampNum((Math.max(0, pool) - used) / easySlots.length, minEasy, RUN_CAPS.speed_run));
        easySlots.forEach((s) => {
          sizes[s] = each;
          used += each;
        });
      }
      shortfall = Math.max(0, pool - used);
      // At higher volume, easy days can add an optional short second run (each run stays under 90 minutes).
      const doublesOk = plan.phase === "block" || plan.phase === "peak" || plan.phase === "build";
      if (doublesOk && shortfall >= 1.5 && easySlots.length) {
        easySlots.forEach((s) => {
          if (shortfall < 1.5) return;
          const d = roundHalf(clampNum(shortfall, 3, 4));
          doubles[s] = d;
          shortfall = Math.max(0, shortfall - d);
        });
      }
      // Flex offers the extra easy run only when the other runs can't comfortably cover the week.
      if (flexIsRun && others.includes("flex")) {
        const comfy = (others.includes("speed_run") ? 6 : 0) + (others.includes("easy_hike") ? 4.5 : 0);
        flexNeeded = pool > comfy + 1;
      }
    } else {
      shortfall = Math.max(0, pool);
    }
    // Slots beyond the days left still get a sensible size in case he picks them.
    const fallbackShare = roundHalf(clampNum(Math.max(0, pool) / Math.max(1, others.length || 1), minEasy, RUN_CAPS.speed_run));
    ["speed_run", "easy_hike", "flex"].forEach((s) => {
      if (sizes[s] == null) {
        sizes[s] = s === "easy_hike" ? roundHalf(clampNum(fallbackShare * 0.85, HILLS_MIN, RUN_CAPS.easy_hike)) : fallbackShare;
      }
    });
    if (ahead) {
      sizes.speed_run = minEasy;
      sizes.flex = minEasy;
      sizes.easy_hike = HILLS_MIN;
    }
    // What a full, untouched week can hold, so a small built-in gap is not called "behind".
    const doublesPossible = plan.phase === "block" || plan.phase === "peak" || plan.phase === "build";
    const fullCapacity =
      plan.longRunMiles + RUN_CAPS.speed_run + RUN_CAPS.easy_hike + (flexIsRun ? RUN_CAPS.flex : 0) +
      (doublesPossible ? 4 * (flexIsRun ? 2 : 1) : 0);
    const structuralShort = Math.max(0, plan.targetMiles - fullCapacity);
    const behind = !ahead && shortfall - structuralShort >= 1.5;
    return { w, plan, phase, logged, remaining, daysLeft, open, counted, sizes, doubles, shortfall: Math.round(shortfall * 10) / 10, behind, ahead, flexIsRun, flexNeeded };
  }

  /** Plan object stored on a sized option, the started session, and today's pick. */
  function runPlanFor(slotId, workout, sizing, tired) {
    if (!workout || workout.isTest) return null;
    const plan = sizing.plan;
    const base = { weekIndex: sizing.w, phase: plan.phase, targetMiles: plan.targetMiles, cutback: !!plan.isCutback };
    if (slotId === "long_run") {
      if (plan.raceWeek) return Object.assign(base, { kind: "race", miles: RACE.miles });
      // Fueling practice from the Build phase (November) onward on long runs over about 90 minutes.
      const fueling = plan.phase !== "base" && plan.longRunMiles * 11.5 > 90;
      return Object.assign(base, { kind: "long", miles: plan.longRunMiles, peakDay: !!plan.peakLongDay, fueling: fueling });
    }
    const note = sizingNote(slotId, sizing);
    if (slotId === "speed_run") {
      let miles = sizing.sizes.speed_run;
      if (tired) miles = sizing.ahead ? sizing.phase.minEasy : Math.min(RUN_CAPS.speed_run, Math.max(sizing.phase.tiredMiles, miles));
      return Object.assign(base, { kind: "easy", miles: miles, double: sizing.doubles.speed_run || 0, tired: !!tired, note: note });
    }
    if (slotId === "easy_hike") {
      return Object.assign(base, { kind: "hills", miles: sizing.sizes.easy_hike, note: note, downhill: downhillWeek(plan) });
    }
    if (slotId === "flex" && workout.id === "fx-second-aerobic") {
      let miles = sizing.sizes.flex;
      if (tired) miles = sizing.ahead ? sizing.phase.minEasy : Math.min(RUN_CAPS.flex, Math.max(sizing.phase.tiredMiles, miles));
      return Object.assign(base, { kind: "flex", miles: miles, double: sizing.doubles.flex || 0, tired: !!tired, note: note });
    }
    return null;
  }

  function sizingNote(slotId, sizing) {
    const plan = sizing.plan;
    if (plan.phase === "race") return "Race week: keep it short and easy so your legs are fresh on " + raceWeekday() + ".";
    if (sizing.ahead) return "You have already reached this week's target of " + fmtMiles(plan.targetMiles) + ", so this stays short and easy.";
    let s =
      (sizing.logged > 0
        ? "Sized for this week: " + fmtMiles(sizing.remaining) + " to go toward " + fmtMiles(plan.targetMiles)
        : "Sized for this week's target of " + fmtMiles(plan.targetMiles)) +
      ", with " + sizing.daysLeft + (sizing.daysLeft === 1 ? " day" : " days") + " left in the week, counting today.";
    if (sizing.behind) s += " These runs are capped at a normal size, so you may come up a little short this week, and that is fine. Don't cram.";
    return s;
  }

  function tiredLegsPrescription(workout) {
    const rp = workout && workout.runPlan;
    if (!rp || !rp.miles) return TIRED_LEGS_PRESCRIPTION;
    const m = workout.displayMiles || rp.miles;
    const trail = workout.id === "sp-trail-volume";
    return (
      "Plan on about " + fmtMiles(m) + ", " + timeRangeText(m, trail ? 12 : 11, trail ? 13 : 12) +
      ", and let the pace be as slow as it needs to be. Time on your feet matters more than speed today."
    );
  }

  function doubleItem(d) {
    return {
      name: "Optional second easy run later today, " + fmtMiles(d),
      detail: "About " + fmtMiles(d) + ", " + timeRangeText(d, 11, 12) + ". Only if your legs feel good and you have the time. Keep it easy enough to talk in full sentences.",
      note: "Two easy runs in one day keep every run under 90 minutes while the weekly miles climb. Skip it if you are tired; missing it is fine.",
    };
  }

  const FUEL_TEXT =
    "Fueling practice: eat about 200 to 300 calories and drink regularly every hour, starting in the first 30 to 45 minutes. Use the exact foods and drinks you plan to use at Black Canyon, and afterward jot down what sat well and what didn't.";
  const DOWNHILL_TEXT =
    "Downhill durability: Black Canyon drops more than it climbs, with roughly 7,300 feet of descent against 5,200 feet of climbing, so practice controlled, easy downhill running on trail. Take short, quick steps, stay relaxed, and let gravity do the work without braking hard. On the Wahoo KICKR RUN you can also lower the deck to its 3 percent decline for a few easy minutes at the end.";

  /** Hills sessions from December onward get the downhill note (through the taper, not race week). */
  function downhillWeek(plan) {
    const dec1 = new Date(2026, 11, 1);
    const weekEnd = new Date(plan.weekStart.getFullYear(), plan.weekStart.getMonth(), plan.weekStart.getDate() + 6);
    return weekEnd >= dec1 && plan.phase !== "race" && plan.phase !== "recovery";
  }

  const LONG_RUN_RULE = "This is the only session of the week allowed to go past 90 minutes, so schedule it on a day off shift.";
  const LONG_RUN_FUEL = "Bring water, and once you are out longer than about 75 minutes, eat something every 30 to 45 minutes.";
  const PEAK_DAY_TEXT = "This is your biggest day before the race: about 24 miles or about 5 hours on your feet, whichever comes first. Practice race-day eating and drinking.";

  /** Apply a stored run plan to a base workout (pure: same inputs give the same blocks and log keys). */
  function applyRunPlan(slotId, base, rp) {
    if (!base || !rp) return base;
    const w = JSON.parse(JSON.stringify(base));
    w.runPlan = rp;
    const first = w.blocks && w.blocks[0] && w.blocks[0].items;
    const m = Number(rp.miles) || 0;

    if (rp.kind === "race") {
      w.title = "Black Canyon 100K race day";
      w.durationMin = 840;
      w.lengthClass = "long";
      w.location = "Outdoor / Trail";
      w.rpe = "3–4";
      w.summary =
        "Race day, " + RACE.label + ": 62 miles on the Black Canyon Trail from Mayer toward Phoenix. Start easy enough to talk, hike every real climb, and eat and drink from the first hour. Pick this on race day, " + raceWeekday() + ".";
      w.warmup = ["Walk around the start area for 5 to 10 minutes and keep the first miles very easy"];
      w.blocks = [
        {
          name: "Race day",
          items: [
            {
              name: "Black Canyon 100K trail run, 62 miles",
              detail: "The whole race at an easy, patient effort. Walk the climbs early so you can still run the last 20 miles.",
              note: "Enter the distance when you finish and it counts toward race week.",
            },
          ],
        },
      ];
      w.notes = ["You trained for this all winter. Run your own race.", "Pick this on race day only. Earlier in race week, choose a short easy run instead."];
      return w;
    }

    if (rp.kind === "long") {
      const t = timeRangeText(m, 11, 12);
      const extra = (rp.peakDay ? " " + PEAK_DAY_TEXT : "") + (rp.cutback ? " It is a little shorter this week because this is a lighter week." : "");
      if (base.id === "lr-short-bridge") {
        w.title = "Shorter long run, about 5 miles";
        w.summary =
          "A fallback for a week that is already packed: about 5 easy miles in 60 minutes. Only use it if the full long run of about " + fmtMiles(m) + " can't happen this week; the full long run matters most, so try to fit it on your next day off shift instead.";
        w.notes = ["An in-between option. Keep it very easy.", "The full long run this week is about " + fmtMiles(m) + "."];
        return w;
      }
      w.durationMin = Math.round((m * (base.id === "lr-trail-long" ? 13.5 : 11.5)) / 5) * 5;
      w.notes = [LONG_RUN_RULE].concat(rp.fueling ? [FUEL_TEXT] : []).concat((base.notes || []).filter((n) => !/TEST|fire-pace/i.test(n)));
      w.fueling = !!rp.fueling;
      if (base.id === "lr-progressive") {
        const mid = fmtMinutes(m * 11.5);
        w.title = "Long easy run by time, about " + mid;
        w.summary = "Build the long run by time: about " + mid + " of easy running, which is roughly " + fmtMiles(m) + ". " + LONG_RUN_RULE + extra;
        if (first && first[0]) {
          first[0].name = "Easy continuous run, about " + mid;
          first[0].detail = "Run easy for about " + mid + ", which is roughly " + fmtMiles(m) + " at 11 to 12 minutes per mile. Keep it easy enough to talk in full sentences.";
          first[0].note = "You can mix jogging and hiking on trails. Progress comes from lasting longer, not running faster. " + LONG_RUN_FUEL;
        }
        return w;
      }
      if (base.id === "lr-trail-long") {
        const tt = timeRangeText(m, 13, 14);
        w.title = "Long easy trail run, about " + fmtMiles(m);
        w.summary = "A long easy trail outing for 100K practice: about " + fmtMiles(m) + ", " + tt + " with the climbs hiked. " + LONG_RUN_RULE + extra;
        if (first && first[0]) {
          first[0].name = "Easy trail run, about " + fmtMiles(m);
          first[0].detail = "About " + fmtMiles(m) + " on trail at 13 to 14 minutes per mile with the climbs hiked, " + tt + ". Keep it easy enough to talk in full sentences.";
          first[0].note = "Power-hike the climbs and stay on soft ground. " + LONG_RUN_FUEL;
        }
        return w;
      }
      w.title = "Long easy run, about " + fmtMiles(m);
      w.summary = "Your main ultra session this week: about " + fmtMiles(m) + " easy, " + t + ". " + LONG_RUN_RULE + extra;
      if (first && first[0]) {
        first[0].name = "Easy continuous run, " + fmtMiles(m);
        first[0].detail = "About " + fmtMiles(m) + " at 11 to 12 minutes per mile, " + t + ". Keep it easy enough to talk in full sentences.";
        first[0].note = "Walk short hills if you need to. " + LONG_RUN_FUEL;
      }
      return w;
    }

    if (rp.kind === "easy" || rp.kind === "flex") {
      let em = m;
      let lo = 11;
      let hi = 12;
      let extraMin = 8;
      let label = "Easy run, ";
      if (base.id === "sp-short-easy") {
        em = clampNum(Math.min(m, 4), 3, 4);
        extraMin = 5;
        label = "Very easy run, ";
      } else if (base.id === "sp-trail-volume") {
        em = Math.min(m, 6.5);
        lo = 12;
        hi = 13;
        extraMin = 6;
        label = "Easy trail jog and hike, ";
      } else if (base.id === "fx-second-aerobic") {
        extraMin = 6;
        label = "Very easy jog or incline walk, ";
      }
      const t = timeRangeText(em, lo, hi);
      w.displayMiles = em;
      w.durationMin = Math.max(30, Math.min(90, Math.round((em * ((lo + hi) / 2) + extraMin) / 5) * 5));
      if (base.id === "sp-short-easy") w.title = "Short easy run, " + fmtMiles(em);
      else if (base.id === "sp-trail-volume") w.title = "Easy trail run, " + fmtMiles(em);
      else if (base.id === "fx-second-aerobic") w.title = "Extra easy run, " + fmtMiles(em);
      else w.title = "Easy conversational run, " + fmtMiles(em);
      w.summary =
        "An easy " + fmtMiles(em) + ", " + t + ". Easy enough to talk in full sentences the whole way. Speed comes with volume, so there are no intervals today." +
        (rp.double && base.id !== "sp-short-easy" ? " An optional second easy run of about " + fmtMiles(rp.double) + " later in the day helps reach this week's miles." : "");
      if (first && first[0]) {
        first[0].name = label + fmtMiles(em);
        first[0].detail =
          "About " + fmtMiles(em) + " at " + lo + " to " + hi + " minutes per mile, " + t + "." +
          (base.id === "fx-second-aerobic" ? " An incline walk is slower, so go by time if you walk." : "") +
          " Keep it easy enough to talk in full sentences.";
        first[0].note = (rp.tired ? "Second day on tired legs, so this run gets a little longer in later phases. " : "") + (rp.note || "");
      }
      if (rp.double && base.id !== "sp-short-easy" && first) first.push(doubleItem(rp.double));
      return w;
    }

    if (rp.kind === "hills") {
      if (rp.downhill) w.notes = [DOWNHILL_TEXT].concat(w.notes || []);
      if (base.id === "eh-hyper-hills") {
        const hm = clampNum(Math.min(m, 4), 2, 4);
        const t = timeRangeText(hm, 14, 16);
        w.title = "Hyper Pro and easy hills, " + fmtMiles(hm) + " of incline";
        w.durationMin = Math.min(90, Math.round((hm * 15 + 25) / 5) * 5);
        w.summary = "About " + fmtMiles(hm) + " of easy incline walking and jogging, then Hyper Pro back and knee work for Black Canyon climbs and multi-day hunts. Easy enough to talk.";
        if (first && first[0]) {
          first[0].name = "Wahoo Incline Walk or Jog, " + fmtMiles(hm);
          first[0].detail = "About " + fmtMiles(hm) + " of easy incline walking and jogging, " + t + ". Load a hilly course import on the Wahoo so the grade rises and falls like real terrain. Keep it easy enough to talk.";
          first[0].note = "Builds climbing fitness for Black Canyon and your hunts at the same time. " + (rp.note || "");
        }
        return w;
      }
      if (base.id === "eh-trail-easy") {
        const tm = clampNum(Math.min(m, 5.5), 2, 5.5);
        const t = timeRangeText(tm, 14, 16);
        w.title = "Easy trail with light pack, " + fmtMiles(tm);
        w.durationMin = Math.min(90, Math.round((tm * 15 + 6) / 5) * 5);
        w.summary = "About " + fmtMiles(tm) + " of easy trail hiking and jogging with a light pack, " + t + ". Toughens your feet for the ultra and feels like a hunt.";
        if (first && first[0]) {
          first[0].name = "Easy trail hike and jog with a light pack, " + fmtMiles(tm);
          first[0].detail = "About " + fmtMiles(tm) + " at 14 to 16 minutes per mile, " + t + ". Hike the steep parts and keep it easy enough to talk.";
          first[0].note = "Carry an optional 10 to 20 lb pack to build toward hunting days. " + (rp.note || "");
        }
        return w;
      }
      return w;
    }
    return w;
  }

  /** Base workout plus any stored run sizing (used for options, the active session, and finishing). */
  function resolveWorkout(slotId, workoutId, runPlan) {
    const base = findWorkout(slotId, workoutId);
    if (!base || !runPlan) return base;
    return applyRunPlan(slotId, base, runPlan);
  }

  function sizeOption(slotId, workout, sizing, tired) {
    const rp = runPlanFor(slotId, workout, sizing, tired);
    return rp ? applyRunPlan(slotId, workout, rp) : workout;
  }

  // ——— Weekly mileage tracker UI ———
  function phaseSentence(plan) {
    if (plan.phase === "race") {
      return "Race week, week " + plan.planWeekNumber + " of the plan. About " + fmtMiles(plan.targetMiles) + " of short, easy running before " + raceWeekday() + ", then the Black Canyon 100K on " + RACE.label + ".";
    }
    if (plan.phase === "recovery") {
      return "Recovery after the race. Keep runs short and easy; about " + fmtMiles(plan.targetMiles) + " is plenty this week.";
    }
    return (
      plan.phaseLabel + ", week " + plan.planWeekNumber + " of the plan. " +
      fmtNum(plan.targetMiles) + " miles is the target this week, and the long run is about " + fmtMiles(plan.longRunMiles) + "."
    );
  }

  function raceCountdown(plan) {
    if (plan.weeksToRace > 1) return "Race day is " + RACE.label + ", " + plan.weeksToRace + " weeks after this one.";
    if (plan.weeksToRace === 1) return "Race day is " + RACE.label + ", next week.";
    return "";
  }

  // ——— Early-January readiness checkpoint ———
  function checkpointWeekIndex() {
    const sched = getPlanSchedule();
    const row = sched.find((r) => r.checkpoint);
    return row ? row.weekIndex : raceWeekIndex() - 5;
  }

  /** Longest single logged run and the average of the last 3 full weeks before the given week. */
  function readinessCheck(atWeek) {
    const cw = checkpointWeekIndex();
    const cur = atWeek != null ? atWeek : getProgramWeekIndex();
    const upTo = Math.min(cur, cw);
    const runs = loadMiles().filter((e) => (e.kind === "run" || e.kind === "long") && e.weekIndex <= cur);
    const longest = runs.reduce((mx, e) => Math.max(mx, Number(e.miles) || 0), 0);
    const weeks = [];
    for (let w = Math.max(0, upTo - 3); w < upTo; w++) weeks.push(milesForWeek(w, { skipRace: true }));
    const avg = weeks.length ? weeks.reduce((a, b) => a + b, 0) / weeks.length : 0;
    const reached = cur >= cw;
    let status;
    const cp = PLAN_META.checkpoint;
    if (longest >= cp.longestRunMiles && avg >= cp.recentAvgMiles) status = "on_track";
    else if (longest >= cp.closeLongestMiles || avg >= cp.closeAvgMiles) status = "close";
    else status = "behind";
    const cpStart = weekStartDate(cw);
    let text = "You're on track if you've finished a long run of about 20 miles feeling okay and your recent weeks have been in the 40s. ";
    text += (longest > 0 ? "So far your longest logged run is " + fmtMiles(longest) : "No runs are logged yet") + (weeks.length ? ", and your last " + weeks.length + (weeks.length === 1 ? " week" : " weeks") + " averaged " + fmtMiles(avg) + "." : ".");
    let verdict = "";
    if (!reached) {
      verdict = "This check happens the week of " + longDate(cpStart) + ". There is plenty of time to get there, so keep stacking easy weeks.";
    } else if (status === "on_track") {
      verdict = "You're on track. Keep the next few weeks easy and consistent, and the peak and taper will take care of the rest.";
    } else if (status === "close") {
      verdict = "You're close. The next two weeks are the biggest of the plan, so keep them easy and steady, and don't try to make up missed miles all at once.";
    } else {
      verdict = "Training hasn't lined up with the plan this time, and that happens, especially with shift work and hunting season. You can still take the start easy and hike more, or switch to the Black Canyon 50K the next day, which is a great race in its own right. Check Aravaipa's rules for changing distances if you go that way.";
    }
    return { longest, avg, weeks, status, reached, text, verdict, checkpointWeek: cw, cpStart };
  }

  function mileageCallout(plan) {
    if (plan.phase === "race") return { cls: "race", text: "Race week. Just a few short, easy runs of about 3 miles to stay loose, then the race on " + raceWeekday() + ". Rest is part of the plan now." };
    if (plan.isCutback) return { cls: "", text: "This is a lighter week on purpose. The mileage drops about 20 percent so your body can absorb the last three weeks of work and come back stronger. Don't add miles to make up for it; the next build starts next week." };
    if (plan.peakLongDay) return { cls: "peak", text: "Your biggest day before the race is this week: a long run of about 24 miles or about 5 hours on your feet, whichever comes first. Put it on a day off shift and practice race-day eating and drinking." };
    if (plan.phase === "taper" && plan.taperPct === 70) return { cls: "", text: "Taper, first week: about 70 percent of your peak mileage. Keep every run easy and let your legs freshen up." };
    if (plan.phase === "taper") return { cls: "", text: "Taper, second week: about half of your peak mileage. The fitness is already built; now you are getting fresh, so resist adding miles." };
    return null;
  }

  function sizingSummary(sizing) {
    const plan = sizing.plan;
    if (plan.phase === "race") return "";
    if (sizing.ahead) return "You have hit this week's target. Anything else this week can stay short and easy.";
    const parts = [];
    const names = { long_run: "a long run of about ", speed_run: "an easy run of about ", easy_hike: "a hills session of about ", flex: "an extra easy run of about " };
    sizing.counted.forEach((s) => {
      if (sizing.sizes[s] != null) parts.push(names[s] + fmtMiles(sizing.sizes[s]));
    });
    let text = fmtMiles(sizing.remaining) + " to go";
    if (parts.length) {
      const list = parts.length > 1 ? parts.slice(0, -1).join(", ") + (parts.length > 2 ? "," : "") + " and " + parts[parts.length - 1] : parts[0];
      text += ". The runs left this week are sized to get you there: " + list + ".";
    } else {
      text += ".";
    }
    if (Object.keys(sizing.doubles).length) text += " Easy days also offer an optional short second run later in the day.";
    if (!sizing.behind && sizing.shortfall >= 1.5) {
      text += " Those runs cover all but about " + fmtMiles(sizing.shortfall) + " of the target. A hike or pack walk can fill the gap, or let it go; close is good enough.";
    }
    if (sizing.behind) {
      text += " You are behind this week's target, and that is fine. Don't cram extra miles into the last days; the runs stay at a normal size, and missing the target by a few miles will not hurt your race.";
    }
    return text;
  }

  function entries0(w) {
    return milesEntriesForWeek(w);
  }

  function mileageCardHtml(prefix, opts) {
    opts = opts || {};
    const sizing = computeWeekSizing();
    const plan = sizing.plan;
    const logged = sizing.logged;
    const target = plan.targetMiles;
    const pct = target > 0 ? Math.min(100, (logged / target) * 100) : 0;
    let call = mileageCallout(plan);
    const raceEntry = plan.phase === "race" ? entries0(sizing.w).find((e) => e.kind === "race") : null;
    if (raceEntry) call = { cls: "race", text: "You finished the Black Canyon 100K: " + fmtMiles(raceEntry.miles) + ". Rest, eat, and sleep. Easy recovery weeks come next." };
    const pending = pendingSessionMiles();
    const entries = milesEntriesForWeek(sizing.w);
    const weekEnd = weekStartDate(sizing.w + 1);
    weekEnd.setDate(weekEnd.getDate() - 1);
    let html = '<section class="mileage-card' + (plan.isCutback ? " cutback" : "") + '" aria-label="Weekly running miles">';
    html += '<div class="mileage-head"><span class="mileage-eyebrow">Weekly miles · ' + escapeHtml(shortDate(plan.weekStart) + " to " + shortDate(weekEnd)) + "</span>";
    html +=
      '<div class="mileage-total" id="' + prefix + '-mileage-total">This week: ' + fmtNum(logged) + " of " + fmtNum(target) + " miles" +
      (plan.phase === "race" ? " before the race" : "") + "</div></div>";
    html += '<div class="mileage-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + target + '" aria-valuenow="' + fmtNum(logged) + '"><span style="width:' + pct.toFixed(1) + '%"></span></div>';
    html += '<p class="mileage-text">' + escapeHtml(phaseSentence(plan)) + "</p>";
    if (call) html += '<p class="mileage-callout ' + call.cls + '">' + escapeHtml(call.text) + "</p>";
    if (sizing.w === checkpointWeekIndex()) {
      const rc = readinessCheck(sizing.w);
      html +=
        '<div class="mileage-callout checkpoint ' + rc.status + '"><strong>Early-January checkpoint</strong><p>' +
        escapeHtml(rc.text) + "</p><p>" + escapeHtml(rc.verdict) + "</p></div>";
    }
    const summary = sizingSummary(sizing);
    if (summary) html += '<p class="mileage-note">' + escapeHtml(summary) + "</p>";
    if (pending > 0) html += '<p class="mileage-note">' + escapeHtml(fmtMiles(pending) + " from the workout you have in progress will count when you tap Finish.") + "</p>";
    if (opts.full) {
      const cd = raceCountdown(plan);
      if (cd) html += '<p class="mileage-note">' + escapeHtml(cd) + "</p>";
      html += '<p class="mileage-note">' + escapeHtml("What counts: runs, trail runs, hills sessions, hikes and hunting hikes, and incline walks or jogs, as long as you enter the distance in Active Workout, plus anything you add here. Strength, core, and recovery sessions don't count.") + "</p>";
    }
    html += '<form class="miles-add" data-miles-form="' + prefix + '" novalidate>';
    html += '<label class="miles-add-label" for="' + prefix + '-miles-input">Add miles done outside the app, like a hunting hike</label>';
    html += '<div class="miles-add-row">';
    html += '<input type="text" inputmode="decimal" id="' + prefix + '-miles-input" data-miles-input placeholder="Miles" autocomplete="off" aria-label="Miles" />';
    html +=
      '<select data-miles-kind aria-label="Type of outing">' +
      '<option value="run">Run</option>' +
      '<option value="hike">Hike or hunting hike</option>' +
      '<option value="incline">Incline or pack walk</option>' +
      "</select>";
    html += '<button type="submit" class="btn-bench primary" data-miles-add>Add miles</button>';
    html += "</div>";
    html += '<p class="miles-status" data-miles-status aria-live="polite"></p>';
    html += "</form>";
    if (entries.length) {
      html += '<details class="miles-entries"><summary>' + escapeHtml("Miles logged this week (" + entries.length + (entries.length === 1 ? " entry)" : " entries)")) + "</summary><ul>";
      entries.forEach((e) => {
        const d = e.dateKey ? new Date(e.dateKey + "T12:00:00") : new Date(e.ts || Date.now());
        const what = (MILES_KINDS[e.kind] || "Miles") + (e.source === "manual" ? ", added by hand" : e.title ? ", " + e.title : "");
        html +=
          '<li><span class="me-what">' + escapeHtml(d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + what) + "</span>" +
          '<span class="me-mi">' + escapeHtml(fmtMiles(e.miles)) + "</span>" +
          '<button type="button" class="me-del" data-miles-del="' + escapeHtml(e.id) + '" aria-label="Delete this entry">✕</button></li>';
      });
      html += "</ul></details>";
    }
    html += "</section>";
    return html;
  }

  function bindMileageCard(root) {
    const form = root.querySelector("[data-miles-form]");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector("[data-miles-input]");
        const kind = form.querySelector("[data-miles-kind]").value;
        const status = form.querySelector("[data-miles-status]");
        const raw = String(input.value || "").trim().replace(/,/g, ".");
        const miles = Number(raw);
        if (!raw || Number.isNaN(miles) || miles <= 0 || miles > 100) {
          status.textContent = "Enter the miles as a number, like 4 or 6.5.";
          status.className = "miles-status err";
          return;
        }
        const now = new Date();
        addMilesEntry({
          source: "manual",
          dateKey: localDateKey(now),
          weekIndex: getProgramWeekIndex(),
          miles: Math.round(miles * 10) / 10,
          kind: kind,
          ts: now.getTime(),
        });
        render();
        const again = document.querySelector('[data-miles-form="' + form.getAttribute("data-miles-form") + '"] [data-miles-status]');
        if (again) {
          again.textContent = "Added " + fmtMiles(miles) + " to this week.";
          again.className = "miles-status ok";
        }
      });
    }
    root.querySelectorAll("[data-miles-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!confirm("Delete these miles from this week?")) return;
        deleteMilesEntry(btn.getAttribute("data-miles-del"));
        render();
      });
    });
  }

  function renderMileage() {
    const t = document.getElementById("mileage-today");
    if (t) {
      t.innerHTML = mileageCardHtml("today", { full: false });
      bindMileageCard(t);
    }
    const wk = document.getElementById("mileage-week");
    if (wk) {
      wk.innerHTML = mileageCardHtml("week", { full: true });
      bindMileageCard(wk);
    }
  }

  function fuelNotesHtml() {
    const seen = {};
    const notes = [];
    loadHistory().concat(loadMiles()).forEach((e) => {
      if (!e || !e.fuelNote) return;
      const key = (e.dateKey || "") + "|" + (e.slotId || "") + "|" + e.fuelNote;
      if (seen[key]) return;
      seen[key] = true;
      notes.push(e);
    });
    if (!notes.length) return "";
    notes.sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return (
      '<details class="plan-details fuel-notes"><summary>' + escapeHtml("Fueling notes from long runs (" + notes.length + ")") + '</summary><ul class="plan-rows">' +
      notes.slice(0, 12).map((e) => {
        const d = e.dateKey ? new Date(e.dateKey + "T12:00:00") : new Date(e.ts || Date.now());
        return '<li><div class="pr-top"><span>' + escapeHtml(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + (e.title || "Long run")) + '</span></div><div class="pr-sub">' + escapeHtml(e.fuelNote) + "</div></li>";
      }).join("") +
      "</ul></details>"
    );
  }

  function mileageHistoryHtml() {
    const cur = getProgramWeekIndex();
    const sched = getPlanSchedule();
    const rw = raceWeekIndex();
    const maxTarget = Math.max.apply(null, sched.filter((r) => r.phase !== "race").map((r) => r.targetMiles));
    let rows = "";
    for (let w = 0; w <= Math.min(cur, sched.length - 1); w++) {
      const p = getWeekPlan(w);
      const actual = milesForWeek(w);
      const trackPct = Math.max(8, Math.min(100, (p.targetMiles / maxTarget) * 100));
      const fillPct = p.targetMiles > 0 ? Math.min(100, (milesForWeek(w, { skipRace: true }) / p.targetMiles) * 100) : 0;
      const tags = [p.phaseLabel];
      if (p.isCutback) tags.push("lighter week");
      if (w === cur) tags.push("this week");
      rows +=
        '<div class="mh-row' + (p.isCutback ? " cutback" : "") + (w === cur ? " current" : "") + '">' +
        '<div class="mh-top"><span class="mh-week">' + escapeHtml("Week " + (w + 1) + " · " + shortDate(p.weekStart)) + "</span>" +
        '<span class="mh-val">' + escapeHtml(p.phase === "race" ? fmtNum(actual) + " miles, including the race" : fmtNum(actual) + " of " + fmtNum(p.targetMiles) + " miles") + "</span></div>" +
        '<div class="mh-track" style="width:' + trackPct.toFixed(1) + '%"><span class="mh-fill" style="width:' + fillPct.toFixed(1) + '%"></span></div>' +
        '<div class="mh-sub">' + escapeHtml(tags.join(" · ")) + "</div></div>";
    }
    let planRows = "";
    for (let w = 0; w <= rw; w++) {
      const p = getWeekPlan(w);
      const lr = p.phase === "race" ? "Race day: Black Canyon 100K, " + raceWeekday() : "Long run about " + fmtMiles(p.longRunMiles) + (p.peakLongDay ? ", or about 5 hours on your feet" : "");
      planRows +=
        '<li class="' + (w === cur ? "current" : "") + (p.isCutback ? " cutback" : "") + '">' +
        '<div class="pr-top"><span>' + escapeHtml("Week " + (w + 1) + " · " + shortDate(p.weekStart)) + "</span><span>" + escapeHtml(fmtNum(p.targetMiles) + " miles") + "</span></div>" +
        '<div class="pr-sub">' + escapeHtml(p.phaseLabel + (p.isCutback ? ", lighter week" : "") + ". " + lr + ".") + "</div></li>";
    }
    return (
      '<article class="bench-card mileage-history">' +
      '<div class="bench-card-head"><div><h3>Weekly running miles</h3><span class="bench-unit">target and actual for each week</span></div></div>' +
      '<p class="sub">The green fill is what you logged. The dashed outline is that week\'s target, drawn to scale so you can compare weeks. Lighter weeks are marked.</p>' +
      '<div class="mh-list">' + rows + "</div>" +
      fuelNotesHtml() +
      '<details class="plan-details"><summary>See the full plan to race day</summary><ul class="plan-rows">' + planRows + "</ul></details>" +
      "</article>"
    );
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
    const sizing = computeWeekSizing();

    function addOption(slotId, preferShort) {
      if (options.length >= 3) return;
      if (options.some((o) => o.slotId === slotId)) return;
      const pool = WORKOUTS[slotId] || [];
      let workout = null;
      // Higher-volume weeks: the flex day offers the extra easy run when the other runs can't cover the miles.
      if (slotId === "flex" && sizing.flexNeeded) {
        workout = pool.find((w) => w.id === "fx-second-aerobic" && !usedWorkouts.has(w.id)) || null;
      }
      if (!workout && preferShort) {
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
    options.forEach((o) => {
      const easy = isEasyRunOption(o.slotId, o.workout);
      if (tired && easy) o.tiredLegs = tiredLegsMessage(tired);
      o.workout = sizeOption(o.slotId, o.workout, sizing, tired && easy ? tired : null);
    });
    return { done: false, options, rem, tiredLegs: tired, sizing };
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
      runPlan: workout.runPlan || null,
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
    const workout = resolveWorkout(sess.slotId, sess.workoutId, sess.runPlan);
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
      runPlan: workout.runPlan || null,
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
    const workout = resolveWorkout(sess.slotId, sess.workoutId, sess.runPlan);
    if (!workout) return;

    const finishedAt = Date.now();
    const cardioSum = summarizeCardioLogs(sess.logs);
    const countsMiles = workoutCountsMiles(sess.slotId, workout);
    const fuelNote = workout.fueling ? String(sess.fuelNote || "").trim().slice(0, 400) : "";
    if (countsMiles && cardioSum.miles > 0) {
      addMilesEntry({
        fuelNote: fuelNote || undefined,
        source: "workout",
        dateKey: localDateKey(finishedAt),
        weekIndex: getProgramWeekIndex(),
        miles: Math.round(cardioSum.miles * 100) / 100,
        kind: milesKindFor(sess.slotId, workout),
        slotId: sess.slotId,
        workoutId: workout.id,
        title: workout.title,
        ts: finishedAt,
      });
    }
    recordHistory({
      dateKey: localDateKey(finishedAt),
      slotId: sess.slotId,
      workoutId: workout.id,
      title: workout.title,
      durationMin: workout.durationMin,
      loggedMiles: cardioSum.miles,
      loggedMinutes: cardioSum.minutes,
      fuelNote: fuelNote || undefined,
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
      countsMiles: countsMiles,
      loggedMiles: Math.round(cardioSum.miles * 100) / 100,
      fuelNote: fuelNote || undefined,
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
      removeWorkoutMiles((c && c.dateKey) || localDateKey(new Date()), slotId);
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
      if (!confirm("Reset this week? The workout in progress and all of this week's completions will be cleared. Logged miles stay.")) return;
    } else if (!confirm("Reset this week? All of this week's completions will be cleared. Logged miles stay.")) {
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
    const fuelEl = body.querySelector('[data-field="fuel-note"]');
    if (fuelEl) sess.fuelNote = fuelEl.value;
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
    const workout = resolveWorkout(sess.slotId, sess.workoutId, sess.runPlan);
    if (!workout) return;
    const meta = SLOT_META[sess.slotId];
    const countsMiles = workoutCountsMiles(sess.slotId, workout);
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
            '<p class="cardio-count-note">' +
            (countsMiles
              ? "Enter the distance, and these miles count toward this week's total when you tap Finish."
              : "This one does not count toward your weekly running miles.") +
            "</p>";
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
            (already ? "Result logged. Edit it in Progress." : "Log your top result in Progress") +
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

    if (workout.fueling) {
      html +=
        '<div class="active-block fuel-block"><h4>How did fueling go?</h4>' +
        '<label class="fuel-label" for="fuel-note-input">Optional. What you ate and drank, and what sat well or didn\'t. It is saved with this run when you tap Finish.</label>' +
        '<textarea id="fuel-note-input" class="fuel-note" data-field="fuel-note" rows="3" maxlength="400" placeholder="For example: 2 gels and a bar, 20 ounces an hour, stomach fine">' +
        escapeHtml(sess.fuelNote || "") +
        "</textarea></div>";
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
    const wkPlan = getWeekPlan(getProgramWeekIndex());
    $("#week-label").textContent = "Week " + wkPlan.planWeekNumber + " · " + wkPlan.phaseLabel;
    const resetBtn = document.getElementById("btn-reset-week");
    if (resetBtn) resetBtn.textContent = "Reset this week";
    $("#today-date").textContent = formatTodayLabel(today.now) + " · MT";

    const doneCount = Object.keys(state.completed).length;
    $("#week-progress").textContent = doneCount + " of 7 workouts done this week";
    $("#progress-fill").style.width = (doneCount / 7) * 100 + "%";

    renderToday();
    renderWeek();
    renderMileage();
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
      $("#done-title").textContent = "Week " + (getProgramWeekIndex() + 1) + " complete";
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
            const w = resolveWorkout(pick.slotId, pick.workoutId, pick.runPlan);
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
      const doneC = state.completed[result.pick.slotId];
      if (doneC && doneC.countsMiles && !(doneC.loggedMiles > 0)) {
        $("#today-sub").textContent += " No distance was entered for this workout, so it did not add to your weekly miles. Use Add miles above to enter it.";
      }
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
        const opt = result.options.find((o) => o.slotId === slotId && o.workout.id === wid);
        const workout = opt ? opt.workout : findWorkout(slotId, wid);
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

    const wkSizing = computeWeekSizing();
    function runSizeLine(slotId) {
      const sz = wkSizing.sizes[slotId];
      if (sz == null) return "";
      if (wkSizing.plan.phase === "race" && slotId === "long_run") return " This week it is the race itself, on " + raceWeekday() + ".";
      if (slotId === "long_run") return " This week: about " + fmtMiles(sz) + ". Schedule it on a day off shift.";
      if (slotId === "speed_run") return " This week: about " + fmtMiles(sz) + ".";
      if (slotId === "easy_hike") return " This week: about " + fmtMiles(sz) + " of hills or incline.";
      if (slotId === "flex" && wkSizing.flexIsRun) return " This week it can be an extra easy run of about " + fmtMiles(sz) + ", or a core or catch-up session.";
      return "";
    }
    list.innerHTML = SLOT_ORDER.map((slotId) => {
      const meta = SLOT_META[slotId];
      const done = state.completed[slotId];
      let status = "remaining";
      let statusIcon = "○";
      let dayLabel = "—";
      const blurb = meta.blurb + runSizeLine(slotId);
      let detail = blurb;

      if (done) {
        status = "done";
        statusIcon = "✓";
        dayLabel = done.dayLabel || "Done";
        detail = done.title + ", about " + done.durationMin + " minutes" + (done.countsMiles && done.loggedMiles > 0 ? ", " + fmtMiles(done.loggedMiles) + " logged" : "") + ".";
      } else if (
        state.todayPick &&
        state.todayPick.slotId === slotId &&
        state.todayPick.dayKey === today.day.key
      ) {
        status = "scheduled";
        statusIcon = "▶";
        dayLabel = today.day.label;
        if (state.activeSession && state.activeSession.slotId === slotId) {
          detail = "Started — finish to complete · " + (state.todayPick.title || blurb);
        } else {
          detail = "Chosen today — open Active Workout to log · " + (state.todayPick.title || blurb);
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
            detail = "Available in today's choices — " + blurb;
          } else if (d && d.offset > today.offset) {
            status = "scheduled";
            statusIcon = "·";
            detail = "On the board later this week — " + blurb;
          } else {
            status = "remaining";
            statusIcon = "!";
            detail = "Catch-up window — " + blurb;
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
      mileageHistoryHtml() +
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
    const cur = getWeekPlan(getProgramWeekIndex());
    const rw = raceWeekIndex();
    el.innerHTML = `
      <div class="goal-card">
        <h3>Black Canyon 100K mileage plan</h3>
        <div class="goal-row"><span>Race date</span><strong>${escapeHtml(RACE.label)}${RACE.edited ? " (edited)" : ""}</strong></div>
        <form class="race-date-form" id="race-date-form" novalidate>
          <label class="miles-add-label" for="race-date-input">Race date (saved on this device; the plan shifts so the peak and taper still land before it)</label>
          <div class="miles-add-row">
            <input type="date" id="race-date-input" value="${isoDate(RACE.date)}" min="2026-11-01" max="2027-12-31" />
            <button type="submit" class="btn-bench primary">Save race date</button>
            ${RACE.edited ? '<button type="button" class="btn-bench" id="race-date-reset">Use the confirmed date</button>' : ""}
          </div>
          <p class="miles-status" id="race-date-status" aria-live="polite"></p>
        </form>
        <div class="goal-row"><span>Race</span><strong>Black Canyon 100K, 62 miles, Arizona</strong></div>
        <div class="goal-row"><span>This week</span><strong>${escapeHtml("Week " + cur.planWeekNumber + " of " + (rw + 1) + ", " + fmtNum(cur.targetMiles) + " miles")}</strong></div>
        <div class="goal-row"><span>Peak</span><strong>About 50 miles a week in mid-January</strong></div>
        <p class="goal-note" style="margin-top:10px">${PLAN_META.provisional ? "These weekly targets are a first version and may change. " : ""}Your weekly running miles build from about 20 now to a peak of about 50 in mid-January, then taper into race day. The plan is counted backward from the race date so the peak and the taper land in the right weeks. The race date is confirmed on ${escapeHtml(RACE.source)}.</p>
        <ul class="notes-list plan-rules">
          <li>Weekly miles go up by no more than about 10 percent at a time, or 2 to 3 miles while the mileage is still low.</li>
          <li>Every fourth week is a lighter week, about 20 to 25 percent less, so your body can absorb the work before the next build.</li>
          <li>Almost every run is easy enough to talk in full sentences. There are no speed sessions, because the speed will come with volume.</li>
          <li>The long run is the only session that goes past 90 minutes. Every other session stays between 30 and 90 minutes. Put the long run on a day off shift.</li>
          <li>Hills, trails, and the Wahoo incline treadmill with course imports build your climbing. Backcountry hunting hikes and pack incline walks count as time on your feet, so add those miles on the Today tab.</li>
          <li>From November on, long runs and long hikes over about 90 minutes are fueling practice: about 200 to 300 calories and regular drinks every hour, using your race-day foods. The long run has a short "How did fueling go?" note you can fill in when you finish.</li>
          <li>From December on, hills sessions include easy, controlled downhill running, because Black Canyon drops more than it climbs.</li>
          <li>About four weeks before the race you do one big day of about 24 miles or about 5 hours on your feet.</li>
          <li>The last two weeks before race week drop to about 70 percent and then about half of your peak. Race week is a few short, easy runs and then the race.</li>
          <li>You still pick each day's workout in any order. The run options resize themselves to fit the miles left in the week, and if you fall behind, the app will not ask you to cram.</li>
        </ul>
      </div>
      ${(function () {
        const rc = readinessCheck();
        return (
          '<div class="goal-card checkpoint-card"><h3>Early-January checkpoint</h3>' +
          '<div class="goal-row"><span>Checkpoint week</span><strong>' + escapeHtml(longDate(rc.cpStart)) + "</strong></div>" +
          '<div class="goal-row"><span>Longest logged run</span><strong>' + escapeHtml(rc.longest > 0 ? fmtMiles(rc.longest) : "None logged yet") + "</strong></div>" +
          '<div class="goal-row"><span>Last 3 weeks, average</span><strong>' + escapeHtml(rc.weeks.length ? fmtMiles(rc.avg) : "Not enough weeks yet") + "</strong></div>" +
          '<p class="goal-note" style="margin-top:10px">' + escapeHtml(rc.text) + "</p>" +
          '<p class="goal-note checkpoint-verdict ' + (rc.reached ? rc.status : "pending") + '" style="margin-top:8px">' + escapeHtml(rc.verdict) + "</p></div>"
        );
      })()}
      <div class="goal-card">
        <h3>Five North-Star Pillars</h3>
        <div class="goal-row"><span>1 · Physique</span><strong>Athletic look: arms, shoulders, and upper back</strong></div>
        <div class="goal-row"><span>2 · Hunting</span><strong>Multi-day elk and deer hiking</strong></div>
        <div class="goal-row"><span>3 · Ultra</span><strong>Black Canyon 100K, easy volume first</strong></div>
        <div class="goal-row"><span>4 · PT marks</span><strong>Personal test targets, checked now and then</strong></div>
        <div class="goal-row"><span>5 · Beast Core</span><strong>Armor for the low back</strong></div>
        <p class="goal-note" style="margin-top:10px">Your running is built on ultra volume. Speed for timed checks comes mostly from that base, not from speed work. This is not job fitness programming. Flag low-back flares, but don't baby your back by default.</p>
      </div>
      <div class="goal-card">
        <h3>Race, Role &amp; Schedule</h3>
        <div class="goal-row"><span>Athlete</span><strong>Nathan · 37 · 215 lbs</strong></div>
        <div class="goal-row"><span>Schedule</span><strong>48 hours on, 96 hours off</strong></div>
        <div class="goal-row"><span>Goal race</span><strong>${escapeHtml(RACE.label)}</strong></div>
        <div class="goal-row"><span>Week 1 started</span><strong>Wednesday, September 23, 2026</strong></div>
        <div class="goal-row"><span>Weeks run</span><strong>Wednesday to Tuesday</strong></div>
        <div class="goal-row"><span>Session length</span><strong>30 to 90 minutes; the long run can go longer</strong></div>
      </div>
      <div class="goal-card">
        <h3>Personal PT / Strength Targets</h3>
        <p class="goal-note" style="margin-bottom:8px">Tracked in Progress. Timed run checks are rare, and none happen during the Black Canyon build; volume does the work.</p>
        <div class="goal-row"><span>Longest easy run (primary)</span><strong>Build past 10 miles</strong></div>
        <div class="goal-row"><span>1.95 miles (rare check)</span><strong>12 minutes or less</strong></div>
        <div class="goal-row"><span>Mile (rare check)</span><strong>About 7 minutes 30 seconds now, faster through volume</strong></div>
        <div class="goal-row"><span>Hand-release push-ups in 2 minutes</span><strong>70 <small style="color:var(--text-dim)">(now about 40)</small></strong></div>
        <div class="goal-row"><span>Dead-hang pull-ups</span><strong>30 <small style="color:var(--text-dim)">(now about 21)</small></strong></div>
        <div class="goal-row"><span>Deadlift</span><strong>405 <small style="color:var(--text-dim)">(now about 345)</small></strong></div>
        <div class="goal-row"><span>Bench</span><strong>315 <small style="color:var(--text-dim)">(now about 275)</small></strong></div>
        <div class="goal-row"><span>Back squat</span><strong>405 <small style="color:var(--text-dim)">(now about 315)</small></strong></div>
        <div class="goal-row"><span>Plank</span><strong>3 minutes, maxed; now weighted planks, rollouts, and hanging work</strong></div>
      </div>
      <div class="goal-card">
        <h3>Ultra Aerobic · How We Run</h3>
        <div class="goal-row"><span>10 miles continuous</span><strong>About 11 minutes per mile, easy</strong></div>
        <div class="goal-row"><span>Daily runs</span><strong>Easy and conversational</strong></div>
        <div class="goal-row"><span>Speed work</span><strong>None; speed comes with volume</strong></div>
        <p class="goal-note" style="margin-top:10px">The long easy run, hills and hike legs, and easy runs stack Black Canyon fitness with hunting time on feet. You pick each day in any order. When an easy run lands the day after a long run, the app flags it as a second day on tired legs, and that run gets a little longer in later phases. “The speed will come with volume.”</p>
      </div>
      <div class="goal-card">
        <h3>Physique (without killing endurance)</h3>
        <p class="goal-note">Muscle-building extras on the strength days: lateral raises, curl bar arm work, rear-delt dumbbell flyes, and balanced pushing and pulling. They come after the main strength and PT work so they don't eat into your ultra volume.</p>
      </div>
      <div class="goal-card">
        <h3>Beast Core (back-pain insurance)</h3>
        <p class="goal-note">Resist arching with barbell rollouts from the knees, weighted front planks, and dead bugs. Resist twisting with single-arm dumbbell rows and Russian twists. Resist leaning with side planks and one-dumbbell suitcase carries. Build grip and posture with heavy farmer carries, and hang from the bar for knee raises working toward toes-to-bar. Freak Athlete Hyper Pro back extensions, full-range reverse hypers, Sorensen holds, side raises, and an occasional small dose of GHD sit-ups round it out. Core finishers come after strength days, plus the flex-day core session.</p>
      </div>
    `;
    const rf = document.getElementById("race-date-form");
    if (rf) {
      rf.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = document.getElementById("race-date-input").value;
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || "");
        const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
        if (!d || isNaN(d) || d <= new Date(2026, 10, 1)) {
          const st = document.getElementById("race-date-status");
          st.textContent = "Pick a race date after November 1, 2026.";
          st.className = "miles-status err";
          return;
        }
        saveRaceDate(v);
        render();
        const st2 = document.getElementById("race-date-status");
        if (st2) {
          st2.textContent = "Saved. The plan now counts back from " + RACE.label + ".";
          st2.className = "miles-status ok";
        }
      });
      const rr = document.getElementById("race-date-reset");
      if (rr) {
        rr.addEventListener("click", () => {
          saveRaceDate("");
          render();
        });
      }
    }
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
          <span class="equip-chip">Freak Athlete Hyper Pro + GHD Attachment + Leg Developer</span>
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
          <li>Hyper Pro means the standard Freak Athlete Hyper Pro (not the Hyper Pro X) with the GHD Attachment and Leg Developer; no Belt Squat Attachment or Upper Body Kit</li>
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
        escapeHtml(tiredLegsPrescription(workout)) +
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
          const workout = sess && resolveWorkout(sess.slotId, sess.workoutId, sess.runPlan);
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
