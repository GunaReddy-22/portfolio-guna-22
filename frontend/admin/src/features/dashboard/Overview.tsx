import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Inbox,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';

import { CmsLoadingState } from '../../components/CmsLoadingState';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState({
    pagesCount: 0,
    formsCount: 0,
    submissionsCount: 0,
    mediaCount: 0,
    unreadSubmissions: 0,
    publishedRevision: 0,
    draftRevision: 0,
    lastPublishedAt: null as string | null,
    homePageId: '',
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pages, forms, submissionsRes, mediaRes] = await Promise.all([
          api.getPages(),
          api.getForms(),
          api.getSubmissions({ limit: 5 }),
          api.getMedia({ limit: 1 }),
        ]);

        const home = pages.find((p: any) => p.slug === 'home') || pages[0];
        const unread = submissionsRes?.items?.filter((s: any) => s.status === 'unread').length || 0;

        setStats({
          pagesCount: pages.length,
          formsCount: forms.length,
          submissionsCount: submissionsRes?.total || submissionsRes?.items?.length || 0,
          mediaCount: mediaRes?.total || 0,
          unreadSubmissions: unread,
          publishedRevision: home?.publishedRevision || 0,
          draftRevision: home?.draftRevision || 0,
          lastPublishedAt: home?.updatedAt || null,
          homePageId: home?._id || 'home',
        });

        setRecentSubmissions(submissionsRes?.items || []);
      } catch (err) {
        console.error('Failed to load dashboard overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <CmsLoadingState
        title="Loading Dashboard Analytics..."
        subtitle="Connecting to database and aggregating system telemetry"
      />
    );
  }

  return (
    <div>
      {/* Top Banner / System Status */}
      <div
        className="cms-card"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 184, 166, 0.04) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.25rem 1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--cms-success-subtle)',
              color: 'var(--cms-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--cms-text)' }}>
              Public Website Live & Synchronized
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span>Published Revision: <strong style={{ color: 'var(--cms-amber)' }}>v{stats.publishedRevision}</strong></span>
              <span>Draft Revision: <strong style={{ color: 'var(--cms-teal)' }}>v{stats.draftRevision}</strong></span>
              {stats.lastPublishedAt && (
                <span>Last Updated: {new Date(stats.lastPublishedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/builder" className="cms-btn cms-btn-primary cms-btn-sm">
            <Layers size={15} />
            <span>Open Visual Builder</span>
          </Link>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="cms-btn cms-btn-secondary cms-btn-sm"
          >
            <ExternalLink size={15} />
            <span>Visit Site</span>
          </a>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="cms-stat-grid">
        <div className="cms-stat-card">
          <div className="cms-stat-icon amber">
            <FileText size={22} />
          </div>
          <div>
            <div className="cms-stat-value">{stats.pagesCount}</div>
            <div className="cms-stat-label">Active Pages</div>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-icon teal">
            <Inbox size={22} />
          </div>
          <div>
            <div className="cms-stat-value">{stats.submissionsCount}</div>
            <div className="cms-stat-label">
              Form Inquiries {stats.unreadSubmissions > 0 && `(${stats.unreadSubmissions} unread)`}
            </div>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-icon violet">
            <ImageIcon size={22} />
          </div>
          <div>
            <div className="cms-stat-value">{stats.mediaCount}</div>
            <div className="cms-stat-label">Media Assets</div>
          </div>
        </div>

        <div className="cms-stat-card">
          <div className="cms-stat-icon green">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="cms-stat-value">{stats.formsCount}</div>
            <div className="cms-stat-label">Contact Forms</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Quick Links & Recent Submissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Quick Launchpad */}
        <div className="cms-card">
          <div className="cms-card-header">
            <div>
              <h3 className="cms-card-title">Quick Actions</h3>
              <p className="cms-card-desc">Jump straight to frequent management tasks</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              to="/builder"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--cms-surface)',
                borderRadius: 'var(--cms-radius-md)',
                textDecoration: 'none',
                color: 'var(--cms-text)',
                border: '1px solid var(--cms-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Edit Portfolio Content</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                  Rearrange hero, skills, experience, projects
                </div>
              </div>
              <ArrowRight size={16} color="var(--cms-amber)" />
            </Link>

            <Link
              to="/theme"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--cms-surface)',
                borderRadius: 'var(--cms-radius-md)',
                textDecoration: 'none',
                color: 'var(--cms-text)',
                border: '1px solid var(--cms-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Theme Studio</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                  Tweak colors, typography, and visual presets
                </div>
              </div>
              <ArrowRight size={16} color="var(--cms-teal)" />
            </Link>

            <Link
              to="/media"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--cms-surface)',
                borderRadius: 'var(--cms-radius-md)',
                textDecoration: 'none',
                color: 'var(--cms-text)',
                border: '1px solid var(--cms-border)',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Media Library</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                  Upload hero portraits, project screenshots & resume PDF
                </div>
              </div>
              <ArrowRight size={16} color="var(--cms-violet)" />
            </Link>
          </div>
        </div>

        {/* Recent Form Inquiries */}
        <div className="cms-card">
          <div className="cms-card-header">
            <div>
              <h3 className="cms-card-title">Recent Inquiries</h3>
              <p className="cms-card-desc">Messages submitted through contact forms</p>
            </div>
            <Link to="/submissions" className="cms-btn cms-btn-ghost cms-btn-sm">
              View All
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--cms-text-muted)', fontSize: '0.85rem' }}>
              No inquiries received yet. Submissions from the contact form will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentSubmissions.map((sub) => (
                <div
                  key={sub._id}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: 'var(--cms-surface)',
                    border: '1px solid var(--cms-border)',
                    borderRadius: 'var(--cms-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--cms-text)' }}>
                      {sub.data?.name || 'Anonymous Visitor'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {sub.data?.email || ''} • {sub.data?.message?.substring(0, 45) || 'No message content'}...
                    </div>
                  </div>
                  <span className={`cms-badge ${sub.status === 'unread' ? 'cms-badge-amber' : 'cms-badge-gray'}`}>
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
