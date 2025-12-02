/* script.js — upgraded Bible Memory Game
   - Difficulty modes: easy / normal / hard / expert
   - Built-in verse pack
   - Persistent progress in localStorage
   - Fully working Multiple Choice & Fill-in-the-Blank
*/

const STORAGE_KEY = 'bvmg_v2';

const ui = {
  verseText: document.getElementById('verse-text'),
  verseRef: document.getElementById('verse-ref'),
  choices: document.getElementById('choices'),
  scoreLabel: document.getElementById('score'),
  difficultyLabel: document.getElementById('difficulty-label'),
  nextBtn: document.getElementById('next-btn'),
  modeMcBtn: document.getElementById('mode-mc'),
  modeFillBtn: document.getElementById('mode-fill'),
  verseListEl: document.getElementById('verse-list'),
  addVerseBtn: document.getElementById('add-verse'),
  customVerseInput: document.getElementById('custom-verse'),
  customRefInput: document.getElementById('custom-ref'),
  clearDataBtn: document.getElementById('clear-data'),
};

let state = {
  verses: [],        // {ref, text, attempts, correct, lastPracticed}
  idx: -1,           // currently selected verse index
  mode: 'mc',        // 'mc' or 'fill'
  difficulty: 'normal', // easy | normal | hard | expert
  score: 0,
  streak: 0,
  lastPracticed: null
};

