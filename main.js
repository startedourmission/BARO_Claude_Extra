import { articles } from './data.js';
import { marked } from 'https://esm.sh/marked@15';

const navInner = document.getElementById('nav-inner');
const contentEl = document.getElementById('content');
const logoEl = document.getElementById('ascii-logo');

let activeSlug = articles[0]?.slug;
let switchId = 0;
let currentBodyAnim = null;

// ── ASCII 로고 ──
const LOGO = `                   vlllr       1l1
                   vlllll     1llv
                    vlll1j    lllî    jll1
              1lv    1lll1   vll1   rllll1j
             lllllv   jllll  rllv  vllllv
              v11ll1v1 jllll vllv1llllll
                 r1llllvvllll1l1vlllllv
                    v1llllllllllllllv      îj1l
                       vlllllllllllll1llllll1lv
           1llllllllllllvlllllllllllll1vvr
                    vîîî1lllllllllllv1vvl1v1vr
                     v1lll11lllllllj l11llllll1í
                  lllll1lvllvl1llll1lv
               v1lll11 î1ll 1l1vlll11l1v
              j1l1j   vllv  1ll l1llv 111v
                     1llv  v11   îlll1  11lj
                   j111    lll     vll1
                  î11z    lll1      vlv
                          o1l1`;

// ── 마크다운 fetch & 렌더링 ──
const cache = {};

async function loadArticle(slug) {
  if (cache[slug]) return cache[slug];
  const res = await fetch(`articles/${slug}.md`);
  if (!res.ok) throw new Error(`Failed to load ${slug}.md`);
  const md = await res.text();
  const html = marked.parse(md);
  cache[slug] = html;
  return html;
}

// ── Nav 생성 ──
articles.forEach((article, i) => {
  const btn = document.createElement('button');
  btn.className = `nav-pill${i === 0 ? ' active' : ''}`;
  btn.textContent = article.title;
  btn.dataset.slug = article.slug;
  btn.addEventListener('click', () => switchArticle(article.slug));
  navInner.appendChild(btn);
});

// ── 타이핑 유틸 (DOM 텍스트 노드를 한 글자씩 드러내기) ──

function collectTextNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const entries = [];
  let n;
  while ((n = walker.nextNode())) {
    const text = n.nodeValue;
    if (text && text.length > 0) {
      entries.push({ node: n, text });
    }
  }
  return entries;
}

function clearEntries(entries) {
  entries.forEach(e => { e.node.nodeValue = ''; });
}

// 타이핑 애니메이션 — 중간 취소 가능, 취소 시 전체 텍스트 즉시 복원
function typeEntries(entries, opts = {}) {
  const charsPerFrame = opts.charsPerFrame ?? 40;
  const onDone = opts.onDone;

  const state = {
    entries: entries.map(e => ({ node: e.node, text: e.text, i: 0 })),
    cancelled: false,
    done: false,
    idx: 0,
  };

  state.cancel = () => {
    if (state.done) return;
    state.cancelled = true;
    state.entries.forEach(e => { e.node.nodeValue = e.text; });
    state.done = true;
  };

  function tick() {
    if (state.cancelled || state.done) return;
    let budget = charsPerFrame;
    while (budget > 0 && state.idx < state.entries.length) {
      const e = state.entries[state.idx];
      const take = Math.min(budget, e.text.length - e.i);
      e.i += take;
      e.node.nodeValue = e.text.slice(0, e.i);
      budget -= take;
      if (e.i >= e.text.length) state.idx++;
    }
    if (state.idx < state.entries.length) {
      requestAnimationFrame(tick);
    } else {
      state.done = true;
      if (onDone) onDone();
    }
  }
  requestAnimationFrame(tick);
  return state;
}

