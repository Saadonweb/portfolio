// ── TabGhost Popup Script ──

const GHOST_THRESHOLD_DAYS = 3;

// ── Utils ──────────────────────────────────────────────────────────────────

function daysSince(ts) {
  return Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
}

function formatDays(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function daysBadgeClass(days) {
  if (days < 1)  return 'fresh';
  if (days < 3)  return 'stale';
  if (days < 7)  return 'ghost';
  return 'ancient';
}

function guiltVerdict(score) {
  if (score === 0)   return { emoji: '🕊️', text: 'Immaculate. Not a single ghost. You might actually be the most organised person alive.' };
  if (score < 5)     return { emoji: '😅', text: "A few ghosts lingering. Manageable. They're mostly harmless." };
  if (score < 15)    return { emoji: '😰', text: 'Your graveyard is getting crowded. Those tabs had families, you know.' };
  if (score < 30)    return { emoji: '👻', text: 'You are a serial tab abandoner. These tabs trusted you.' };
  return               { emoji: '💀', text: 'Absolute hoarder energy. Your RAM weeps. The ghosts have formed a union.' };
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return url; }
}

// ── Render ghost item ──────────────────────────────────────────────────────

function renderGhostItem(tab, showResurrect = true) {
  const days = tab.daysAbandoned ?? daysSince(tab.lastVisited);
  const badgeClass = daysBadgeClass(days);
  const isAncient = days >= 7;

  const item = document.createElement('div');
  item.className = `ghost-item${isAncient ? ' ancient' : ''}`;

  const faviconHtml = tab.favIconUrl
    ? `<img class="ghost-favicon" src="${tab.favIconUrl}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    + `<div class="ghost-favicon-placeholder" style="display:none">🌐</div>`
    : `<div class="ghost-favicon-placeholder">🌐</div>`;

  item.innerHTML = `
    ${faviconHtml}
    <div class="ghost-info">
      <div class="ghost-title" title="${tab.title}">${tab.title || getDomain(tab.url)}</div>
      <div class="ghost-url">${getDomain(tab.url)}</div>
    </div>
    <div class="ghost-meta">
      <span class="days-badge ${badgeClass}">${formatDays(days)}</span>
      ${showResurrect ? `<button class="resurrect-btn" data-url="${tab.url}" data-closed="${tab.closedAt || ''}">↑ Rise</button>` : ''}
    </div>
  `;

  // Resurrect handler
  if (showResurrect) {
    const btn = item.querySelector('.resurrect-btn');
    btn.addEventListener('click', async () => {
      btn.textContent = '✓ Risen';
      btn.classList.add('done');
      btn.disabled = true;

      chrome.runtime.sendMessage({
        action: 'resurrect',
        url: tab.url,
        closedAt: tab.closedAt
      }, () => {
        // Remove the item with animation
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        item.style.transition = 'all 0.3s';
        setTimeout(() => { item.remove(); checkEmpty(); }, 300);
      });
    });
  }

  return item;
}

// ── Check empty states ─────────────────────────────────────────────────────

function checkEmpty() {
  const gList  = document.getElementById('graveyardList');
  const gEmpty = document.getElementById('graveyardEmpty');
  const hList  = document.getElementById('hauntedList');
  const hEmpty = document.getElementById('hauntedEmpty');

  if (gList.children.length === 0) gEmpty.classList.add('visible');
  if (hList.children.length === 0) hEmpty.classList.add('visible');
}

// ── Update stats UI ────────────────────────────────────────────────────────

function updateStats(graveyard, stats, ghostActiveTabs) {
  const totalGhosts = graveyard.filter(t => t.isGhost).length + ghostActiveTabs.length;
  const guiltScore  = Math.min(100, stats.totalAbandoned * 2 - stats.totalResurrected);
  const safeScore   = Math.max(0, guiltScore);

  document.getElementById('statGhosts').textContent     = totalGhosts;
  document.getElementById('statAbandoned').textContent  = stats.totalAbandoned;
  document.getElementById('statResurrected').textContent = stats.totalResurrected;
  document.getElementById('statGuilt').textContent      = safeScore;

  // Guilt meter
  document.getElementById('guiltMeter').style.width = `${safeScore}%`;

  const verdict = guiltVerdict(safeScore);
  document.getElementById('guiltLabel').textContent = verdict.emoji + ' ' + (
    safeScore < 20 ? 'Doing fine' :
    safeScore < 50 ? 'Concerning' :
    safeScore < 80 ? 'Haunted' : 'MAXIMUM GUILT'
  );

  return { safeScore, verdict };
}

// ── Populate weekly report ─────────────────────────────────────────────────

function updateReport(stats, verdict) {
  const weekStart = new Date(stats.weekStart);
  document.getElementById('reportDate').textContent =
    `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  document.getElementById('rWeekly').textContent      = stats.weeklyAbandoned;
  document.getElementById('rResurrected').textContent = stats.totalResurrected;
  document.getElementById('rTotal').textContent       = stats.totalAbandoned;
  document.getElementById('rSaved').textContent       = stats.totalResurrected;

  document.getElementById('verdictEmoji').textContent = verdict.emoji;
  document.getElementById('verdictText').textContent  = verdict.text;
}

// ── Main load ──────────────────────────────────────────────────────────────

chrome.runtime.sendMessage({ action: 'getGuiltData' }, ({ graveyard, stats, ghostActiveTabs }) => {
  const { safeScore, verdict } = updateStats(graveyard, stats, ghostActiveTabs);
  updateReport(stats, verdict);

  const gList  = document.getElementById('graveyardList');
  const gEmpty = document.getElementById('graveyardEmpty');
  const hList  = document.getElementById('hauntedList');
  const hEmpty = document.getElementById('hauntedEmpty');

  // Populate graveyard
  if (graveyard.length === 0) {
    gEmpty.classList.add('visible');
  } else {
    graveyard.forEach(tab => gList.appendChild(renderGhostItem(tab, true)));
  }

  // Populate haunted active tabs (open but untouched)
  if (ghostActiveTabs.length === 0) {
    hEmpty.classList.add('visible');
  } else {
    ghostActiveTabs.forEach(tab => hList.appendChild(renderGhostItem(tab, false)));
  }
});

// ── Tab switching ──────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Clear graveyard ────────────────────────────────────────────────────────

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Bury them all? This clears your entire graveyard.')) return;
  chrome.runtime.sendMessage({ action: 'clearGraveyard' }, () => {
    document.getElementById('graveyardList').innerHTML = '';
    document.getElementById('graveyardEmpty').classList.add('visible');
    document.getElementById('statGhosts').textContent = '0';
    document.getElementById('guiltMeter').style.width = '0%';
  });
});
