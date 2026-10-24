import React, { useEffect, useState } from 'react';
import { Server, Activity, ShieldCheck } from 'lucide-react';

interface CmsLoadingStateProps {
  title?: string;
  subtitle?: string;
  fullScreen?: boolean;
  minHeight?: string | number;
}

export const CmsLoadingState: React.FC<CmsLoadingStateProps> = ({
  title = 'Connecting to Guna CMS...',
  subtitle = 'Fetching dynamic data and verifying cloud connection',
  fullScreen = false,
  minHeight = '320px',
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isColdStart = seconds >= 8;

  return (
    <div
      className={`cms-loading-container ${fullScreen ? 'cms-loading-fullscreen' : ''}`}
      style={!fullScreen ? { minHeight } : undefined}
    >
      <div className="cms-loading-card">
        {/* Orbital Radar Spinner */}
        <div className="cms-loading-orbit-wrap">
          <div className="cms-loading-ring-outer"></div>
          <div className="cms-loading-ring-inner"></div>
          <div className="cms-loading-center-emblem">G</div>
        </div>

        <div className="cms-loading-content">
          <h3 className="cms-loading-title">{title}</h3>
          <p className="cms-loading-sub">{subtitle}</p>

          {/* Shimmer progress bar */}
          <div className="cms-loading-progress-track">
            <div className="cms-loading-progress-shimmer"></div>
          </div>

          {/* Status Telemetry */}
          <div className="cms-loading-status-bar">
            <div className="cms-loading-status-badge">
              <span className="cms-loading-pulse-dot"></span>
              <span>{isColdStart ? 'CONTAINER SPINNING UP' : 'ACTIVE CLOUD REQUEST'}</span>
            </div>
            <div className="cms-loading-timer-badge">
              <span>{seconds}s elapsed</span>
            </div>
          </div>

          {isColdStart && (
            <div className="cms-loading-notice">
              <Server size={14} className="cms-loading-notice-icon" />
              <span>
                Backend is cold-starting from idle sleep (~15-30s on free-tier). Once awake, pages will load instantly.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