// ── 초기 로드 ──
async function init() {
  contentEl.innerHTML = '';

  for (const article of articles) {
    const div = document.createElement('div');
    div.className = `article${article.slug === activeSlug ? ' active' : ''}`;
    div.id = `article-${article.slug}`;

    const body = document.createElement('div');
    body.className = 'article-body';
    div.appendChild(body);
    contentEl.appendChild(div);
  }

  // 첫 글 로드
  try {
    const html = await loadArticle(activeSlug);
    const el = document.querySelector(`#article-${activeSlug} .article-body`);
    el.innerHTML = html;
  } catch (e) {
    console.error(e);
  }

  animateIntro();
}

// ── 인트로 애니메이션 (로고 + 타이틀 + 네비 + 본문) ──
function animateIntro() {
  const introSlug = activeSlug;

  const slow = [
    ...document.querySelectorAll('.hero-title'),
    ...document.querySelectorAll('.nav-pill'),
  ];

  logoEl.textContent = '';
  const slowOrig = slow.map(el => { const t = el.textContent; el.textContent = ''; return t; });

  // 본문 텍스트 노드들을 비워둔다
  const activeBody = document.querySelector('.article.active .article-body');
  let bodyEntries = [];
  if (activeBody) {
    bodyEntries = collectTextNodes(activeBody);
    clearEntries(bodyEntries);
  }

  const SLOW_SPEED = 1;
  const CONTENT_START = 30;

  let globalI = 0;
  let bodyStarted = false;

  function tick() {
    let chromeDone = true;

    // 로고
    if (logoEl.textContent.length < LOGO.length) {
      logoEl.textContent = LOGO.slice(0, Math.min(LOGO.length, logoEl.textContent.length + 3));
      chromeDone = false;
    }

    // 느린 그룹 (타이틀, 네비)
    slow.forEach((el, idx) => {
      const full = slowOrig[idx];
      const delay = idx * 8;
      const progress = Math.max(0, globalI - delay);
      const len = Math.min(full.length, progress * SLOW_SPEED);
      if (el.textContent.length < full.length) {
        el.textContent = full.slice(0, len);
        chromeDone = false;
      }
    });

    // 본문 타이핑 시작 (CONTENT_START 프레임 이후, 한 번만)
    // 사용자가 이미 다른 글로 전환했다면 시작하지 않는다
    if (!bodyStarted && globalI >= CONTENT_START && bodyEntries.length > 0 && activeSlug === introSlug) {
      bodyStarted = true;
      currentBodyAnim = typeEntries(bodyEntries, {
        onDone: () => { if (currentBodyAnim && currentBodyAnim.done) currentBodyAnim = null; },
      });
    }

    globalI++;
    if (!chromeDone) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── 글 전환 (로딩 중·타이핑 중이어도 즉시 전환 가능) ──
async function switchArticle(slug) {
  // 타이핑 중인 애니메이션이 있으면 먼저 중단
  if (currentBodyAnim && !currentBodyAnim.done) {
    currentBodyAnim.cancel();
    currentBodyAnim = null;
  }

  if (slug === activeSlug) return;

  const myId = ++switchId;

  // Nav 상태 변경
  document.querySelectorAll('.nav-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.slug === slug)
  );

  // 이전 글 숨기기
  const oldEl = document.getElementById(`article-${activeSlug}`);
  oldEl.classList.remove('active');

  activeSlug = slug;

  const newEl = document.getElementById(`article-${slug}`);
  const body = newEl.querySelector('.article-body');

  // 로드 중에도 다른 글로 전환 가능하도록 myId 체크
  let html;
  try {
    html = await loadArticle(slug);
  } catch (e) {
    html = '<p>글을 불러올 수 없습니다.</p>';
  }

  // 로드 완료 시점에 이미 다른 글로 넘어간 경우 무시
  if (myId !== switchId) return;

  body.innerHTML = html;
  newEl.classList.add('active');

  // 본문 타이핑 시작
  const entries = collectTextNodes(body);
  clearEntries(entries);
  currentBodyAnim = typeEntries(entries, {
    onDone: () => { if (myId === switchId) currentBodyAnim = null; },
  });
}

init();
