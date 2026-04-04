import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

const EXAMPLES = [
  { label: '🎵 Music Streaming', text: 'A Spotify-like music streaming platform where users can upload songs, create playlists, follow artists, and stream audio with offline download support.' },
  { label: '🚗 Ride Sharing', text: 'An Uber-like ride-sharing app where drivers and passengers can match in real-time, track location on a map, process payments, and leave ratings.' },
  { label: '🛒 E-commerce', text: 'An Amazon-like e-commerce marketplace where sellers can list products, buyers can browse, add to cart, checkout with payments, and track orders.' },
  { label: '💬 Chat App', text: 'A Slack-like team chat app with real-time messaging, channels, direct messages, file sharing, search across message history, and notification system.' },
];

const METHOD_COLORS = { GET: '#10b981', POST: '#6366f1', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#a855f7' };
const COMPLEXITY_COLOR = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

export default function Home() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [design, setDesign] = useState(null);
  const mermaidRef = useRef(null);
  const mermaidInitialized = useRef(false);

  const handleExample = (text) => { setDescription(text); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (description.trim().length < 10) { setError('Please describe your app in a bit more detail.'); return; }
    setLoading(true); setError(''); setDesign(null);
    try {
      const res = await fetch('/api/design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setDesign(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!design?.mermaidDiagram) return;
    const renderMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        if (!mermaidInitialized.current) {
          mermaid.initialize({ startOnLoad: false, theme: 'dark', themeVariables: { primaryColor: '#1a1a35', primaryTextColor: '#e2e8f0', primaryBorderColor: '#6366f1', lineColor: '#6366f1', secondaryColor: '#0d0d20', tertiaryColor: '#0a0a1a', background: '#04040f', nodeBorder: '#6366f1', clusterBkg: '#0d0d20', titleColor: '#e2e8f0', edgeLabelBackground: '#1a1a35', fontFamily: 'Inter, system-ui, sans-serif' } });
          mermaidInitialized.current = true;
        }
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = '';
          const id = `mermaid-${Date.now()}`;
          const { svg } = await mermaid.render(id, design.mermaidDiagram);
          mermaidRef.current.innerHTML = svg;
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (mermaidRef.current) mermaidRef.current.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">Could not render diagram.</p>';
      }
    };
    renderMermaid();
  }, [design]);

  return (
    <>
      <Head>
        <title>ArchAI — AI System Design Generator</title>
        <meta name="description" content="Describe your app, get a complete system architecture in seconds." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <header style={{ textAlign: 'center', padding: '4rem 1.5rem 2rem' }}>
          <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.35rem 1rem', fontSize: '0.75rem', color: 'var(--cyan)', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '1.5rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            POWERED BY GEMINI AI
          </div>
          <h1 className="fade-up-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, lineHeight: 1.1, background: 'linear-gradient(135deg, #e2e8f0 0%, #6366f1 50%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1.25rem' }}>
            ⚡ ArchAI
          </h1>
          <p className="fade-up-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', color: 'var(--dim)', maxWidth: 580, margin: '0 auto 0.75rem' }}>
            Describe your app. Get a <em style={{ color: 'var(--indigo)', fontStyle: 'normal' }}>complete system design</em> in seconds.
          </p>
          <p className="fade-up-3" style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Architecture · Tech Stack · API Design · Scalability</p>
        </header>
        <main style={{ maxWidth: 820, margin: '0 auto', padding: '0 1.5rem 6rem' }}>
          <div className="fade-up-4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', marginBottom: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--dim)', marginBottom: '0.75rem' }}>Describe your application</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. A social platform where developers share code snippets, get peer reviews, and build a reputation..." rows={4}
                style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--indigo)'} onBlur={(e) => e.target.style.borderColor = 'var(--border)'} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '0.875rem 0' }}>
                {EXAMPLES.map((ex) => (
                  <button key={ex.label} type="button" onClick={() => handleExample(ex.text)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '999px', padding: '0.35rem 0.875rem', color: 'var(--dim)', fontSize: '0.8rem', fontWeight: 500, transition: 'all 0.15s' }}
                    onMouseEnter={(e) => { e.target.style.borderColor = 'var(--indigo)'; e.target.style.color = 'var(--text)'; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--dim)'; }}>
                    {ex.label}
                  </button>
                ))}
              </div>
              {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.625rem 0.875rem', background: '#ef44441a', borderRadius: 8, border: '1px solid #ef444433' }}>{error}</p>}
              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '0.875rem', background: loading ? 'var(--border)' : 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', transition: 'opacity 0.2s', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }} onMouseLeave={(e) => { e.target.style.opacity = '1'; }}>
                {loading ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating system design...</span> : '⚡ Generate System Design'}
              </button>
            </form>
          </div>
          {design && (
            <div>
              <div className="fade-up" style={{ background: 'linear-gradient(135deg, #6366f115, #a855f715)', border: '1px solid #6366f140', borderRadius: 16, padding: '1.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.375rem' }}>{design.appName}</h2>
                    <p style={{ color: 'var(--dim)', fontSize: '0.95rem', maxWidth: 520, lineHeight: 1.6 }}>{design.overview}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ background: '#6366f122', border: '1px solid #6366f155', borderRadius: '999px', padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--indigo)' }}>{design.architectureType}</span>
                    <span style={{ background: `${COMPLEXITY_COLOR[design.estimatedComplexity]}22`, border: `1px solid ${COMPLEXITY_COLOR[design.estimatedComplexity]}55`, borderRadius: '999px', padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 700, color: COMPLEXITY_COLOR[design.estimatedComplexity] }}>{design.estimatedComplexity} Complexity</span>
                    {design.mvpTimeline && <span style={{ background: '#22d3ee15', border: '1px solid #22d3ee40', borderRadius: '999px', padding: '0.35rem 0.875rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--cyan)' }}>MVP: {design.mvpTimeline}</span>}
                  </div>
                </div>
              </div>
              <Section title="🗺️ Architecture Diagram" delay={1}>
                <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: '1.5rem', border: '1px solid var(--border)', overflowX: 'auto' }}>
                  <div ref={mermaidRef} className="mermaid-container" style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Rendering diagram...</span>
                  </div>
                </div>
              </Section>
              <Section title="🛠️ Tech Stack" delay={2}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.875rem' }}>
                  {design.techStack?.map((item, i) => (
                    <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem', transition: 'border-color 0.15s, transform 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--indigo)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--indigo)', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>{item.category.toUpperCase()}</div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem', marginBottom: '0.375rem' }}>{item.tech}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>{item.reason}</div>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="🔌 Key API Endpoints" delay={3}>
                <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead><tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>{['Method','Endpoint','Description'].map(h => <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em' }}>{h.toUpperCase()}</th>)}</tr></thead>
                    <tbody>{design.keyAPIs?.map((api, i) => <tr key={i} style={{ borderBottom: i < design.keyAPIs.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'var(--card)' }}><td style={{ padding: '0.75rem 1rem' }}><span style={{ display: 'inline-block', padding: '0.2rem 0.625rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', background: `${METHOD_COLORS[api.method] || '#6366f1'}22`, color: METHOD_COLORS[api.method] || '#6366f1' }}>{api.method}</span></td><td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--cyan)' }}>{api.endpoint}</td><td style={{ padding: '0.75rem 1rem', color: 'var(--dim)' }}>{api.description}</td></tr>)}</tbody>
                  </table>
                </div>
              </Section>
              <Section title="📈 Scalability Features" delay={4}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.625rem' }}>
                  {design.scalabilityFeatures?.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem' }}>
                      <span style={{ color: 'var(--green)', fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--dim)', lineHeight: 1.5 }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </Section>
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button onClick={() => { setDesign(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, padding: '0.75rem 1.75rem', color: 'var(--dim)', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.target.style.borderColor = 'var(--indigo)'; e.target.style.color = 'var(--text)'; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--dim)'; }}>
                  ← Design Another App
                </button>
              </div>
            </div>
          )}
          {!design && !loading && (
            <div className="fade-up-5" style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Your architecture will appear here. Try one of the examples above!</p>
            </div>
          )}
        </main>
        <footer style={{ textAlign: 'center', padding: '2rem', borderTop: '1px solid var(--border)', color: 'var(--muted)', fontSize: '0.8rem' }}>
          Built with Next.js &amp; Gemini AI · <a href="https://github.com/Saadonweb" style={{ color: 'var(--indigo)' }}>@Saadonweb</a>
        </footer>
      </div>
    </>
  );
}

function Section({ title, children, delay }) {
  return (
    <div className={`fade-up-${delay || 1}`} style={{ marginBottom: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '0.875rem', fontSize: '1.05rem' }}>{title}</h3>
      {children}
    </div>
  );
}
