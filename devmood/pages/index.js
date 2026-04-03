import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';

const ARCHETYPES = [
  { emoji: '🌙', name: 'The Midnight Coder' },
  { emoji: '🚀', name: 'The Feature Machine' },
  { emoji: '🐛', name: 'The Bug Slayer' },
  { emoji: '✨', name: 'The Clean Coder' },
  { emoji: '⚔️', name: 'The WIP Warrior' },
  { emoji: '🎨', name: 'The Emoji Architect' },
  { emoji: '🔥', name: 'The Chaos Agent' },
];

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return;
    setLoading(true);
    setError('');
    // Validate user exists before navigating
    try {
      const res = await fetch(`/api/analyze/${clean}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }
      router.push(`/results/${clean}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>DevMood — Your GitHub, Unwrapped</title>
        <meta name="description" content="Spotify Wrapped but for your GitHub commits. Powered by GPT-4." />
        <meta property="og:title" content="DevMood — Your GitHub, Unwrapped" />
        <meta property="og:description" content="Drop your GitHub username. Get your developer personality profile." />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Grotesk:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        body { background: #080810; }

        .page {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2rem;
          position: relative; overflow: hidden;
        }

        /* Background glow */
        .bg-glow {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(124,107,255,0.10) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .content { position: relative; z-index: 1; text-align: center; max-width: 560px; width: 100%; }

        .logo {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Space Mono', monospace;
          font-size: 1.1rem; font-weight: 700; color: #eeeeff;
          margin-bottom: 3rem;
          text-decoration: none;
        }
        .logo span { color: #7c6bff; }

        h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.2rem, 6vw, 3.8rem);
          font-weight: 900; letter-spacing: -0.03em;
          line-height: 1.05; margin-bottom: 1rem;
          color: #eeeeff;
        }
        h1 em { color: #7c6bff; font-style: normal; }
        h1 strong { color: #ff6b9d; }

        .subtitle {
          font-size: 1rem; color: #5a5a88; margin-bottom: 2.5rem; line-height: 1.7;
        }

        .input-wrapper {
          display: flex; gap: 0; width: 100%;
          background: #0f0f1e;
          border: 1px solid rgba(124,107,255,0.25);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 1rem;
        }
        .input-wrapper:focus-within {
          border-color: rgba(124,107,255,0.6);
          box-shadow: 0 0 0 3px rgba(124,107,255,0.12);
        }

        .at-prefix {
          display: flex; align-items: center; padding: 0 0.8rem 0 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 1rem; color: #5a5a88;
          background: transparent; user-select: none;
        }

        input[type="text"] {
          flex: 1; padding: 1rem 0.5rem; border: none; outline: none;
          background: transparent; color: #eeeeff;
          font-family: 'Space Mono', monospace; font-size: 1rem;
        }
        input[type="text"]::placeholder { color: #3a3a55; }

        .analyze-btn {
          display: flex; align-items: center; gap: 8px;
          background: #7c6bff; color: #fff;
          border: none; cursor: pointer;
          padding: 1rem 1.5rem;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.9rem; font-weight: 600;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .analyze-btn:hover:not(:disabled) { background: #6b5ce7; }
        .analyze-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .error-msg {
          color: #ff6b9d; font-size: 0.8rem;
          text-align: left; padding: 0.2rem 0.2rem;
          font-family: 'Space Mono', monospace;
        }

        .archetypes-preview {
          margin-top: 3rem;
          display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem;
        }
        .arch-pill {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 20px;
          border: 1px solid rgba(124,107,255,0.15);
          background: rgba(124,107,255,0.04);
          font-size: 0.75rem; color: #5a5a88;
          transition: border-color 0.2s, color 0.2s;
        }
        .arch-pill:hover { border-color: rgba(124,107,255,0.4); color: #eeeeff; }

        .footer-note {
          margin-top: 2rem;
          font-size: 0.75rem; color: #3a3a55;
          font-family: 'Space Mono', monospace;
        }
        .footer-note a { color: #5a5a88; text-decoration: none; }
        .footer-note a:hover { color: #eeeeff; }
      `}</style>

      <div className="bg-glow" />

      <div className="page">
        <div className="content">
          <a href="/" className="logo">🧠 Dev<span>Mood</span></a>

          <h1>
            Your GitHub,<br />
            <em>analyzed.</em> <strong>Roasted.</strong>
          </h1>
          <p className="subtitle">
            Drop your GitHub username. GPT-4 analyzes your commit history and generates a developer personality profile you didn't ask for but absolutely need.
          </p>

          <form onSubmit={handleAnalyze}>
            <div className="input-wrapper">
              <span className="at-prefix">github.com/</span>
              <input
                type="text"
                placeholder="your-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              <button type="submit" className="analyze-btn" disabled={loading || !username.trim()}>
                {loading ? <div className="spinner" /> : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Analyze
                  </>
                )}
              </button>
            </div>
            {error && <div className="error-msg">⚠ {error}</div>}
          </form>

          <div className="archetypes-preview">
            {ARCHETYPES.map(a => (
              <div key={a.name} className="arch-pill">
                {a.emoji} {a.name}
              </div>
            ))}
          </div>

          <p className="footer-note">
            Only public repos are analyzed · No OAuth required · Built by{' '}
            <a href="https://github.com/Saadonweb" target="_blank" rel="noreferrer">Saad Mohammad</a>
          </p>
        </div>
      </div>
    </>
  );
}
