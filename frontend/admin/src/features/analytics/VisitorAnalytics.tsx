import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Activity,
  Users,
  Eye,
  Globe2,
  Clock,
  Download,
  RefreshCw,
  Search,
  Monitor,
  Smartphone,
  Tablet,
  Bot,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  X,
  Compass,
  Wifi,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
  Cpu,
  HardDrive,
  Gauge,
  FileText,
  Sparkles,
  MousePointer,
  Flame,
  Zap,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const VisitorAnalytics: React.FC = () => {
  const [period, setPeriod] = useState<string>('7d');
  const [overview, setOverview] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [deviceFilter, setDeviceFilter] = useState<string>('');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [clearing, setClearing] = useState<boolean>(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);

  const autoRefreshTimerRef = useRef<any>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [overviewData, liveData] = await Promise.all([
        api.getAnalyticsOverview(period),
        api.getAnalyticsLiveLogs({ page, limit: 50, search, device: deviceFilter }),
      ]);
      setOverview(overviewData);
      setLogs(liveData?.items || []);
      setTotalLogs(liveData?.total || 0);

      // Keep selected visitor synced if inspector is open
      if (selectedVisitor) {
        const updated = liveData?.items?.find((item: any) => item._id === selectedVisitor._id);
        if (updated) setSelectedVisitor(updated);
      }
    } catch (err) {
      console.error('Failed to load visitor analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, page, search, deviceFilter, selectedVisitor]);

  useEffect(() => {
    loadData();
  }, [period, page, search, deviceFilter]);

  // Auto-refresh interval (15s)
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        loadData(true);
      }, 15000);
    } else if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh, loadData]);

  const handleCopyIp = (ip: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to purge all visitor telemetry logs? This action cannot be undone.')) {
      return;
    }
    try {
      setClearing(true);
      await api.clearAnalyticsLogs();
      setSelectedVisitor(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to clear logs: ${err?.message || 'Error'}`);
    } finally {
      setClearing(false);
    }
  };

  const isVisitorActive = (lastActiveStr?: string, visitedAtStr?: string) => {
    const ts = lastActiveStr || visitedAtStr;
    if (!ts) return false;
    const diff = Date.now() - new Date(ts).getTime();
    return diff < 45000; // active within last 45 seconds
  };

  const formatExactTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '—';
    }
  };

  const formatFullDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 5) return 'Just now';
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const formatDuration = (sec?: number) => {
    if (!sec || sec <= 0) return '< 5s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const renderCountryFlag = (code?: string, size: 'sm' | 'md' = 'sm') => {
    if (!code || code === 'XX' || code.length !== 2) {
      return <Globe2 size={size === 'md' ? 20 : 16} style={{ color: 'var(--cms-text-muted)' }} />;
    }
    const lower = code.toLowerCase();
    const width = size === 'md' ? 24 : 18;
    const height = size === 'md' ? 18 : 13;
    return (
      <img
        src={`https://flagcdn.com/24x18/${lower}.png`}
        srcSet={`https://flagcdn.com/48x36/${lower}.png 2x`}
        alt={code}
        width={width}
        height={height}
        style={{
          borderRadius: '2px',
          objectFit: 'cover',
          display: 'inline-block',
          verticalAlign: 'middle',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile':
        return <Smartphone size={14} style={{ color: 'var(--cms-teal)' }} />;
      case 'tablet':
        return <Tablet size={14} style={{ color: 'var(--cms-violet)' }} />;
      case 'bot':
        return <Bot size={14} style={{ color: 'var(--cms-text-muted)' }} />;
      default:
        return <Monitor size={14} style={{ color: 'var(--cms-amber)' }} />;
    }
  };

  const getReferrerBadge = (source: string) => {
    const s = (source || 'direct').toLowerCase();
    switch (s) {
      case 'linkedin':
        return { label: 'LinkedIn', bg: 'rgba(10, 102, 194, 0.16)', color: '#0a66c2', border: 'rgba(10, 102, 194, 0.35)' };
      case 'github':
        return { label: 'GitHub', bg: 'rgba(124, 92, 252, 0.16)', color: '#a78bfa', border: 'rgba(124, 92, 252, 0.35)' };
      case 'google':
        return { label: 'Google Search', bg: 'rgba(66, 133, 244, 0.16)', color: '#4285f4', border: 'rgba(66, 133, 244, 0.35)' };
      case 'resume':
        return { label: 'Resume / CV', bg: 'rgba(16, 185, 129, 0.16)', color: '#10b981', border: 'rgba(16, 185, 129, 0.35)' };
      case 'twitter':
        return { label: 'X / Twitter', bg: 'rgba(29, 155, 240, 0.16)', color: '#1d9bf0', border: 'rgba(29, 155, 240, 0.35)' };
      default:
        return { label: 'Direct Entry', bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--cms-amber)', border: 'rgba(245, 158, 11, 0.25)' };
    }
  };

  // Filter logs based on intent tab
  const filteredLogs = logs.filter((l) => {
    if (intentFilter === 'resume') {
      return (l.events || []).some((e: any) => e.type === 'resume_download');
    }
    if (intentFilter === 'demos') {
      return (l.events || []).some((e: any) => e.type === 'external_link_click');
    }
    if (intentFilter === 'returning') {
      return l.isReturning || (l.visitNumber && l.visitNumber > 1);
    }
    return true;
  });

  if (loading && !overview) {
    return (
      <CmsLoadingState
        title="Loading Visitor Telemetry..."
        subtitle="Connecting to database, resolving geographic data, and aggregating engagement stats"
      />
    );
  }

  const topCountry = overview?.topCountries?.[0];
  const topCity = overview?.topCities?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="cms-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="cms-page-title">Visitor Analytics & Live Intelligence</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '11px',
                fontFamily: 'var(--cms-font-mono)',
                backgroundColor: autoRefresh ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                color: autoRefresh ? 'var(--cms-success)' : 'var(--cms-text-muted)',
                border: `1px solid ${autoRefresh ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: autoRefresh ? 'var(--cms-success)' : 'var(--cms-text-muted)',
                }}
              />
              {autoRefresh ? 'Live Sync Active (15s)' : 'Live Sync Paused'}
            </span>
          </div>
          <p className="cms-page-subtitle">
            Elite real-time telemetry: In/Out timestamps, hardware GPU X-ray, recruiter intent, repeat visits, and section journeys
          </p>
        </div>

        {/* Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--cms-surface)',
              border: '1px solid var(--cms-border)',
              borderRadius: 'var(--cms-radius-md)',
              padding: '2px',
            }}
          >
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--cms-radius-sm)',
                  fontSize: '12px',
                  fontFamily: 'var(--cms-font-mono)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: period === p.id ? 'var(--cms-amber)' : 'transparent',
                  color: period === p.id ? '#0a0d14' : 'var(--cms-text-secondary)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Auto refresh toggle */}
          <button
            type="button"
            className="cms-btn cms-btn-secondary"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title="Toggle real-time auto-refresh"
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {autoRefresh ? 'Auto Sync: On' : 'Auto Sync: Off'}
          </button>

          {/* Export CSV */}
          <a
            href={api.getAnalyticsExportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="cms-btn cms-btn-secondary"
            style={{ textDecoration: 'none', fontSize: '12px', padding: '7px 12px' }}
          >
            <Download size={14} />
            Export CSV
          </a>

          {/* Clear logs */}
          <button
            type="button"
            className="cms-btn cms-btn-danger"
            onClick={handleClearLogs}
            disabled={clearing}
            title="Purge all visitor telemetry"
            style={{ fontSize: '12px', padding: '7px 12px' }}
          >
            <Trash2 size={14} />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Primary KPI Row: Core & Recruiter Intent */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Page Views */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Pageviews
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--cms-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.totalVisits ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} style={{ color: 'var(--cms-success)' }} /> Bot-filtered clean traffic
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unique Visitors
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(20, 184, 166, 0.12)', color: 'var(--cms-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.uniqueVisitors ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            Distinct network IPs & devices
          </div>
        </div>

        {/* Resume Downloads (High Intent) */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', border: overview?.totalResumeDownloads > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resume Downloads
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--cms-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-success)', lineHeight: 1 }}>
            {overview?.totalResumeDownloads ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            High recruiter hiring intent 📄
          </div>
        </div>

        {/* Demo & Repo Clicks */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Project & Demo Clicks
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.12)', color: 'var(--cms-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.totalDemoClicks ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            Outbound project validations 🚀
          </div>
        </div>

        {/* Returning Visitors (Loyalty) */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Returning Visitors
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--cms-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.returningVisitors ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            {overview?.uniqueVisitors > 0 ? `${Math.round(((overview?.returningVisitors || 0) / overview.uniqueVisitors) * 100)}% return rate` : 'Multi-session tracking'}
          </div>
        </div>

        {/* Avg Scroll Depth */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Scroll Depth
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gauge size={16} />
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.avgScrollDepth || 0}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            {formatDuration(overview?.avgDuration)} avg dwell time
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Geographic Breakdown */}
        <div className="cms-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe2 size={16} style={{ color: 'var(--cms-teal)' }} />
              Top Visitor Locations
            </h3>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)' }}>
              Country & City
            </span>
          </div>

          {(!overview?.topCountries || overview.topCountries.length === 0) ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--cms-text-muted)', fontSize: '13px' }}>
              No geographic visitor data recorded for this time period yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {overview.topCountries.map((c: any, i: number) => {
                const total = overview.totalVisits || 1;
                const pct = Math.round((c.count / total) * 100);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{renderCountryFlag(c.code)}</span>
                        <span style={{ fontWeight: 600 }}>{c.country}</span>
                        <span style={{ fontSize: '11px', color: 'var(--cms-text-muted)', fontFamily: 'var(--cms-font-mono)' }}>
                          ({c.code})
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--cms-text)' }}>{c.count}</span>
                        <span style={{ fontSize: '11px', color: 'var(--cms-text-muted)', minWidth: '32px', textAlign: 'right' }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--cms-surface-elevated)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--cms-amber), var(--cms-teal))',
                          borderRadius: '10px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Traffic Channels & Devices */}
        <div className="cms-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: 'var(--cms-amber)' }} />
              Traffic Sources & Platforms
            </h3>
            <span style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)' }}>
              Inbound Channels
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Referrers */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', textTransform: 'uppercase', color: 'var(--cms-text-muted)', marginBottom: '8px' }}>
                Traffic Sources
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {overview?.topReferrers?.map((r: any, idx: number) => {
                  const badge = getReferrerBadge(r.source);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--cms-radius-sm)',
                        backgroundColor: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      <span>{badge.label}</span>
                      <span
                        style={{
                          backgroundColor: 'rgba(0,0,0,0.25)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontFamily: 'var(--cms-font-mono)',
                        }}
                      >
                        {r.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Devices & Browsers */}
            <div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', textTransform: 'uppercase', color: 'var(--cms-text-muted)', marginBottom: '8px' }}>
                Device & System Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {overview?.deviceBreakdown?.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--cms-surface)',
                      borderRadius: 'var(--cms-radius-sm)',
                      border: '1px solid var(--cms-border)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                      {getDeviceIcon(d.device)}
                      <span>{d.device}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--cms-font-mono)' }}>{d.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Visitor Feed Section */}
      <div className="cms-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Feed Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--cms-teal)' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                Live Visitor Feed ({totalLogs} recorded)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--cms-text-secondary)', margin: '4px 0 0' }}>
              Click any row to inspect deep hardware GPU telemetry, connection quality, recruiter actions, and section dwell times
            </p>
          </div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Quick Intent Filter Tabs */}
            <div
              style={{
                display: 'inline-flex',
                backgroundColor: 'var(--cms-surface)',
                border: '1px solid var(--cms-border)',
                borderRadius: 'var(--cms-radius-md)',
                padding: '2px',
              }}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'resume', label: '📄 Resume' },
                { id: 'demos', label: '🚀 Demos' },
                { id: 'returning', label: '🔄 Returning' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setIntentFilter(tab.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--cms-radius-sm)',
                    fontSize: '11px',
                    fontFamily: 'var(--cms-font-mono)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: intentFilter === tab.id ? 'var(--cms-amber)' : 'transparent',
                    color: intentFilter === tab.id ? '#0a0d14' : 'var(--cms-text-secondary)',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search IP, City, ISP, GPU..."
                className="cms-input"
                style={{ paddingLeft: '32px', width: '200px', fontSize: '12px' }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Device Filter */}
            <select
              className="cms-select"
              style={{ fontSize: '12px', width: '120px' }}
              value={deviceFilter}
              onChange={(e) => {
                setDeviceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Devices</option>
              <option value="desktop">Desktop</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="bot">Bots</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {filteredLogs.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
            <Globe2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No visitor records found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {search || intentFilter !== 'all' ? 'Try clearing your filter or search query' : 'Visitor visits to gunasai.in will appear here in real-time.'}
            </div>
          </div>
        ) : (
          <div className="cms-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="cms-table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ width: '85px' }}>In Time</th>
                  <th style={{ width: '100px' }}>Out / Status</th>
                  <th style={{ width: '140px' }}>Visitor IP</th>
                  <th style={{ width: '105px' }}>Loyalty / Visit</th>
                  <th>Location (City & Country)</th>
                  <th>Carrier / Network</th>
                  <th>Hardware & GPU</th>
                  <th>Intent Actions</th>
                  <th style={{ width: '75px' }}>Scroll</th>
                  <th style={{ textAlign: 'right', width: '75px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log: any) => {
                  const refBadge = getReferrerBadge(log.referrerSource);
                  const isCopied = copiedIp === log.ip;
                  const active = isVisitorActive(log.lastActiveAt, log.visitedAt);

                  const displayCity = log.city && log.city !== 'Unknown' ? log.city : '';
                  const displayRegion = log.region && log.region !== 'Unknown' ? log.region : '';
                  const displayCountry = log.country && log.country !== 'Unknown' ? log.country : 'Unknown';

                  const displayIsp = log.isp && log.isp !== 'Cloudflare Network' ? log.isp : (log.org || 'Direct Network');

                  // High-intent flags in row
                  const hasResume = (log.events || []).some((e: any) => e.type === 'resume_download');
                  const hasDemos = (log.events || []).some((e: any) => e.type === 'external_link_click');
                  const hasCopy = (log.events || []).some((e: any) => e.type === 'contact_copy');

                  // Hardware chip
                  let hardwareChip = log.gpuRenderer ? log.gpuRenderer.split(' ')[0] : '';
                  if (!hardwareChip && log.cpuCores) hardwareChip = `${log.cpuCores}c`;

                  return (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedVisitor(log)}
                      style={{ cursor: 'pointer', transition: 'background-color 0.15s ease' }}
                    >
                      {/* In Time */}
                      <td style={{ color: 'var(--cms-text-muted)', fontFamily: 'var(--cms-font-mono)', fontSize: '11px' }} title={formatFullDate(log.visitedAt)}>
                        {formatExactTime(log.visitedAt)}
                        <div style={{ fontSize: '10px', color: 'var(--cms-text-secondary)' }}>{formatRelativeTime(log.visitedAt)}</div>
                      </td>

                      {/* Out Time / Live Status */}
                      <td>
                        {active ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '2px 8px',
                              borderRadius: '100px',
                              fontSize: '10px',
                              fontFamily: 'var(--cms-font-mono)',
                              fontWeight: 700,
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: 'var(--cms-success)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                            }}
                          >
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--cms-success)' }} />
                            Active Now
                          </span>
                        ) : (
                          <div style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '11px', color: 'var(--cms-text-muted)' }} title={formatFullDate(log.lastActiveAt || log.visitedAt)}>
                            {formatExactTime(log.lastActiveAt || log.visitedAt)}
                          </div>
                        )}
                      </td>

                      {/* IP with Copy Button */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontFamily: 'var(--cms-font-mono)', fontSize: '11.5px', color: log.isBot ? 'var(--cms-text-muted)' : 'var(--cms-text)' }}>
                            {log.ip}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyIp(log.ip, e)}
                            title="Copy IP"
                            style={{ background: 'transparent', border: 'none', color: isCopied ? 'var(--cms-success)' : 'var(--cms-text-muted)', cursor: 'pointer', padding: '1px' }}
                          >
                            {isCopied ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                      </td>

                      {/* Loyalty Badge */}
                      <td>
                        {log.isReturning || (log.visitNumber && log.visitNumber > 1) ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontFamily: 'var(--cms-font-mono)',
                              fontWeight: 700,
                              backgroundColor: 'rgba(239, 68, 68, 0.14)',
                              color: 'var(--cms-danger)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                            }}
                          >
                            <Flame size={10} /> #{log.visitNumber || 2} Visit
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontFamily: 'var(--cms-font-mono)',
                              color: 'var(--cms-text-muted)',
                              backgroundColor: 'rgba(255,255,255,0.03)',
                            }}
                          >
                            ⭐ 1st Visit
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{renderCountryFlag(log.countryCode)}</span>
                          <div>
                            <span style={{ fontWeight: 600 }}>{displayCity || displayCountry}</span>
                            {displayCity && (
                              <span style={{ color: 'var(--cms-text-muted)', fontSize: '11px' }}>
                                , {displayRegion ? `${displayRegion}, ` : ''}{displayCountry}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ISP / Carrier */}
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', fontFamily: 'var(--cms-font-mono)' }}>
                          {displayIsp}
                        </span>
                      </td>

                      {/* Hardware & GPU */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {getDeviceIcon(log.deviceType)}
                          <span style={{ fontSize: '11px', color: 'var(--cms-text)', fontWeight: 500 }}>
                            {log.browser} · {hardwareChip || log.os}
                          </span>
                          {log.connectionType && (
                            <span style={{ fontSize: '9.5px', fontFamily: 'var(--cms-font-mono)', padding: '1px 4px', borderRadius: '3px', backgroundColor: 'rgba(20,184,166,0.15)', color: 'var(--cms-teal)' }}>
                              {log.connectionType.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Intent Actions (Badges) */}
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {hasResume && (
                            <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(16,185,129,0.18)', color: 'var(--cms-success)', fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>
                              📄 CV
                            </span>
                          )}
                          {hasDemos && (
                            <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(139,92,246,0.18)', color: 'var(--cms-violet)', fontWeight: 700, border: '1px solid rgba(139,92,246,0.3)' }}>
                              🚀 Demo
                            </span>
                          )}
                          {hasCopy && (
                            <span style={{ fontSize: '9.5px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(245,158,11,0.18)', color: 'var(--cms-amber)', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>
                              📋 Copy
                            </span>
                          )}
                          {!hasResume && !hasDemos && !hasCopy && (
                            <span style={{ fontSize: '10px', color: 'var(--cms-text-muted)' }}>Browsing</span>
                          )}
                        </div>
                      </td>

                      {/* Scroll Depth Progress */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ flex: 1, height: '4px', backgroundColor: 'var(--cms-surface-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${log.maxScrollPercentage || 0}%`,
                                height: '100%',
                                backgroundColor: (log.maxScrollPercentage || 0) >= 75 ? 'var(--cms-success)' : 'var(--cms-amber)',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)' }}>
                            {log.maxScrollPercentage || 0}%
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td style={{ textAlign: 'right', fontFamily: 'var(--cms-font-mono)', fontSize: '11px', color: 'var(--cms-text-muted)' }}>
                        {formatDuration(log.durationSeconds)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visitor Session Inspector Modal (Elite Telemetry Drawer) */}
      {selectedVisitor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setSelectedVisitor(null)}
        >
          <div
            className="cms-card"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--cms-bg-card)',
              border: '1px solid var(--cms-border-focus)',
              boxShadow: 'var(--cms-shadow-lg)',
              borderRadius: 'var(--cms-radius-lg)',
              padding: '1.75rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--cms-border)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{renderCountryFlag(selectedVisitor.countryCode, 'md')}</span>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                    {selectedVisitor.city ? `${selectedVisitor.city}, ${selectedVisitor.country}` : (selectedVisitor.country || 'Visitor Telemetry')}
                  </h2>

                  {/* Active vs Departed */}
                  {isVisitorActive(selectedVisitor.lastActiveAt, selectedVisitor.visitedAt) ? (
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontFamily: 'var(--cms-font-mono)', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--cms-success)', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                      🟢 Active Now
                    </span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontFamily: 'var(--cms-font-mono)', backgroundColor: 'rgba(100, 116, 139, 0.15)', color: 'var(--cms-text-muted)' }}>
                      Session Ended
                    </span>
                  )}

                  {/* Loyalty Badge */}
                  {selectedVisitor.isReturning || selectedVisitor.visitNumber > 1 ? (
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontFamily: 'var(--cms-font-mono)', fontWeight: 700, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--cms-danger)', border: '1px solid rgba(239, 68, 68, 0.35)' }}>
                      🔥 Returning Visitor (#{selectedVisitor.visitNumber || 2} Visit)
                    </span>
                  ) : (
                    <span style={{ padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontFamily: 'var(--cms-font-mono)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--cms-text-secondary)' }}>
                      ⭐ First-Time Visitor
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '12px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-secondary)' }}>
                  <span>IP: {selectedVisitor.ip}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyIp(selectedVisitor.ip)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--cms-amber)', cursor: 'pointer', padding: '0 4px', fontSize: '11px' }}
                  >
                    {copiedIp === selectedVisitor.ip ? 'Copied!' : 'Copy IP'}
                  </button>
                  {selectedVisitor.visitorFingerprint && (
                    <span style={{ color: 'var(--cms-text-muted)' }}>• Device ID: {selectedVisitor.visitorFingerprint}</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="cms-sidebar-close-btn"
                onClick={() => setSelectedVisitor(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--cms-text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* In-Time & Out-Time Big Display */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '0.75rem',
                backgroundColor: 'var(--cms-surface)',
                borderRadius: 'var(--cms-radius-md)',
                padding: '1rem',
                marginBottom: '1.25rem',
                border: '1px solid var(--cms-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  In Time (Arrival)
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '3px', color: 'var(--cms-amber)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatExactTime(selectedVisitor.visitedAt)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  {formatFullDate(selectedVisitor.visitedAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  Out Time (Last Active)
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '3px', color: 'var(--cms-teal)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatExactTime(selectedVisitor.lastActiveAt || selectedVisitor.visitedAt)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  {formatFullDate(selectedVisitor.lastActiveAt || selectedVisitor.visitedAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  Total Duration
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '3px', color: 'var(--cms-text)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatDuration(selectedVisitor.durationSeconds)}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  {selectedVisitor.activeSeconds ? `${selectedVisitor.activeSeconds}s active reading` : 'Total session'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  Max Scroll Depth
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '3px', color: (selectedVisitor.maxScrollPercentage || 0) >= 75 ? 'var(--cms-success)' : 'var(--cms-amber)', fontFamily: 'var(--cms-font-mono)' }}>
                  {selectedVisitor.maxScrollPercentage || 0}% Read
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  Page engagement
                </div>
              </div>
            </div>

            {/* High-Intent Recruiter Events (The Goldmine) */}
            <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} style={{ color: 'var(--cms-amber)' }} />
                High-Intent Actions & Interactions ({selectedVisitor.events?.length || 0})
              </h4>

              {(!selectedVisitor.events || selectedVisitor.events.length === 0) ? (
                <div style={{ fontSize: '12px', color: 'var(--cms-text-muted)', fontStyle: 'italic' }}>
                  Visitor scrolled and read sections; no outbound clicks or file downloads recorded during this session.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedVisitor.events.map((evt: any, idx: number) => {
                    let badgeColor = 'var(--cms-amber)';
                    let badgeBg = 'rgba(245, 158, 11, 0.15)';
                    if (evt.type === 'resume_download') {
                      badgeColor = 'var(--cms-success)';
                      badgeBg = 'rgba(16, 185, 129, 0.15)';
                    } else if (evt.type === 'external_link_click') {
                      badgeColor = 'var(--cms-violet)';
                      badgeBg = 'rgba(139, 92, 246, 0.15)';
                    }

                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          backgroundColor: 'var(--cms-surface-elevated)',
                          borderRadius: 'var(--cms-radius-sm)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: badgeBg,
                              color: badgeColor,
                              fontSize: '10px',
                              fontFamily: 'var(--cms-font-mono)',
                              fontWeight: 700,
                            }}
                          >
                            {evt.type.toUpperCase()}
                          </span>
                          <span style={{ fontWeight: 600 }}>{evt.label}</span>
                          {evt.target && (
                            <span style={{ color: 'var(--cms-text-muted)', fontSize: '11px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              ({evt.target})
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)' }}>
                          {formatExactTime(evt.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detailed 2-Column Specs: Hardware X-Ray & Network Telemetry */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* Hardware & GPU X-Ray */}
              <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} style={{ color: 'var(--cms-teal)' }} />
                  Hardware & Device "X-Ray"
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>GPU Chip / Renderer:</strong>{' '}
                    <span style={{ color: 'var(--cms-amber)', fontFamily: 'var(--cms-font-mono)' }}>
                      {selectedVisitor.gpuRenderer || 'Integrated / Protected'}
                    </span>
                  </div>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>CPU Cores:</strong>{' '}
                    {selectedVisitor.cpuCores ? `${selectedVisitor.cpuCores} Threads` : '—'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>System RAM:</strong>{' '}
                    {selectedVisitor.deviceMemoryGb ? `~${selectedVisitor.deviceMemoryGb} GB` : '—'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>Display:</strong>{' '}
                    {selectedVisitor.screenResolution || '—'} {selectedVisitor.pixelRatio ? `(@${selectedVisitor.pixelRatio}x Retina)` : ''}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>Input Method:</strong>{' '}
                    {selectedVisitor.touchPoints && selectedVisitor.touchPoints > 0 ? `Touchscreen (${selectedVisitor.touchPoints} touch points)` : 'Desktop Mouse / Keyboard (0 touch points)'}
                  </div>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>OS & Browser:</strong>{' '}
                    {selectedVisitor.os} · {selectedVisitor.browser} {selectedVisitor.browserVersion || ''}
                  </div>
                </div>
              </div>

              {/* Network, Carrier & ASN */}
              <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wifi size={14} style={{ color: 'var(--cms-violet)' }} />
                  Network & Connection Telemetry
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>ISP / Carrier:</strong>{' '}
                    <span style={{ fontWeight: 600 }}>{selectedVisitor.isp || '—'}</span>
                  </div>
                  {selectedVisitor.org && (
                    <div>
                      <strong style={{ color: 'var(--cms-text-muted)' }}>Organization / ASN:</strong>{' '}
                      {selectedVisitor.org}
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>Network Type:</strong>{' '}
                    <span style={{ textTransform: 'uppercase', fontFamily: 'var(--cms-font-mono)' }}>
                      {selectedVisitor.connectionType || 'Broadband / WiFi'}
                    </span>
                  </div>
                  {selectedVisitor.downlinkMbps && (
                    <div>
                      <strong style={{ color: 'var(--cms-text-muted)' }}>Estimated Bandwidth:</strong>{' '}
                      {selectedVisitor.downlinkMbps} Mbps
                    </div>
                  )}
                  {selectedVisitor.rttMs && (
                    <div>
                      <strong style={{ color: 'var(--cms-text-muted)' }}>Round-Trip Latency (RTT):</strong>{' '}
                      {selectedVisitor.rttMs} ms
                    </div>
                  )}
                  <div>
                    <strong style={{ color: 'var(--cms-text-muted)' }}>Color Scheme:</strong>{' '}
                    <span style={{ textTransform: 'capitalize' }}>{selectedVisitor.colorScheme || 'Default'}</span>
                  </div>
                  {selectedVisitor.languages && selectedVisitor.languages.length > 0 && (
                    <div>
                      <strong style={{ color: 'var(--cms-text-muted)' }}>Configured Languages:</strong>{' '}
                      {selectedVisitor.languages.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Journey & Sections */}
            <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} style={{ color: 'var(--cms-amber)' }} /> Visitor Exploration Journey
              </h4>
              <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                <strong style={{ color: 'var(--cms-text-muted)' }}>Referral Channel:</strong>{' '}
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: getReferrerBadge(selectedVisitor.referrerSource).bg,
                    color: getReferrerBadge(selectedVisitor.referrerSource).color,
                    border: `1px solid ${getReferrerBadge(selectedVisitor.referrerSource).border}`,
                    marginLeft: '4px',
                  }}
                >
                  {getReferrerBadge(selectedVisitor.referrerSource).label}
                </span>
                {selectedVisitor.referrer && selectedVisitor.referrer !== 'Direct' && (
                  <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    Origin: {selectedVisitor.referrer}
                  </div>
                )}
              </div>

              {selectedVisitor.sections && selectedVisitor.sections.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '10.5px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', marginBottom: '6px' }}>
                    SECTIONS EXPLORED IN CHRONOLOGICAL ORDER:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {selectedVisitor.sections.map((sec: string, idx: number) => {
                      const dwellSec = selectedVisitor.sectionDwellTimes?.[sec];
                      return (
                        <React.Fragment key={idx}>
                          <span
                            style={{
                              padding: '4px 10px',
                              backgroundColor: 'rgba(255,200,74,0.08)',
                              border: '1px solid rgba(255,200,74,0.25)',
                              borderRadius: '4px',
                              color: 'var(--cms-amber)',
                              fontSize: '11px',
                              fontFamily: 'var(--cms-font-mono)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span>{sec || '/'}</span>
                            {dwellSec && (
                              <span style={{ fontSize: '9.5px', color: 'var(--cms-text-secondary)', opacity: 0.8 }}>
                                ({dwellSec}s)
                              </span>
                            )}
                          </span>
                          {idx < selectedVisitor.sections.length - 1 && (
                            <ChevronRight size={12} style={{ color: 'var(--cms-text-muted)' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
