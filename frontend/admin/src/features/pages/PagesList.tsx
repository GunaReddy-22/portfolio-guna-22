import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Sliders,
  Eye,
  UploadCloud,
  History,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const PagesList: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await api.getPages();
      setPages(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;

    try {
      setCreating(true);
      setError(null);
      const newPage = await api.createPage({
        title: newTitle.trim(),
        slug: newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
      setIsModalOpen(false);
      setNewTitle('');
      setNewSlug('');
      await loadPages();
      navigate(`/builder?pageId=${newPage._id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (pageId: string) => {
    if (!window.confirm('Are you sure you want to publish this draft to the live website?')) {
      return;
    }
    try {
      setPublishingId(pageId);
      const targetPage = pages.find((p) => (p.id || p._id) === pageId);
      await api.publishPage(pageId, {
        expectedDraftRevision: targetPage?.draftRevision,
      });
      setSuccessMsg('Page published successfully to the live website!');
      await loadPages();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Publish failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handlePreview = async (pageId: string) => {
    try {
      const res = await api.getPreviewToken(pageId);
      window.open(res.previewUrl || `/?preview=${res.token}`, '_blank');
    } catch (err: any) {
      alert(`Preview failed: ${err?.message || 'Could not generate preview token'}`);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Site Pages</h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Manage the pages and layouts of your portfolio
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="cms-btn cms-btn-primary"
        >
          <Plus size={16} />
          <span>New Page</span>
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

      {loading ? (
        <CmsLoadingState
          title="Loading Portfolio Pages..."
          subtitle="Connecting to database and fetching page layouts"
        />
      ) : (
        <div className="cms-table-container">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Title & Slug</th>
                <th>Status</th>
                <th>Draft Rev</th>
                <th>Published Rev</th>
                <th>Last Modified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => {
                const pageId = page.id || page._id;
                return (
                <tr key={pageId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--cms-radius-sm)',
                          backgroundColor: 'var(--cms-surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--cms-amber)',
                        }}
                      >
                        <FileText size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--cms-text)' }}>
                          {page.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)', fontFamily: 'var(--cms-font-mono)' }}>
                          /{page.slug === 'home' ? '' : page.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`cms-badge ${
                        page.status === 'published' ? 'cms-badge-green' : 'cms-badge-amber'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '0.8rem' }}>
                      v{page.draftRevision}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '0.8rem', color: 'var(--cms-amber)' }}>
                      v{page.publishedRevision || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/builder?pageId=${pageId}`)}
                        className="cms-btn cms-btn-secondary cms-btn-sm"
                        title="Open Visual Builder"
                      >
                        <Sliders size={14} />
                        <span>Builder</span>
                      </button>
                      <button
                        onClick={() => handlePreview(pageId)}
                        className="cms-btn cms-btn-ghost cms-btn-sm"
                        title="Secure Draft Preview"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => handlePublish(pageId)}
                        disabled={publishingId === pageId}
                        className="cms-btn cms-btn-primary cms-btn-sm"
                        title="Publish Live"
                      >
                        <UploadCloud size={14} />
                        <span>{publishingId === pageId ? 'Publishing...' : 'Publish'}</span>
                      </button>
                      <button
                        onClick={() => navigate(`/revisions?pageId=${pageId}`)}
                        className="cms-btn cms-btn-ghost cms-btn-sm"
                        title="Revision History"
                      >
                        <History size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Page Modal */}
      {isModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="cms-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Create New Page</h3>
              <button
                className="cms-btn cms-btn-icon cms-btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreatePage}>
              <div className="cms-modal-body">
                <div className="cms-form-group">
                  <label className="cms-label" htmlFor="title">
                    Page Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="cms-input"
                    placeholder="e.g. Case Studies"
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (!newSlug) {
                        setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                      }
                    }}
                    required
                    autoFocus
                  />
                </div>
                <div className="cms-form-group">
                  <label className="cms-label" htmlFor="slug">
                    URL Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    className="cms-input"
                    placeholder="case-studies"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    required
                  />
                  <div className="cms-helper-text">
                    Unique identifier for the page route.
                  </div>
                </div>
              </div>
              <div className="cms-modal-footer">
                <button
                  type="button"
                  className="cms-btn cms-btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-btn cms-btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
