/**
 * Dashboard/dashboard-board.js
 *
 * Renders the Kanban board by fetching all jobs from local storage,
 * applying filters/search, and distributing job cards into status columns.
 * Also computes KPI counts for the header strip.
 *
 * Dependencies: dashboard-state.js, dashboard-modal.js, storage-crud.js
 */

async function renderBoard() {
  const jobs = await window.JobStorage.getAll();

  document.querySelectorAll('.column-body').forEach(col => col.innerHTML = '');

  const counts = { 'Applied': 0, 'Follow-up': 0, 'Interview': 0, 'Offer': 0, 'Ghosted': 0, 'Rejected': 0 };

  jobs.sort((a, b) => b.appliedAt - a.appliedAt);

  const { currentFilter, searchQuery } = window.DashboardState;

  const filteredJobs = jobs.filter(job => {
    if (currentFilter !== 'all' && job.source !== currentFilter) return false;
    if (searchQuery) {
      const haystack = `${job.jobTitle} ${job.company} ${job.notes} ${job.location} ${job.source}`.toLowerCase();
      return haystack.includes(searchQuery);
    }
    return true;
  });

  filteredJobs.forEach(job => {
    const daysOld = Math.floor((Date.now() - job.appliedAt) / (1000 * 60 * 60 * 24));
    let displayStatus = job.status;

    // Auto-promote Applied jobs older than 7 days to Follow-up
    if (job.status === 'Applied' && daysOld >= 7) displayStatus = 'Follow-up';

    counts[displayStatus] = (counts[displayStatus] || 0) + 1;

    const cleanCompany = sanitizeCompanyName(job.company);

    // Build the contextual action signal tag
    let actionSignal = '';
    if (displayStatus === 'Applied') {
      actionSignal = `<span class="op-signal wait">follow up in ${7 - daysOld}d</span>`;
    } else if (displayStatus === 'Follow-up') {
      actionSignal = `<span class="op-signal urgent">\u2192 send a follow-up</span>`;
    } else if (displayStatus === 'Interview') {
      actionSignal = `<span class="op-signal prep">\u2192 prep &amp; schedule</span>`;
    } else if (displayStatus === 'Offer') {
      actionSignal = `<span class="op-signal win">\u2192 review the offer</span>`;
    } else if (displayStatus === 'Ghosted') {
      actionSignal = `<span class="op-signal terminal">no reply</span>`;
    } else if (displayStatus === 'Rejected') {
      actionSignal = `<span class="op-signal terminal">closed</span>`;
    }

    const card = document.createElement('div');
    card.className = 'job-card';
    card.draggable = true;
    card.dataset.id = job.jobId;

    card.innerHTML = `
      <div class="card-header">
        <span class="source-tag">${job.source || 'Manual'}</span>
        <span class="card-age" title="Days since you applied">day ${daysOld}</span>
      </div>
      <h4 class="card-title">${job.jobTitle || 'Unknown Role'}</h4>
      <div class="card-company">${cleanCompany}</div>
      ${job.location ? `<div class="card-location">${job.location}</div>` : ''}
      <div class="card-meta">
        ${actionSignal}
        ${job.ctc || job.salary ? `<span class="salary-tag">${job.ctc || job.salary}</span>` : ''}
      </div>
    `;

    card.addEventListener('mousedown', () => { window.DashboardState.isDragging = false; });
    card.addEventListener('click', () => { if (!window.DashboardState.isDragging) openModal(job); });
    card.addEventListener('dragstart', (e) => {
      window.DashboardState.isDragging = true;
      e.dataTransfer.setData('text/plain', job.jobId);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.style.opacity = '0.4', 0);
    });
    card.addEventListener('dragend', () => {
      card.style.opacity = '1';
      setTimeout(() => { window.DashboardState.isDragging = false; }, 100);
    });

    const col = document.getElementById(`col-${displayStatus.toLowerCase()}`);
    if (col) {
      if (displayStatus === 'Follow-up') col.prepend(card);
      else col.appendChild(card);
    }
  });

  // Update column count badges
  Object.keys(counts).forEach(status => {
    const el = document.getElementById(`count-${status.toLowerCase().replace(/\s+/g, '-')}`);
    if (el) el.textContent = counts[status];
  });

  // Update KPI strip
  const totalPipeline = counts['Applied'] + counts['Follow-up'] + counts['Interview'] + counts['Offer'];
  const kpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  kpi('kpi-pipeline', totalPipeline);
  kpi('kpi-followup', counts['Follow-up']);
  kpi('kpi-interviews', counts['Interview']);
  kpi('kpi-offers', counts['Offer']);
}
