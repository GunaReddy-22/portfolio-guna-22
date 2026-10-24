import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Download,
  Eye,
  CheckCircle2,
  Archive,
  X,
  Filter,
  Star,
  Mail,
  Calendar,
  MessageSquare,
  User,
  Check,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const SubmissionsInbox: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFormId = searchParams.get('formId') || 'all';

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>(initialFormId);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  useEffect(() => {
    // Load available forms for the filter selector
    api.getForms().then((data) => setForms(data || [])).catch(() => {});
  }, []);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (selectedFormId !== 'all') {
        params.formId = selectedFormId;
      }
      const res = await api.getSubmissions(params);
      setSubmissions(res.items || []);
      setTotal(res.pagination?.total || res.total || (res.items || []).length);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter, selectedFormId]);

  const handleFormFilterChange = (formId: string) => {
    setSelectedFormId(formId);
    if (formId === 'all') {
      searchParams.delete('formId');
    } else {
      searchParams.set('formId', formId);
    }
    setSearchParams(searchParams);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.updateSubmission(id, { status: newStatus });
      setSubmissions((prev) =>
        prev.map((s) => (s._id === id || s.id === id ? { ...s, status: newStatus } : s))
      );
      if (selectedSubmission?._id === id || selectedSubmission?.id === id) {
        setSelectedSubmission((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csvText = await api.exportSubmissionsCsv(selectedFormId !== 'all' ? selectedFormId : undefined);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `guna-feedback-responses-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  // Helper to extract a primary rating if present
  const extractRating = (data: any): number | null => {
    if (!data) return null;
    for (const key of Object.keys(data)) {
      if (key.includes('rating') || key.includes('satisfaction') || key.includes('score')) {
        const val = parseInt(data[key], 10);
        if (!isNaN(val) && val >= 1 && val <= 5) return val;
      }
    }
    return null;
  };

  // Helper to extract primary feedback / comment preview
  const extractCommentPreview = (data: any): string => {
    if (!data) return 'No comments';
    for (const key of ['feedback_notes', 'issues_and_friction', 'favorite_features', 'one_thing_to_improve', 'summary', 'message', 'testimonial', 'description']) {
      if (data[key]) return String(data[key]);
    }
    const values = Object.values(data).filter((v) => typeof v === 'string' && (v as string).length > 3);
    return values[0] ? String(values[0]) : JSON.stringify(data);
  };

  // Helper to extract sender identity
  const extractSender = (data: any): { name?: string; email?: string } => {
    if (!data) return {};
    const email = data.email || data.tester_email || data.reporter_email || data.user_email || data.contact_info;
    const name = data.name || data.client_name || data.user_name || data.app_name;
    return { name, email };
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Inbox size={22} color="var(--cms-amber)" />
            Feedback Responses & Inquiries
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Browse and review user feedback, bug reports, ratings, and inquiries ({total} total responses).
          </p>
        </div>

        <button onClick={handleExportCsv} className="cms-btn cms-btn-secondary">
          <Download size={15} />
          <span>Export Responses (CSV)</span>
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div
        className="cms-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Form Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cms-text-muted)' }}>
            Filter by Form:
          </label>
          <select
            className="cms-select"
            style={{ minWidth: '220px' }}
            value={selectedFormId}
            onChange={(e) => handleFormFilterChange(e.target.value)}
          >
            <option value="all">All Feedback Forms & Inquiries</option>
            {forms.map((f) => (
              <option key={f.id || f._id} value={f.id || f._id}>
                {f.title || f.name} ({f.responseCount || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'reviewed', label: 'Reviewed' },
            { id: 'archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`cms-btn cms-btn-sm ${
                statusFilter === tab.id ? 'cms-btn-primary' : 'cms-btn-ghost'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      {loading ? (
        <CmsLoadingState
          title="Loading Feedback Submissions..."
          subtitle="Decrypting incoming user reviews and feedback submissions"
        />
      ) : submissions.length === 0 ? (
        <div className="cms-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
          <Inbox size={36} color="var(--cms-amber)" style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#fff', margin: '0 0 0.4rem 0' }}>No Responses Found</h3>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            {selectedFormId !== 'all'
              ? 'No responses submitted for this feedback form yet. Send out the public link to testers!'
              : 'No inquiries or feedback responses match your current filter.'}
          </p>
        </div>
      ) : (
        <div className="cms-table-container">
          <table className="cms-table">
            <thead>
              <tr>
                <th>Form / Origin</th>
                <th>Sender / Rating</th>
                <th>Feedback Snippet</th>
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => {
                const subId = sub.id || sub._id;
                const sender = extractSender(sub.data);
                const rating = extractRating(sub.data);
                const commentPreview = extractCommentPreview(sub.data);
                const isUnread = sub.status === 'unread';

                return (
                  <tr
                    key={subId}
                    style={{
                      background: isUnread ? 'rgba(245, 158, 11, 0.03)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--cms-text)' }}>
                        {sub.formTitle || sub.formSlug}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                        slug: {sub.formSlug}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {sender.name || sender.email || 'Anonymous Tester'}
                        </span>
                        {sender.email && sender.name && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                            {sender.email}
                          </span>
                        )}
                        {rating && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.15rem' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= rating ? '#fbbf24' : 'none'}
                                color={star <= rating ? '#fbbf24' : '#64748b'}
                              />
                            ))}
                            <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginLeft: '0.2rem' }}>
                              {rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div
                        style={{
                          maxWidth: '360px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: '0.85rem',
                          color: '#cbd5e1',
                        }}
                      >
                        {commentPreview}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`cms-badge ${
                          sub.status === 'unread'
                            ? 'cms-badge-amber'
                            : sub.status === 'reviewed'
                            ? 'cms-badge-green'
                            : 'cms-badge-gray'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            if (sub.status === 'unread') {
                              handleUpdateStatus(subId, 'reviewed');
                            }
                          }}
                          className="cms-btn cms-btn-primary cms-btn-sm"
                          title="View Full Response"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {sub.status !== 'archived' && (
                          <button
                            onClick={() => handleUpdateStatus(subId, 'archived')}
                            className="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon"
                            title="Archive Response"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Response Details Modal */}
      {selectedSubmission && (
        <div className="cms-modal-backdrop" onClick={() => setSelectedSubmission(null)}>
          <div className="cms-modal" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="cms-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Feedback Response Details
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                  Form: {selectedSubmission.formTitle || selectedSubmission.formSlug} •{' '}
                  {selectedSubmission.createdAt ? new Date(selectedSubmission.createdAt).toLocaleString() : ''}
                </div>
              </div>
              <button className="cms-btn cms-btn-icon cms-btn-ghost" onClick={() => setSelectedSubmission(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="cms-modal-body">
              {/* Status Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--cms-radius-md)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--cms-border)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--cms-text-muted)' }}>Status:</span>
                  <span
                    className={`cms-badge ${
                      selectedSubmission.status === 'unread'
                        ? 'cms-badge-amber'
                        : selectedSubmission.status === 'reviewed'
                        ? 'cms-badge-green'
                        : 'cms-badge-gray'
                    }`}
                  >
                    {selectedSubmission.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {selectedSubmission.status !== 'reviewed' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedSubmission.id || selectedSubmission._id, 'reviewed')}
                      className="cms-btn cms-btn-sm cms-btn-secondary"
                    >
                      <Check size={13} /> Mark Reviewed
                    </button>
                  )}
                  {selectedSubmission.status !== 'unread' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedSubmission.id || selectedSubmission._id, 'unread')}
                      className="cms-btn cms-btn-sm cms-btn-secondary"
                    >
                      Mark Unread
                    </button>
                  )}
                  {selectedSubmission.status !== 'archived' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedSubmission.id || selectedSubmission._id, 'archived')}
                      className="cms-btn cms-btn-sm cms-btn-ghost"
                    >
                      <Archive size={13} /> Archive
                    </button>
                  )}
                </div>
              </div>

              {/* Answers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(selectedSubmission.data || {}).map(([key, value]) => {
                  const isRating =
                    key.includes('rating') ||
                    key.includes('satisfaction') ||
                    (!isNaN(Number(value)) && Number(value) >= 1 && Number(value) <= 5 && key.includes('score'));

                  const ratingNum = isRating ? Number(value) : null;
                  const isEmail = typeof value === 'string' && value.includes('@');

                  return (
                    <div
                      key={key}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--cms-radius-md)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--cms-border)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: 'var(--cms-amber)',
                          marginBottom: '0.4rem',
                        }}
                      >
                        {key.replace(/_/g, ' ')}
                      </div>

                      {ratingNum !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={20}
                              fill={star <= ratingNum ? '#fbbf24' : 'none'}
                              color={star <= ratingNum ? '#fbbf24' : '#475569'}
                            />
                          ))}
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24', marginLeft: '0.4rem' }}>
                            {ratingNum} / 5 Stars
                          </span>
                        </div>
                      ) : isEmail ? (
                        <a
                          href={`mailto:${value}`}
                          style={{
                            color: 'var(--cms-teal)',
                            fontSize: '0.95rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            textDecoration: 'none',
                          }}
                        >
                          <Mail size={15} />
                          <span>{String(value)}</span>
                        </a>
                      ) : (
                        <div
                          style={{
                            fontSize: '0.95rem',
                            color: '#ffffff',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5,
                          }}
                        >
                          {String(value)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Technical / Device Audit Metadata */}
              {(selectedSubmission.userAgent || selectedSubmission.ipHash) && (
                <div
                  style={{
                    marginTop: '1.25rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--cms-radius-sm)',
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: '0.72rem',
                    color: 'var(--cms-text-muted)',
                    fontFamily: 'var(--cms-font-mono)',
                  }}
                >
                  {selectedSubmission.userAgent && <div>Device: {selectedSubmission.userAgent}</div>}
                  {selectedSubmission.ipHash && <div>Audit Hash: {selectedSubmission.ipHash}</div>}
                </div>
              )}
            </div>

            <div className="cms-modal-footer">
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
