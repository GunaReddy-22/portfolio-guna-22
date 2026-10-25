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
            <h1 className="cms-page-title">Visitor Analytics & Live Engagement</h1>
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
            Elite real-time session telemetry: arrival in-time, departure out-time, precise city/ISP resolution, and section journeys
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

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Total Page Views */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Pageviews
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--cms-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.totalVisits ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TrendingUp size={12} style={{ color: 'var(--cms-success)' }} /> Filtered clean telemetry
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Unique Visitors
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(20, 184, 166, 0.12)',
                color: 'var(--cms-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {overview?.uniqueVisitors ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            Distinct network IPs & devices
          </div>
        </div>

        {/* Top Location */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Location
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                color: 'var(--cms-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Globe2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cms-text)', lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{renderCountryFlag(topCountry?.code, 'md')}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {topCountry?.country || 'No visits yet'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            {topCity ? `${topCity.city} (${topCountry?.count || 0} visits)` : 'Awaiting traffic'}
          </div>
        </div>

        {/* Avg Engagement Time */}
        <div className="cms-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '12px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Avg. Time on Site
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--cms-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cms-text)', lineHeight: 1 }}>
            {formatDuration(overview?.avgDuration)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '0.5rem' }}>
            Measured via live heartbeat
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {overview?.deviceBreakdown?.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px',
                      backgroundColor: 'var(--cms-surface)',
                      border: '1px solid var(--cms-border)',
                      borderRadius: 'var(--cms-radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {getDeviceIcon(d.device)}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{d.device}</div>
                      <div style={{ fontSize: '11px', color: 'var(--cms-text-muted)', fontFamily: 'var(--cms-font-mono)' }}>
                        {d.count} hits
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Live Visitor Log Table */}
      <div className="cms-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--cms-success)', display: 'inline-block' }} />
              Live Visitor Feed
              <span style={{ fontSize: '12px', color: 'var(--cms-text-muted)', fontWeight: 'normal' }}>
                ({totalLogs} total recorded)
              </span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--cms-text-secondary)', margin: '4px 0 0' }}>
              Click any row to inspect full visitor details, network carrier, in/out timestamps, and section journey
            </p>
          </div>

          {/* Search & Device Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cms-text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search IP, City, Country, Path..."
                className="cms-input"
                style={{ paddingLeft: '32px', width: '220px', fontSize: '12px' }}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="cms-select"
              style={{ fontSize: '12px', width: '130px' }}
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
        {logs.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
            <Globe2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: '14px', fontWeight: 600 }}>No visitor records found</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {search ? 'Try clearing your search query' : 'Visitor visits to gunasai.in will appear here in real-time.'}
            </div>
          </div>
        ) : (
          <div className="cms-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="cms-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>In Time</th>
                  <th style={{ width: '105px' }}>Out / Status</th>
                  <th style={{ width: '150px' }}>Visitor IP</th>
                  <th>Location (City & Country)</th>
                  <th>ISP / Carrier</th>
                  <th>Device / Browser</th>
                  <th>Referral Origin</th>
                  <th>Section Viewed</th>
                  <th style={{ textAlign: 'right', width: '80px' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => {
                  const refBadge = getReferrerBadge(log.referrerSource);
                  const isCopied = copiedIp === log.ip;
                  const active = isVisitorActive(log.lastActiveAt, log.visitedAt);

                  const displayCity = log.city && log.city !== 'Unknown' ? log.city : '';
                  const displayRegion = log.region && log.region !== 'Unknown' ? log.region : '';
                  const displayCountry = log.country && log.country !== 'Unknown' ? log.country : 'Unknown';

                  let locationText = displayCountry;
                  if (displayCity && displayRegion) {
                    locationText = `${displayCity}, ${displayRegion}, ${displayCountry}`;
                  } else if (displayCity) {
                    locationText = `${displayCity}, ${displayCountry}`;
                  }

                  const displayIsp = log.isp && log.isp !== 'Cloudflare Network' ? log.isp : (log.org || 'Direct Network');

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
                              fontSize: '10.5px',
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'var(--cms-font-mono)',
                              fontSize: '12px',
                              color: log.isBot ? 'var(--cms-text-muted)' : 'var(--cms-text)',
                            }}
                          >
                            {log.ip}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyIp(log.ip, e)}
                            title="Copy IP"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isCopied ? 'var(--cms-success)' : 'var(--cms-text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                          >
                            {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{renderCountryFlag(log.countryCode)}</span>
                          <div>
                            <span style={{ fontWeight: 600 }}>{displayCity || displayCountry}</span>
                            {displayCity && (
                              <span style={{ color: 'var(--cms-text-muted)', fontSize: '11.5px' }}>
                                , {displayRegion ? `${displayRegion}, ` : ''}{displayCountry}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ISP / Carrier */}
                      <td>
                        <span style={{ fontSize: '11.5px', color: 'var(--cms-text-secondary)', fontFamily: 'var(--cms-font-mono)' }}>
                          {displayIsp}
                        </span>
                      </td>

                      {/* Device & OS */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getDeviceIcon(log.deviceType)}
                          <span style={{ fontWeight: 500 }}>
                            {log.browser} · {log.os}
                          </span>
                        </div>
                      </td>

                      {/* Referrer */}
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: refBadge.bg,
                            color: refBadge.color,
                            border: `1px solid ${refBadge.border}`,
                          }}
                        >
                          {refBadge.label}
                        </span>
                      </td>

                      {/* Visited Path */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--cms-font-mono)',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--cms-border)',
                          }}
                        >
                          {log.path || '/'}
                        </span>
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

      {/* Visitor Session Inspector Modal (Elite Platform Detail View) */}
      {selectedVisitor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
              maxWidth: '680px',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--cms-border)', paddingBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{renderCountryFlag(selectedVisitor.countryCode, 'md')}</span>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                    {selectedVisitor.city ? `${selectedVisitor.city}, ${selectedVisitor.country}` : (selectedVisitor.country || 'Visitor Telemetry')}
                  </h2>
                  {isVisitorActive(selectedVisitor.lastActiveAt, selectedVisitor.visitedAt) ? (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontFamily: 'var(--cms-font-mono)',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--cms-success)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      🟢 Active Now
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontFamily: 'var(--cms-font-mono)',
                        backgroundColor: 'rgba(100, 116, 139, 0.15)',
                        color: 'var(--cms-text-muted)',
                      }}
                    >
                      Session Ended
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '13px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-secondary)' }}>
                  <span>IP: {selectedVisitor.ip}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyIp(selectedVisitor.ip)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--cms-amber)', cursor: 'pointer', padding: '0 4px' }}
                  >
                    {copiedIp === selectedVisitor.ip ? 'Copied!' : 'Copy'}
                  </button>
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--cms-surface)',
                borderRadius: 'var(--cms-radius-md)',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                border: '1px solid var(--cms-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  In Time (Arrival)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--cms-amber)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatExactTime(selectedVisitor.visitedAt)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  {formatFullDate(selectedVisitor.visitedAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  Out Time (Last Active)
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--cms-teal)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatExactTime(selectedVisitor.lastActiveAt || selectedVisitor.visitedAt)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  {formatFullDate(selectedVisitor.lastActiveAt || selectedVisitor.visitedAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', textTransform: 'uppercase' }}>
                  Total Duration
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px', color: 'var(--cms-text)', fontFamily: 'var(--cms-font-mono)' }}>
                  {formatDuration(selectedVisitor.durationSeconds)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cms-text-secondary)', marginTop: '2px' }}>
                  Session duration
                </div>
              </div>
            </div>

            {/* Detailed Grid: Location & Network */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {/* Location Card */}
              <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ color: 'var(--cms-teal)' }} /> Location Details
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>City:</strong> {selectedVisitor.city || '—'}</div>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>Region/State:</strong> {selectedVisitor.region || '—'}</div>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>Country:</strong> {selectedVisitor.country} ({selectedVisitor.countryCode})</div>
                  {selectedVisitor.zip && <div><strong style={{ color: 'var(--cms-text-muted)' }}>Postal Code:</strong> {selectedVisitor.zip}</div>}
                  {selectedVisitor.timezone && <div><strong style={{ color: 'var(--cms-text-muted)' }}>Timezone:</strong> {selectedVisitor.timezone}</div>}
                </div>
              </div>

              {/* Network / ISP Card */}
              <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wifi size={14} style={{ color: 'var(--cms-amber)' }} /> Network & Carrier
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>ISP:</strong> {selectedVisitor.isp || '—'}</div>
                  {selectedVisitor.org && <div><strong style={{ color: 'var(--cms-text-muted)' }}>Org:</strong> {selectedVisitor.org}</div>}
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>Device:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedVisitor.deviceType}</span></div>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>Operating System:</strong> {selectedVisitor.os}</div>
                  <div><strong style={{ color: 'var(--cms-text-muted)' }}>Browser:</strong> {selectedVisitor.browser} {selectedVisitor.browserVersion}</div>
                  {selectedVisitor.screenResolution && <div><strong style={{ color: 'var(--cms-text-muted)' }}>Resolution:</strong> {selectedVisitor.screenResolution}</div>}
                </div>
              </div>
            </div>

            {/* Navigation Journey & Sections */}
            <div style={{ backgroundColor: 'var(--cms-surface)', padding: '1rem', borderRadius: 'var(--cms-radius-md)', border: '1px solid var(--cms-border)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={14} style={{ color: 'var(--cms-violet)' }} /> Visitor Exploration Journey
              </h4>
              <div style={{ fontSize: '12.5px', marginBottom: '8px' }}>
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
                  <div style={{ fontSize: '11.5px', color: 'var(--cms-text-secondary)', marginTop: '4px', wordBreak: 'break-all' }}>
                    Origin: {selectedVisitor.referrer}
                  </div>
                )}
              </div>

              {selectedVisitor.sections && selectedVisitor.sections.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--cms-font-mono)', color: 'var(--cms-text-muted)', marginBottom: '6px' }}>
                    SECTIONS VIEWED IN THIS SESSION:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    {selectedVisitor.sections.map((sec: string, idx: number) => (
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
                          }}
                        >
                          {sec || '/'}
                        </span>
                        {idx < selectedVisitor.sections.length - 1 && (
                          <ChevronRight size={12} style={{ color: 'var(--cms-text-muted)' }} />
                        )}
                      </React.Fragment>
                    ))}
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
