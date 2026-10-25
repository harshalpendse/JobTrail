/**
 * Dashboard/dashboard-modal.js
 *
 * Job detail modal: displays full job information, status timeline,
 * editable notes/CTC/resume fields, an AI context copy button,
 * and a two-click delete confirmation.
 *
 * Also defines sanitizeCompanyName which is shared with dashboard-board.js.
 *
 * Dependencies: dashboard-state.js, storage-crud.js, dashboard-board.js
 */

/**
 * Strip rating artifacts from scraped company names.
 * @param {string} rawName
 * @returns {string}
 */
function sanitizeCompanyName(rawName) {
  if (!rawName) return 'Unknown Company';
  return rawName
    .replace(/[0-9.,kK+]+\s*Reviews?/gi, '')
    .replace(/[0-9]\.[0-9]/g, '')
    .replace(/\u2B50/g, '')
    .replace(/-\s*$/, '')
    .trim() || 'Unknown Company';
}

/**
 * Open the job detail modal and populate it with the given job's data.
 * @param {Object} job - The full job object from storage
 */
function openModal(job) {
  window.DashboardState.currentJobId = job.jobId;

  document.getElementById('modal-title').textContent = job.jobTitle;
  document.getElementById('modal-company').textContent = sanitizeCompanyName(job.company);
  document.getElementById('modal-url').href = job.jobUrl;
  document.getElementById('modal-description').innerHTML = job.description || '<p class="empty-note">No description was saved for this job.</p>';

  document.getElementById('modal-ctc').value = job.ctc || '';
  document.getElementById('modal-resume').value = job.resumeVersion || '';
  document.getElementById('modal-notes').value = job.notes || '';

  // Eyebrow: where it came from and when you applied
  const eyebrow = document.getElementById('modal-eyebrow');
  if (eyebrow) {
    const applied = new Date(job.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    eyebrow.textContent = `${job.source || 'Manual'} \u00b7 applied ${applied}`;
  }

  // Meta details (location, salary, etc.) as a label/value list
  const metaTags = document.getElementById('modal-meta-tags');
  const rows = [
    ['Location', job.location],
    ['Salary', job.salary],
    ['Type', job.employmentType],
    ['Level', job.experienceLevel]
  ].filter(([, value]) => value);
  if (metaTags) metaTags.innerHTML = rows.map(([label, value]) => `<dt>${label}</dt><dd>${value}</dd>`).join('');

  renderTimeline(job);
  document.getElementById('job-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('job-modal').classList.add('hidden');
  window.DashboardState.currentJobId = null;
}

function renderTimeline(job) {
  const container = document.getElementById('modal-timeline');
  if (!container) return;

  const rawHistory = job.statusHistory || [{ status: job.status, timestamp: job.appliedAt }];
  const history = rawHistory.filter((entry, i, arr) => i === 0 || entry.status !== arr[i - 1].status);

  container.innerHTML = history.map((entry, i) => {
    const date = new Date(entry.timestamp);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const isLast = i === history.length - 1;
    return `
      <li class="timeline-item ${isLast ? 'timeline-current' : ''}">
        <span class="timeline-date">${dateStr}, ${timeStr}</span>
        <span class="timeline-status">${entry.status}</span>
      </li>
    `;
  }).join('');
}

function initModalEvents() {
  document.getElementById('close-modal')?.addEventListener('click', closeModal);
  document.getElementById('job-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'job-modal') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.DashboardState.currentJobId) closeModal();
  });

  // Save Notes
  document.getElementById('save-notes-btn')?.addEventListener('click', async () => {
    const { currentJobId } = window.DashboardState;
    if (!currentJobId) return;
    const btn = document.getElementById('save-notes-btn');
    const ctc = document.getElementById('modal-ctc')?.value || '';
    const notes = document.getElementById('modal-notes')?.value || '';
    const resumeVersion = document.getElementById('modal-resume')?.value || '';

    if (btn) btn.textContent = 'Saving\u2026';
    await window.JobStorage.update(currentJobId, { ctc, notes, resumeVersion });

    if (btn) {
      btn.textContent = 'Saved';
      setTimeout(() => { btn.textContent = 'Save notes'; }, 2000);
    }
    renderBoard();
  });

  // AI Context Copy
  document.getElementById('llm-copy-btn')?.addEventListener('click', async () => {
    const { currentJobId } = window.DashboardState;
    if (!currentJobId) return;
    const jobs = await window.JobStorage.getAll();
    const job = jobs.find(j => j.jobId === currentJobId);
    if (!job) return;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = job.description || 'No description available.';
    const cleanDescription = tempDiv.innerText.trim();

    const ctc = document.getElementById('modal-ctc')?.value || job.ctc || 'Not specified';
    const notes = document.getElementById('modal-notes')?.value || job.notes || 'No specific notes yet.';
    const resumeVersion = document.getElementById('modal-resume')?.value || job.resumeVersion || 'Not specified';

    const promptText = `I am preparing for an application/interview. Please analyze the following job description and my notes, and help me tailor a cover letter and anticipate interview questions.

  --- JOB DETAILS ---
  Role: ${job.jobTitle}
  Company: ${job.company}
  Location: ${job.location || 'Not specified'}
  Salary: ${job.salary || ctc || 'Not specified'}
  Source: ${job.source}
  Resume Version Used: ${resumeVersion}

  --- MY NOTES ---
  ${notes}

  --- JOB DESCRIPTION ---
  ${cleanDescription}`;

    try {
      await navigator.clipboard.writeText(promptText);
      const btn = document.getElementById('llm-copy-btn');
      btn.textContent = 'Copied \u2014 paste it anywhere';
      btn.classList.add('is-done');
      setTimeout(() => {
        btn.textContent = 'Copy as prompt';
        btn.classList.remove('is-done');
      }, 2500);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = promptText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
  });

  // Delete Job (two-click confirmation)
  let deleteConfirmPending = false;
  let deleteConfirmTimer = null;

  document.getElementById('delete-job-btn')?.addEventListener('click', async () => {
    const { currentJobId } = window.DashboardState;
    if (!currentJobId) return;
    const btn = document.getElementById('delete-job-btn');

    if (!deleteConfirmPending) {
      deleteConfirmPending = true;
      const original = btn.textContent;
      btn.textContent = 'Click again to delete for good';
      btn.classList.add('is-armed');
      deleteConfirmTimer = setTimeout(() => {
        deleteConfirmPending = false;
        btn.textContent = original;
        btn.classList.remove('is-armed');
      }, 3000);
    } else {
      clearTimeout(deleteConfirmTimer);
      deleteConfirmPending = false;
      btn.textContent = 'Delete this job';
      btn.classList.remove('is-armed');
      await window.JobStorage.deleteJob(currentJobId);
      closeModal();
      renderBoard();
    }
  });
}
