import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { History, RotateCcw, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { api } from '../../lib/api';

export const RevisionHistory: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pageIdParam = searchParams.get('pageId');
  const navigate = useNavigate();

  const [pages, setPages] = useState<any[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringRev, setRestoringRev] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPages() {
      try {
        const pagesList = await api.getPages();
        setPages(pagesList);
        const target = pageIdParam || pagesList[0]?.id || pagesList[0]?._id;
        if (target) {
          setSelectedPageId(target);
        }
      } catch (err: any) {
        setError(err.message);
      }
    }
    loadPages();
  }, [pageIdParam]);

  useEffect(() => {
    if (!selectedPageId) return;
    async function loadVersions() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getVersions(selectedPageId);
        setVersions(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load revisions');
      } finally {
        setLoading(false);
      }
    }
    loadVersions();
  }, [selectedPageId]);

  const handleRestore = async (revision: number) => {
    if (
      !window.confirm(
        `Are you sure you want to restore revision v${revision}? This will create a fresh draft with these contents without affecting the currently published site.`
      )
    ) {
      return;
    }

    try {
      setRestoringRev(revision);
      const updatedPage = await api.restoreVersion(selectedPageId, revision);
      setSuccessMsg(`Revision v${revision} restored to draft successfully as v${updatedPage.draftRevision}!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      // Reload versions
      const data = await api.getVersions(selectedPageId);
      setVersions(data);
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setRestoringRev(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={22} color="var(--cms-amber)" />
            Revision History & Rollbacks
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Inspect immutable snapshots of published and draft versions and restore past content safely
          </p>
        </div>

        {/* Page Selector */}
        {pages.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--cms-text-muted)' }}>Page:</span>
            <select
              className="cms-select"
              style={{ width: '200px' }}
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.title} (/{p.slug})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="cms-alert cms-alert-success">
          <CheckCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{successMsg}</div>
          <button
            className="cms-btn cms-btn-primary cms-btn-sm"
            onClick={() => navigate(`/builder?pageId=${selectedPageId}`)}
          >
            Open in Builder
          </button>
        </div>
      )}

      {error && (
        <div className="cms-alert cms-alert-danger">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          Loading revision history snapshots...
        </div>
      ) : versions.length === 0 ? (
        <div className="cms-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          No revision snapshots recorded yet. Publishing or editing pages will generate immutable snapshots here.
        </div>
      ) : (
        <div className="cms-table-container">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Revision</th>
                <th>Snapshot Type</th>
                <th>Sections Included</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((ver) => (
                <tr key={ver._id}>
                  <td>
                    <span style={{ fontFamily: 'var(--cms-font-mono)', fontWeight: 700, color: 'var(--cms-amber)', fontSize: '0.95rem' }}>
                      v{ver.revision}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`cms-badge ${
                        ver.kind === 'published' ? 'cms-badge-green' : 'cms-badge-gray'
                      }`}
                    >
                      {ver.kind === 'published' ? 'Live Snapshot' : 'Draft Snapshot'}
                    </span>
                  </td>
                  <td>
                    {(ver.snapshot?.sections || []).length} sections (
                    {(ver.snapshot?.sections || []).map((s: any) => s.type).join(', ')}
                    )
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: 'var(--cms-text-muted)' }}>
                      {new Date(ver.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleRestore(ver.revision)}
                        disabled={restoringRev === ver.revision}
                        className="cms-btn cms-btn-secondary cms-btn-sm"
                        title="Restore this version to draft"
                      >
                        <RotateCcw size={14} />
                        <span>{restoringRev === ver.revision ? 'Restoring...' : 'Restore to Draft'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
