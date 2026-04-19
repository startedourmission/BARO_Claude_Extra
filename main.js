import { articles, categories } from './data.js';
import { marked } from 'https://esm.sh/marked@15';

const navInner = document.getElementById('nav-inner');
const contentEl = document.getElementById('content');
const logoEl = document.getElementById('ascii-logo');

let activeSlug = articles[0]?.slug;
let switchId = 0;

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

// Obsidian 이미지 임베드 문법을 웹에서 쓸 수 있게 변환
// 지원 형태:
//   ![[file.png]]              기본
//   ![[file.png|Alt text]]     alt 지정
//   ![[file.png|300]]          width 지정
//   ![[file.png|300x200]]      width x height
//   ![[file.png|Alt|300]]      alt + width
//   ![[sub/file.png]]          하위 폴더
//
// 이미지 파일은 articles/assets/images/ 아래에 둔다 (Obsidian 첨부 폴더 컨벤션)
const IMAGE_BASE = 'articles/assets/images/';

function encodeFilePath(path) {
  return path.split('/').map(encodeURIComponent).join('/');
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function preprocessObsidianImages(md) {
  return md.replace(
    /!\[\[([^\]|]+?)(?:\|([^\]|]+?))?(?:\|([^\]|]+?))?\]\]/g,
    (_m, file, opt1, opt2) => {
      const src = IMAGE_BASE + encodeFilePath(file.trim());

      let alt = '';
      let width = '';
      let height = '';
      for (const p of [opt1, opt2].filter(Boolean)) {
        const t = p.trim();
        const dim = t.match(/^(\d+)(?:x(\d+))?$/);
        if (dim) {
          width = dim[1];
          if (dim[2]) height = dim[2];
        } else {
          alt = t;
        }
      }
      const altText = alt || file.trim().split('/').pop();

      let attrs = `src="${src}" alt="${escapeAttr(altText)}" loading="lazy"`;
      if (width) attrs += ` width="${width}"`;
      if (height) attrs += ` height="${height}"`;
      return `<img ${attrs}>`;
    }
  );
}

async function loadArticle(slug) {
  if (cache[slug]) return cache[slug];
  const res = await fetch(`articles/${slug}.md`);
  if (!res.ok) throw new Error(`Failed to load ${slug}.md`);
  const raw = await res.text();
  const md = preprocessObsidianImages(raw);
  const html = marked.parse(md);
  cache[slug] = html;
  return html;
}

// ── Nav 생성 (카테고리별) ──
categories.forEach(cat => {
  const group = document.createElement('div');
  group.className = 'nav-category';

  const label = document.createElement('div');
  label.className = 'nav-category-label';
  label.textContent = cat.name;
  group.appendChild(label);

  cat.items.forEach(article => {
    const btn = document.createElement('button');
    btn.className = `nav-pill${article.slug === activeSlug ? ' active' : ''}`;
    btn.textContent = article.title;
    btn.dataset.slug = article.slug;
    btn.addEventListener('click', () => switchArticle(article.slug));
    group.appendChild(btn);
  });

  navInner.appendChild(group);
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

  animateChrome();
}

// ── 인트로: 로고 + 타이틀 + 네비만 타이핑 연출 (본문은 즉시 표시) ──
function animateChrome() {
  const slow = [
    ...document.querySelectorAll('.hero-title'),
    ...document.querySelectorAll('.nav-pill'),
  ];

  logoEl.textContent = '';
  const slowOrig = slow.map(el => { const t = el.textContent; el.textContent = ''; return t; });

  const SLOW_SPEED = 1;
  let globalI = 0;

  function tick() {
    let done = true;

    if (logoEl.textContent.length < LOGO.length) {
      logoEl.textContent = LOGO.slice(0, Math.min(LOGO.length, logoEl.textContent.length + 3));
      done = false;
    }

    slow.forEach((el, idx) => {
      const full = slowOrig[idx];
      const delay = idx * 8;
      const progress = Math.max(0, globalI - delay);
      const len = Math.min(full.length, progress * SLOW_SPEED);
      if (el.textContent.length < full.length) {
        el.textContent = full.slice(0, len);
        done = false;
      }
    });

    globalI++;
    if (!done) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ── 글 전환 ──
async function switchArticle(slug) {
  if (slug === activeSlug) return;

  const myId = ++switchId;

  document.querySelectorAll('.nav-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.slug === slug)
  );

  const oldEl = document.getElementById(`article-${activeSlug}`);
  oldEl.classList.remove('active');

  activeSlug = slug;

  const newEl = document.getElementById(`article-${slug}`);
  const body = newEl.querySelector('.article-body');

  let html;
  try {
    html = await loadArticle(slug);
  } catch (e) {
    html = '<p>글을 불러올 수 없습니다.</p>';
  }

  if (myId !== switchId) return;

  body.innerHTML = html;
  newEl.classList.add('active');
}

init();