// Built-in verses (you can expand)
const BUILTIN_VERSES = [
  { ref: 'John 3:16', text: 'For God so loved the world that he gave his only Son, that whoever believes in him should not perish but have eternal life.' },
  { ref: 'Philippians 4:13', text: 'I can do all things through him who strengthens me.' },
  { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
  { ref: 'Proverbs 3:5', text: 'Trust in the Lord with all your heart, and do not lean on your own understanding.' },
  { ref: 'Romans 8:28', text: 'And we know that for those who love God all things work together for good, for those who are called according to his purpose.' },
  { ref: 'Matthew 6:33', text: 'But seek first the kingdom of God and his righteousness, and all these things will be added to you.' },
  { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope.' },
  { ref: '1 Corinthians 13:4', text: 'Love is patient and kind; love does not envy or boast; it is not arrogant.' },
  { ref: 'Genesis 1:1', text: 'In the beginning, God created the heavens and the earth.' },
  { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
  { ref: 'Isaiah 40:31', text: 'But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.' },
  { ref: 'Romans 12:2', text: 'Do not be conformed to this world, but be transformed by the renewal of your mind.' },
  { ref: 'John 14:6', text: 'Jesus said to him, \'I am the way, and the truth, and the life. No one comes to the Father except through me.\'' },
  { ref: 'Psalm 118:24', text: 'This is the day that the Lord has made; let us rejoice and be glad in it.' },
  { ref: 'Matthew 11:28', text: 'Come to me, all who labor and are heavy laden, and I will give you rest.' },
  { ref: 'Ephesians 2:8-9', text: 'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.' },
  { ref: 'Joshua 1:9', text: 'Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.' },
  { ref: 'Psalm 27:1', text: 'The Lord is my light and my salvation; whom shall I fear?' },
  { ref: '1 John 4:19', text: 'We love because he first loved us.' },
  { ref: 'Romans 5:8', text: 'But God shows his love for us in that while we were still sinners, Christ died for us.' },
  { ref: 'Proverbs 18:10', text: 'The name of the Lord is a strong tower; the righteous man runs into it and is safe.' },
  { ref: 'Psalm 91:1', text: 'He who dwells in the shelter of the Most High will abide in the shadow of the Almighty.' },
  { ref: 'Isaiah 41:10', text: 'Fear not, for I am with you; be not dismayed, for I am your God.' },
  { ref: '2 Corinthians 5:7', text: 'For we walk by faith, not by sight.' },
  { ref: 'Philippians 4:6', text: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God.' },
  { ref: 'Psalm 37:4', text: 'Delight yourself in the Lord, and he will give you the desires of your heart.' },
  { ref: 'Hebrews 11:1', text: 'Now faith is the assurance of things hoped for, the conviction of things not seen.' },
  { ref: 'Matthew 5:14', text: 'You are the light of the world. A city set on a hill cannot be hidden.' },
  { ref: 'James 1:5', text: 'If any of you lacks wisdom, let him ask God, who gives generously to all without reproach, and it will be given him.' },
  { ref: 'John 1:1', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { ref: 'Psalm 34:8', text: 'Oh, taste and see that the Lord is good! Blessed is the man who takes refuge in him!' },
  { ref: '1 Peter 5:7', text: 'Casting all your anxieties on him, because he cares for you.' },
  { ref: 'Romans 10:9', text: 'If you confess with your mouth that Jesus is Lord and believe in your heart that God raised him from the dead, you will be saved.' },
  { ref: 'Isaiah 53:5', text: 'But he was wounded for our transgressions; he was crushed for our iniquities.' },
  { ref: 'Psalm 121:1-2', text: 'I lift up my eyes to the hills. From where does my help come? My help comes from the Lord, who made heaven and earth.' },
  { ref: 'Matthew 28:20', text: 'And behold, I am with you always, to the end of the age.' },
  { ref: 'Colossians 3:23', text: 'Whatever you do, work heartily, as for the Lord and not for men.' },
  { ref: 'Proverbs 16:3', text: 'Commit your work to the Lord, and your plans will be established.' }
];


//
// Initialization
//
function init() {
  loadState();
  if (!state.verses.length) {
    // preload built-ins automatically on first run
    state.verses = BUILTIN_VERSES.map(v => ({ ...v, attempts: 0, correct: 0, lastPracticed: null }));
    saveState();
  }
  wireUpUI();
  renderStats();
  renderVerseList();
  pickInitial();
  renderCurrent();
}

function wireUpUI() {
  ui.modeMcBtn.onclick = () => { state.mode = 'mc'; renderCurrent(); };
  ui.modeFillBtn.onclick = () => { state.mode = 'fill'; renderCurrent(); };
  ui.nextBtn.onclick = nextVerse;
  ui.addVerseBtn.onclick = addCustomVerse;
  ui.clearDataBtn.onclick = clearAllData;
  // difficulty selector via clicking label (cycles)
  ui.difficultyLabel.onclick = () => {
    const order = ['easy', 'normal', 'hard', 'expert'];
    const i = order.indexOf(state.difficulty);
    state.difficulty = order[(i + 1) % order.length];
    ui.difficultyLabel.textContent = `Difficulty: ${capitalize(state.difficulty)}`;
    saveState();
    renderCurrent();
  };
}

//
// Persistence
//
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    // basic validation
    if (s && Array.isArray(s.verses)) {
      state = Object.assign(state, s);
    }
  } catch (e) {
    console.warn('Failed to load saved state:', e);
  }
}

function clearAllData() {
  if (!confirm('Clear all saved verses and progress?')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

//
// Helper utilities
//
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function trunc(s, n = 80) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sanitizeForCompare(s) { return (s || '').replace(/[.,;:!?()"']/g, '').trim().toLowerCase(); }

//
// Verse selection & progression
//
function pickInitial() {
  if (state.idx >= 0 && state.idx < state.verses.length) return;
  if (state.verses.length) state.idx = 0;
}

function nextVerse() {
  if (!state.verses.length) return alert('No verses. Add some or reload the page.');
  // Weighted selection: prefer lower success rate
  const pool = state.verses.map((v, i) => {
    const attempts = v.attempts || 1;
    const score = 1 - ((v.correct || 0) / attempts);
    return { i, score };
  });
  pool.sort((a, b) => b.score - a.score);
  const topHalf = pool.slice(0, Math.max(1, Math.floor(pool.length / 2)));
  const pick = topHalf[Math.floor(Math.random() * topHalf.length)];
  state.idx = pick.i;
  renderCurrent();
  saveState();
}

//
// Rendering main UI
//
function renderCurrent() {
  ui.choices.innerHTML = '';
  if (state.idx < 0 || state.idx >= state.verses.length) { ui.verseText.textContent = 'No verse selected.'; ui.verseRef.textContent = ''; return; }
  const v = state.verses[state.idx];
  ui.verseRef.textContent = v.ref || '';
  ui.verseText.innerHTML = ''; // adjusted per mode below
  ui.difficultyLabel.textContent = `Difficulty: ${capitalize(state.difficulty)}`;
  ui.scoreLabel.textContent = `Score: ${state.score}`;

  if (state.mode === 'mc') {
    renderMultipleChoice(v);
  } else {
    renderFillInBlank(v);
  }
  renderVerseList();
  saveState();
}

//
// Multiple Choice implementation
//
function renderMultipleChoice(v) {
  // show short prompt (verse ref)
  ui.verseText.textContent = v.ref + ' — choose the correct verse text:';
  const container = document.createElement('div');
  container.className = 'choices';

  // prepare distractors
  const others = state.verses.filter((_, idx) => idx !== state.idx).map(x => x.text);
  const distractors = [];

  // difficulty affects how distractors are chosen
  const useNearby = state.difficulty === 'easy' || state.difficulty === 'normal';
  while (distractors.length < 3) {
    if (others.length && useNearby) {
      // take random distinct others
      const pick = others.splice(Math.floor(Math.random() * others.length), 1)[0];
      distractors.push(trunc(pick, 120));
    } else {
      // create a shuffled / truncated variant of the correct text as a trick distractor
      distractors.push(trunc(shuffleWords(v.text), 120));
    }
  }

  const options = [v.text, ...distractors].sort(() => Math.random() - 0.5);

  options.forEach(opt => {
    const optEl = document.createElement('div');
    optEl.className = 'choice';
    optEl.textContent = opt;
    optEl.onclick = () => {
      // disable further clicks
      Array.from(container.children).forEach(ch => ch.style.pointerEvents = 'none');
      const correct = opt === v.text;
      if (correct) {
        optEl.classList.add('correct');
        awardPoints(true);
        v.correct = (v.correct || 0) + 1;
      } else {
        optEl.classList.add('wrong');
        awardPoints(false);
      }
      v.attempts = (v.attempts || 0) + 1;
      v.lastPracticed = new Date().toISOString();
      state.lastPracticed = v.lastPracticed;
      // reveal correct
      Array.from(container.children).forEach(ch => {
        if (ch.textContent === v.text) ch.classList.add('correct');
      });
      renderStats();
      saveState();
    };
    container.appendChild(optEl);
  });

  ui.choices.appendChild(container);
}

function awardPoints(correct) {
  // scoring variant by difficulty
  const map = {
    easy: { hit: 5, miss: -1 },
    normal: { hit: 10, miss: -3 },
    hard: { hit: 18, miss: -6 },
    expert: { hit: 30, miss: -10 }
  };
  const pick = map[state.difficulty] || map.normal;
  if (correct) {
    state.score += pick.hit;
    state.streak = (state.streak || 0) + 1;
  } else {
    state.score = Math.max(0, state.score + pick.miss);
    state.streak = 0;
  }
}

//
// Fill-in-the-blank implementation
//
function renderFillInBlank(v) {
  // choose words to hide depending on difficulty
  const words = v.text.split(/\b/); // keep punctuation in tokens
  const wordIndices = words
    .map((w, i) => ({ w, i }))
    .filter(x => /\w/.test(x.w)) // tokens with letters/digits
    .map(x => x.i);

  let hideFraction = 0.25;
  if (state.difficulty === 'easy') hideFraction = 0.15;
  if (state.difficulty === 'normal') hideFraction = 0.25;
  if (state.difficulty === 'hard') hideFraction = 0.40;
  if (state.difficulty === 'expert') hideFraction = 0.60;

  const hideCount = Math.max(1, Math.min(wordIndices.length, Math.floor(wordIndices.length * hideFraction)));
  const shuffledIndices = shuffleArray(wordIndices.slice());
  const hideSet = new Set(shuffledIndices.slice(0, hideCount));

  // build display
  const display = document.createElement('div');
  display.className = 'fill-display';

  const inputs = []; // {index, answer, inputEl}

  words.forEach((tok, i) => {
    if (hideSet.has(i)) {
      const span = document.createElement('span');
      span.className = 'hidden-word';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = '...';
      input.size = Math.min(12, Math.max(3, tok.replace(/\W+/g, '').length || 3));
      span.appendChild(input);
      display.appendChild(span);
      inputs.push({ index: i, answer: tok, inputEl: input });
      // small space
      display.appendChild(document.createTextNode(' '));
    } else {
      display.appendChild(document.createTextNode(tok));
    }
  });

  // check button & hint
  const controls = document.createElement('div');
  controls.style.marginTop = '10px';

  const checkBtn = document.createElement('button');
  checkBtn.textContent = 'Check answers';
  checkBtn.onclick = () => {
    let allCorrect = true;
    inputs.forEach(obj => {
      const user = obj.inputEl.value;
      if (compareWords(user, obj.answer)) {
        obj.inputEl.disabled = true;
        obj.inputEl.classList.add('correct-input');
      } else {
        obj.inputEl.classList.remove('correct-input');
        allCorrect = false;
      }
    });
    // scoring
    if (allCorrect) {
      awardPoints(true);
      v.correct = (v.correct || 0) + 1;
    } else {
      awardPoints(false);
    }
    v.attempts = (v.attempts || 0) + 1;
    v.lastPracticed = new Date().toISOString();
    state.lastPracticed = v.lastPracticed;
    renderStats();
    saveState();
  };

  const revealBtn = document.createElement('button');
  revealBtn.textContent = 'Reveal missing words';
  revealBtn.onclick = () => {
    inputs.forEach(obj => {
      obj.inputEl.value = obj.answer.replace(/\b/g, ''); // rough reveal
      obj.inputEl.disabled = true;
      obj.inputEl.classList.add('correct-input');
    });
    v.attempts = (v.attempts || 0) + 1;
    saveState();
  };

  controls.appendChild(checkBtn);
  controls.appendChild(revealBtn);

  // render into UI
  ui.verseText.textContent = '';
  ui.verseText.appendChild(display);
  ui.choices.appendChild(controls);
}

function compareWords(a, b) {
  // loose compare: case-insensitive, remove punctuation, allow simple contractions to match
  return sanitizeForCompare(a) === sanitizeForCompare(b);
}

//
// Utilities used by render functions
//
function shuffleWords(s) {
  const arr = s.split(/\s+/).filter(Boolean);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join(' ');
}
function shuffleArray(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

//
// Stats & UI helpers
//
function renderStats() {
  ui.scoreLabel.textContent = `Score: ${state.score}`;
  // streak & last practiced in the footer if present
  const streakEl = document.getElementById('streak');
  if (streakEl) streakEl.textContent = state.streak || 0;
  const lastEl = document.getElementById('lastPracticed');
  if (lastEl) lastEl.textContent = state.lastPracticed ? new Date(state.lastPracticed).toLocaleString() : '—';
}

//
// Verse list UI
//
function renderVerseList() {
  ui.verseListEl.innerHTML = '';
  state.verses.forEach((v, i) => {
    const row = document.createElement('div');
    row.className = 'verse-row';
    row.innerHTML = `<strong>${escapeHtml(v.ref || '')}</strong> — <span class="small">${escapeHtml(trunc(v.text, 120))}</span>`;
    const btnPlay = document.createElement('button');
    btnPlay.textContent = 'Practice';
    btnPlay.onclick = () => { state.idx = i; renderCurrent(); };
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Delete';
    btnDel.onclick = () => {
      if (!confirm('Delete this verse?')) return;
      state.verses.splice(i, 1);
      if (state.idx >= state.verses.length) state.idx = state.verses.length - 1;
      saveState();
      renderVerseList();
      renderCurrent();
    };
    row.appendChild(btnPlay);
    row.appendChild(btnDel);
    ui.verseListEl.appendChild(row);
  });
}

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

//
// Adding verses
//
function addCustomVerse() {
  const text = (ui.customVerseInput.value || '').trim();
  const ref = (ui.customRefInput.value || '').trim() || 'Custom';
  if (!text) return alert('Enter verse text first.');
  state.verses.push({ ref, text, attempts: 0, correct: 0, lastPracticed: null });
  ui.customVerseInput.value = '';
  ui.customRefInput.value = '';
  saveState();
  renderVerseList();
}

//
// Start-up helpers
//
function pickRandomIndex() {
  return Math.floor(Math.random() * state.verses.length);
}

function renderMultipleChoiceFallback() {
  // fallback if something goes wrong
  ui.verseText.textContent = state.verses[state.idx]?.text || '—';
}

//
// Launch
//
init();
renderStats();
renderCurrent();
