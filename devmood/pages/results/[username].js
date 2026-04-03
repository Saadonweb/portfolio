import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const ARCHETYPE_EMOJI = {
  'The Midnight Coder':    '🌙',
  'The Feature Machine':   '🚀',
  'The Bug Slayer':        '🐛',
  'The Clean Coder':       '✨',
  'The WIP Warrior':       '⚔️',
  'The Emoji Architect':   '🎨',
  'The Doc Sage':          '📚',
  'The Chaos Agent':       '🔥',
  'The Reliable Builder':  '🔨',
};

const ARCHETYPE_COLOR = {
  'The Midnight Coder':    '#7c6bff',
  'The Feature Machine':   '#00f5a0',
  'The Bug Slayer':        '#ff6b9d',
  'The Clean Coder':       '#ffd166',
  'The WIP Warrior':       '#ff9a3c',
  'The Emoji Architect':   '#ff6b9d',
  'The Doc Sage':          '#00f5a0',
  'The Chaos Agent':       '#ff4040',
  'The Reliable Builder':  '#7c6bff',
};

function StatBar({ label, value, max = 100, color = '#7c6bff' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: '#5a5a88' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', color: '#eeeeff', fontFamily: 'Space Mono, monospace' }}>
          {value}{max === 100 ? '/100' : ''}
        </span>
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, pct)}%`,
          background: color, borderRadius: '3px',
          transition: 'width 1.2s cubic-bezier(0.25,0.46,0.45,0.94)',
        }} />
      </div>
    </div>
  );
}

function LoadingScreen({ username }) {
  const steps = [
    'Fetching commit history...',
    'Analyzing patterns...',
    'Consulting GPT-4...',
    'Writing your roast...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'spin 3s linear infinite' }}>🧠</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Analyzing <span style={{ color: '#7c6bff' }}>@{username}</span>
      </h2>
      <p style={{ color: '#5a5a88', fontSize: '0.875rem', marginBottom: '2rem', fontFamily: 'Space Mono, monospace' }}>
        {steps[step]}
      </p>
      <div style={{ display: 'flex', gap: '6px' }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i <= step ? '24px' : '8px', height: '8px',
            borderRadius: '4px', background: i <= step ? '#7c6bff' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>
    </div>
  );
}

export default function Results() {
  const router = useRouter();
  const { username } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetch(`/api/analyze/${username}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return; }
        setData(d);
        setLoading(false);
      })
      .catch(() => { setError('Network error. Please try again.'); setLoading(false); });
  }, [username]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading || !username) return (
    <>
      <Head><link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" /></Head>
      <style>{`body{background:#080810;color:#eeeeff;font-family:'Space Grotesk',sans-serif;}@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <LoadingScreen username={username || '...'} />
    </>
  );

  if (error) return (
    <>
      <Head><link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" /></Head>
      <style>{`body{background:#080810;color:#eeeeff;font-family:'Space Grotesk',sans-serif;}`}</style>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😬</div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Something went wrong</h2>
        <p style={{ color: '#5a5a88', marginBottom: '2rem', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem' }}>{error}</p>
        <button onClick={() => router.push('/')} style={{ background: '#7c6bff', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.8rem 1.8rem', cursor: 'pointer', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600 }}>
          Try Again
        </button>
      </div>
    </>
  );

  const { user, archetype, stats, verdict, sampleCommits } = data;
  const color = ARCHETYPE_COLOR[archetype] || '#7c6bff';
  const emoji = ARCHETYPE_EMOJI[archetype] || '💻';

  return (
    <>
      <Head>
        <title>{user.name}'s DevMood Profile — {archetype}</title>
        <meta name="description" content={`${user.name} is ${archetype}. ${verdict}`} />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        body { background: #080810; color: #eeeeff; font-family: 'Space Grotesk', sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .fade-1 { animation: fadeUp 0.6s ease forwards; }
        .fade-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .fade-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .fade-4 { animation: fadeUp 0.6s 0.3s ease both; }

        .results-page { max-width: 860px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

        .back-btn {
          display: inline-flex; align-items: center; gap: 6px;
          color: #5a5a88; font-size: 0.8rem; cursor: pointer;
          background: none; border: none; margin-bottom: 2.5rem;
          font-family: 'Space Mono', monospace;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #eeeeff; }

        .profile-header {
          display: flex; align-items: center; gap: 1.2rem;
          margin-bottom: 2rem;
        }
        .avatar {
          width: 60px; height: 60px; border-radius: 50%;
          border: 2px solid rgba(124,107,255,0.3);
        }
        .user-info h1 {
          font-family: 'Syne', sans-serif; font-size: 1.4rem; font-weight: 800;
          margin-bottom: 2px;
        }
        .user-handle { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: #5a5a88; }

        .archetype-hero {
          border-radius: 20px; padding: 2rem 2.2rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, #0f0f1e 0%, #0d0d1a 100%);
          border: 1px solid rgba(124,107,255,0.15);
          position: relative; overflow: hidden;
        }
        .archetype-hero::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
        }
        .arch-label { font-family: 'Space Mono', monospace; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: #5a5a88; margin-bottom: 8px; }
        .arch-big-name { font-family: 'Syne', sans-serif; font-size: clamp(2rem, 5vw, 3rem); font-weight: 900; letter-spacing: -0.02em; }
        .arch-emoji-big { font-size: 3.5rem; float: right; margin-top: -0.5rem; }
        .verdict-box { margin-top: 1.2rem; padding: 1rem 1.2rem; background: rgba(0,0,0,0.3); border-radius: 10px; border-left: 3px solid; }
        .verdict-label { font-family: 'Space Mono', monospace; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .verdict-text { font-size: 0.9rem; color: #aaaacc; line-height: 1.75; font-style: italic; }

        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } }

        .stat-card {
          background: #0f0f1e; border: 1px solid rgba(124,107,255,0.12);
          border-radius: 14px; padding: 1.2rem;
        }
        .stat-card-label { font-size: 0.65rem; color: #5a5a88; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; font-family: 'Space Mono', monospace; }
        .stat-card-val { font-family: 'Syne', sans-serif; font-size: 1.5rem; font-weight: 800; }
        .stat-card-sub { font-size: 0.7rem; color: #5a5a88; margin-top: 2px; }

        .bars-card { background: #0f0f1e; border: 1px solid rgba(124,107,255,0.12); border-radius: 14px; padding: 1.5rem; margin-bottom: 1.5rem; }
        .bars-title { font-family: 'Space Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #5a5a88; margin-bottom: 1.2rem; }

        .commits-card { background: #0f0f1e; border: 1px solid rgba(124,107,255,0.12); border-radius: 14px; padding: 1.5rem; margin-bottom: 2rem; }
        .commits-title { font-family: 'Space Mono', monospace; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #5a5a88; margin-bottom: 1rem; }
        .commit-item {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
          font-family: 'Space Mono', monospace; font-size: 0.75rem; color: #aaaacc;
        }
        .commit-item:last-child { border-bottom: none; }
        .commit-dot { width: 6px; height: 6px; border-radius: 50%; background: #5a5a88; flex-shrink: 0; margin-top: 6px; }

        .action-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .btn-share { display: inline-flex; align-items: center; gap: 8px; background: #7c6bff; color: #fff; border: none; border-radius: 10px; padding: 0.9rem 1.8rem; font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn-share:hover { background: #6b5ce7; }
        .btn-back { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: #eeeeff; border: 1px solid rgba(124,107,255,0.2); border-radius: 10px; padding: 0.9rem 1.8rem; font-family: 'Space Grotesk', sans-serif; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: border-color 0.2s; }
        .btn-back:hover { border-color: rgba(124,107,255,0.5); }
      `}</style>

      <div className="results-page">
        <button className="back-btn fade-1" onClick={() => router.push('/')}>
          ← Analyze another
        </button>

        {/* Header */}
        <div className="profile-header fade-1">
          <img src={user.avatar} alt={user.name} className="avatar" />
          <div className="user-info">
            <h1>{user.name}</h1>
            <div className="user-handle">@{user.login} · {stats.total} commits analyzed</div>
          </div>
        </div>

        {/* Archetype hero */}
        <div className="archetype-hero fade-2" style={{ '--arch-color': color }}>
          <div className="archetype-hero" style={{ padding: 0, border: 'none', background: 'none', position: 'relative' }}>
            <style>{`.archetype-hero::before { background: linear-gradient(90deg, ${color}, ${color}88); }`}</style>
          </div>
          <div className="arch-label">Developer Archetype</div>
          <span className="arch-emoji-big">{emoji}</span>
          <div className="arch-big-name" style={{ color }}>{archetype}</div>
          <div className="verdict-box" style={{ borderLeftColor: color }}>
            <div className="verdict-label" style={{ color }}>🤖 GPT-4 Verdict</div>
            <p className="verdict-text">"{verdict}"</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="stats-grid fade-3">
          <div className="stat-card">
            <div className="stat-card-label">Night Owl Score</div>
            <div className="stat-card-val" style={{ color }}>{stats.nightOwlScore}<span style={{ fontSize: '0.9rem', fontFamily: 'Space Grotesk', fontWeight: 400, color: '#5a5a88' }}>/100</span></div>
            <div className="stat-card-sub">Peak hour: {stats.peakHour}:00</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Chaos Index</div>
            <div className="stat-card-val" style={{ color: stats.chaosScore > 60 ? '#ff4040' : '#ffd166' }}>{stats.chaosScore}<span style={{ fontSize: '0.9rem', fontFamily: 'Space Grotesk', fontWeight: 400, color: '#5a5a88' }}>/100</span></div>
            <div className="stat-card-sub">{stats.chaosScore > 70 ? '🔥 It\'s chaotic in here' : stats.chaosScore > 40 ? '😅 Manageable chaos' : '✨ Actually organized'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Most Active Day</div>
            <div className="stat-card-val">{stats.peakDay}</div>
            <div className="stat-card-sub">Top commit type: {stats.topType}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Emoji Enthusiasm</div>
            <div className="stat-card-val" style={{ color: stats.emojiScore > 50 ? '#ff6b9d' : '#eeeeff' }}>{stats.emojiScore}%</div>
            <div className="stat-card-sub">{stats.emojiScore > 50 ? '🎨 Expressive coder' : 'Professional AF'}</div>
          </div>
        </div>

        {/* Score bars */}
        <div className="bars-card fade-4">
          <div className="bars-title">Developer Dimensions</div>
          <StatBar label="Night Owl" value={stats.nightOwlScore} color={color} />
          <StatBar label="Chaos Index" value={stats.chaosScore} color={stats.chaosScore > 60 ? '#ff4040' : '#ffd166'} />
          <StatBar label="Emoji Usage" value={stats.emojiScore} color="#ff6b9d" />
          <StatBar label="Conventional Commits" value={stats.conventionalScore} color="#00f5a0" />
          <StatBar label="Bug Fix Ratio" value={Math.round((stats.types.fix / stats.total) * 100)} color="#ff9a3c" />
          <StatBar label="Feature Builder" value={Math.round((stats.types.feat / stats.total) * 100)} color="#7c6bff" />
        </div>

        {/* Sample commits */}
        {sampleCommits?.length > 0 && (
          <div className="commits-card fade-4">
            <div className="commits-title">Recent Commits</div>
            {sampleCommits.map((msg, i) => (
              <div key={i} className="commit-item">
                <div className="commit-dot" />
                <span>{msg}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="action-row fade-4">
          <button className="btn-share" onClick={handleShare}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {copied ? '✓ Copied!' : 'Share My Profile'}
          </button>
          <button className="btn-back" onClick={() => router.push('/')}>
            Analyze Someone Else
          </button>
        </div>
      </div>
    </>
  );
}
