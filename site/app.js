(function () {
  'use strict';

  const DATA = window.KB_DATA || { knowledgePoints: [] };
  const points = DATA.knowledgePoints;

  const CATEGORY_LABELS = {
    GRAMMAR: '语法',
    VOCABULARY: '词汇',
    EXPRESSION: '表达',
    PRAGMATICS: '语用',
  };
  const DIFFICULTY_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const state = {
    q: '',
    category: 'ALL',
    difficulty: 'ALL',
    subcategory: 'ALL',
    source: 'ALL',
    sort: 'newest',
  };

  const $ = (sel) => document.querySelector(sel);
  const searchEl = $('#search');
  const subcategoryEl = $('#filter-subcategory');
  const sourceEl = $('#filter-source');
  const sortEl = $('#sort');
  const resetEl = $('#reset');
  const cardsEl = $('#cards');
  const emptyEl = $('#empty');
  const resultCountEl = $('#result-count');
  const chipsCategoryEl = $('#chips-category');
  const chipsDifficultyEl = $('#chips-difficulty');
  const statTotalEl = $('#stat-total');
  const buildInfoEl = $('#build-info');

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const unique = (fn) => [...new Set(points.map(fn).filter(Boolean))];
  const catLabel = (c) => CATEGORY_LABELS[c] ?? c;
  const diffRank = (d) => DIFFICULTY_ORDER.indexOf(d);
  const get = (p, key) => p.content?.[key] ?? p.log?.[key];

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function chipsHtml(items, current) {
    const all = `<button type="button" class="chip${current === 'ALL' ? ' active' : ''}" data-value="ALL">全部</button>`;
    return (
      all +
      items
        .map(([value, count, label]) => {
          const active = current === value ? ' active' : '';
          return `<button type="button" class="chip${active}" data-value="${esc(value)}">${esc(label ?? value)}<em>${count}</em></button>`;
        })
        .join('')
    );
  }

  function renderStats() {
    statTotalEl.textContent = String(points.length);
    buildInfoEl.textContent = `构建于 ${fmtDate(DATA.generatedAt) || '未知'} · ${points.length} 个知识点`;

    const catCounts = {};
    for (const p of points) {
      const c = get(p, 'category');
      if (c) catCounts[c] = (catCounts[c] ?? 0) + 1;
    }
    chipsCategoryEl.innerHTML = chipsHtml(
      Object.entries(catCounts).map(([v, n]) => [v, n, catLabel(v)]),
      state.category
    );
    chipsCategoryEl.querySelectorAll('button.chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.category = btn.dataset.value === state.category ? 'ALL' : btn.dataset.value;
        state.subcategory = 'ALL';
        subcategoryEl.value = 'ALL';
        sync();
      });
    });

    const diffItems = DIFFICULTY_ORDER.map((d) => [
      d,
      points.filter((p) => get(p, 'difficulty') === d).length,
      d,
    ]).filter(([, n]) => n > 0);
    chipsDifficultyEl.innerHTML = chipsHtml(diffItems, state.difficulty);
    chipsDifficultyEl.querySelectorAll('button.chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.difficulty = btn.dataset.value === state.difficulty ? 'ALL' : btn.dataset.value;
        sync();
      });
    });
  }

  function populateControls() {
    const subcats = unique((p) => get(p, 'subcategory')).sort();
    subcategoryEl.innerHTML =
      `<option value="ALL">全部子类别</option>` +
      subcats.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');

    const sources = unique((p) => get(p, 'source')).sort();
    sourceEl.innerHTML =
      `<option value="ALL">全部来源</option>` +
      sources.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
  }

  function matches(p) {
    const category = get(p, 'category');
    const difficulty = get(p, 'difficulty');
    const subcategory = get(p, 'subcategory');
    const source = get(p, 'source');

    if (state.category !== 'ALL' && category !== state.category) return false;
    if (state.difficulty !== 'ALL' && difficulty !== state.difficulty) return false;
    if (state.subcategory !== 'ALL' && subcategory !== state.subcategory) return false;
    if (state.source !== 'ALL' && source !== state.source) return false;

    const q = state.q.trim().toLowerCase();
    if (!q) return true;

    const content = p.content ?? {};
    const haystack = [
      p.id,
      category,
      subcategory,
      difficulty,
      source,
      content.definition?.name,
      content.definition?.description,
      (content.tags ?? []).join(' '),
      ...(content.examples ?? []).map((ex) => `${ex.english} ${ex.translation} ${ex.note}`),
      p.log?.request,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function sortPoints(list) {
    const list2 = [...list];
    switch (state.sort) {
      case 'oldest':
        list2.sort((a, b) =>
          (get(a, 'createdAt') ?? '').localeCompare(get(b, 'createdAt') ?? '')
        );
        break;
      case 'difficulty-asc':
        list2.sort(
          (a, b) =>
            diffRank(get(a, 'difficulty')) - diffRank(get(b, 'difficulty')) ||
            a.id.localeCompare(b.id)
        );
        break;
      case 'difficulty-desc':
        list2.sort(
          (a, b) =>
            diffRank(get(b, 'difficulty')) - diffRank(get(a, 'difficulty')) ||
            a.id.localeCompare(b.id)
        );
        break;
      case 'name':
        list2.sort((a, b) =>
          (get(a, 'definition')?.name ?? a.id).localeCompare(
            get(b, 'definition')?.name ?? b.id,
            'zh-CN'
          )
        );
        break;
      default: // newest
        list2.sort((a, b) =>
          (get(b, 'createdAt') ?? '').localeCompare(get(a, 'createdAt') ?? '')
        );
    }
    return list2;
  }

  function cardHtml(p) {
    const content = p.content ?? {};
    const category = get(p, 'category');
    const difficulty = get(p, 'difficulty');
    const source = get(p, 'source');
    const name = content.definition?.name ?? p.log?.request ?? p.id;
    const desc = content.definition?.description ?? '';
    const firstExample = content.examples?.[0];
    const tags = content.tags ?? [];
    const created = fmtDate(get(p, 'createdAt'));
    const catClass = `badge-cat-${String(category ?? '').toLowerCase()}`;
    const diffClass = `badge-diff-${String(difficulty ?? '').toLowerCase()}`;

    return `
      <a class="card" href="knowledge/${encodeURIComponent(p.id)}/" aria-label="查看 ${esc(name)} 详情">
        <div class="card-top">
          <span class="badge ${catClass}">${esc(catLabel(category))}</span>
          ${difficulty ? `<span class="badge ${diffClass}">${esc(difficulty)}</span>` : ''}
          ${source ? `<span class="badge badge-source">${esc(source)}</span>` : ''}
          ${!p.hasContent ? `<span class="badge badge-warn">内容缺失</span>` : ''}
        </div>
        <h3 class="card-name">${esc(name)}</h3>
        <p class="card-id">${esc(p.id)}</p>
        ${desc ? `<p class="card-desc">${esc(desc)}</p>` : ''}
        ${
          firstExample
            ? `<figure class="card-example">
                <blockquote>${esc(firstExample.english)}</blockquote>
                <figcaption>${esc(firstExample.translation ?? '')}</figcaption>
              </figure>`
            : ''
        }
        <div class="card-meta">
          ${created ? `<span>创建于 ${created}</span>` : ''}
          <span>相关 ${content.relatedTopics?.length ?? 0}</span>
          <span>学习资产 ${p.learningAssetCount}</span>
        </div>
        ${
          tags.length
            ? `<div class="card-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>`
            : ''
        }
        <span class="card-open">查看详情 →</span>
      </a>
    `;
  }

  function render() {
    const filtered = sortPoints(points.filter(matches));
    cardsEl.innerHTML = filtered.map(cardHtml).join('');
    emptyEl.hidden = filtered.length > 0;
    resultCountEl.textContent =
      filtered.length === points.length
        ? `${points.length} 个知识点`
        : `${filtered.length} / ${points.length} 个知识点`;
  }

  function sync() {
    renderStats();
    render();
  }

  searchEl.addEventListener('input', () => {
    state.q = searchEl.value;
    render();
  });
  subcategoryEl.addEventListener('change', () => {
    state.subcategory = subcategoryEl.value;
    render();
  });
  sourceEl.addEventListener('change', () => {
    state.source = sourceEl.value;
    render();
  });
  sortEl.addEventListener('change', () => {
    state.sort = sortEl.value;
    render();
  });
  resetEl.addEventListener('click', () => {
    state.q = '';
    state.category = 'ALL';
    state.difficulty = 'ALL';
    state.subcategory = 'ALL';
    state.source = 'ALL';
    state.sort = 'newest';
    searchEl.value = '';
    subcategoryEl.value = 'ALL';
    sourceEl.value = 'ALL';
    sortEl.value = 'newest';
    sync();
  });

  populateControls();
  sync();
})();
