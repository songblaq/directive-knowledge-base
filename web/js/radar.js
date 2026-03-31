/**
 * Chart.js radar for DKB detail (group averages + group drill-down) and compare overlay.
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

  const RADAR_FILL = 'rgba(108, 155, 255, 0.25)';
  const RADAR_STROKE = 'rgba(108, 155, 255, 0.95)';
  const RADAR_POINT = '#93c5fd';

  function groupAverage(directive, group) {
    const g = directive.scores_by_group && directive.scores_by_group[group];
    if (!g || typeof g !== 'object') return null;
    const vals = Object.values(g).filter((v) => typeof v === 'number');
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function groupDimensionSeries(directive, group) {
    const g = directive.scores_by_group && directive.scores_by_group[group];
    if (!g || typeof g !== 'object') return { labels: [], data: [] };
    const entries = Object.entries(g).filter(([, v]) => typeof v === 'number');
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    return {
      labels: entries.map(([k]) => k),
      data: entries.map(([, v]) => Math.round(v * 100)),
    };
  }

  function radarScaleOptions() {
    return {
      min: 0,
      max: 100,
      ticks: {
        color: '#9ca3af',
        backdropColor: 'transparent',
        showLabelBackdrop: false,
        stepSize: 25,
      },
      grid: { color: 'rgba(156, 163, 175, 0.22)' },
      angleLines: { color: 'rgba(156, 163, 175, 0.2)' },
      pointLabels: {
        color: '#e5e7eb',
        font: { size: window.innerWidth < 400 ? 9 : 11 },
      },
    };
  }

  function baseRadarOptions(onClick) {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.15,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => (ctx.parsed.r != null ? `${ctx.parsed.r}%` : ''),
          },
        },
      },
      scales: { r: radarScaleOptions() },
      onClick,
    };
  }

  /**
   * @param {HTMLElement} container
   * @param {object} directive
   */
  function mount(container, directive) {
    if (typeof Chart === 'undefined') {
      container.innerHTML = '<p class="text-sm text-amber-400">Chart.js가 로드되지 않았습니다.</p>';
      return;
    }
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'space-y-2';
    const nav = document.createElement('div');
    nav.className = 'flex items-center gap-2 text-xs text-gray-400 min-h-[1.25rem]';
    const canvasWrap = document.createElement('div');
    canvasWrap.className = 'relative w-full max-w-md mx-auto';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', '그룹별 점수 레이더');
    canvasWrap.appendChild(canvas);
    const hint = document.createElement('p');
    hint.className = 'text-[11px] text-gray-500 text-center mt-1';
    hint.textContent = '축(그룹)을 클릭하면 해당 그룹의 차원별 점수를 봅니다.';
    wrap.appendChild(nav);
    wrap.appendChild(canvasWrap);
    wrap.appendChild(hint);
    container.appendChild(wrap);

    let chart = null;

    function destroyChart() {
      if (chart) {
        chart.destroy();
        chart = null;
      }
    }

    function renderGroups() {
      nav.innerHTML = '';
      hint.textContent = '축(그룹)을 클릭하면 해당 그룹의 차원별 점수를 봅니다.';
      destroyChart();
      const labels = GROUP_ORDER.map((g) => GROUP_LABELS[g]);
      const data = GROUP_ORDER.map((g) => {
        const v = groupAverage(directive, g);
        return v != null ? Math.round(v * 100) : 0;
      });
      const ctx = canvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: '그룹 평균',
              data,
              fill: true,
              backgroundColor: RADAR_FILL,
              borderColor: RADAR_STROKE,
              borderWidth: 2,
              pointBackgroundColor: RADAR_POINT,
              pointBorderColor: '#1e3a5f',
              pointHoverBackgroundColor: '#bfdbfe',
            },
          ],
        },
        options: baseRadarOptions((e, elements) => {
          if (!elements.length) return;
          const idx = elements[0].index;
          const g = GROUP_ORDER[idx];
          if (g) renderDrill(g);
        }),
      });
    }

    function renderDrill(group) {
      const { labels, data } = groupDimensionSeries(directive, group);
      if (!labels.length) {
        renderGroups();
        return;
      }
      nav.innerHTML = '';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'text-blue-400 hover:text-blue-300';
      back.textContent = '← 전체 그룹';
      back.addEventListener('click', renderGroups);
      nav.appendChild(back);
      const span = document.createElement('span');
      span.className = 'text-gray-500';
      span.textContent = ' · ' + GROUP_LABELS[group];
      nav.appendChild(span);
      hint.textContent = '이 그룹에 기록된 차원만 표시됩니다. 상단에서 전체 그룹으로 돌아갈 수 있습니다.';
      destroyChart();
      const ctx = canvas.getContext('2d');
      chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels,
          datasets: [
            {
              label: GROUP_LABELS[group],
              data,
              fill: true,
              backgroundColor: 'rgba(52, 211, 153, 0.2)',
              borderColor: 'rgba(52, 211, 153, 0.9)',
              borderWidth: 2,
              pointBackgroundColor: '#6ee7b7',
              pointBorderColor: '#064e3b',
              pointHoverBackgroundColor: '#a7f3d0',
            },
          ],
        },
        options: baseRadarOptions(),
      });
    }

    renderGroups();

    return {
      destroy: () => {
        destroyChart();
        container.innerHTML = '';
      },
    };
  }

  /**
   * Two directives overlaid on one radar (group averages).
   * @param {HTMLCanvasElement} canvas
   * @param {object} a
   * @param {object} b
   * @param {Chart|null} prev
   * @returns {Chart|null}
   */
  function mountCompare(canvas, a, b, prev) {
    if (typeof Chart === 'undefined' || !canvas) return null;
    if (prev) prev.destroy();
    const labels = GROUP_ORDER.map((g) => GROUP_LABELS[g]);
    const dataA = GROUP_ORDER.map((g) => {
      const v = groupAverage(a, g);
      return v != null ? Math.round(v * 100) : 0;
    });
    const dataB = GROUP_ORDER.map((g) => {
      const v = groupAverage(b, g);
      return v != null ? Math.round(v * 100) : 0;
    });
    const nameA = (a && a.preferred_name) || (a && a.directive_id) || 'A';
    const nameB = (b && b.preferred_name) || (b && b.directive_id) || 'B';

    return new Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: nameA,
            data: dataA,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 0.95)',
            borderWidth: 2,
            pointBackgroundColor: '#60a5fa',
            pointBorderColor: '#1e3a8a',
          },
          {
            label: nameB,
            data: dataB,
            fill: true,
            backgroundColor: 'rgba(249, 115, 22, 0.18)',
            borderColor: 'rgba(249, 115, 22, 0.95)',
            borderWidth: 2,
            pointBackgroundColor: '#fb923c',
            pointBorderColor: '#7c2d12',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 1.2,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: '#d1d5db', padding: 16, usePointStyle: true },
          },
          title: {
            display: true,
            text: '그룹 평균 비교 (%)',
            color: '#e5e7eb',
            font: { size: 14 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.r}%`,
            },
          },
        },
        scales: { r: radarScaleOptions() },
      },
    });
  }

  window.DKBRadar = { mount, mountCompare, GROUP_ORDER, GROUP_LABELS, groupAverage };
})();
