/**
 * popup/popup-triage.js
 *
 * Renders the triage action center in the popup. Lists up to 5 jobs
 * that need immediate attention (follow-ups, interviews, offers) under
 * a one-line summary of what today looks like.
 *
 * Dependencies: storage-crud.js (window.JobStorage)
 */

/**
 * Strip rating artifacts (e.g. "4.2", "1.2K Reviews") from company names
 * that get accidentally scraped from job site DOM.
 *
 * @param {string} rawName - Company name as scraped from the page
 * @returns {string} Cleaned company name
 */
function sanitizeCompanyName(rawName) {
  if (!rawName) return 'Unknown Company';
  return rawName
    .replace(/[0-9.,kK+]+\s*Reviews?/gi, '')
    .replace(/[0-9]\.[0-9]/g, '')
    .replace(/\u2B50/g, '')
    .replace(/-\s*$/, '')
    .trim();
}

/**
 * Fetch all tracked jobs, compute which ones need attention, and render
 * them as triage cards in the popup list. Also updates the summary strip
 * with follow-up / interview counts.
 */
async function renderTriageCenter() {
  const jobs = await window.JobStorage.getAll();
  const triageList = document.getElementById('triage-list');
  const summaryText = document.getElementById('summary-text');
  if (!triageList || !summaryText) return;

  let actionRequired = [];
  let followUpCount = 0;
  let prepCount = 0;

  jobs.forEach(job => {
    const daysOld = Math.floor((Date.now() - job.appliedAt) / (1000 * 60 * 60 * 24));
    job.daysOld = daysOld;

    // Auto-promote "Applied" jobs older than 7 days to "Follow-up" status
    job.calculatedStatus = (job.status === 'Applied' && daysOld >= 7) ? 'Follow-up' : job.status;

    if (job.calculatedStatus === 'Follow-up') {
      followUpCount++;
      job.intentClass = 'intent-urgent';
      job.intentLabel = 'Chase';
      job.intentWeight = 3;
      actionRequired.push(job);
    } else if (job.calculatedStatus === 'Interview' || job.calculatedStatus === 'Offer') {
      prepCount++;
      job.intentClass = job.calculatedStatus === 'Offer' ? 'intent-win' : 'intent-prep';
      job.intentLabel = job.calculatedStatus === 'Offer' ? 'Offer' : 'Prep';
      job.intentWeight = 2;
      actionRequired.push(job);
    }
  });

  // Sort by urgency (highest weight first), then by oldest first within same weight
  actionRequired.sort((a, b) =>
    b.intentWeight !== a.intentWeight ? b.intentWeight - a.intentWeight : a.appliedAt - b.appliedAt
  );

  // Build summary sentence, e.g. "2 to chase, 1 to prep for."
  const parts = [];
  if (followUpCount > 0) parts.push(`<b>${followUpCount}</b> to chase`);
  if (prepCount > 0) parts.push(`${prepCount} to prep for`);
  summaryText.innerHTML = parts.length > 0
    ? `${parts.join(', ')}.`
    : jobs.length > 0 ? 'Nothing needs you today.' : 'No jobs logged yet.';

  triageList.innerHTML = '';

  // Show empty state if nothing needs attention
  if (actionRequired.length === 0) {
    triageList.innerHTML = jobs.length > 0
      ? `<li class="zero-state">
          <div class="zero-state-title">No follow-ups due.</div>
          <div class="zero-state-body">Applications move here once they've sat for a week, or when you mark an interview or offer.</div>
        </li>`
      : `<li class="zero-state">
          <div class="zero-state-title">Your log is empty.</div>
          <div class="zero-state-body">Hit Apply on LinkedIn, Indeed or Naukri and the job lands here on its own.</div>
        </li>`;
    return;
  }

  // Render top 5 action items as triage cards
  actionRequired.slice(0, 5).forEach(job => {
    const cleanCompany = sanitizeCompanyName(job.company);
    const safeTitle = (job.jobTitle === 'Indeed' || job.jobTitle === 'Naukri') ? 'Unknown Role' : job.jobTitle;

    const card = document.createElement('li');
    card.className = 'triage-card';

    card.innerHTML = `
      <span class="intent-label ${job.intentClass}">${job.intentLabel}</span>
      <div class="card-body">
        <h4 class="job-title" title="${safeTitle}">${safeTitle}</h4>
        <span class="company">${cleanCompany}${job.source ? ` \u00b7 ${job.source}` : ''}</span>
      </div>
      <span class="card-age" title="Days since you applied">${job.daysOld}d</span>
    `;

    card.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('Dashboard/dashboard.html') });
    });

    triageList.appendChild(card);
  });

  if (actionRequired.length > 5) {
    const more = document.createElement('li');
    more.className = 'more-row';
    more.textContent = `+ ${actionRequired.length - 5} more on the board`;
    triageList.appendChild(more);
  }
}
