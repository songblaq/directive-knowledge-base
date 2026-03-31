/**
 * DKB Browse MVP — catalog loading, filters, cards, detail, compare.
 * Expects window.__DKB_PAGE__ = 'browse' | 'detail' | 'compare'
 */
(function () {
  'use strict';

  const GROUP_ORDER = ['form', 'function', 'execution', 'governance', 'adoption', 'clarity'];
  const GROUP_LABELS = {
    form: 'Form',
    function: 'Function',
    execution: 'Execution',
    governance: 'Governance',
    adoption: 'Adoption',
    clarity: 'Clarity',
  };
  const GROUP_ACCENT = {
    form: '#6c9bff',
    function: '#a78bfa',
    execution: '#34d399',
    governance: '#fbbf24',
    adoption: '#f472b6',
    clarity: '#22d3ee',
  };

  const CATEGORIES = [
    'agent-skills-community',
    'agent-skills-official',
    'awesome-collections',
    'claude-code',
    'clawhub',
    'codex',
    'cursor-rules',
    'llm-tools',
    'mcp',
    'oh-my-tools',
    'prompts',
    'skills-platforms',
  ];

  /** Spec v0.1 — 34 dimensions; values resolved via aliases from catalog `scores`. */
  const DIMENSION_SPEC = [
    { group: 'form', key: 'skillness', label: 'skillness' },
    { group: 'form', key: 'agentness', label: 'agentness' },
    { group: 'form', key: 'workflowness', label: 'workflowness' },
    { group: 'form', key: 'commandness', label: 'commandness' },
    { group: 'form', key: 'pluginness', label: 'pluginness' },
    { group: 'function', key: 'planning', label: 'planning' },
    { group: 'function', key: 'review', label: 'review' },
    { group: 'function', key: 'coding', label: 'coding' },
    { group: 'function', key: 'research', label: 'research' },
    { group: 'function', key: 'ops', label: 'ops' },
    { group: 'function', key: 'writing', label: 'writing' },
    { group: 'function', key: 'content', label: 'content' },
    { group: 'function', key: 'orchestration', label: 'orchestration' },
    { group: 'execution', key: 'atomicity', label: 'atomicity' },
    { group: 'execution', key: 'autonomy', label: 'autonomy' },
    { group: 'execution', key: 'multi_stepness', label: 'multi_stepness' },
    { group: 'execution', key: 'tool_dependence', label: 'tool_dependence' },
    { group: 'execution', key: 'composability', label: 'composability' },
    { group: 'execution', key: 'reusability', label: 'reusability' },
    { group: 'governance', key: 'officialness', label: 'officialness' },
    { group: 'governance', key: 'legal_clarity', label: 'legal_clarity' },
    { group: 'governance', key: 'maintenance_health', label: 'maintenance_health' },
    { group: 'governance', key: 'install_verifiability', label: 'install_verifiability' },
    { group: 'governance', key: 'trustworthiness', label: 'trustworthiness' },
    { group: 'adoption', key: 'star_signal', label: 'star_signal' },
    { group: 'adoption', key: 'fork_signal', label: 'fork_signal' },
    { group: 'adoption', key: 'mention_signal', label: 'mention_signal' },
    { group: 'adoption', key: 'install_signal', label: 'install_signal' },
    { group: 'adoption', key: 'freshness', label: 'freshness' },
    { group: 'clarity', key: 'naming_clarity', label: 'naming_clarity' },
    { group: 'clarity', key: 'description_clarity', label: 'description_clarity' },
    { group: 'clarity', key: 'io_clarity', label: 'io_clarity' },
    { group: 'clarity', key: 'example_coverage', label: 'example_coverage' },
    { group: 'clarity', key: 'overlap_ambiguity_inverse', label: 'overlap_ambiguity_inverse' },
  ];

  const SCORE_KEY_ALIASES = {
    pluginness: ['pluginness', 'toolness'],
    commandness: ['commandness'],
    install_verifiability: ['install_verifiability', 'installability'],
    trustworthiness: ['trustworthiness', 'trust'],
    star_signal: ['star_signal', 'popularity'],
    fork_signal: ['fork_signal'],
    mention_signal: ['mention_signal'],
    install_signal: ['install_signal'],
    freshness: ['freshness'],
    officialness: ['officialness'],
    legal_clarity: ['legal_clarity'],
    maintenance_health: ['maintenance_health'],
    atomicity: ['atomicity'],
    autonomy: ['autonomy'],
    multi_stepness: ['multi_stepness'],
    tool_dependence: ['tool_dependence'],
    composability: ['composability'],
    reusability: ['reusability'],
    agentness: ['agentness'],
    research: ['research'],
    ops: ['ops'],
    writing: ['writing'],
    content: ['content'],
    orchestration: ['orchestration'],
    naming_clarity: ['naming_clarity'],
    io_clarity: ['io_clarity'],
    example_coverage: ['example_coverage'],
    overlap_ambiguity_inverse: ['overlap_ambiguity_inverse'],
  };

  function getScoreEntry(directive, specKey) {
    if (!directive.scores) return null;
    const aliases = SCORE_KEY_ALIASES[specKey] || [specKey];
    for (const a of aliases) {
      if (directive.scores[a] != null) return directive.scores[a];
    }
    return null;
  }

  function getDimensionValue(directive, specKey) {
    const e = getScoreEntry(directive, specKey);
    return e ? e.score : null;
  }

  function groupAverage(directive, group) {
    const g = directive.scores_by_group && directive.scores_by_group[group];
    if (!g || typeof g !== 'object') return null;
    const vals = Object.values(g).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function groupStatus(avg) {
    if (avg == null || Number.isNaN(avg)) return { cls: 'bg-gray-600', label: 'N/A', tier: 'na' };
    if (avg >= 0.6) return { cls: 'bg-emerald-500', label: '양호', tier: 'good' };
    if (avg >= 0.35) return { cls: 'bg-amber-500', label: '주의', tier: 'warn' };
    return { cls: 'bg-red-500', label: '차단', tier: 'bad' };
  }

  function topLowDimensions(directive, n) {
    if (!directive.scores) return [];
    const rows = Object.entries(directive.scores).map(([key, v]) => ({
      key,
      score: v.score,
      group: v.dimension_group || '',
      confidence: v.confidence,
    }));
    rows.sort((a, b) => a.score - b.score);
    return rows.slice(0, n);
  }

  function truncate(s, max) {
    if (!s) return '';
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }

  function recommendationBadge(rec) {
    const map = {
      recommended: { text: '추천', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
      neutral: { text: '중립', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
      caution: { text: '주의', cls: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
    };
    return map[rec] || map.neutral;
  }

  function verdictReasoning(d) {
    const rec = (d.verdict && d.verdict.recommendation) || 'neutral';
    const trust = (d.verdict && d.verdict.trust) || 'medium';
    const overall = typeof d.overall_score === 'number' ? d.overall_score : null;
    const lows = topLowDimensions(d, 3).map((x) => x.key).join(', ');
    const parts = [];
    if (overall != null) {
      parts.push(`종합 점수는 약 ${(overall * 100).toFixed(1)}점 수준입니다.`);
    }
    parts.push(`권고 등급은 “${rec === 'recommended' ? '추천' : rec === 'caution' ? '주의' : '중립'}”이며, 신뢰 신호는 “${trust}”로 표시됩니다.`);
    if (lows) {
      parts.push(`상대적으로 낮게 나온 차원에는 ${lows} 등이 있습니다. 이 구간은 실제 사용 전에 문서·라이선스·운영 상태를 추가로 확인하는 것이 좋습니다.`);
    }
    return parts.join(' ');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderMiniHealthBars(directive) {
    return GROUP_ORDER.map((g) => {
      const avg = groupAverage(directive, g);
      const pct = avg != null ? Math.round(avg * 100) : 0;
      const st = groupStatus(avg);
      const fill = avg != null ? `width:${pct}%` : 'width:0%';
      const bg =
        st.tier === 'na' ? '#4b5563' : st.tier === 'good' ? '#10b981' : st.tier === 'warn' ? '#f59e0b' : '#ef4444';
      return `<div class="flex items-center gap-1.5 min-w-0" title="${GROUP_LABELS[g]}: ${st.label} · ${avg != null ? pct + '%' : 'N/A'}">
        <span class="text-[9px] uppercase tracking-tighter text-gray-500 w-4 shrink-0">${g[0].toUpperCase()}</span>
        <div class="h-1.5 flex-1 rounded-full bg-gray-800 overflow-hidden">
          <div class="h-full rounded-full transition-all" style="${fill};background:${bg};opacity:${avg != null ? 0.9 : 0.35}"></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderGroupCards(directive) {
    return GROUP_ORDER.map((g) => {
      const avg = groupAverage(directive, g);
      const st = groupStatus(avg);
      const pct = avg != null ? Math.round(avg * 100) : null;
      const border = st.tier === 'good' ? 'border-emerald-500/30' : st.tier === 'warn' ? 'border-amber-500/30' : st.tier === 'bad' ? 'border-red-500/30' : 'border-gray-700';
      return `<div class="rounded-xl border ${border} bg-gray-800/50 p-4">
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-sm font-medium text-gray-200">${GROUP_LABELS[g]}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${st.cls} text-white font-medium">${st.label}</span>
        </div>
        <div class="h-2 rounded-full bg-gray-900 overflow-hidden mb-1">
          <div class="h-full rounded-full transition-all" style="width:${pct != null ? pct : 0}%;background:${GROUP_ACCENT[g]}"></div>
        </div>
        <p class="text-xs text-gray-500">${pct != null ? `평균 ${pct}%` : '데이터 없음'}</p>
      </div>`;
    }).join('');
  }

  function renderExpertTable(directive) {
    let currentGroup = '';
    const parts = [];
    for (const dim of DIMENSION_SPEC) {
      if (dim.group !== currentGroup) {
        const accent = GROUP_ACCENT[dim.group] || '#6c9bff';
        parts.push(
          '<tr class="bg-gray-800/80"><td colspan="3" class="px-3 py-2 text-xs font-semibold text-gray-300 uppercase tracking-wider border-l-4" style="border-left-color:' +
            accent +
            '">' +
            GROUP_LABELS[dim.group] +
            '</td></tr>'
        );
        currentGroup = dim.group;
      }
      const val = getDimensionValue(directive, dim.key);
      const conf = getScoreEntry(directive, dim.key);
      const confVal = conf && typeof conf.confidence === 'number' ? conf.confidence : null;
      const display = val != null ? (val * 100).toFixed(1) + '%' : '—';
      const confStr = confVal != null ? (confVal * 100).toFixed(0) + '%' : '—';
      parts.push(`<tr class="border-b border-gray-800 hover:bg-gray-800/30">
          <td class="px-3 py-2 text-sm text-gray-300 font-mono">${escapeHtml(dim.label)}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-100">${display}</td>
          <td class="px-3 py-2 text-sm text-right text-gray-500">${confStr}</td>
        </tr>`);
    }
    const rows = parts.join('');
    return `<table class="w-full text-left border-collapse">
      <thead><tr class="text-xs text-gray-500 border-b border-gray-700">
        <th class="px-3 py-2 font-medium">차원</th>
        <th class="px-3 py-2 font-medium text-right">점수</th>
        <th class="px-3 py-2 font-medium text-right">신뢰도</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  function renderTopIssues(directive, n) {
    const lows = topLowDimensions(directive, n);
    if (!lows.length) return '<p class="text-gray-500 text-sm">이슈 차원 데이터가 없습니다.</p>';
    return `<ol class="space-y-3 list-decimal list-inside marker:text-amber-400">
      ${lows
        .map(
          (x) => `<li class="text-sm text-gray-200 pl-1">
            <span class="font-mono text-amber-200/90">${escapeHtml(x.key)}</span>
            <span class="text-gray-500"> · ${GROUP_LABELS[x.group] || x.group}</span>
            <span class="text-red-300/90 font-medium"> ${(x.score * 100).toFixed(1)}%</span>
          </li>`
        )
        .join('')}
    </ol>`;
  }

  function renderDetailInner(directive) {
    const repo = directive.metadata && directive.metadata.repo;
    const stars = repo && repo.stargazers_count != null ? repo.stargazers_count : '—';
    const lic = repo && repo.license_spdx ? repo.license_spdx : '—';
    const url = (repo && repo.html_url) || directive.origin_uri || '—';
    const updated = (repo && repo.updated_at) || (directive.metadata && directive.metadata.fetched_at) || '—';
    const rec = (directive.verdict && directive.verdict.recommendation) || 'neutral';
    const badge = recommendationBadge(rec);

    const permalink = 'detail.html?id=' + encodeURIComponent(directive.directive_id);
    return `<div class="space-y-6">
      <div>
        <h2 class="text-xl font-bold text-white mb-1">${escapeHtml(directive.preferred_name || directive.directive_id)}</h2>
        <p class="text-xs text-gray-500 mt-1"><a class="text-blue-400 hover:underline" href="${permalink}">공유 링크 (별도 페이지)</a></p>
        <p class="text-gray-400 text-sm leading-relaxed mt-2">${escapeHtml(directive.normalized_summary || '')}</p>
        <div class="flex flex-wrap gap-2 mt-3">
          <span class="text-xs px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">${escapeHtml(directive.category || '')}</span>
          <span class="text-xs px-2 py-1 rounded-md border ${badge.cls}">${badge.text}</span>
        </div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-300 mb-3">① 그룹 헬스 (6)</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${renderGroupCards(directive)}</div>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-300 mb-3">② 주요 이슈 차원 (낮은 순)</h3>
        ${renderTopIssues(directive, 5)}
      </div>
      <div>
        <h3 class="text-sm font-semibold text-gray-300 mb-2">③ 권고 및 근거</h3>
        <p class="text-sm text-gray-300 leading-relaxed border border-gray-700 rounded-lg p-4 bg-gray-800/40">${escapeHtml(verdictReasoning(directive))}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border border-gray-800 rounded-xl p-4 bg-gray-900/50">
        <div><span class="text-gray-500">출처</span><br><a class="text-blue-400 hover:underline break-all" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></div>
        <div><span class="text-gray-500">라이선스</span><br><span class="text-gray-200">${escapeHtml(String(lic))}</span></div>
        <div><span class="text-gray-500">Stars</span><br><span class="text-gray-200">${escapeHtml(String(stars))}</span></div>
        <div><span class="text-gray-500">최근 갱신</span><br><span class="text-gray-200">${escapeHtml(String(updated))}</span></div>
      </div>
      <div>
        <button type="button" id="dkb-expert-toggle" class="text-sm text-blue-400 hover:text-blue-300 mb-2">전문가 뷰 · 34차원 전체 표시</button>
        <div id="dkb-expert-panel" class="hidden overflow-x-auto rounded-xl border border-gray-800 bg-gray-950/50">${renderExpertTable(directive)}</div>
      </div>
    </div>`;
  }

  function wireExpertToggle(root) {
    const btn = root.querySelector('#dkb-expert-toggle');
    const panel = root.querySelector('#dkb-expert-panel');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const open = !panel.classList.contains('hidden');
      if (open) {
        panel.classList.add('hidden');
        btn.textContent = '전문가 뷰 · 34차원 전체 표시';
      } else {
        panel.classList.remove('hidden');
        btn.textContent = '전문가 뷰 닫기';
      }
    });
  }

  let catalogCache = null;

  async function loadCatalog() {
    if (catalogCache) return catalogCache;
    const res = await fetch('data/catalog.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('catalog load failed');
    catalogCache = await res.json();
    return catalogCache;
  }

  function getDirectives(data) {
    return Array.isArray(data.directives) ? data.directives : [];
  }

  function filterDirectives(directives, query, selectedCategories) {
    const q = (query || '').trim().toLowerCase();
    return directives.filter((d) => {
      if (selectedCategories.size && !selectedCategories.has(d.category)) return false;
      if (!q) return true;
      const hay = [d.preferred_name, d.directive_id, d.normalized_summary, d.source_label]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }

  function initBrowse() {
    const grid = document.getElementById('dkb-card-grid');
    const search = document.getElementById('dkb-search');
    const sidebar = document.getElementById('dkb-category-filters');
    const panel = document.getElementById('dkb-detail-panel');
    const panelInner = document.getElementById('dkb-detail-inner');
    const panelBackdrop = document.getElementById('dkb-detail-backdrop');
    const closeBtn = document.getElementById('dkb-detail-close');

    let selectedCats = new Set(CATEGORIES);
    let allDirectives = [];

    function closePanel() {
      panel.classList.add('hidden');
      panelBackdrop.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }

    function openPanel() {
      panel.classList.remove('hidden');
      panelBackdrop.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    closeBtn.addEventListener('click', closePanel);
    panelBackdrop.addEventListener('click', closePanel);

    sidebar.innerHTML = CATEGORIES.map(
      (c) => `<label class="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white py-1">
        <input type="checkbox" class="dkb-cat rounded border-gray-600 bg-gray-800 text-blue-500" value="${escapeHtml(c)}" checked />
        <span class="truncate" title="${escapeHtml(c)}">${escapeHtml(c.replace(/-/g, ' '))}</span>
      </label>`
    ).join('');

    sidebar.querySelectorAll('.dkb-cat').forEach((el) => {
      el.addEventListener('change', () => {
        selectedCats = new Set();
        sidebar.querySelectorAll('.dkb-cat:checked').forEach((x) => selectedCats.add(x.value));
        render();
      });
    });

    search.addEventListener('input', render);

    function renderCard(d) {
      const rec = (d.verdict && d.verdict.recommendation) || 'neutral';
      const badge = recommendationBadge(rec);
      const repo = d.metadata && d.metadata.repo;
      const stars = repo && repo.stargazers_count != null ? repo.stargazers_count : '—';
      return `<article class="dkb-card cursor-pointer rounded-xl border border-gray-800 bg-gray-800/40 hover:border-gray-600 hover:bg-gray-800/70 p-4 transition-colors" data-id="${escapeHtml(d.directive_id)}">
        <div class="flex justify-between items-start gap-2 mb-2">
          <h3 class="font-semibold text-gray-100 text-sm leading-snug">${escapeHtml(d.preferred_name || d.directive_id)}</h3>
          <span class="shrink-0 text-[10px] px-2 py-0.5 rounded border ${badge.cls}">${badge.text}</span>
        </div>
        <p class="text-xs text-gray-500 mb-3 line-clamp-2">${escapeHtml(truncate(d.normalized_summary || '', 140))}</p>
        <div class="flex items-center gap-2 mb-3">
          <span class="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-900 text-indigo-300 border border-gray-700">${escapeHtml(d.category || '')}</span>
          <span class="text-xs text-gray-500">★ ${escapeHtml(String(stars))}</span>
        </div>
        <div class="space-y-1">${renderMiniHealthBars(d)}</div>
      </article>`;
    }

    function render() {
      const list = filterDirectives(allDirectives, search.value, selectedCats);
      grid.innerHTML = list.length
        ? list.map(renderCard).join('')
        : '<p class="col-span-full text-center text-gray-500 py-12">조건에 맞는 디렉티브가 없습니다.</p>';
      grid.querySelectorAll('.dkb-card').forEach((card) => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          const d = allDirectives.find((x) => x.directive_id === id);
          if (!d) return;
          panelInner.innerHTML = renderDetailInner(d);
          wireExpertToggle(panelInner);
          openPanel();
        });
      });
    }

    loadCatalog()
      .then((data) => {
        allDirectives = getDirectives(data);
        render();
      })
      .catch(() => {
        grid.innerHTML = '<p class="text-red-400">catalog.json을 불러오지 못했습니다.</p>';
      });
  }

  function initDetailPage() {
    const root = document.getElementById('dkb-detail-page');
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    loadCatalog()
      .then((data) => {
        const d = getDirectives(data).find((x) => x.directive_id === id);
        if (!d) {
          root.innerHTML = '<p class="text-gray-400">디렉티브를 찾을 수 없습니다.</p>';
          return;
        }
        root.innerHTML = renderDetailInner(d);
        wireExpertToggle(root);
      })
      .catch(() => {
        root.innerHTML = '<p class="text-red-400">로드 실패</p>';
      });
  }

  let compareChart = null;

  function initCompare() {
    const selA = document.getElementById('dkb-compare-a');
    const selB = document.getElementById('dkb-compare-b');
    const out = document.getElementById('dkb-compare-output');
    const canvas = document.getElementById('dkb-compare-chart');

    function optionHtml(d) {
      return `<option value="${escapeHtml(d.directive_id)}">${escapeHtml(d.preferred_name || d.directive_id)}</option>`;
    }

    function renderDelta(a, b) {
      const rows = GROUP_ORDER.map((g) => {
        const av = groupAverage(a, g);
        const bv = groupAverage(b, g);
        let delta = null;
        if (av != null && bv != null) delta = bv - av;
        const dStr = delta == null ? '—' : (delta >= 0 ? '+' : '') + (delta * 100).toFixed(1) + '%';
        const dCls =
          delta == null ? 'text-gray-500' : delta > 0.02 ? 'text-emerald-400' : delta < -0.02 ? 'text-red-400' : 'text-gray-400';
        const ast = groupStatus(av);
        const bst = groupStatus(bv);
        return `<tr class="border-b border-gray-800">
          <td class="py-3 px-2 text-sm text-gray-300">${GROUP_LABELS[g]}</td>
          <td class="py-3 px-2 text-center"><span class="text-xs ${ast.cls} px-2 py-0.5 rounded text-white">${av != null ? (av * 100).toFixed(0) + '%' : '—'}</span></td>
          <td class="py-3 px-2 text-center font-mono text-sm ${dCls}">${dStr}</td>
          <td class="py-3 px-2 text-center"><span class="text-xs ${bst.cls} px-2 py-0.5 rounded text-white">${bv != null ? (bv * 100).toFixed(0) + '%' : '—'}</span></td>
        </tr>`;
      }).join('');

      const recA = recommendationBadge((a.verdict && a.verdict.recommendation) || 'neutral');
      const recB = recommendationBadge((b.verdict && b.verdict.recommendation) || 'neutral');

      out.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div class="rounded-xl border border-gray-800 p-4 bg-gray-800/30">
          <h3 class="text-sm font-semibold text-blue-300 mb-2">A</h3>
          <p class="text-white font-medium">${escapeHtml(a.preferred_name)}</p>
          <p class="text-xs text-gray-500 mt-1">${escapeHtml(a.category || '')}</p>
          <span class="inline-block mt-2 text-xs px-2 py-0.5 rounded border ${recA.cls}">${recA.text}</span>
        </div>
        <div class="rounded-xl border border-amber-500/20 p-4 bg-amber-500/5 flex flex-col justify-center items-center">
          <p class="text-xs text-amber-200/80 uppercase tracking-wider mb-1">Delta (B − A)</p>
          <p class="text-sm text-gray-400 text-center">그룹 평균 점수 차이. 양수면 B가 더 높음.</p>
        </div>
        <div class="rounded-xl border border-gray-800 p-4 bg-gray-800/30">
          <h3 class="text-sm font-semibold text-violet-300 mb-2">B</h3>
          <p class="text-white font-medium">${escapeHtml(b.preferred_name)}</p>
          <p class="text-xs text-gray-500 mt-1">${escapeHtml(b.category || '')}</p>
          <span class="inline-block mt-2 text-xs px-2 py-0.5 rounded border ${recB.cls}">${recB.text}</span>
        </div>
      </div>
      <div class="overflow-x-auto rounded-xl border border-gray-800">
        <table class="w-full text-sm">
          <thead><tr class="text-left text-gray-500 border-b border-gray-700">
            <th class="py-2 px-2">그룹</th>
            <th class="py-2 px-2 text-center">A</th>
            <th class="py-2 px-2 text-center">Δ</th>
            <th class="py-2 px-2 text-center">B</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

      if (typeof Chart === 'undefined' || !canvas) return;
      const labels = GROUP_ORDER.map((g) => GROUP_LABELS[g]);
      const dataA = GROUP_ORDER.map((g) => {
        const v = groupAverage(a, g);
        return v != null ? Math.round(v * 100) : 0;
      });
      const dataB = GROUP_ORDER.map((g) => {
        const v = groupAverage(b, g);
        return v != null ? Math.round(v * 100) : 0;
      });

      if (compareChart) compareChart.destroy();
      compareChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'A',
              data: dataA,
              backgroundColor: 'rgba(108, 155, 255, 0.7)',
              borderColor: 'rgba(108, 155, 255, 1)',
              borderWidth: 1,
            },
            {
              label: 'B',
              data: dataB,
              backgroundColor: 'rgba(167, 139, 250, 0.7)',
              borderColor: 'rgba(167, 139, 250, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: { labels: { color: '#d1d5db' } },
            title: { display: true, text: '그룹별 평균 (%)', color: '#e5e7eb' },
          },
          scales: {
            x: { ticks: { color: '#9ca3af' }, grid: { color: '#374151' } },
            y: {
              min: 0,
              max: 100,
              ticks: { color: '#9ca3af' },
              grid: { color: '#374151' },
            },
          },
        },
      });
    }

    function update() {
      const idA = selA.value;
      const idB = selB.value;
      const a = compareState.list.find((x) => x.directive_id === idA);
      const b = compareState.list.find((x) => x.directive_id === idB);
      if (!a || !b || idA === idB) {
        out.innerHTML = '<p class="text-gray-500">서로 다른 디렉티브 두 개를 선택하세요.</p>';
        if (compareChart) {
          compareChart.destroy();
          compareChart = null;
        }
        return;
      }
      renderDelta(a, b);
    }

    const compareState = { list: [] };
    loadCatalog()
      .then((data) => {
        compareState.list = getDirectives(data);
        const opts = compareState.list.map(optionHtml).join('');
        selA.innerHTML = opts;
        selB.innerHTML = opts;
        if (compareState.list.length > 1) selB.selectedIndex = 1;
        selA.addEventListener('change', update);
        selB.addEventListener('change', update);
        update();
      })
      .catch(() => {
        out.innerHTML = '<p class="text-red-400">catalog 로드 실패</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body && document.body.dataset.page;
    if (page === 'browse') initBrowse();
    else if (page === 'detail') initDetailPage();
    else if (page === 'compare') initCompare();
  });
})();
