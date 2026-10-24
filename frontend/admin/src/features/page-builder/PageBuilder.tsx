import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Plus,
  Save,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { BlockEditor } from './BlockEditor';
import { CmsLoadingState } from '../../components/CmsLoadingState';

// Sortable Section Item Component
const SortableSectionItem: React.FC<{
  section: any;
  index: number;
  total: number;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({
  section,
  index,
  total,
  isActive,
  onSelect,
  onToggleVisibility,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id || section._id || `sec-${index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cms-section-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cms-drag-handle" onClick={(e) => e.stopPropagation()}>
        <GripVertical size={16} />
      </div>

      <div className="cms-section-meta">
        <div className="cms-section-type">
          {section.type}
          {!section.visible && (
            <span style={{ fontSize: '0.7rem', color: 'var(--cms-text-muted)', marginLeft: '0.5rem' }}>
              (Hidden)
            </span>
          )}
        </div>
        <div className="cms-section-subtitle">
          {section.content?.headline ||
            section.content?.heading ||
            section.content?.title ||
            `Section #${index + 1}`}
        </div>
      </div>

      <div className="cms-section-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cms-btn cms-btn-icon cms-btn-ghost cms-btn-sm"
          onClick={onMoveUp}
          disabled={index === 0}
          title="Move Up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-icon cms-btn-ghost cms-btn-sm"
          onClick={onMoveDown}
          disabled={index === total - 1}
          title="Move Down"
        >
          <ChevronDown size={14} />
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-icon cms-btn-ghost cms-btn-sm"
          onClick={onToggleVisibility}
          title={section.visible ? 'Hide Section' : 'Show Section'}
        >
          {section.visible ? <Eye size={14} /> : <EyeOff size={14} color="var(--cms-danger)" />}
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-icon cms-btn-ghost cms-btn-sm"
          onClick={onDuplicate}
          title="Duplicate Section"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          className="cms-btn cms-btn-icon cms-btn-ghost cms-btn-sm"
          onClick={onDelete}
          title="Delete Section"
        >
          <Trash2 size={14} color="var(--cms-danger)" />
        </button>
      </div>
    </div>
  );
};

export const PageBuilder: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pageIdParam = searchParams.get('pageId');

  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadPageData = async () => {
    try {
      setLoading(true);
      const pages = await api.getPages();
      const targetSummary = pageIdParam
        ? pages.find((p: any) => p.id === pageIdParam || p._id === pageIdParam || p.slug === pageIdParam)
        : (pages.find((p: any) => p.slug === 'home') || pages[0]);

      if (targetSummary) {
        const pageId = targetSummary.id || targetSummary._id;
        const pageDoc = await api.getPage(pageId);
        setPage(pageDoc);
        const secs = (pageDoc.draftSections || pageDoc.sections || []).map((s: any, i: number) => ({
          ...s,
          id: s.id || s._id || `sec-${i}-${Date.now()}`,
          visible: s.visible !== undefined ? s.visible : true,
        }));
        setSections(secs);
        if (secs.length > 0) {
          setSelectedSectionId(secs[0].id);
        }
      }
      setIsDirty(false);
      setConflictError(null);
    } catch (err: any) {
      console.error('Failed to load page for builder:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [pageIdParam]);

  // Unsaved changes alert
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      const updated = arrayMove(sections, oldIndex, newIndex);
      setSections(updated);
      setIsDirty(true);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const updated = arrayMove(sections, index, targetIndex);
    setSections(updated);
    setIsDirty(true);
  };

  const handleToggleVisibility = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s));
    setSections(updated);
    setIsDirty(true);
  };

  const handleDuplicate = (id: string) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return;
    const clone = {
      ...JSON.parse(JSON.stringify(target)),
      id: `sec-${Date.now()}`,
    };
    const index = sections.findIndex((s) => s.id === id);
    const updated = [...sections];
    updated.splice(index + 1, 0, clone);
    setSections(updated);
    setSelectedSectionId(clone.id);
    setIsDirty(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section block?')) return;
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    if (selectedSectionId === id) {
      setSelectedSectionId(updated.length > 0 ? updated[0].id : null);
    }
    setIsDirty(true);
  };

  const handleAddSection = (type: string) => {
    const defaultContents: Record<string, any> = {
      hero: {
        pillText: 'Full Stack Developer',
        eyebrowText: 'Full-Stack Developer · AI Builder',
        headlineNameFirst: 'GUNA',
        headlineNameMiddle: 'Sai Venkata Reddy',
        headlineNameLast: 'KOVVURI',
        description: 'B.Tech student at NIT Delhi crafting production-grade full-stack, mobile, and AI-powered applications.',
        ctaButtons: [{ label: 'View Projects →', url: '#projects', style: 'primary' }],
        stats: [{ number: '5', label: 'Shipped Projects' }],
        floatingTags: ['Node.js', 'React.js'],
        marqueeItems: ['Full-Stack Developer', 'NIT Delhi'],
      },
      about: {
        sectionNum: '01',
        sectionTitle: 'About',
        headline: 'Engineered by curiosity.',
        introText: 'I build things that work — fast, secure, and at scale.',
        bodyParagraphs: ['Passionate full-stack developer.'],
        quickFacts: [{ key: 'Location', value: 'Delhi, India' }],
        skillGroups: [{ label: 'Frontend', tags: ['React', 'TypeScript'] }],
      },
      skills: {
        sectionNum: '01B',
        sectionTitle: 'Technical Skills',
        headline: 'Core technical toolkit.',
        skillGroups: [{ label: 'Core Skills', tags: ['TypeScript', 'React', 'Node.js'] }],
      },
      experience: {
        sectionNum: '02',
        sectionTitle: 'Experience',
        headline: 'On the job.',
        entries: [{
          id: `exp-${Date.now()}`,
          role: 'Full Stack Developer Intern',
          company: 'ZenithIndia',
          dateRange: 'Jul 2026 → Sep 2026',
          summary: 'Developed scalable full-stack applications.',
          points: ['Built production-ready features and APIs.'],
        }],
      },
      projects: {
        sectionNum: '03',
        sectionTitle: 'Projects',
        headline: "Stuff I've shipped.",
        projects: [{
          id: `proj-${Date.now()}`,
          num: '01',
          tag: 'Web Application',
          name: 'Innovative Web App',
          description: 'A production-grade full-stack web application.',
          techPills: ['React', 'TypeScript', 'Node.js'],
          points: ['Designed and deployed scalable full-stack architecture.'],
          liveUrl: 'https://gunasai.in',
          featured: true,
        }],
      },
      education: {
        sectionNum: '04',
        sectionTitle: 'Education',
        headline: 'Academic journey.',
        entries: [{
          id: `edu-${Date.now()}`,
          year: '2024 — 2028',
          degree: 'B.Tech — Mechanical Engineering',
          school: 'National Institute of Technology Delhi',
          score: 'CGPA: 8.04 / 10.0',
        }],
      },
      highlights: {
        sectionNum: '05',
        sectionTitle: 'Highlights',
        headline: 'Beyond the code.',
        highlights: [{
          id: `hl-${Date.now()}`,
          icon: '⚡',
          title: 'DSA Practitioner',
          description: 'Solved 100+ problems on LeetCode.',
        }],
      },
      resume: {
        sectionNum: '06',
        sectionTitle: 'Resume',
        headline: 'See it on paper.',
        frameLabel: 'RESUME_KGUNA.PDF',
        sideTitle: 'One-page snapshot of everything above.',
        sideBody: 'My current resume covering experience, shipped projects, and skills.',
        downloadPdfUrl: '/assets/resume.pdf',
        downloadButtonLabel: 'DOWNLOAD FULL RESUME',
        openFullSizeLabel: 'VIEW IN FULL WINDOW',
        highlights: [{ icon: 'briefcase', text: 'Full Stack Intern @ ZenithIndia' }],
      },
      contact: {
        sectionNum: '07',
        sectionTitle: 'Contact',
        headline: "Let's build something.",
        subtext: "I'm actively looking for full-stack and AI opportunities.",
        contactLinks: [{ label: 'Email', value: '241310022@nitdelhi.ac.in', href: 'mailto:241310022@nitdelhi.ac.in' }],
        infoCards: [{ tag: 'CURRENTLY', text: 'NIT Delhi student & AI builder.' }],
      },
      form: {
        sectionNum: '08',
        sectionTitle: 'Send a Message',
        headline: 'Get in touch.',
        subtitle: 'Fill out this form to send a message directly to my inbox.',
        formSlug: 'contact-me',
      },
      richText: { title: 'Custom Notes', body: 'Formatted information here.' },
      gallery: { images: [{ url: '/assets/hero-portrait.jpg', caption: 'Portrait' }] },
    };

    const newSec = {
      id: `sec-${Date.now()}`,
      type,
      schemaVersion: 1,
      visible: true,
      content: defaultContents[type] || {},
    };

    setSections([...sections, newSec]);
    setSelectedSectionId(newSec.id);
    setAddModalOpen(false);
    setIsDirty(true);
  };

  const formatSectionsPayload = (list: any[]) =>
    list.map((s, idx) => {
      const isVis = s.visible !== undefined ? Boolean(s.visible) : (s.isVisible !== undefined ? Boolean(s.isVisible) : true);
      return {
        ...s,
        order: idx,
        visible: isVis,
        isVisible: isVis,
      };
    });

  const handleSaveDraft = async () => {
    const pageId = page?._id || page?.id || pageIdParam;
    if (!pageId) return;
    try {
      setSaving(true);
      setConflictError(null);
      const res = await api.updateDraft(pageId, {
        expectedRevision: page?.draftRevision,
        sections: formatSectionsPayload(sections),
      });
      setPage((prev: any) => ({ ...prev, ...(res?.data || res) }));
      setIsDirty(false);
      setSuccessMsg('Draft saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      if (err.status === 409) {
        setConflictError(
          'Conflict detected: The page draft was updated by another session or revision. Please reload to review the latest changes.'
        );
      } else {
        alert(`Save draft failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    const pageId = page?._id || page?.id || pageIdParam;
    if (!pageId) return;
    try {
      if (isDirty) {
        await handleSaveDraft();
      }
      const res = await api.getPreviewToken(pageId);
      const targetUrl = res.fullPreviewUrl || res.previewUrl || `https://gunasai.in/?preview=true&token=${res.token}`;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(`Preview failed: ${err.message}`);
    }
  };

  const handlePublish = async () => {
    const pageId = page?._id || page?.id || pageIdParam;
    if (!pageId) return;
    try {
      setPublishing(true);
      let currentDraftRev = page?.draftRevision;
      if (isDirty) {
        const res = await api.updateDraft(pageId, {
          expectedRevision: page?.draftRevision,
          sections: formatSectionsPayload(sections),
        });
        const updated = res?.data || res;
        setPage((prev: any) => ({ ...prev, ...updated }));
        currentDraftRev = updated.draftRevision || (currentDraftRev ? currentDraftRev + 1 : 1);
        setIsDirty(false);
      }
      const res = await api.publishPage(pageId, {
        expectedDraftRevision: currentDraftRev,
      });
      setPage((prev: any) => ({ ...prev, ...(res?.data || res) }));
      setPublishModalOpen(false);
      setSuccessMsg('Page published live to gunasai.in successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Publishing failed: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const selectedSection = sections.find((s) => s.id === selectedSectionId);

  if (loading) {
    return (
      <CmsLoadingState
        title="Loading Visual Page Builder..."
        subtitle="Retrieving page sections, schema blocks, and draft revisions"
      />
    );
  }

  return (
    <div>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
              Visual Builder: {page?.title || 'Page'}
            </h2>
            <span
              className={`cms-badge ${
                page?.status === 'published' ? 'cms-badge-green' : 'cms-badge-amber'
              }`}
            >
              Draft v{page?.draftRevision} • Live v{page?.publishedRevision || '—'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', marginTop: '0.2rem' }}>
            {isDirty ? (
              <span style={{ color: 'var(--cms-amber)', fontWeight: 600 }}>
                ● Unsaved changes in draft
              </span>
            ) : (
              <span>All changes saved to draft</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSaveDraft}
            disabled={saving || !isDirty}
            className="cms-btn cms-btn-secondary"
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button onClick={handlePreview} className="cms-btn cms-btn-ghost">
            <ExternalLink size={15} />
            <span>Preview Draft</span>
          </button>

          <button
            onClick={() => setPublishModalOpen(true)}
            className="cms-btn cms-btn-primary"
          >
            <UploadCloud size={15} />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {conflictError && (
        <div className="cms-alert cms-alert-danger">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{conflictError}</div>
          <button
            className="cms-btn cms-btn-secondary cms-btn-sm"
            onClick={loadPageData}
          >
            Reload Latest
          </button>
        </div>
      )}

      {successMsg && (
        <div className="cms-alert cms-alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Builder 2-Column Workspace */}
      <div className="cms-builder-layout">
        {/* Left Column: Reorderable Sections List */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--cms-text-secondary)' }}>
              SECTIONS ({sections.length})
            </span>
            <button
              onClick={() => setAddModalOpen(true)}
              className="cms-btn cms-btn-primary cms-btn-sm"
            >
              <Plus size={14} /> Add Block
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="cms-section-list">
                {sections.map((section, idx) => (
                  <SortableSectionItem
                    key={section.id}
                    section={section}
                    index={idx}
                    total={sections.length}
                    isActive={section.id === selectedSectionId}
                    onSelect={() => setSelectedSectionId(section.id)}
                    onToggleVisibility={() => handleToggleVisibility(section.id)}
                    onDuplicate={() => handleDuplicate(section.id)}
                    onDelete={() => handleDelete(section.id)}
                    onMoveUp={() => handleMove(idx, 'up')}
                    onMoveDown={() => handleMove(idx, 'down')}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right Column: Active Block Structured Editor */}
        <div>
          {selectedSection ? (
            <div className="cms-card">
              <div className="cms-card-header">
                <div>
                  <h3 className="cms-card-title">
                    Editing Block: <span style={{ textTransform: 'capitalize', color: 'var(--cms-amber)' }}>{selectedSection.type}</span>
                  </h3>
                  <p className="cms-card-desc">ID: {selectedSection.id}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleToggleVisibility(selectedSection.id)}
                    className="cms-btn cms-btn-secondary cms-btn-sm"
                  >
                    {selectedSection.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span>{selectedSection.visible ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>

              <BlockEditor
                section={selectedSection}
                onChange={(updated) => {
                  const newSections = sections.map((s) =>
                    s.id === selectedSection.id ? updated : s
                  );
                  setSections(newSections);
                  setIsDirty(true);
                }}
              />
            </div>
          ) : (
            <div
              className="cms-card"
              style={{ padding: '3rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}
            >
              Select a section from the left column to edit its content.
            </div>
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      {addModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setAddModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Add Section Block</h3>
              <button
                className="cms-btn cms-btn-icon cms-btn-ghost"
                onClick={() => setAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="cms-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { type: 'hero', label: 'Hero', desc: 'Main headline, CTA buttons & portrait' },
                  { type: 'about', label: 'About', desc: 'Biography, lead paragraph & stats' },
                  { type: 'skills', label: 'Skills', desc: 'Categorized technical skill groups' },
                  { type: 'experience', label: 'Experience', desc: 'Career timeline & achievements' },
                  { type: 'projects', label: 'Projects', desc: 'Project cards with live links' },
                  { type: 'education', label: 'Education', desc: 'Academic degrees & credentials' },
                  { type: 'highlights', label: 'Highlights', desc: 'Awards & notable achievements' },
                  { type: 'resume', label: 'Resume', desc: 'Downloadable CV PDF & preview' },
                  { type: 'contact', label: 'Contact', desc: 'Email, phone, location & socials' },
                  { type: 'form', label: 'Form Block', desc: 'Embed an interactive contact form' },
                  { type: 'richText', label: 'Rich Text', desc: 'Formatted markdown or HTML content' },
                  { type: 'gallery', label: 'Gallery', desc: 'Grid of portfolio screenshots' },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => handleAddSection(item.type)}
                    style={{
                      textAlign: 'left',
                      padding: '0.85rem',
                      backgroundColor: 'var(--cms-surface)',
                      border: '1px solid var(--cms-border)',
                      borderRadius: 'var(--cms-radius-md)',
                      cursor: 'pointer',
                      color: 'var(--cms-text)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--cms-amber)';
                      e.currentTarget.style.backgroundColor = 'var(--cms-surface-elevated)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--cms-border)';
                      e.currentTarget.style.backgroundColor = 'var(--cms-surface)';
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--cms-amber)' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)', marginTop: '0.2rem' }}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="cms-modal-footer">
              <button
                type="button"
                className="cms-btn cms-btn-ghost"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Confirmation Dialog */}
      {publishModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setPublishModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UploadCloud size={20} color="var(--cms-amber)" />
                Publish to Live Website
              </h3>
              <button
                className="cms-btn cms-btn-icon cms-btn-ghost"
                onClick={() => setPublishModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="cms-modal-body">
              <p style={{ margin: '0 0 1rem 0', color: 'var(--cms-text-secondary)', fontSize: '0.9rem' }}>
                You are about to publish the current draft as an immutable live snapshot to{' '}
                <strong style={{ color: 'var(--cms-text)' }}>gunasai.in</strong>.
              </p>
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: 'var(--cms-surface)',
                  borderRadius: 'var(--cms-radius-md)',
                  border: '1px solid var(--cms-border)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ marginBottom: '0.4rem' }}>
                  <strong>Draft Revision:</strong> v{page?.draftRevision}
                </div>
                <div style={{ marginBottom: '0.4rem' }}>
                  <strong>Active Sections:</strong> {sections.filter((s) => s.visible).length} visible ({sections.length} total)
                </div>
                <div>
                  <strong>Snapshot Version:</strong> An immutable backup is stored automatically in Revision History.
                </div>
              </div>
            </div>
            <div className="cms-modal-footer">
              <button
                type="button"
                className="cms-btn cms-btn-ghost"
                onClick={() => setPublishModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? 'Publishing Snapshot...' : 'Confirm & Publish Live'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
