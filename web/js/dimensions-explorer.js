/**
 * Dimension model explorer — tree, histogram, top/bottom directives per dimension.
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

  /** What each spec dimension measures (DKB v0.1 model). */
  const DIMENSION_DESCRIPTIONS = {
    skillness:
      'Degree to which the artifact is structured as a reusable skill-like unit (instructions, boundaries) rather than loose prose.',
    agentness: 'How oriented the content is toward autonomous agent execution vs human-only reading.',
    workflowness: 'Presence of multi-step workflow patterns, pipelines, or staged procedures.',
    commandness: 'Emphasis on CLI commands, invocations, or executable entry points.',
    pluginness: 'Plugin/MCP/tool integration surface vs standalone documentation.',
    planning: 'Coverage of planning, decomposition, or task-breakdown behavior.',
    review: 'Emphasis on review, critique, or verification loops.',
    coding: 'Strength of software construction, patches, or code-oriented assistance.',
    research: 'Information gathering, sourcing, and exploratory analysis signals.',
    ops: 'Deployment, monitoring, incident, or operational workflows.',
    writing: 'General writing, editing, or prose composition support.',
    content: 'Media or structured content production beyond code.',
    orchestration: 'Multi-agent or multi-tool coordination patterns.',
    atomicity: 'How focused and single-purpose each unit of work is.',
    autonomy: 'How much the agent can proceed without human checkpoints.',
    multi_stepness: 'Typical depth of chained steps before completion.',
    tool_dependence: 'Reliance on external tools/APIs vs pure reasoning.',
    composability: 'How well pieces combine with other directives or tools.',
    reusability: 'Likelihood the same artifact works across projects/contexts.',
    officialness: 'Vendor/official vs community/third-party origin signals.',
    legal_clarity: 'License, terms, and compliance clarity.',
    maintenance_health: 'Signals of ongoing maintenance, issues, and release health.',
    install_verifiability: 'How verifiable and reproducible installation/setup is.',
    trustworthiness: 'Overall trust and safety posture of the source and content.',
    star_signal: 'Popularity proxy from stars or equivalent attention metrics.',
    fork_signal: 'Community engagement via forks or derivatives.',
    mention_signal: 'Discourse/mention footprint across ecosystems.',
    install_signal: 'Adoption signals tied to installs or usage counters.',
    freshness: 'Recency of updates and currency of the material.',
    naming_clarity: 'How clear and unambiguous naming and identifiers are.',
    description_clarity: 'Quality of descriptions, README, and intent communication.',
    io_clarity: 'Clarity of inputs, outputs, and interfaces.',
    example_coverage: 'Presence and quality of examples and templates.',
    overlap_ambiguity_inverse:
      'Higher when the artifact is distinct from neighbors; lower when overlapping or ambiguous vs peers.',
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

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function scoreToBin(v) {
    if (v == null || Number.isNaN(v)) return -1;
    if (v >= 1) return 9;
    return Math.min(9, Math.floor(v * 10));
  }

  function dimsInGroup(group) {
    return DIMENSION_SPEC.filter((d) => d.group === group);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const treeEl = document.getElementById('dkb-dim-tree');
    const detailEl = document.getElementById('dkb-dim-detail');
    if (!treeEl || !detailEl) return;

    let directives = [];
    let histChart = null;

    function destroyHist() {
      if (histChart) {
        histChart.destroy();
        histChart = null;
      }
    }

    function renderTree() {
      treeEl.innerHTML = GROUP_ORDER.map((g) => {
        const dims = dimsInGroup(g);
        const dimRows = dims
          .map(
            (d) =>
              `<li><button type="button" class="dkb-dim-leaf w-full text-left text-sm font-mono text-gray-300 hover:text-white py-1.5 px-2 rounded-lg hover:bg-gray-800/80" data-dim="${escapeHtml(d.key)}">${escapeHtml(d.label)}</button></li>`
          )
          .join('');
        return `<li class="mb-1">
          <button type="button" class="dkb-dim-group w-full flex items-center justify-between text-left text-sm font-medium text-gray-200 py-2 px-2 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700" data-group="${escapeHtml(g)}">
            <span>${escapeHtml(GROUP_LABELS[g])}</span>
            <span class="text-xs text-gray-500">${dims.length}</span>
          </button>
          <ul class="pl-3 border-l border-gray-700 ml-2 space-y-0.5 mt-1">${dimRows}</ul>
        </li>`;
      }).join('');

      treeEl.querySelectorAll('.dkb-dim-group').forEach((btn) => {
        btn.addEventListener('click', () => {
          const g = btn.getAttribute('data-group');
          renderGroupDetail(g);
        });
      });
      treeEl.querySelectorAll('.dkb-dim-leaf').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const k = btn.getAttribute('data-dim');
          renderDimDetail(k);
        });
      });
    }

    function renderGroupDetail(group) {
      destroyHist();
      const dims = dimsInGroup(group);
      const avgs = [];
      for (const d of directives) {
        const a = groupAverage(d, group);
        if (a != null) avgs.push(a);
      }
      const n = avgs.length;
      const mean = n ? avgs.reduce((x, y) => x + y, 0) / n : null;
      const min = n ? Math.min(...avgs) : null;
      const max = n ? Math.max(...avgs) : null;

      const dimList = dims
        .map((d) => `<li class="text-sm font-mono text-gray-400">${escapeHtml(d.label)}</li>`)
        .join('');

      detailEl.innerHTML = `<div class="space-y-4">
        <div>
          <h2 class="text-xl font-bold text-white">${escapeHtml(GROUP_LABELS[group])}</h2>
          <p class="text-sm text-gray-500 mt-1">모델 그룹 요약 · 카탈로그 전체 기준</p>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl border border-gray-800 bg-gray-800/40 p-3">
            <p class="text-xs text-gray-500">차원 수</p>
            <p class="text-lg font-semibold text-white">${dims.length}</p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-800/40 p-3">
            <p class="text-xs text-gray-500">평균(그룹 평균)</p>
            <p class="text-lg font-semibold text-white">${mean != null ? (mean * 100).toFixed(1) + '%' : '—'}</p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-800/40 p-3">
            <p class="text-xs text-gray-500">최소</p>
            <p class="text-lg font-semibold text-emerald-300/90">${min != null ? (min * 100).toFixed(1) + '%' : '—'}</p>
          </div>
          <div class="rounded-xl border border-gray-800 bg-gray-800/40 p-3">
            <p class="text-xs text-gray-500">최대</p>
            <p class="text-lg font-semibold text-amber-300/90">${max != null ? (max * 100).toFixed(1) + '%' : '—'}</p>
          </div>
        </div>
        <div>
          <p class="text-xs text-gray-500 mb-2">이 그룹의 차원 키 (${dims.length})</p>
          <ul class="columns-2 gap-4 text-gray-400">${dimList}</ul>
        </div>
        <p class="text-sm text-gray-500">왼쪽에서 차원을 선택하면 분포 히스토그램과 상·하위 디렉티브를 볼 수 있습니다.</p>
      </div>`;
    }

    function renderDimDetail(specKey) {
      const spec = DIMENSION_SPEC.find((x) => x.key === specKey);
      if (!spec) return;

      const desc = DIMENSION_DESCRIPTIONS[specKey] || '이 차원에 대한 설명이 아직 없습니다.';
      const values = [];
      for (const d of directives) {
        const v = getDimensionValue(d, specKey);
        if (v != null) values.push({ d, v });
      }

      const sorted = [...values].sort((a, b) => b.v - a.v);
      const top5 = sorted.slice(0, 5);
      const bottom5 = sorted.length ? sorted.slice(-5).reverse() : [];

      const binLabels = ['0–10%', '10–20%', '20–30%', '30–40%', '40–50%', '50–60%', '60–70%', '70–80%', '80–90%', '90–100%'];
      const bins = Array(10).fill(0);
      for (const { v } of values) {
        const b = scoreToBin(v);
        if (b >= 0) bins[b]++;
      }

      detailEl.innerHTML = `<div class="space-y-4">
        <div>
          <p class="text-xs text-gray-500">${escapeHtml(GROUP_LABELS[spec.group])}</p>
          <h2 class="text-xl font-bold text-white font-mono">${escapeHtml(spec.label)}</h2>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed border border-gray-800 rounded-xl p-4 bg-gray-800/30">${escapeHtml(desc)}</p>
        <div>
          <h3 class="text-sm font-semibold text-gray-300 mb-2">전 디렉티브 점수 분포 (${values.length}개 샘플)</h3>
          <div class="rounded-xl border border-gray-800 bg-gray-950/50 p-3">
            <canvas id="dkb-dim-hist" height="220"></canvas>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 class="text-sm font-semibold text-emerald-400/90 mb-2">상위 5</h3>
            <ol class="space-y-2 list-decimal list-inside text-sm text-gray-300">
              ${top5.length ? top5.map((x) => `<li><a class="text-blue-400 hover:underline" href="detail.html?id=${encodeURIComponent(x.d.directive_id)}">${escapeHtml(x.d.preferred_name || x.d.directive_id)}</a> · ${(x.v * 100).toFixed(1)}%</li>`).join('') : '<li class="text-gray-500">데이터 없음</li>'}
            </ol>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-rose-400/90 mb-2">하위 5</h3>
            <ol class="space-y-2 list-decimal list-inside text-sm text-gray-300">
              ${bottom5.length ? bottom5.map((x) => `<li><a class="text-blue-400 hover:underline" href="detail.html?id=${encodeURIComponent(x.d.directive_id)}">${escapeHtml(x.d.preferred_name || x.d.directive_id)}</a> · ${(x.v * 100).toFixed(1)}%</li>`).join('') : '<li class="text-gray-500">데이터 없음</li>'}
            </ol>
          </div>
        </div>
      </div>`;

      const newCanvas = document.getElementById('dkb-dim-hist');
      destroyHist();
      if (typeof Chart !== 'undefined' && newCanvas && values.length) {
        histChart = new Chart(newCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: binLabels,
            datasets: [
              {
                label: '디렉티브 수',
                data: bins,
                backgroundColor: 'rgba(108, 155, 255, 0.55)',
                borderColor: 'rgba(108, 155, 255, 0.9)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2.2,
            plugins: {
              legend: { display: false },
              title: { display: false },
            },
            scales: {
              x: { ticks: { color: '#9ca3af', maxRotation: 45, minRotation: 45 }, grid: { color: '#374151' } },
              y: {
                beginAtZero: true,
                ticks: { color: '#9ca3af', stepSize: 1 },
                grid: { color: '#374151' },
              },
            },
          },
        });
      } else if (newCanvas && !values.length) {
        newCanvas.replaceWith(Object.assign(document.createElement('p'), { className: 'text-sm text-gray-500 py-8 text-center', textContent: '이 차원에 대한 점수가 카탈로그에 없습니다.' }));
      }
    }

    fetch('data/catalog.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        directives = Array.isArray(data.directives) ? data.directives : [];
        renderTree();
        renderGroupDetail('form');
      })
      .catch(() => {
        treeEl.innerHTML = '<p class="text-red-400 text-sm">catalog.json을 불러오지 못했습니다.</p>';
        detailEl.innerHTML = '';
      });
  });
})();
