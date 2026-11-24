// ============================================================
// THE TEST ENGINE: used by every chapter test page.
// The page first loads its data file (const UNIT = {...}),
// then this file. This file makes the three screens:
//   1. categories (Synonyms, Translation ...)
//   2. the tests of one category (Test 1, Test 2 ...)
//   3. the quiz, and then the result
// ============================================================

// 1. FIND THE PARTS OF THE PAGE
const el = function (id) { return document.getElementById(id); };
const screens = ["homeScreen", "listScreen", "quizScreen", "resultScreen"];
const LETTERS = ["A", "B", "C", "D"];

let cat = null;       // the open category
let testNo = 0;       // the open test (0 = Test 1)
let questions = [];   // the questions of the open test
let qNo = 0;          // the question on screen
let score = 0;

function show(id) {
  screens.forEach(function (s) { el(s).classList.toggle("hidden", s !== id); });
  window.scrollTo(0, 0);
}

// Make text safe, then turn *word* into a bold, underlined word
function format(text) {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return safe.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
}

function testName(c, n) {
  return c.testNames ? c.testNames[n] : "Test " + (n + 1);
}

// Best scores are kept in this browser only
function getBest(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function setBest(key, value) {
  try {
    const old = Number(localStorage.getItem(key) || -1);
    if (value > old) localStorage.setItem(key, value);
  } catch (e) { /* storage not allowed: no problem */ }
}
function bestKey(c, n) { return "s30-" + UNIT.id + "-" + c.id + "-" + n; }

// 2. SCREEN 1: THE CATEGORIES
el("unitTag").textContent = UNIT.cls + " · " + UNIT.subject + " · " + UNIT.unit;
el("unitTitle").textContent = UNIT.title;
document.title = UNIT.unit + " Tests: " + UNIT.short + " | Super-30";

UNIT.categories.forEach(function (c, i) {
  const total = c.tests.reduce(function (sum, t) { return sum + t.length; }, 0);
  const btn = document.createElement("button");
  btn.className = "card-btn";
  btn.innerHTML = '<span class="num">' + (i + 1) + '</span><span class="name">' + c.name + "</span>" +
                  '<span class="info">' + c.tests.length + (c.tests.length === 1 ? " test" : " tests") +
                  " · " + total + " MCQs →</span>";
  btn.addEventListener("click", function () { openCategory(c); });
  el("categoryList").appendChild(btn);
});

// 3. SCREEN 2: THE TESTS OF ONE CATEGORY
function openCategory(c) {
  cat = c;
  el("listTitle").textContent = c.name;
  el("listIntro").textContent = c.note || "Choose a test. Each test has 10 questions.";
  const list = el("testList");
  list.innerHTML = "";
  c.tests.forEach(function (t, n) {
    const best = getBest(bestKey(c, n));
    const btn = document.createElement("button");
    btn.className = "card-btn";
    btn.innerHTML = '<span class="name">' + testName(c, n) + "</span>" +
      (best !== null ? '<span class="done">Best: ' + best + "/" + t.length + "</span>"
                     : '<span class="info">' + t.length + " MCQs →</span>");
    btn.addEventListener("click", function () { startTest(c, n); });
    list.appendChild(btn);
  });
  list.classList.toggle("two", c.tests.length > 4 && !c.testNames);
  history.replaceState(null, "", "#" + c.id);
  show("listScreen");
}

// 4. SCREEN 3: THE QUIZ
function startTest(c, n) {
  cat = c;
  testNo = n;
  questions = c.tests[n];
  qNo = 0;
  score = 0;
  el("testName").textContent = c.name + " · " + testName(c, n);
  history.replaceState(null, "", "#" + c.id + "-" + (n + 1));
  showQuestion();
  show("quizScreen");
}

function showQuestion() {
  const item = questions[qNo];
  el("counter").textContent = "Question " + (qNo + 1) + " of " + questions.length;
  el("scoreNow").textContent = "Score: " + score;
  el("bar").style.width = (qNo / questions.length * 100) + "%";

  const instruction = item.i || (cat.testInstructions ? cat.testInstructions[testNo] : cat.instruction);
  el("instruction").textContent = instruction;

  const q = el("question");
  q.innerHTML = format(item.q);
  q.className = "question" + (item.urduQ ? " urdu" : "") + (cat.urdu ? " passage" : "");
  q.classList.toggle("hidden", item.q === "");

  const box = el("options");
  box.innerHTML = "";
  item.options.forEach(function (text, i) {
    const b = document.createElement("button");
    b.className = "option" + (cat.urdu ? " urdu" : "");
    b.innerHTML = '<span class="letter">' + LETTERS[i] + ")</span><span>" + format(text) + "</span>";
    b.addEventListener("click", function () { choose(i); });
    box.appendChild(b);
  });

  el("feedback").textContent = "";
  el("feedback").className = "feedback";
  meaningsBox().classList.add("hidden");
  el("nextBtn").classList.add("hidden");
}

function choose(i) {
  const item = questions[qNo];
  const buttons = el("options").querySelectorAll(".option");
  buttons.forEach(function (b) { b.disabled = true; });
  buttons[item.answer].classList.add("right");

  const fb = el("feedback");
  if (i === item.answer) {
    score++;
    fb.textContent = "✓ Correct!";
    fb.className = "feedback right";
  } else {
    buttons[i].classList.add("wrong");
    fb.textContent = "✗ Wrong. The correct answer is " + LETTERS[item.answer] + ".";
    fb.className = "feedback wrong";
  }
  el("scoreNow").textContent = "Score: " + score;
  showMeanings(item);
  el("nextBtn").textContent = qNo + 1 < questions.length ? "Next Question" : "See Result";
  el("nextBtn").classList.remove("hidden");
  el("nextBtn").focus({ preventScroll: true });
}

// Urdu meanings of both words (Pair of Words): shown after every answer
function meaningsBox() {
  let box = el("meanings");
  if (!box) {
    box = document.createElement("div");
    box.id = "meanings";
    box.className = "meanings hidden";
    el("feedback").after(box);
  }
  return box;
}
function showMeanings(item) {
  const box = meaningsBox();
  if (!item.m) return;
  box.innerHTML = item.m.map(function (x) {
    return '<div class="pair' + (x.ok ? " ok" : "") + '"><span class="w">' + x.w + "</span>" +
           '<span class="ur" lang="ur">' + x.ur + "</span></div>";
  }).join("");
  box.classList.remove("hidden");
}

el("nextBtn").addEventListener("click", function () {
  qNo++;
  if (qNo < questions.length) showQuestion();
  else showResult();
});

el("leaveBtn").addEventListener("click", function () { openCategory(cat); });

// 5. SCREEN 4: THE RESULT
function showResult() {
  setBest(bestKey(cat, testNo), score);
  el("resultName").textContent = cat.name + " · " + testName(cat, testNo);
  el("finalScore").textContent = score + " / " + questions.length;
  const p = score / questions.length;
  el("message").textContent =
    p === 1 ? "Excellent! Full marks." :
    p >= 0.8 ? "Very good! Keep it up." :
    p >= 0.5 ? "Good effort. Read the chapter again and try once more." :
               "Read the chapter carefully and try again. You can do it.";
  el("nextTestBtn").classList.toggle("hidden", testNo + 1 >= cat.tests.length);
  show("resultScreen");
}

el("restartBtn").addEventListener("click", function () { startTest(cat, testNo); });
el("nextTestBtn").addEventListener("click", function () { startTest(cat, testNo + 1); });
el("listBtn").addEventListener("click", function () { openCategory(cat); });
// A page with only one type of test (e.g. Pair of Words) opens its test list at once
const single = UNIT.categories.length === 1;
if (single) el("backHome").textContent = "← All subjects";
el("backHome").addEventListener("click", function () {
  if (single) { location.href = "tests.html"; return; }
  history.replaceState(null, "", location.pathname);
  show("homeScreen");
});

// 6. OPEN A TEST FROM THE LINK, e.g. page.html#synonyms-2
(function () {
  const m = location.hash.match(/^#([a-z]+)(?:-(\d+))?$/);
  if (!m) { if (single) openCategory(UNIT.categories[0]); return; }
  const c = UNIT.categories.find(function (x) { return x.id === m[1]; });
  if (!c) return;
  const n = m[2] ? Number(m[2]) - 1 : -1;
  if (n >= 0 && n < c.tests.length) startTest(c, n);
  else openCategory(c);
})();
