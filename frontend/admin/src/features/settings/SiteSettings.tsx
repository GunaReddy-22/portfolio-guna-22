import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    siteId: 'gunasai-in',
    siteName: 'Guna Sai Portfolio',
    siteUrl: 'https://gunasai.in',
    title: 'Guna Sai Venkata Reddy Kovvuri — Full Stack Developer',
    metaDescription:
      'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications.',
    keywords: ['Guna Sai Venkata Reddy Kovvuri', 'Full Stack Developer', 'NIT Delhi', 'ZenithIndia', 'AI Builder'],
    nav: {
      logoText: 'GS',
      logoDot: '.',
      links: [
        { label: 'About', href: '#about', isCta: false },
        { label: 'Experience', href: '#experience', isCta: false },
        { label: 'Projects', href: '#projects', isCta: false },
        { label: 'Education', href: '#education', isCta: false },
        { label: 'Resume', href: '#resume', isCta: false },
        { label: 'Contact', href: '#contact', isCta: false },
      ],
      hireMeCta: {
        label: 'Hire Me ↗',
        href: 'mailto:241310022@nitdelhi.ac.in?subject=Hiring',
        enabled: true,
      },
      mechToggle: {
        enabled: true,
        label: 'Mech Portfolio',
        href: 'https://mech.gunasai.in',
      },
      languageSwitch: {
        enabled: true,
        defaultCode: 'en',
      },
    },
    footer: {
      leftText: 'Designed & built by',
      leftHighlight: 'Guna Sai Venkata Reddy Kovvuri',
      year: '2026',
      rightText: 'NIT Delhi · Full-Stack Developer',
    },
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/guna-kovvuri' },
      { platform: 'GitHub', url: 'https://github.com' },
      { platform: 'Email', url: 'mailto:241310022@nitdelhi.ac.in' },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const data = await api.getSettings();
        if (data) {
          setSettings((prev: any) => ({
            ...prev,
            ...data,
            nav: {
              ...prev.nav,
              ...(data.nav || {}),
              links: data.nav?.links || prev.nav.links,
              hireMeCta: { ...prev.nav.hireMeCta, ...(data.nav?.hireMeCta || {}) },
              mechToggle: { ...prev.nav.mechToggle, ...(data.nav?.mechToggle || {}) },
            },
            footer: {
              ...prev.footer,
              ...(data.footer || {}),
            },
            socialLinks: data.socialLinks || prev.socialLinks,
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await api.updateSettings(settings);
      setSuccessMsg('Site settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNavLink = () => {
    setSettings((prev: any) => ({
      ...prev,
      nav: {
        ...prev.nav,
        links: [...(prev.nav?.links || []), { label: 'New Link', href: '#section', isCta: false }],
      },
    }));
  };

  const handleRemoveNavLink = (idx: number) => {
    setSettings((prev: any) => ({
      ...prev,
      nav: {
        ...prev.nav,
        links: prev.nav.links.filter((_: any, i: number) => i !== idx),
      },
    }));
  };

  const handleAddSocial = () => {
    setSettings((prev: any) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), { platform: 'LinkedIn', url: 'https://' }],
    }));
  };

  const handleRemoveSocial = (idx: number) => {
    setSettings((prev: any) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_: any, i: number) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <CmsLoadingState
        title="Loading Site Configuration..."
        subtitle="Retrieving global metadata, navigation links, and social credentials"
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={22} color="var(--cms-amber)" />
            Site Settings & Navigation
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Configure global website copy, navigation links, header CTAs, and footer attributions
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="cms-btn cms-btn-primary">
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="cms-alert cms-alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {error && (
        <div className="cms-alert cms-alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Site Identity Card */}
        <div className="cms-card">
          <h3 className="cms-card-title">Site Identity & SEO Copy</h3>
          <div className="cms-form-row" style={{ marginTop: '1rem' }}>
            <div className="cms-form-group">
              <label className="cms-label">Browser Title Tag</label>
              <input
                type="text"
                className="cms-input"
                value={settings.title || ''}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                required
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Site Name</label>
              <input
                type="text"
                className="cms-input"
                value={settings.siteName || ''}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Meta Description (SEO)</label>
            <textarea
              className="cms-textarea"
              rows={2}
              value={settings.metaDescription || ''}
              onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
            />
          </div>
          <div className="cms-form-group">
            <label className="cms-label">SEO Keywords (comma-separated)</label>
            <input
              type="text"
              className="cms-input"
              value={Array.isArray(settings.keywords) ? settings.keywords.join(', ') : settings.keywords || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
          </div>
        </div>

        {/* Navigation Bar & Header CTAs */}
        <div className="cms-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className="cms-card-title">Header Navigation & Branding</h3>
            <button type="button" onClick={handleAddNavLink} className="cms-btn cms-btn-secondary cms-btn-sm">
              <Plus size={14} /> Add Nav Link
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '140px' }}>
              <label className="cms-label">Logo Initials</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.logoText || 'GS'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: { ...settings.nav, logoText: e.target.value },
                  })
                }
              />
            </div>
            <div className="cms-form-group" style={{ maxWidth: '80px' }}>
              <label className="cms-label">Logo Dot</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.logoDot || '.'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: { ...settings.nav, logoDot: e.target.value },
                  })
                }
              />
            </div>
          </div>

          <label className="cms-label" style={{ marginTop: '0.5rem' }}>Navigation Menu Links</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {(settings.nav?.links || []).map((link: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="cms-input"
                  style={{ width: '160px' }}
                  placeholder="Label (e.g. About)"
                  value={link.label || ''}
                  onChange={(e) => {
                    const links = [...settings.nav.links];
                    links[idx].label = e.target.value;
                    setSettings({ ...settings, nav: { ...settings.nav, links } });
                  }}
                />
                <input
                  type="text"
                  className="cms-input"
                  style={{ flex: 1 }}
                  placeholder="Target (#about or URL)"
                  value={link.href || ''}
                  onChange={(e) => {
                    const links = [...settings.nav.links];
                    links[idx].href = e.target.value;
                    setSettings({ ...settings, nav: { ...settings.nav, links } });
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveNavLink(idx)}
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Header Action Buttons */}
          <div className="cms-form-row" style={{ borderTop: '1px solid var(--cms-border)', paddingTop: '1rem' }}>
            <div className="cms-form-group">
              <label className="cms-label">"Hire Me" CTA Button Label</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.hireMeCta?.label || 'Hire Me ↗'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: {
                      ...settings.nav,
                      hireMeCta: { ...settings.nav?.hireMeCta, label: e.target.value },
                    },
                  })
                }
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">"Hire Me" Destination (mailto or URL)</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.hireMeCta?.href || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: {
                      ...settings.nav,
                      hireMeCta: { ...settings.nav?.hireMeCta, href: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">Mech Portfolio Switch Label</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.mechToggle?.label || 'Mech Portfolio'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: {
                      ...settings.nav,
                      mechToggle: { ...settings.nav?.mechToggle, label: e.target.value },
                    },
                  })
                }
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Mech Portfolio Destination URL</label>
              <input
                type="text"
                className="cms-input"
                value={settings.nav?.mechToggle?.href || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    nav: {
                      ...settings.nav,
                      mechToggle: { ...settings.nav?.mechToggle, href: e.target.value },
                    },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Footer Configuration */}
        <div className="cms-card">
          <h3 className="cms-card-title">Footer Attribution & Copyright Text</h3>
          <div className="cms-form-row" style={{ marginTop: '1rem' }}>
            <div className="cms-form-group">
              <label className="cms-label">Left Prefix Text</label>
              <input
                type="text"
                className="cms-input"
                value={settings.footer?.leftText || 'Designed & built by'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footer: { ...settings.footer, leftText: e.target.value },
                  })
                }
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Author Highlight Name</label>
              <input
                type="text"
                className="cms-input"
                value={settings.footer?.leftHighlight || 'Guna Sai Venkata Reddy Kovvuri'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footer: { ...settings.footer, leftHighlight: e.target.value },
                  })
                }
              />
            </div>
          </div>
          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '140px' }}>
              <label className="cms-label">Year</label>
              <input
                type="text"
                className="cms-input"
                value={settings.footer?.year || '2026'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footer: { ...settings.footer, year: e.target.value },
                  })
                }
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Right Text</label>
              <input
                type="text"
                className="cms-input"
                value={settings.footer?.rightText || 'NIT Delhi · Full-Stack Developer'}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    footer: { ...settings.footer, rightText: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Social Links Card */}
        <div className="cms-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 className="cms-card-title">Social Profiles & Links</h3>
            <button type="button" onClick={handleAddSocial} className="cms-btn cms-btn-secondary cms-btn-sm">
              <Plus size={14} /> Add Social Link
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {(settings.socialLinks || []).map((link: any, idx: number) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  backgroundColor: 'var(--cms-surface)',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--cms-radius-md)',
                  border: '1px solid var(--cms-border)',
                }}
              >
                <input
                  type="text"
                  className="cms-input"
                  style={{ width: '160px' }}
                  placeholder="Platform"
                  value={link.platform}
                  onChange={(e) => {
                    const links = [...settings.socialLinks];
                    links[idx].platform = e.target.value;
                    setSettings({ ...settings, socialLinks: links });
                  }}
                />
                <input
                  type="url"
                  className="cms-input"
                  style={{ flex: 1 }}
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => {
                    const links = [...settings.socialLinks];
                    links[idx].url = e.target.value;
                    setSettings({ ...settings, socialLinks: links });
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSocial(idx)}
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
