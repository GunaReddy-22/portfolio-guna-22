import React, { useEffect, useState } from 'react';
import { Palette, CheckCircle, RefreshCw, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const ThemeStudio: React.FC = () => {
  const [theme, setTheme] = useState<any>({
    colors: {
      void: '#04070d',
      deep: '#080d1a',
      surface: '#0e1626',
      border: '#1a2436',
      text: '#f0f4fc',
      muted: '#6a7894',
      amber: '#f59e0b',
      amberGlow: 'rgba(245, 158, 11, 0.15)',
      teal: '#14b8a6',
      violet: '#8b5cf6',
    },
    typography: {
      fontSans: 'Plus Jakarta Sans',
      fontHeading: 'Bricolage Grotesque',
      fontDisplay: 'Fraunces',
      fontMono: 'Space Mono',
    },
    layout: {
      containerWidth: '1200px',
      borderRadius: '12px',
    },
    animations: {
      enableCanvas: true,
      enableCustomCursor: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTheme() {
      try {
        setLoading(true);
        const data = await api.getTheme();
        if (data) {
          setTheme((prev: any) => ({
            ...prev,
            ...data,
            colors: { ...prev.colors, ...(data.colors || {}) },
            typography: { ...prev.typography, ...(data.typography || {}) },
            layout: { ...prev.layout, ...(data.layout || {}) },
            animations: { ...prev.animations, ...(data.animations || {}) },
          }));
        }
      } catch (err) {
        console.error('Failed to load theme:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  const handleColorChange = (key: string, value: string) => {
    setTheme((prev: any) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }));
  };

  const handleTypographyChange = (key: string, value: string) => {
    setTheme((prev: any) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateTheme(theme);
      setSuccessMsg('Theme settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(`Failed to save theme: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CmsLoadingState
        title="Loading Theme Studio..."
        subtitle="Retrieving design tokens, custom CSS, and typography configurations"
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={22} color="var(--cms-amber)" />
            Theme Studio
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Customize global portfolio color tokens, typography, and visual presets
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="cms-btn cms-btn-primary"
        >
          <Save size={16} />
          <span>{saving ? 'Saving Theme...' : 'Save Theme'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="cms-alert cms-alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Form Controls */}
        <form onSubmit={handleSave}>
          {/* Colors Card */}
          <div className="cms-card">
            <h3 className="cms-card-title">Color Palette Tokens</h3>
            <p className="cms-card-desc">CSS design tokens applied to the public website</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="cms-label">Void Background (--void)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.void || '#04070d'}
                    onChange={(e) => handleColorChange('void', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.void || '#04070d'}
                    onChange={(e) => handleColorChange('void', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label">Surface Card (--surface)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.surface || '#0e1626'}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.surface || '#0e1626'}
                    onChange={(e) => handleColorChange('surface', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label">Amber Primary (--amber)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.amber || '#f59e0b'}
                    onChange={(e) => handleColorChange('amber', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.amber || '#f59e0b'}
                    onChange={(e) => handleColorChange('amber', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label">Teal Secondary (--teal)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.teal || '#14b8a6'}
                    onChange={(e) => handleColorChange('teal', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.teal || '#14b8a6'}
                    onChange={(e) => handleColorChange('teal', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label">Violet Accent (--violet)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.violet || '#8b5cf6'}
                    onChange={(e) => handleColorChange('violet', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.violet || '#8b5cf6'}
                    onChange={(e) => handleColorChange('violet', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="cms-label">Subtle Border (--border)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={theme.colors?.border || '#1a2436'}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                    style={{ width: '40px', height: '36px', border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="cms-input"
                    value={theme.colors?.border || '#1a2436'}
                    onChange={(e) => handleColorChange('border', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography Card */}
          <div className="cms-card">
            <h3 className="cms-card-title">Typography Settings</h3>
            <p className="cms-card-desc">Approved Google Fonts used in the layout</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <div className="cms-form-group">
                <label className="cms-label">Headings Font</label>
                <input
                  type="text"
                  className="cms-input"
                  value={theme.typography?.fontHeading || 'Bricolage Grotesque'}
                  onChange={(e) => handleTypographyChange('fontHeading', e.target.value)}
                />
              </div>
              <div className="cms-form-group">
                <label className="cms-label">Display Serif Font</label>
                <input
                  type="text"
                  className="cms-input"
                  value={theme.typography?.fontDisplay || 'Fraunces'}
                  onChange={(e) => handleTypographyChange('fontDisplay', e.target.value)}
                />
              </div>
              <div className="cms-form-group">
                <label className="cms-label">Body Sans Font</label>
                <input
                  type="text"
                  className="cms-input"
                  value={theme.typography?.fontSans || 'Plus Jakarta Sans'}
                  onChange={(e) => handleTypographyChange('fontSans', e.target.value)}
                />
              </div>
              <div className="cms-form-group">
                <label className="cms-label">Monospace Font</label>
                <input
                  type="text"
                  className="cms-input"
                  value={theme.typography?.fontMono || 'Space Mono'}
                  onChange={(e) => handleTypographyChange('fontMono', e.target.value)}
                />
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Live Simulated Preview */}
        <div>
          <div className="cms-card">
            <h3 className="cms-card-title">Real-Time Design Preview</h3>
            <p className="cms-card-desc">Previewing active tokens on a component mock</p>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '2rem',
                backgroundColor: theme.colors?.void,
                borderRadius: theme.layout?.borderRadius || '12px',
                border: `1px solid ${theme.colors?.border}`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${theme.colors?.amber}`,
                  color: theme.colors?.amber,
                  fontFamily: theme.typography?.fontMono,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                }}
              >
                ● LIVE PORTFOLIO PREVIEW
              </div>

              <h2
                style={{
                  fontFamily: theme.typography?.fontHeading,
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  color: theme.colors?.text,
                  margin: '0 0 0.5rem 0',
                  lineHeight: 1.2,
                }}
              >
                Engineering Digital Experiences with{' '}
                <span style={{ color: theme.colors?.amber, fontStyle: 'italic', fontFamily: theme.typography?.fontDisplay }}>
                  Precision.
                </span>
              </h2>

              <p
                style={{
                  fontFamily: theme.typography?.fontSans,
                  fontSize: '0.9rem',
                  color: theme.colors?.muted,
                  margin: '0 0 1.5rem 0',
                  lineHeight: 1.6,
                }}
              >
                Simulating typography, contrast ratios, and button hierarchy using your chosen theme tokens.
              </p>

              {/* Sample Card */}
              <div
                style={{
                  backgroundColor: theme.colors?.surface,
                  border: `1px solid ${theme.colors?.border}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(20, 184, 166, 0.15)',
                      color: theme.colors?.teal,
                      fontFamily: theme.typography?.fontMono,
                    }}
                  >
                    TypeScript
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(139, 92, 246, 0.15)',
                      color: theme.colors?.violet,
                      fontFamily: theme.typography?.fontMono,
                    }}
                  >
                    Express
                  </span>
                </div>
                <div style={{ color: theme.colors?.text, fontWeight: 700, fontSize: '0.95rem' }}>
                  Sample Project Card
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  style={{
                    backgroundColor: theme.colors?.amber,
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'default',
                  }}
                >
                  Explore Work
                </button>
                <button
                  type="button"
                  style={{
                    backgroundColor: 'transparent',
                    color: theme.colors?.text,
                    border: `1px solid ${theme.colors?.border}`,
                    borderRadius: '8px',
                    padding: '0.6rem 1.2rem',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'default',
                  }}
                >
                  Contact Me
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
