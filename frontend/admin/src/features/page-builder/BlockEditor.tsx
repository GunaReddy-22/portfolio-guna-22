import React, { useState } from 'react';
import { Trash2, Plus, ArrowUp, ArrowDown, UploadCloud, Image, X, Loader2, ExternalLink, Play, Download, Github } from 'lucide-react';
import { api } from '../../lib/api';

interface BlockEditorProps {
  section: any;
  onChange: (updatedSection: any) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ section, onChange }) => {
  const content = section.content || {};
  const [uploadingProjIdx, setUploadingProjIdx] = useState<number | null>(null);

  const handleUploadAppIcon = async (idx: number, file: File, currentProjects: any[]) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit.');
      return;
    }
    try {
      setUploadingProjIdx(idx);
      const alt = `${currentProjects[idx]?.name || 'project'}-icon`;
      const res = await api.uploadMedia(file, alt);
      const uploadedUrl = res?.data?.url || res?.url;
      if (!uploadedUrl) throw new Error('Cloudinary upload completed but no URL was returned.');

      const next = [...currentProjects];
      next[idx] = {
        ...next[idx],
        appIcon: uploadedUrl,
        iconUrl: uploadedUrl,
      };
      updateContent('projects', next);
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      alert(`Failed to upload to Cloudinary: ${err.message || 'Storage error'}`);
    } finally {
      setUploadingProjIdx(null);
    }
  };

  const updateContent = (field: string, value: any) => {
    onChange({
      ...section,
      content: {
        ...content,
        [field]: value,
      },
    });
  };

  const updateNestedContent = (parent: string, field: string, value: any) => {
    onChange({
      ...section,
      content: {
        ...content,
        [parent]: {
          ...(content[parent] || {}),
          [field]: value,
        },
      },
    });
  };

  switch (section.type) {
    case 'hero': {
      const stats = content.stats || [
        { number: '100', suffix: '+', label: 'DSA Problems' },
        { number: '5', suffix: '', label: 'Shipped Projects' },
        { number: '8.04', suffix: '', label: 'CGPA' },
      ];
      const ctaButtons = content.ctaButtons || [
        { label: 'View Projects →', url: '#projects', style: 'primary' },
        { label: 'View Resume', url: '#resume', style: 'secondary' },
      ];
      const floatingTags = Array.isArray(content.floatingTags)
        ? content.floatingTags.join(', ')
        : content.floatingTags || '';
      const marqueeItems = Array.isArray(content.marqueeItems)
        ? content.marqueeItems.join(', ')
        : content.marqueeItems || '';

      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>Hero Section Content</h4>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">Status Pill Text</label>
              <input
                type="text"
                className="cms-input"
                placeholder="Full Stack Developer Intern @ ZenithIndia"
                value={content.pillText || ''}
                onChange={(e) => updateContent('pillText', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Eyebrow Subheading</label>
              <input
                type="text"
                className="cms-input"
                placeholder="Full-Stack Developer · AI Builder"
                value={content.eyebrowText || ''}
                onChange={(e) => updateContent('eyebrowText', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">First Name (Sans-Serif Bold)</label>
              <input
                type="text"
                className="cms-input"
                placeholder="GUNA"
                value={content.headlineNameFirst || content.headline || ''}
                onChange={(e) => updateContent('headlineNameFirst', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Middle Name (Serif Italic)</label>
              <input
                type="text"
                className="cms-input"
                placeholder="Sai Venkata Reddy"
                value={content.headlineNameMiddle || ''}
                onChange={(e) => updateContent('headlineNameMiddle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Last Name (Sans-Serif Bold)</label>
              <input
                type="text"
                className="cms-input"
                placeholder="KOVVURI"
                value={content.headlineNameLast || ''}
                onChange={(e) => updateContent('headlineNameLast', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Hero Bio / Description</label>
            <textarea
              className="cms-textarea"
              rows={3}
              placeholder="B.Tech student at NIT Delhi crafting production-grade..."
              value={content.description || content.introduction || ''}
              onChange={(e) => updateContent('description', e.target.value)}
            />
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">Hero Portrait Image URL</label>
              <input
                type="text"
                className="cms-input"
                placeholder="/assets/hero-portrait.jpg"
                value={content.photoUrl || content.portraitUrl || ''}
                onChange={(e) => updateContent('photoUrl', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Portrait Alt Text</label>
              <input
                type="text"
                className="cms-input"
                placeholder="Guna Sai Venkata Reddy Kovvuri"
                value={content.photoAlt || ''}
                onChange={(e) => updateContent('photoAlt', e.target.value)}
              />
            </div>
          </div>

          {/* Availability Badge */}
          <div className="cms-card" style={{ padding: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Availability Badge</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={content.badge?.enabled !== false}
                  onChange={(e) => updateNestedContent('badge', 'enabled', e.target.checked)}
                />
                Show Badge
              </label>
            </div>
            <div className="cms-form-row">
              <div className="cms-form-group" style={{ marginBottom: 0 }}>
                <label className="cms-label">Tag Text</label>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Open to work"
                  value={content.badge?.tag || 'Open to work'}
                  onChange={(e) => updateNestedContent('badge', 'tag', e.target.value)}
                />
              </div>
              <div className="cms-form-group" style={{ marginBottom: 0 }}>
                <label className="cms-label">Role Target</label>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Full-Stack & AI Roles"
                  value={content.badge?.role || 'Full-Stack & AI Roles'}
                  onChange={(e) => updateNestedContent('badge', 'role', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Call-To-Action Buttons ({ctaButtons.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...ctaButtons, { label: 'New Action', url: '#', style: 'primary' }];
                updateContent('ctaButtons', next);
              }}
            >
              <Plus size={14} /> Add Button
            </button>
          </div>
          {ctaButtons.map((btn: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="cms-input"
                placeholder="Button Label"
                style={{ flex: 1 }}
                value={btn.label || ''}
                onChange={(e) => {
                  const next = [...ctaButtons];
                  next[idx].label = e.target.value;
                  updateContent('ctaButtons', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="#section or URL"
                style={{ flex: 1 }}
                value={btn.url || ''}
                onChange={(e) => {
                  const next = [...ctaButtons];
                  next[idx].url = e.target.value;
                  updateContent('ctaButtons', next);
                }}
              />
              <select
                className="cms-input"
                style={{ width: '110px' }}
                value={btn.style || 'primary'}
                onChange={(e) => {
                  const next = [...ctaButtons];
                  next[idx].style = e.target.value;
                  updateContent('ctaButtons', next);
                }}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
              <button
                type="button"
                className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                onClick={() => {
                  const next = ctaButtons.filter((_: any, i: number) => i !== idx);
                  updateContent('ctaButtons', next);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Stats Counter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Highlight Counters ({stats.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...stats, { number: '0', suffix: '+', label: 'Metric' }];
                updateContent('stats', next);
              }}
            >
              <Plus size={14} /> Add Stat
            </button>
          </div>
          {stats.map((st: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="cms-input"
                placeholder="Number (e.g. 100)"
                style={{ width: '90px' }}
                value={st.number || ''}
                onChange={(e) => {
                  const next = [...stats];
                  next[idx].number = e.target.value;
                  updateContent('stats', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="+"
                style={{ width: '50px' }}
                value={st.suffix || ''}
                onChange={(e) => {
                  const next = [...stats];
                  next[idx].suffix = e.target.value;
                  updateContent('stats', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="Label (e.g. DSA Problems)"
                style={{ flex: 1 }}
                value={st.label || ''}
                onChange={(e) => {
                  const next = [...stats];
                  next[idx].label = e.target.value;
                  updateContent('stats', next);
                }}
              />
              <button
                type="button"
                className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                onClick={() => {
                  const next = stats.filter((_: any, i: number) => i !== idx);
                  updateContent('stats', next);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          <div className="cms-form-group" style={{ marginTop: '1rem' }}>
            <label className="cms-label">Floating Tech Badges (comma-separated)</label>
            <input
              type="text"
              className="cms-input"
              placeholder="Node.js, PostgreSQL, React.js, React Native, RAG / LLM"
              value={floatingTags}
              onChange={(e) =>
                updateContent(
                  'floatingTags',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
            />
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Marquee Ticker Phrases (comma-separated)</label>
            <input
              type="text"
              className="cms-input"
              placeholder="FULL-STACK DEVELOPMENT, AI & LLM AGENTS, REACT NATIVE..."
              value={marqueeItems}
              onChange={(e) =>
                updateContent(
                  'marqueeItems',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                )
              }
            />
          </div>
        </div>
      );
    }

    case 'about': {
      const quickFacts = content.quickFacts || [
        { key: 'Location', value: 'New Delhi / Andhra Pradesh, India' },
        { key: 'Education', value: 'NIT Delhi — B.Tech (CGPA 8.04)' },
        { key: 'Interests', value: 'Full-Stack, AI/LLMs, Mechanical CAD' },
      ];
      const skillGroups = content.skillGroups || [];
      const paragraphs = Array.isArray(content.bodyParagraphs)
        ? content.bodyParagraphs.join('\n\n')
        : Array.isArray(content.paragraphs)
        ? content.paragraphs.join('\n\n')
        : content.bodyParagraphs || content.paragraphs || '';

      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>About Section Content</h4>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '01'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'About'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Main Headline</label>
            <input
              type="text"
              className="cms-input"
              placeholder="Engineered by curiosity."
              value={content.headline || content.heading || ''}
              onChange={(e) => updateContent('headline', e.target.value)}
            />
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Introductory Quotation / Lead</label>
            <textarea
              className="cms-textarea"
              rows={2}
              placeholder="I build things that work — fast, secure, and at scale."
              value={content.introText || content.lead || ''}
              onChange={(e) => updateContent('introText', e.target.value)}
            />
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Body Text (Separate paragraphs with double newlines)</label>
            <textarea
              className="cms-textarea"
              style={{ minHeight: '130px' }}
              value={paragraphs}
              onChange={(e) => {
                const arr = e.target.value.split('\n\n').filter((p) => p.trim().length > 0);
                updateContent('bodyParagraphs', arr);
              }}
            />
          </div>

          {/* Quick Facts */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Quick Facts ({quickFacts.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...quickFacts, { key: 'Key', value: 'Value', link: '' }];
                updateContent('quickFacts', next);
              }}
            >
              <Plus size={14} /> Add Fact
            </button>
          </div>
          {quickFacts.map((fact: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="cms-input"
                placeholder="Key"
                style={{ width: '130px' }}
                value={fact.key || ''}
                onChange={(e) => {
                  const next = [...quickFacts];
                  next[idx].key = e.target.value;
                  updateContent('quickFacts', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="Value text"
                style={{ flex: 1 }}
                value={fact.value || ''}
                onChange={(e) => {
                  const next = [...quickFacts];
                  next[idx].value = e.target.value;
                  updateContent('quickFacts', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="Optional link URL"
                style={{ flex: 1 }}
                value={fact.link || ''}
                onChange={(e) => {
                  const next = [...quickFacts];
                  next[idx].link = e.target.value;
                  updateContent('quickFacts', next);
                }}
              />
              <button
                type="button"
                className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                onClick={() => {
                  const next = quickFacts.filter((_: any, i: number) => i !== idx);
                  updateContent('quickFacts', next);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Embedded Skill Categories */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1.5rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Skill Categories in About Block ({skillGroups.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...skillGroups, { label: 'New Category', tags: ['Skill A', 'Skill B'] }];
                updateContent('skillGroups', next);
              }}
            >
              <Plus size={14} /> Add Category
            </button>
          </div>
          {skillGroups.map((grp: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="cms-input"
                  style={{ fontWeight: 600 }}
                  placeholder="Category Name (e.g. Languages)"
                  value={grp.label || grp.category || grp.name || ''}
                  onChange={(e) => {
                    const next = [...skillGroups];
                    next[idx].label = e.target.value;
                    updateContent('skillGroups', next);
                  }}
                />
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = skillGroups.filter((_: any, i: number) => i !== idx);
                    updateContent('skillGroups', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                type="text"
                className="cms-input"
                placeholder="Comma-separated skills (e.g. Python, C++, TypeScript)"
                value={Array.isArray(grp.tags) ? grp.tags.join(', ') : grp.tags || ''}
                onChange={(e) => {
                  const next = [...skillGroups];
                  next[idx].tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  updateContent('skillGroups', next);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    case 'skills': {
      const groups = content.groups || content.skillGroups || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Technical Skills ({groups.length} Categories)</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...groups, { label: 'New Category', tags: ['Skill 1', 'Skill 2'] }];
                updateContent('groups', next);
              }}
            >
              <Plus size={14} /> Add Category
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '01B'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Technical Skills'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Subtitle / Description</label>
            <input
              type="text"
              className="cms-input"
              value={content.subtitle || content.headline || ''}
              onChange={(e) => updateContent('subtitle', e.target.value)}
            />
          </div>

          {groups.map((group: any, idx: number) => {
            const rawTags = group.tags || group.items || group.skills || [];
            const tagStr = Array.isArray(rawTags)
              ? rawTags.map((t: any) => (typeof t === 'string' ? t : t.name || '')).join(', ')
              : rawTags;

            return (
              <div key={idx} className="cms-card" style={{ padding: '0.85rem', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="cms-input"
                    style={{ fontWeight: 600 }}
                    placeholder="Category Name"
                    value={group.label || group.name || group.category || ''}
                    onChange={(e) => {
                      const next = [...groups];
                      next[idx].label = e.target.value;
                      next[idx].name = e.target.value;
                      updateContent('groups', next);
                    }}
                  />
                  <button
                    type="button"
                    className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                    onClick={() => {
                      const next = groups.filter((_: any, i: number) => i !== idx);
                      updateContent('groups', next);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Comma-separated skill items"
                  value={tagStr}
                  onChange={(e) => {
                    const next = [...groups];
                    next[idx].tags = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    updateContent('groups', next);
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    case 'experience': {
      const entries = content.entries || content.jobs || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Experience Timeline ({entries.length} Roles)</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...entries,
                  {
                    id: `exp-${Date.now()}`,
                    role: 'Full Stack Engineer',
                    company: 'Company Name',
                    dateRange: 'Jan 2026 → Present',
                    summary: 'Key responsibilities and engineering accomplishments.',
                    points: ['Shipped production features with React & Node.js'],
                  },
                ];
                updateContent('entries', next);
              }}
            >
              <Plus size={14} /> Add Role
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '02'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Experience'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || 'On the job.'}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          {entries.map((job: any, idx: number) => {
            const pointsStr = Array.isArray(job.points)
              ? job.points.join('\n')
              : Array.isArray(job.achievements)
              ? job.achievements.join('\n')
              : job.points || '';

            return (
              <div key={idx} className="cms-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cms-amber)' }}>
                    #{idx + 1} {job.role || 'Untitled Role'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="cms-btn cms-btn-secondary cms-btn-sm cms-btn-icon"
                        title="Move Up"
                        onClick={() => {
                          const next = [...entries];
                          const temp = next[idx - 1];
                          next[idx - 1] = next[idx];
                          next[idx] = temp;
                          updateContent('entries', next);
                        }}
                      >
                        <ArrowUp size={13} />
                      </button>
                    )}
                    {idx < entries.length - 1 && (
                      <button
                        type="button"
                        className="cms-btn cms-btn-secondary cms-btn-sm cms-btn-icon"
                        title="Move Down"
                        onClick={() => {
                          const next = [...entries];
                          const temp = next[idx + 1];
                          next[idx + 1] = next[idx];
                          next[idx] = temp;
                          updateContent('entries', next);
                        }}
                      >
                        <ArrowDown size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                      title="Delete Entry"
                      onClick={() => {
                        const next = entries.filter((_: any, i: number) => i !== idx);
                        updateContent('entries', next);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Job Title / Role</label>
                    <input
                      type="text"
                      className="cms-input"
                      value={job.role || ''}
                      onChange={(e) => {
                        const next = [...entries];
                        next[idx].role = e.target.value;
                        updateContent('entries', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Company / Organization</label>
                    <input
                      type="text"
                      className="cms-input"
                      value={job.company || ''}
                      onChange={(e) => {
                        const next = [...entries];
                        next[idx].company = e.target.value;
                        updateContent('entries', next);
                      }}
                    />
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Date Range / Duration</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="Jul 2026 → Sep 2026"
                      value={job.dateRange || job.period || ''}
                      onChange={(e) => {
                        const next = [...entries];
                        next[idx].dateRange = e.target.value;
                        updateContent('entries', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Location (Optional)</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="New Delhi, India"
                      value={job.location || ''}
                      onChange={(e) => {
                        const next = [...entries];
                        next[idx].location = e.target.value;
                        updateContent('entries', next);
                      }}
                    />
                  </div>
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Overview Summary</label>
                  <textarea
                    className="cms-textarea"
                    rows={2}
                    value={job.summary || job.description || ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].summary = e.target.value;
                      updateContent('entries', next);
                    }}
                  />
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Bullet Achievements (One item per line)</label>
                  <textarea
                    className="cms-textarea"
                    rows={4}
                    value={pointsStr}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].points = e.target.value.split('\n').filter((p) => p.trim().length > 0);
                      updateContent('entries', next);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'projects': {
      const projects = content.projects || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Shipped Projects ({projects.length})</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...projects,
                  {
                    id: `proj-${Date.now()}`,
                    num: `0${projects.length + 1}`,
                    tag: 'Web App',
                    name: 'New Shipped Project',
                    description: 'Description of problem solved and technology stack.',
                    techPills: ['React', 'Node.js'],
                    points: ['Engineered responsive interface and high-performance backend.'],
                    liveUrl: '',
                    sourceUrl: '',
                    playStoreUrl: '',
                    downloadUrl: '',
                    downloadNote: '',
                    featured: true,
                  },
                ];
                updateContent('projects', next);
              }}
            >
              <Plus size={14} /> Add Project
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '03'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Projects'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || "Stuff I've shipped."}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          {projects.map((proj: any, idx: number) => {
            const pillsStr = Array.isArray(proj.techPills)
              ? proj.techPills.join(', ')
              : Array.isArray(proj.tags)
              ? proj.tags.join(', ')
              : proj.techPills || '';
            const pointsStr = Array.isArray(proj.points) ? proj.points.join('\n') : proj.points || '';

            return (
              <div key={idx} className="cms-card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cms-amber)' }}>
                    #{proj.num || idx + 1} {proj.name || proj.title || 'Untitled'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="cms-btn cms-btn-secondary cms-btn-sm cms-btn-icon"
                        title="Move Up"
                        onClick={() => {
                          const next = [...projects];
                          const temp = next[idx - 1];
                          next[idx - 1] = next[idx];
                          next[idx] = temp;
                          updateContent('projects', next);
                        }}
                      >
                        <ArrowUp size={13} />
                      </button>
                    )}
                    {idx < projects.length - 1 && (
                      <button
                        type="button"
                        className="cms-btn cms-btn-secondary cms-btn-sm cms-btn-icon"
                        title="Move Down"
                        onClick={() => {
                          const next = [...projects];
                          const temp = next[idx + 1];
                          next[idx + 1] = next[idx];
                          next[idx] = temp;
                          updateContent('projects', next);
                        }}
                      >
                        <ArrowDown size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                      onClick={() => {
                        const next = projects.filter((_: any, i: number) => i !== idx);
                        updateContent('projects', next);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group" style={{ maxWidth: '100px' }}>
                    <label className="cms-label">Number</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="01"
                      value={proj.num || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].num = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Project Name</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="StudyVault"
                      value={proj.name || proj.title || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].name = e.target.value;
                        next[idx].title = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Category Tag</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="RAG / Full Stack"
                      value={proj.tag || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].tag = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                </div>

                {/* App Icon Upload & Preview (Cloudinary) */}
                <div className="cms-form-group" style={{ background: 'rgba(255, 200, 74, 0.03)', border: '1px dashed rgba(255, 200, 74, 0.25)', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <label className="cms-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cms-amber)' }}>
                      <Image size={14} /> App Icon (Optional · Displays on Right Side)
                    </label>
                    <span style={{ fontSize: '11px', color: 'var(--cms-text-muted)' }}>
                      Durable Cloudinary Storage
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    {(proj.appIcon || proj.iconUrl) ? (
                      <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,200,74,0.4)', background: '#0a0d18', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        <img
                          src={proj.appIcon || proj.iconUrl}
                          alt="App icon preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cms-text-muted)', flexShrink: 0 }}>
                        <Image size={20} />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '220px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <label className={`cms-btn cms-btn-sm ${uploadingProjIdx === idx ? 'cms-btn-secondary' : 'cms-btn-primary'}`} style={{ cursor: uploadingProjIdx === idx ? 'not-allowed' : 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {uploadingProjIdx === idx ? (
                            <>
                              <Loader2 size={13} style={{ animation: 'cmsOrbitSpin 1s linear infinite' }} /> Uploading to Cloudinary...
                            </>
                          ) : (
                            <>
                              <UploadCloud size={13} /> {proj.appIcon || proj.iconUrl ? 'Replace Icon via Cloudinary' : 'Upload Icon via Cloudinary'}
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/webp, image/gif, image/x-icon"
                            style={{ display: 'none' }}
                            disabled={uploadingProjIdx === idx}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadAppIcon(idx, e.target.files[0], projects);
                                e.target.value = '';
                              }
                            }}
                          />
                        </label>

                        {(proj.appIcon || proj.iconUrl) && (
                          <button
                            type="button"
                            className="cms-btn cms-btn-secondary cms-btn-sm"
                            style={{ color: 'var(--cms-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => {
                              const next = [...projects];
                              next[idx].appIcon = '';
                              next[idx].iconUrl = '';
                              updateContent('projects', next);
                            }}
                          >
                            <X size={13} /> Remove Icon
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        className="cms-input"
                        style={{ fontSize: '12px', padding: '5px 8px' }}
                        placeholder="Or paste Cloudinary URL (https://res.cloudinary.com/...)"
                        value={proj.appIcon || proj.iconUrl || ''}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx].appIcon = e.target.value;
                          next[idx].iconUrl = e.target.value;
                          updateContent('projects', next);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Description</label>
                  <textarea
                    className="cms-textarea"
                    rows={2}
                    value={proj.description || ''}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx].description = e.target.value;
                      updateContent('projects', next);
                    }}
                  />
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Tech Pills (comma-separated)</label>
                  <input
                    type="text"
                    className="cms-input"
                    placeholder="React.js, Node.js, Pinecone, Groq LLM"
                    value={pillsStr}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx].techPills = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      updateContent('projects', next);
                    }}
                  />
                </div>

                <div className="cms-form-group">
                  <label className="cms-label">Key Points / Feature Bullets (One per line)</label>
                  <textarea
                    className="cms-textarea"
                    rows={3}
                    value={pointsStr}
                    onChange={(e) => {
                      const next = [...projects];
                      next[idx].points = e.target.value.split('\n').filter((p) => p.trim().length > 0);
                      updateContent('projects', next);
                    }}
                  />
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ExternalLink size={13} style={{ color: '#ffc84a' }} />
                      Live Web App URL
                      <span style={{ fontSize: '11px', color: '#ffc84a', fontWeight: 'normal', opacity: 0.85 }}>
                        (Web Link Icon)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="https://..."
                      value={proj.liveUrl || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].liveUrl = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Github size={13} style={{ color: '#a78bfa' }} />
                      Source Code / GitHub URL
                    </label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="https://github.com/..."
                      value={proj.sourceUrl || proj.githubUrl || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].sourceUrl = e.target.value;
                        next[idx].githubUrl = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Play size={13} style={{ color: '#00d4b4', fill: '#00d4b4' }} />
                      Google Play Store URL
                      <span style={{ fontSize: '11px', color: '#00d4b4', fontWeight: 'normal', opacity: 0.85 }}>
                        (Play Store Icon)
                      </span>
                    </label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      value={proj.playStoreUrl || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].playStoreUrl = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Download size={13} style={{ color: '#38bdf8' }} />
                      Direct Download URL (Optional)
                    </label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="/downloads/... or https://..."
                      value={proj.downloadUrl || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].downloadUrl = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">Download / App Store Note</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="e.g. Google Play Link or APK available on request"
                      value={proj.downloadNote || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].downloadNote = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                </div>

                <div className="cms-form-row">
                  <div className="cms-form-group">
                    <label className="cms-label">AI Badge Label (Optional)</label>
                    <input
                      type="text"
                      className="cms-input"
                      placeholder="RAG Pipeline"
                      value={proj.aiBadge || ''}
                      onChange={(e) => {
                        const next = [...projects];
                        next[idx].aiBadge = e.target.value;
                        updateContent('projects', next);
                      }}
                    />
                  </div>
                  <div className="cms-form-group">
                    <label className="cms-label">Platform Badge Label &amp; Style</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '8px' }}>
                      <input
                        type="text"
                        className="cms-input"
                        placeholder="e.g. Full-Stack EdTech / Android"
                        value={proj.platformBadge?.text || ''}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx].platformBadge = {
                            ...(next[idx].platformBadge || { type: 'web' }),
                            text: e.target.value,
                          };
                          updateContent('projects', next);
                        }}
                      />
                      <select
                        className="cms-input"
                        value={proj.platformBadge?.type || 'web'}
                        onChange={(e) => {
                          const next = [...projects];
                          next[idx].platformBadge = {
                            ...(next[idx].platformBadge || { text: '' }),
                            type: e.target.value,
                          };
                          updateContent('projects', next);
                        }}
                      >
                        <option value="web">Web (Amber)</option>
                        <option value="android">Mobile (Teal)</option>
                        <option value="desktop">Desktop (Rose)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'education': {
      const entries = content.entries || content.items || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Education Records ({entries.length})</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...entries,
                  {
                    id: `edu-${Date.now()}`,
                    degree: 'Degree Title',
                    school: 'Institution / School',
                    year: '2024 → 2028',
                    score: 'Score: 90%',
                  },
                ];
                updateContent('entries', next);
              }}
            >
              <Plus size={14} /> Add Education
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '04'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Education'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || 'Academic journey.'}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          {entries.map((item: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cms-amber)' }}>
                  #{idx + 1} {item.degree || 'Degree'}
                </span>
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = entries.filter((_: any, i: number) => i !== idx);
                    updateContent('entries', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="cms-form-row">
                <div className="cms-form-group">
                  <label className="cms-label">Degree / Qualification</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={item.degree || ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].degree = e.target.value;
                      updateContent('entries', next);
                    }}
                  />
                </div>
                <div className="cms-form-group">
                  <label className="cms-label">Institution / School</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={item.school || item.institution || ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].school = e.target.value;
                      next[idx].institution = e.target.value;
                      updateContent('entries', next);
                    }}
                  />
                </div>
              </div>

              <div className="cms-form-row">
                <div className="cms-form-group">
                  <label className="cms-label">Year / Duration</label>
                  <input
                    type="text"
                    className="cms-input"
                    placeholder="Aug 2024 → May 2028"
                    value={item.year || item.period || ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].year = e.target.value;
                      next[idx].period = e.target.value;
                      updateContent('entries', next);
                    }}
                  />
                </div>
                <div className="cms-form-group">
                  <label className="cms-label">Score / CGPA / Grade</label>
                  <input
                    type="text"
                    className="cms-input"
                    placeholder="CGPA: 8.04 / 10.0"
                    value={item.score || ''}
                    onChange={(e) => {
                      const next = [...entries];
                      next[idx].score = e.target.value;
                      updateContent('entries', next);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'highlights': {
      const highlights = content.highlights || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Highlights & Achievements ({highlights.length})</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...highlights,
                  {
                    id: `hl-${Date.now()}`,
                    icon: '⚡',
                    title: 'New Achievement',
                    description: 'Description of notable achievement.',
                  },
                ];
                updateContent('highlights', next);
              }}
            >
              <Plus size={14} /> Add Highlight
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '05'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Highlights'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || 'Beyond the code.'}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          {highlights.map((h: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cms-amber)' }}>
                  #{idx + 1} {h.icon} {h.title || 'Untitled'}
                </span>
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = highlights.filter((_: any, i: number) => i !== idx);
                    updateContent('highlights', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="cms-form-row">
                <div className="cms-form-group" style={{ maxWidth: '100px' }}>
                  <label className="cms-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={h.icon || '⚡'}
                    onChange={(e) => {
                      const next = [...highlights];
                      next[idx].icon = e.target.value;
                      updateContent('highlights', next);
                    }}
                  />
                </div>
                <div className="cms-form-group">
                  <label className="cms-label">Highlight Title</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={h.title || ''}
                    onChange={(e) => {
                      const next = [...highlights];
                      next[idx].title = e.target.value;
                      updateContent('highlights', next);
                    }}
                  />
                </div>
              </div>

              <div className="cms-form-group">
                <label className="cms-label">Description</label>
                <textarea
                  className="cms-textarea"
                  rows={2}
                  value={h.description || ''}
                  onChange={(e) => {
                    const next = [...highlights];
                    next[idx].description = e.target.value;
                    updateContent('highlights', next);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'resume': {
      const highlights = content.highlights || [
        { icon: '💼', label: 'Currently:', details: 'Full Stack Developer Intern @ ZenithIndia' },
        { icon: '🎓', label: 'Education:', details: 'B.Tech Mechanical Engineering, NIT Delhi' },
        { icon: '🚀', label: 'Projects:', details: '5 production projects shipped' },
      ];

      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>Resume Section Content</h4>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '06'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Resume'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || 'See it on paper.'}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">Window Frame Label</label>
              <input
                type="text"
                className="cms-input"
                placeholder="Resume_KGuna.pdf"
                value={content.frameLabel || ''}
                onChange={(e) => updateContent('frameLabel', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Preview Image URL</label>
              <input
                type="text"
                className="cms-input"
                placeholder="/assets/resume-preview.png"
                value={content.previewImageUrl || ''}
                onChange={(e) => updateContent('previewImageUrl', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group">
              <label className="cms-label">Open Full Size Button Label</label>
              <input
                type="text"
                className="cms-input"
                placeholder="VIEW IN FULL WINDOW"
                value={content.openFullSizeLabel || ''}
                onChange={(e) => updateContent('openFullSizeLabel', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Side Card Title</label>
            <input
              type="text"
              className="cms-input"
              placeholder="One-page snapshot of everything above."
              value={content.sideTitle || ''}
              onChange={(e) => updateContent('sideTitle', e.target.value)}
            />
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Side Card Description</label>
            <textarea
              className="cms-textarea"
              rows={2}
              value={content.sideBody || ''}
              onChange={(e) => updateContent('sideBody', e.target.value)}
            />
          </div>

          {/* Highlights in Resume */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Resume Snapshot Points ({highlights.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [...highlights, { icon: '✨', label: 'Feature:', details: 'Details description' }];
                updateContent('highlights', next);
              }}
            >
              <Plus size={14} /> Add Point
            </button>
          </div>
          {highlights.map((rh: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="cms-input"
                placeholder="Icon"
                style={{ width: '50px' }}
                value={rh.icon || ''}
                onChange={(e) => {
                  const next = [...highlights];
                  next[idx].icon = e.target.value;
                  updateContent('highlights', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="Label (e.g. Currently:)"
                style={{ width: '130px' }}
                value={rh.label || ''}
                onChange={(e) => {
                  const next = [...highlights];
                  next[idx].label = e.target.value;
                  updateContent('highlights', next);
                }}
              />
              <input
                type="text"
                className="cms-input"
                placeholder="Details"
                style={{ flex: 1 }}
                value={rh.details || ''}
                onChange={(e) => {
                  const next = [...highlights];
                  next[idx].details = e.target.value;
                  updateContent('highlights', next);
                }}
              />
              <button
                type="button"
                className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                onClick={() => {
                  const next = highlights.filter((_: any, i: number) => i !== idx);
                  updateContent('highlights', next);
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    case 'contact': {
      const contactLinks = content.contactLinks || [
        { id: 'c1', type: 'email', label: 'Email', value: '241310022@nitdelhi.ac.in', href: 'mailto:241310022@nitdelhi.ac.in', icon: '✉' },
        { id: 'c2', type: 'phone', label: 'Phone', value: '+91 9381888078', href: 'tel:+919381888078', icon: '📱' },
      ];
      const infoCards = content.infoCards || [
        { id: 'i1', title: 'Status & Availability', body: 'Available for internships.' },
      ];

      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>Contact Section Content</h4>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '07'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Contact'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group" style={{ maxWidth: '140px' }}>
              <label className="cms-label">BG Watermark</label>
              <input
                type="text"
                className="cms-input"
                placeholder="HELLO"
                value={content.bgWord || 'HELLO'}
                onChange={(e) => updateContent('bgWord', e.target.value)}
              />
            </div>
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Headline</label>
            <input
              type="text"
              className="cms-input"
              value={content.headline || content.title || "Let's build something."}
              onChange={(e) => updateContent('headline', e.target.value)}
            />
          </div>

          <div className="cms-form-group">
            <label className="cms-label">Introduction / Subtitle</label>
            <textarea
              className="cms-textarea"
              rows={2}
              value={content.subtext || content.subtitle || ''}
              onChange={(e) => updateContent('subtext', e.target.value)}
            />
          </div>

          {/* Contact Links */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Contact Channels ({contactLinks.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...contactLinks,
                  { id: `c-${Date.now()}`, type: 'custom', label: 'Channel', value: 'Value', href: 'https://', icon: '↗' },
                ];
                updateContent('contactLinks', next);
              }}
            >
              <Plus size={14} /> Add Channel
            </button>
          </div>
          {contactLinks.map((lnk: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '0.75rem', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Icon"
                  style={{ width: '50px' }}
                  value={lnk.icon || '✉'}
                  onChange={(e) => {
                    const next = [...contactLinks];
                    next[idx].icon = e.target.value;
                    updateContent('contactLinks', next);
                  }}
                />
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Label (e.g. Email)"
                  style={{ width: '130px' }}
                  value={lnk.label || ''}
                  onChange={(e) => {
                    const next = [...contactLinks];
                    next[idx].label = e.target.value;
                    updateContent('contactLinks', next);
                  }}
                />
                <input
                  type="text"
                  className="cms-input"
                  placeholder="Displayed text"
                  style={{ flex: 1 }}
                  value={lnk.value || ''}
                  onChange={(e) => {
                    const next = [...contactLinks];
                    next[idx].value = e.target.value;
                    updateContent('contactLinks', next);
                  }}
                />
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = contactLinks.filter((_: any, i: number) => i !== idx);
                    updateContent('contactLinks', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <input
                type="text"
                className="cms-input"
                placeholder="Destination URL (mailto:..., tel:..., https:...)"
                value={lnk.href || ''}
                onChange={(e) => {
                  const next = [...contactLinks];
                  next[idx].href = e.target.value;
                  updateContent('contactLinks', next);
                }}
              />
            </div>
          ))}

          {/* Info Cards */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 0.5rem 0' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Side Info Cards ({infoCards.length})</span>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...infoCards,
                  { id: `info-${Date.now()}`, title: 'Card Title', body: 'Card content description' },
                ];
                updateContent('infoCards', next);
              }}
            >
              <Plus size={14} /> Add Card
            </button>
          </div>
          {infoCards.map((card: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '0.75rem', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="cms-input"
                  style={{ fontWeight: 600 }}
                  placeholder="Card Title (e.g. Current Focus)"
                  value={card.title || ''}
                  onChange={(e) => {
                    const next = [...infoCards];
                    next[idx].title = e.target.value;
                    updateContent('infoCards', next);
                  }}
                />
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = infoCards.filter((_: any, i: number) => i !== idx);
                    updateContent('infoCards', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <textarea
                className="cms-textarea"
                rows={2}
                placeholder="Card description text"
                value={card.body || ''}
                onChange={(e) => {
                  const next = [...infoCards];
                  next[idx].body = e.target.value;
                  updateContent('infoCards', next);
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    case 'form':
      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>Form Block Reference</h4>
          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '08'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Inquiry Form'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Headline</label>
            <input
              type="text"
              className="cms-input"
              value={content.headline || 'Send an inquiry directly.'}
              onChange={(e) => updateContent('headline', e.target.value)}
            />
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Subtitle</label>
            <input
              type="text"
              className="cms-input"
              value={content.subtitle || ''}
              onChange={(e) => updateContent('subtitle', e.target.value)}
            />
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Form Slug</label>
            <input
              type="text"
              className="cms-input"
              value={content.formSlug || 'contact-me'}
              onChange={(e) => updateContent('formSlug', e.target.value)}
            />
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Submit Button Label</label>
            <input
              type="text"
              className="cms-input"
              value={content.submitLabel || 'Send Message →'}
              onChange={(e) => updateContent('submitLabel', e.target.value)}
            />
          </div>
        </div>
      );

    case 'richText':
      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-amber)' }}>Rich Text Block</h4>
          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || ''}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || ''}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
          </div>
          <div className="cms-form-group">
            <label className="cms-label">Headline</label>
            <input
              type="text"
              className="cms-input"
              value={content.headline || content.title || ''}
              onChange={(e) => updateContent('headline', e.target.value)}
            />
          </div>
          <div className="cms-form-group">
            <label className="cms-label">HTML or Markdown Body (Sanitized with DOMPurify)</label>
            <textarea
              className="cms-textarea"
              style={{ minHeight: '180px' }}
              value={content.html || content.body || ''}
              onChange={(e) => {
                updateContent('html', e.target.value);
                updateContent('body', e.target.value);
              }}
            />
          </div>
        </div>
      );

    case 'gallery': {
      const galleryItems = content.items || content.images || [];
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, color: 'var(--cms-amber)' }}>Gallery Images ({galleryItems.length})</h4>
            <button
              type="button"
              className="cms-btn cms-btn-secondary cms-btn-sm"
              onClick={() => {
                const next = [
                  ...galleryItems,
                  { id: `img-${Date.now()}`, imageUrl: '', caption: '', alt: '' },
                ];
                updateContent('items', next);
              }}
            >
              <Plus size={14} /> Add Image
            </button>
          </div>

          <div className="cms-form-row">
            <div className="cms-form-group" style={{ maxWidth: '120px' }}>
              <label className="cms-label">Section #</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionNum || '09'}
                onChange={(e) => updateContent('sectionNum', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Section Title</label>
              <input
                type="text"
                className="cms-input"
                value={content.sectionTitle || 'Gallery'}
                onChange={(e) => updateContent('sectionTitle', e.target.value)}
              />
            </div>
            <div className="cms-form-group">
              <label className="cms-label">Headline</label>
              <input
                type="text"
                className="cms-input"
                value={content.headline || 'Featured Visuals'}
                onChange={(e) => updateContent('headline', e.target.value)}
              />
            </div>
          </div>

          {galleryItems.map((img: any, idx: number) => (
            <div key={idx} className="cms-card" style={{ padding: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--cms-amber)' }}>
                  Image #{idx + 1}
                </span>
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                  onClick={() => {
                    const next = galleryItems.filter((_: any, i: number) => i !== idx);
                    updateContent('items', next);
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="cms-form-row">
                <div className="cms-form-group">
                  <label className="cms-label">Image URL</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={img.imageUrl || img.url || ''}
                    onChange={(e) => {
                      const next = [...galleryItems];
                      next[idx].imageUrl = e.target.value;
                      next[idx].url = e.target.value;
                      updateContent('items', next);
                    }}
                  />
                </div>
                <div className="cms-form-group">
                  <label className="cms-label">Alt Text</label>
                  <input
                    type="text"
                    className="cms-input"
                    value={img.alt || ''}
                    onChange={(e) => {
                      const next = [...galleryItems];
                      next[idx].alt = e.target.value;
                      updateContent('items', next);
                    }}
                  />
                </div>
              </div>
              <div className="cms-form-group">
                <label className="cms-label">Caption</label>
                <input
                  type="text"
                  className="cms-input"
                  value={img.caption || ''}
                  onChange={(e) => {
                    const next = [...galleryItems];
                    next[idx].caption = e.target.value;
                    updateContent('items', next);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    }

    default:
      return (
        <div>
          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--cms-text-muted)' }}>
            Custom / Generic Section ({section.type})
          </h4>
          <div className="cms-form-group">
            <label className="cms-label">Raw JSON Content</label>
            <textarea
              className="cms-textarea"
              style={{ minHeight: '200px', fontFamily: 'var(--cms-font-mono)', fontSize: '0.8rem' }}
              value={JSON.stringify(content, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  onChange({ ...section, content: parsed });
                } catch {
                  // typing invalid json
                }
              }}
            />
          </div>
        </div>
      );
  }
};
