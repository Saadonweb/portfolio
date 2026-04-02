// ── TabGhost Background Service Worker ──
// Tracks tab activity, manages graveyard, fires weekly guilt reports

const GHOST_THRESHOLD_DAYS = 3; // tabs untouched for 3+ days become ghosts
const GRAVEYARD_MAX = 50;       // max tabs stored in graveyard

// ── Helpers ──────────────────────────────────────────────────────────────────

function now() { return Date.now(); }

function daysSince(ts) {
  return Math.floor((now() - ts) / (1000 * 60 * 60 * 24));
}

function isGhost(lastVisited) {
  return daysSince(lastVisited) >= GHOST_THRESHOLD_DAYS;
}

async function getStorage() {
  return new Promise(resolve => {
    chrome.storage.local.get(['activeTabs', 'graveyard', 'stats'], data => {
      resolve({
        activeTabs: data.activeTabs || {},
        graveyard:  data.graveyard  || [],
        stats:      data.stats      || {
          totalResurrected: 0,
          totalAbandoned:   0,
          weeklyAbandoned:  0,
          weekStart:        now()
        }
      });
    });
  });
}

async function saveStorage(patch) {
  return new Promise(resolve => {
    chrome.storage.local.set(patch, resolve);
  });
}

// ── Track tab visits ──────────────────────────────────────────────────────────

async function touchTab(tabId) {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

  const { activeTabs } = await getStorage();

  activeTabs[tabId] = {
    tabId,
    url:        tab.url,
    title:      tab.title || tab.url,
    favIconUrl: tab.favIconUrl || '',
    lastVisited: now(),
    createdAt:   activeTabs[tabId]?.createdAt || now()
  };

  await saveStorage({ activeTabs });
}

// Tab switched to
chrome.tabs.onActivated.addListener(({ tabId }) => touchTab(tabId));

// Tab URL or title updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) touchTab(tabId);
});

// ── On tab close → move to graveyard ─────────────────────────────────────────

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { activeTabs, graveyard, stats } = await getStorage();

  const tabData = activeTabs[tabId];
  if (!tabData) return;

  const daysAbandoned = daysSince(tabData.lastVisited);
  const ghost = isGhost(tabData.lastVisited);

  // Add to graveyard
  const graveyardEntry = {
    ...tabData,
    closedAt:     now(),
    daysAbandoned,
    isGhost:      ghost
  };

  const newGraveyard = [graveyardEntry, ...graveyard].slice(0, GRAVEYARD_MAX);

  // Update stats
  const newStats = { ...stats };
  if (ghost) {
    newStats.totalAbandoned++;
    newStats.weeklyAbandoned++;
  }

  // Remove from active
  delete activeTabs[tabId];

  await saveStorage({ activeTabs, graveyard: newGraveyard, stats: newStats });
});

// ── Weekly guilt report alarm ─────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('weeklyGuiltReport', {
    periodInMinutes: 60 * 24 * 7 // every 7 days
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'weeklyGuiltReport') return;

  const { stats, graveyard } = await getStorage();
  const ghostsThisWeek = stats.weeklyAbandoned;

  const message = ghostsThisWeek === 0
    ? 'Impressive. Zero ghost tabs this week. Are you even human?'
    : `You abandoned ${ghostsThisWeek} tab${ghostsThisWeek > 1 ? 's' : ''} this week. They haunt you still. 👻`;

  chrome.notifications.create('weeklyGuilt', {
    type:    'basic',
    iconUrl: 'icons/icon128.png',
    title:   '👻 Your Weekly Guilt Report',
    message,
    priority: 2
  });

  // Reset weekly count
  await saveStorage({
    stats: { ...stats, weeklyAbandoned: 0, weekStart: now() }
  });
});

// ── Resurrection: reopen a graveyard tab ─────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'resurrect') {
    (async () => {
      const { graveyard, stats } = await getStorage();

      // Find the tab
      const idx = graveyard.findIndex(t => t.url === msg.url && t.closedAt === msg.closedAt);
      if (idx === -1) { sendResponse({ ok: false }); return; }

      // Open it
      await chrome.tabs.create({ url: msg.url, active: true });

      // Remove from graveyard
      const newGraveyard = graveyard.filter((_, i) => i !== idx);
      const newStats = { ...stats, totalResurrected: stats.totalResurrected + 1 };

      await saveStorage({ graveyard: newGraveyard, stats: newStats });
      sendResponse({ ok: true });
    })();
    return true; // async response
  }

  if (msg.action === 'clearGraveyard') {
    (async () => {
      await saveStorage({ graveyard: [] });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (msg.action === 'getGuiltData') {
    (async () => {
      const { activeTabs, graveyard, stats } = await getStorage();

      // Also scan active tabs for ghost status
      const ghostActiveTabs = Object.values(activeTabs).filter(t => isGhost(t.lastVisited));

      sendResponse({ graveyard, stats, ghostActiveTabs });
    })();
    return true;
  }
});
