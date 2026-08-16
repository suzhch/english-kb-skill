(function () {
  'use strict';

  const D = window.KB_DETAIL || {};
  const point = D.point || {};
  const assets = D.assets || [];
  const content = point.content || {};
  const meta = point.log || {};
  const available = new Set(D.availableIds || []);
  const names = D.names || {};

  const CATEGORY_LABELS = {
    GRAMMAR: '语法',
    VOCABULARY: '词汇',
    EXPRESSION: '表达',
    PRAGMATICS: '语用',
  };
  const STRATEGY_LABELS = {
    CLASSIFICATION: '分类定位',
    EXPLANATION: '核心讲解',
    COMPARISON: '对比辨析',
    ASSOCIATION: '联想关联',
    EXAMPLE: '例句',
    COUNTER_EXAMPLE: '反例警示',
    CONFUSION: '易混辨析',
    SCENARIO: '场景应用',
    DIALOGUE: '情景对话',
    MNEMONIC: '记忆口诀',
    PRODUCTION: '表达产出',
    EXTENSION: '延伸学习',
  };

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  const get = (key) => content[key] ?? meta[key];
  const catLabel = (c) => CATEGORY_LABELS[c] ?? c;
  const li = (s) => `<li>${esc(s)}</li>`;

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function kpLink(id) {
    const label = names[id] || id;
    if (available.has(id)) {
      return `<a class="rel-link" href="../${encodeURIComponent(id)}/"><span>${esc(label)}</span><small>${esc(id)}</small></a>`;
    }
    return `<span class="rel-link plain"><span>${esc(label)}</span><small>${esc(id)}</small></span>`;
  }

  function section(title, count, body) {
    const badge = count === null ? '' : ` <span class="count">${count}</span>`;
    return `<section class="detail-section"><h3>${esc(title)}${badge}</h3>${body}</section>`;
  }

  function assetBody(a) {
    switch (a.strategy) {
      case 'CLASSIFICATION': {
        const c = a.classification || {};
        return `<p class="asset-class-parent">属于 <strong>${esc(c.parent)}</strong></p><p>${esc(c.reason ?? '')}</p>`;
      }
      case 'EXPLANATION':
        return `<p>${esc(a.explanation?.myUnderstanding ?? '')}</p>`;
      case 'COMPARISON': {
        const c = a.comparison || {};
        return `<p class="asset-compare-with">对比对象：<strong>${esc(c.compareWith)}</strong></p>
          ${c.similarities?.length ? `<h5>共同点</h5><ul>${c.similarities.map(li).join('')}</ul>` : ''}
          ${c.differences?.length ? `<h5>区别</h5><ul>${c.differences.map(li).join('')}</ul>` : ''}`;
      }
      case 'ASSOCIATION': {
        const c = a.association || {};
        return `${c.relatedWords?.length ? `<div class="chips">${c.relatedWords.map((w) => `<span class="chip-static">${esc(w)}</span>`).join('')}</div>` : ''}
          ${c.relatedTopics?.length ? `<div class="asset-links">${c.relatedTopics.map(kpLink).join('')}</div>` : ''}
          ${c.note ? `<p class="asset-note">${esc(c.note)}</p>` : ''}`;
      }
      case 'EXAMPLE': {
        const c = a.example || {};
        return `<figure class="card-example"><blockquote>${esc(c.english)}</blockquote><figcaption>${esc(c.translation ?? '')}</figcaption></figure>${c.note ? `<p class="asset-note">${esc(c.note)}</p>` : ''}`;
      }
      case 'COUNTER_EXAMPLE': {
        const c = a.counterExample || {};
        return `<p class="wrong">${esc(c.wrong)}</p><p class="asset-note">${esc(c.reason ?? '')}</p>`;
      }
      case 'CONFUSION': {
        const c = a.confusion || {};
        return `<p>容易与 <strong>${esc(c.confusedWith)}</strong> 混淆</p><p class="asset-note">${esc(c.reason ?? '')}</p>`;
      }
      case 'SCENARIO':
        return `<p>${esc(a.scenario?.description ?? '')}</p>`;
      case 'DIALOGUE': {
        const conv = a.dialogue?.conversation || [];
        return `<div class="dialogue">${conv
          .map(
            (turn) =>
              `<div class="line"><span class="speaker">${esc(turn.speaker)}</span><span class="text">${esc(turn.text)}</span></div>`
          )
          .join('')}</div>`;
      }
      case 'MNEMONIC': {
        const c = a.mnemonic || {};
        return `<p class="asset-method">方法：${esc(c.method ?? '')}</p><p class="asset-mnemonic">${esc(c.content ?? '')}</p>`;
      }
      case 'PRODUCTION': {
        const c = a.production || {};
        const score = c.score ?? 0;
        const stars = '★'.repeat(score) + '☆'.repeat(Math.max(0, 5 - score));
        return `<p class="prod-prompt">${esc(c.mySentence ?? '')}</p>
          ${c.feedback ? `<p class="asset-note">反馈：${esc(c.feedback)}</p>` : ''}
          ${score ? `<p class="prod-score">难度：<span>${stars}</span></p>` : ''}`;
      }
      case 'EXTENSION': {
        const next = a.extension?.nextTopics || [];
        return `<ul>${next.map(li).join('')}</ul>`;
      }
      default:
        return `<pre>${esc(JSON.stringify(a, null, 2))}</pre>`;
    }
  }

  function assetHtml(a) {
    return `<article class="asset-card">
      <div class="asset-head">
        <span class="badge asset-strategy">${esc(STRATEGY_LABELS[a.strategy] ?? a.strategy)}</span>
        ${a.title ? `<h4>${esc(a.title)}</h4>` : ''}
      </div>
      <div class="asset-body">${assetBody(a)}</div>
    </article>`;
  }

  const category = get('category');
  const difficulty = get('difficulty');
  const source = get('source');
  const name = content.definition?.name ?? meta.request ?? point.id;
  const created = fmtDate(get('createdAt'));
  const catClass = `badge-cat-${String(category ?? '').toLowerCase()}`;
  const diffClass = `badge-diff-${String(difficulty ?? '').toLowerCase()}`;

  const hero = `
    <section class="detail-hero">
      <div class="card-top">
        <span class="badge ${catClass}">${esc(catLabel(category))}</span>
        ${difficulty ? `<span class="badge ${diffClass}">${esc(difficulty)}</span>` : ''}
        ${source ? `<span class="badge badge-source">${esc(source)}</span>` : ''}
        ${!point.hasContent ? `<span class="badge badge-warn">内容缺失</span>` : ''}
      </div>
      <h2>${esc(name)}</h2>
      <p class="card-id">${esc(point.id)}</p>
      ${content.definition?.description ? `<p class="detail-desc">${esc(content.definition.description)}</p>` : ''}
      ${content.tags?.length ? `<div class="card-tags detail-tags">${content.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="card-meta detail-meta">
        ${created ? `<span>创建于 ${created}</span>` : ''}
        <span>学习资产 ${point.learningAssetCount}</span>
        <span>相关知识点 ${content.relatedTopics?.length ?? 0}</span>
      </div>
    </section>`;

  const parts = [hero];

  const examples = content.examples ?? [];
  if (examples.length) {
    parts.push(
      section(
        '例句',
        examples.length,
        examples
          .map(
            (ex) =>
              `<figure class="card-example detail-example"><blockquote>${esc(ex.english)}</blockquote><figcaption>${esc(ex.translation ?? '')}</figcaption>${ex.note ? `<figcaption class="ex-note">${esc(ex.note)}</figcaption>` : ''}</figure>`
          )
          .join('')
      )
    );
  }

  if (assets.length) {
    parts.push(section('学习资产', assets.length, assets.map(assetHtml).join('')));
  } else {
    parts.push(
      section('学习资产', 0, '<p class="asset-empty">该知识点暂无学习资产，可以让 Codex 生成。</p>')
    );
  }

  const related = content.relatedTopics ?? [];
  if (related.length) {
    parts.push(
      section('相关知识点', related.length, `<div class="detail-related">${related.map(kpLink).join('')}</div>`)
    );
  }

  document.getElementById('detail').innerHTML = parts.join('');
  document.title = `${name} · 英语知识库`;
  document.getElementById('page-title').textContent = name;
  document.getElementById('page-subtitle').textContent = `${catLabel(category)} · ${difficulty ?? ''} · ${point.id}`;
  document.getElementById('build-info').textContent = `构建于 ${fmtDate(D.generatedAt) || '未知'} · ${assets.length} 个学习资产`;
})();
