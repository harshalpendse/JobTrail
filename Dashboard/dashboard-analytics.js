/**
 * Dashboard/dashboard-analytics.js
 *
 * Renders the analytics view with four chart types:
 * 1. Application velocity (bar chart) - apps per week for the last 8 weeks
 * 2. Source distribution (stacked bar) - LinkedIn vs Indeed vs Naukri
 * 3. Pipeline funnel (horizontal bars) - Applied > Follow-up > Interview > Offer
 * 4. Top companies (horizontal bars) - most frequently applied-to companies
 *
 * The velocity chart is drawn on a canvas; the rest are plain DOM bars.
 * Colors come from the CSS custom properties in dashboard.css so the
 * charts follow light/dark mode (no external libraries).
 *
 * Dependencies: storage-analytics.js (JobStorage.getAnalytics)
 */

async function renderAnalytics() {
  const analytics = await window.JobStorage.getAnalytics();

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('metric-total', analytics.total);
  set('metric-response', analytics.responseRate + '%');
  set('metric-avg-days', analytics.avgDaysInPipeline);
  set('metric-offers', analytics.byStatus['Offer'] || 0);

  renderVelocityChart(analytics.weeklyApps);
  renderSourceChart(analytics.bySource);
  renderFunnel(analytics.byStatus);
  renderTopCompanies(analytics.topCompanies);
}

/** Read a color token from :root so canvas drawing matches the stylesheet. */
function themeColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function renderVelocityChart(weeklyApps) {
  const canvas = document.getElementById('chart-velocity');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);

  const W = canvas.offsetWidth;
  const H = 180;
  const padding = { top: 20, right: 0, bottom: 28, left: 0 };
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;
  const ink = themeColor('--ink');
  const ink3 = themeColor('--ink-3');
  const rule = themeColor('--rule');
  const mark = themeColor('--mark-fill');
  const mono = '11px ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  ctx.clearRect(0, 0, W, H);

  const maxVal = Math.max(...weeklyApps.map(w => w.count), 1);
  const slot = chartW / weeklyApps.length;
  const barWidth = Math.min(slot * 0.5, 56);

  // Baseline only; the numbers on the bars carry the scale
  ctx.strokeStyle = rule;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH + 0.5);
  ctx.lineTo(padding.left + chartW, padding.top + chartH + 0.5);
  ctx.stroke();

  weeklyApps.forEach((week, i) => {
    const x = padding.left + i * slot + (slot - barWidth) / 2;
    const barH = (week.count / maxVal) * chartH;
    const y = padding.top + chartH - barH;
    const isCurrent = week.week === 0;

    ctx.fillStyle = isCurrent ? mark : ink;
    ctx.fillRect(x, y, barWidth, barH);

    ctx.font = mono;
    ctx.textAlign = 'center';
    if (week.count > 0) {
      ctx.fillStyle = ink;
      ctx.fillText(week.count, x + barWidth / 2, y - 6);
    }

    ctx.fillStyle = isCurrent ? ink : ink3;
    ctx.fillText(isCurrent ? 'this wk' : `${week.week}w ago`, x + barWidth / 2, H - 8);
  });
}

function renderSourceChart(bySource) {
  const bar = document.getElementById('source-bar');
  const legend = document.getElementById('source-legend');
  if (!bar || !legend) return;

  const entries = Object.entries(bySource).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) {
    bar.innerHTML = '';
    legend.innerHTML = '<div class="empty-note">Nothing logged yet.</div>';
    return;
  }

  // Ink for the biggest source, then the highlighter, then greys; no brand blues
  const shades = ['var(--ink)', 'var(--mark-fill)', 'var(--ink-3)', 'var(--rule-strong)'];
  const colorFor = i => shades[Math.min(i, shades.length - 1)];

  bar.innerHTML = entries.map(([source, count], i) =>
    `<span style="flex:${count};background:${colorFor(i)}" title="${source}: ${count}"></span>`
  ).join('');

  legend.innerHTML = entries.map(([source, count], i) =>
    `<div class="legend-item">
      <span class="legend-dot" style="background:${colorFor(i)}"></span>
      <span>${source}</span>
      <strong>${count}</strong>
      <span class="legend-pct">${Math.round((count / total) * 100)}%</span>
    </div>`
  ).join('');
}

function renderFunnel(byStatus) {
  const container = document.getElementById('funnel-chart');
  if (!container) return;

  const stages = [
    { key: 'Applied', label: 'Applied', mod: '' },
    { key: 'Follow-up', label: 'Follow up', mod: 'funnel-bar--accent' },
    { key: 'Interview', label: 'Interviewing', mod: '' },
    { key: 'Offer', label: 'Offers', mod: 'funnel-bar--good' }
  ];
  const max = Math.max(...stages.map(s => byStatus[s.key] || 0), 1);

  container.innerHTML = stages.map(stage => {
    const count = byStatus[stage.key] || 0;
    const pct = (count / max) * 100;
    return `
      <div class="funnel-stage">
        <span class="funnel-label">${stage.label}</span>
        <div class="funnel-bar-track">
          <div class="funnel-bar ${stage.mod}" style="width:${count ? Math.max(pct, 2) : 0}%"></div>
        </div>
        <span class="funnel-count">${count}</span>
      </div>
    `;
  }).join('');
}

function renderTopCompanies(topCompanies) {
  const container = document.getElementById('top-companies');
  if (!container) return;

  if (topCompanies.length === 0) {
    container.innerHTML = '<div class="empty-note">Nothing logged yet.</div>';
    return;
  }

  const max = topCompanies[0].count;
  container.innerHTML = topCompanies.map(c => {
    const pct = (c.count / max) * 100;
    return `
      <div class="company-bar-item">
        <span class="company-name">${sanitizeCompanyName(c.name)}</span>
        <div class="company-bar-track">
          <div class="company-bar" style="width:${Math.max(pct, 2)}%"></div>
        </div>
        <span class="company-count">${c.count}</span>
      </div>
    `;
  }).join('');
}
