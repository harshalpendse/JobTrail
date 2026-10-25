# Chrome Web Store listing: JobTrail

> Last updated: 2026-10-25

Everything needed to fill in the Chrome Web Store developer dashboard, ready to copy and paste. Build the upload with `scripts/package.sh`.

## Store listing

**Extension name**
JobTrail

**Short description** (125 of 132 characters; matches `manifest.json`)
Logs the jobs you apply to on LinkedIn, Indeed and Naukri, and reminds you when to follow up. Your data stays on your device.

**Detailed description** (plain text; the store strips markdown)

```
JobTrail keeps a log of the jobs you apply to on LinkedIn, Indeed and Naukri, and tells you when it's time to follow up.

HOW IT WORKS
Apply to a job as you normally would. When you click Apply, JobTrail saves the role, company, location, salary, the full job description and a link back to the posting. A small note in the corner of the page confirms it. If you already saved the same job from another site, it tells you.

WHAT YOU GET
• A board with six columns: Applied, Follow up, Interviewing, Offers, Ghosted and Rejected. Drag a card to change its status.
• Follow-up nudges. A job that has sat in Applied for a week moves to Follow up, and a desktop notification tells you when something needs you.
• A toolbar popup listing the jobs to chase or prepare for today.
• A detail view for each job with its saved description, a dated history, and space for your notes, the resume you sent and your expected salary.
• Copy as prompt: copies the role, your notes and the description as one block of text, ready to paste into an AI assistant for a cover letter or interview prep.
• Numbers: applications per week, where your open applications stand, which sites they came from, and the companies you apply to most.
• Export and import your log as a JSON file.
• Light and dark mode, following your system setting.

YOUR DATA STAYS WITH YOU
Your jobs and notes are saved in your browser on your own computer. There is no account and no server, and JobTrail sends nothing anywhere: no analytics, no tracking, no ads.

PERMISSIONS
• Read data on linkedin.com, indeed.com and naukri.com: to notice when you click Apply and save that job's details. JobTrail does not run on any other site.
• Notifications and alarms: for the twice-daily follow-up reminder.
• Storage: to keep your log on your computer.

SUPPORT
Found a bug, or JobTrail stopped catching applications on a site? Open an issue at https://github.com/harshalpendse/JobTrail/issues

JobTrail is open source and not affiliated with LinkedIn, Indeed or Naukri.
```

**Category**
Productivity (Workflow & Planning)

**Single purpose** (dashboard field, read by reviewers)
Saves the jobs a user applies to on LinkedIn, Indeed and Naukri into a local log and reminds them when to follow up.

**Language**
English

## Graphics

| Asset | Size | Status | File |
|-------|------|--------|------|
| Store icon | 128×128 PNG | ✅ Ready | `icons/icon128.png` |
| Screenshot 1: the board | 1280×800 | ✅ Ready | `store-assets/1-board.png` |
| Screenshot 2: the popup | 1280×800 | ✅ Ready | `store-assets/2-popup.png` |
| Screenshot 3: job detail | 1280×800 | ✅ Ready | `store-assets/3-job-detail.png` |
| Screenshot 4: Numbers, dark mode | 1280×800 | ✅ Ready | `store-assets/4-numbers-dark.png` |
| Small promo tile | 440×280 | ✅ Ready | `store-assets/promo-small-440x280.png` |
| Marquee promo tile | 1400×560 | Optional, not made | |

The screenshots use sample data with made-up company names, so no other company's name appears as if it were a customer.

## Permission justifications

Paste each into the matching field on the dashboard's Privacy tab.

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Saves the user's job log (job details they applied to, their notes and status changes) in local extension storage so the board and popup can show it. Nothing is synced or sent off the device. |
| `alarms` | permissions | Runs a check every 12 hours to find applications that have had no response for 7 days, so the extension can remind the user to follow up. |
| `notifications` | permissions | Shows the follow-up reminder ("2 follow-ups needed") as a desktop notification. Clicking it opens the user's job board. |
| `https://*.linkedin.com/*` | host_permissions | Detects when the user clicks Apply on a LinkedIn job and reads that job's title, company, location, salary and description from the page so it can be saved. |
| `https://*.indeed.com/*` | host_permissions | Same as above for Indeed job pages. |
| `https://*.naukri.com/*` | host_permissions | Same as above for Naukri job pages. |

**Remote code:** No. All JavaScript, CSS and fonts are bundled in the package.

## Privacy and data use

These answers match `PRIVACY.md`. Declare conservatively: the extension does handle page content and the user's notes, even though none of it leaves the device.

| Data type | Handled? | Leaves the device? | Purpose |
|-----------|----------|--------------------|---------|
| Personally identifiable info | No | No | |
| Health info | No | No | |
| Financial and payment info | No | No | Salary text is copied from the job posting, not the user's own finances |
| Authentication info | No | No | |
| Personal communications | No | No | |
| Location | No | No | Job location is part of the posting, not the user's location |
| Web history | No | No | |
| User activity | Yes | No | Records that the user clicked Apply on a job, to save it |
| Website content | Yes | No | Job details read from the job page the user applied on |

Certify all three:
- [x] Not sold to third parties
- [x] Not used or transferred for purposes unrelated to the extension's single purpose
- [x] Not used or transferred to determine creditworthiness or for lending

**Privacy policy URL**
https://github.com/harshalpendse/JobTrail/blob/main/PRIVACY.md

## Distribution

**Visibility:** Public (or Unlisted to share by link only)
**Regions:** All regions

## Developer info

**Publisher name:** fill in on the dashboard
**Contact email:** the email on your developer account; Google sends policy notices there
**Support URL:** https://github.com/harshalpendse/JobTrail/issues
**Homepage URL:** https://github.com/harshalpendse/JobTrail

## Version history

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 2.0.0 | 2026-10-25 | First store submission: redesigned board, popup and job detail; bundled fonts; plain-language listing | Draft |

## Review notes

### Before you submit
- Load the packaged ZIP unpacked once and apply to a job on each site to confirm it still catches applications. Job sites change their pages often.
- Merge the PR that adds `PRIVACY.md`, then open the privacy policy URL above while signed out to check it loads.
- Every later upload needs a higher `version` in `manifest.json`.

### Things a reviewer may ask about
- **Site names in the listing.** LinkedIn, Indeed and Naukri are named only to say which sites it works with, and the description says it isn't affiliated with them. The extension name and icon don't use their branding.
- **Bug report link.** The dashboard's "Report a bug" opens an email to an existing address in the code. Make sure that inbox is monitored, or switch it to the issues page.

### Rejection history
None yet.
