import { articles } from './data.js';
import { marked } from 'https://esm.sh/marked@15';

const navInner = document.getElementById('nav-inner');
const contentEl = document.getElementById('content');
const logoEl = document.getElementById('ascii-logo');

let activeSlug = articles[0]?.slug;

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

  typeAll();
}

// ── 글 전환 ──
let transitioning = false;

async function switchArticle(slug) {
  if (slug === activeSlug || transitioning) return;
  transitioning = true;

  // Nav 상태 변경
  document.querySelectorAll('.nav-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.slug === slug)
  );

  // 이전 글 숨기기
  const oldEl = document.getElementById(`article-${activeSlug}`);
  oldEl.classList.remove('active');

  activeSlug = slug;

  // 새 글 로드
  const newEl = document.getElementById(`article-${slug}`);
  const body = newEl.querySelector('.article-body');

  try {
    const html = await loadArticle(slug);
    body.innerHTML = html;
  } catch (e) {
    body.innerHTML = '<p>글을 불러올 수 없습니다.</p>';
  }

  newEl.classList.add('active');

  // 타이핑 애니메이션
  typeContent(body).then(() => {
    transitioning = false;
  });
}

// ── 타이핑 애니메이션 ──
function typeAll() {
  const slow = [
    ...document.querySelectorAll('.hero-title'),
    ...document.querySelectorAll('.nav-pill'),
  ];

  logoEl.textContent = '';
  const slowOrig = slow.map(el => { const t = el.textContent; el.textContent = ''; return t; });

  const activeBody = document.querySelector('.article.active .article-body');
  const bodyChildren = activeBody ? Array.from(activeBody.children) : [];
  bodyChildren.forEach(el => { el.style.opacity = '0'; });

  let globalI = 0;
  const SLOW_SPEED = 1;
  const CONTENT_START = 30;

  function tick() {
    let allDone = true;

    // 로고
    if (logoEl.textContent.length < LOGO.length) {
      logoEl.textContent = LOGO.slice(0, Math.min(LOGO.length, logoEl.textContent.length + 3));
      allDone = false;
    }

    // 느린 그룹 (타이틀, 네비)
    slow.forEach((el, idx) => {
      const full = slowOrig[idx];
      const delay = idx * 8;
      const progress = Math.max(0, globalI - delay);
      const len = Math.min(full.length, progress * SLOW_SPEED);
      if (el.textContent.length < full.length) {
        el.textContent = full.slice(0, len);
        allDone = false;
      }
    });

    // 본문: 블록 단위 페이드인
    if (globalI >= CONTENT_START) {
      const p = globalI - CONTENT_START;
      bodyChildren.forEach((el, i) => {
        const delay = i * 4;
        if (p >= delay && el.style.opacity === '0') {
          el.style.transition = 'opacity 400ms ease';
          el.style.opacity = '1';
        }
        if (p < delay) allDone = false;
      });
    } else {
      if (bodyChildren.length > 0) allDone = false;
    }

    globalI++;
    if (!allDone) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function typeContent(body) {
  const children = Array.from(body.children);
  children.forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 400ms ease';
  });

  return new Promise(resolve => {
    let i = 0;
    function reveal() {
      if (i >= children.length) { resolve(); return; }
      children[i].style.opacity = '1';
      i++;
      setTimeout(reveal, 60);
    }
    setTimeout(reveal, 100);
  });
}

init();
