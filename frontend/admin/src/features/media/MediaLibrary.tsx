import React, { useEffect, useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Trash2,
  Copy,
  Check,
  FileText,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CmsLoadingState } from '../../components/CmsLoadingState';

export const MediaLibrary: React.FC = () => {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMedia({ search, limit: 50 });
      setMediaList(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [search]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await api.uploadMedia(file, file.name.replace(/\.[^/.]+$/, ''));
      setSuccessMsg(`File "${file.name}" uploaded successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await loadMedia();
    } catch (err: any) {
      setError(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (mediaId: string, filename: string) => {
    if (!mediaId || mediaId === 'undefined') {
      alert('Cannot delete: Missing media asset ID.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) return;

    try {
      await api.deleteMedia(mediaId);
      setSuccessMsg(`Deleted "${filename}".`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setMediaList((prev) => prev.filter((m) => (m._id || m.id) !== mediaId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={22} color="var(--cms-amber)" />
            Media Library
          </h2>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Manage hero portraits, project assets, and documents
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
            accept="image/*,.pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="cms-btn cms-btn-primary"
          >
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
          </button>
        </div>
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

      {/* Search Bar */}
      <div className="cms-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="cms-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search assets by filename or alt text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--cms-text-muted)',
            }}
          />
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <CmsLoadingState
          title="Loading Media Assets..."
          subtitle="Connecting to Cloudinary storage and retrieving image assets"
        />
      ) : mediaList.length === 0 ? (
        <div
          className="cms-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            border: '2px dashed var(--cms-border)',
            backgroundColor: 'transparent',
          }}
        >
          <Upload size={36} color="var(--cms-text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--cms-text)' }}>No media files found</h3>
          <p style={{ color: 'var(--cms-text-muted)', fontSize: '0.85rem', margin: '0 0 1.5rem 0' }}>
            Upload portraits, screenshots, or documents to use them in your pages.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="cms-btn cms-btn-primary"
          >
            <Upload size={16} />
            <span>Select File to Upload</span>
          </button>
        </div>
      ) : (
        <div className="cms-media-grid">
          {mediaList.map((media) => {
            const mediaId = media._id || media.id;
            const filename = media.originalFilename || media.filename || 'media asset';
            const size = media.fileSizeBytes ?? media.size;
            const isImage = media.mimeType?.startsWith('image/');
            const isPdf = media.mimeType?.includes('pdf') || filename.toLowerCase().endsWith('.pdf');

            return (
              <div key={mediaId || media.url} className="cms-media-card">
                <div className="cms-media-thumb">
                  {isImage ? (
                    <img src={media.url} alt={media.altText || media.alt || filename} loading="lazy" />
                  ) : (
                    <FileText size={36} color="var(--cms-amber)" />
                  )}
                </div>

                <div className="cms-media-info">
                  <div className="cms-media-name" title={filename}>
                    {filename}
                  </div>
                  <div className="cms-media-size">
                    {size ? `${(size / 1024).toFixed(1)} KB` : 'Unknown size'} •{' '}
                    {isPdf ? 'PDF' : isImage ? 'Image' : 'File'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem' }}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(media.url, mediaId)}
                      className="cms-btn cms-btn-secondary cms-btn-sm"
                      style={{ flex: 1 }}
                      title="Copy URL"
                    >
                      {copiedId === mediaId ? <Check size={14} color="var(--cms-success)" /> : <Copy size={14} />}
                      <span style={{ fontSize: '0.75rem' }}>{copiedId === mediaId ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(mediaId, filename)}
                      className="cms-btn cms-btn-danger cms-btn-sm cms-btn-icon"
                      title="Delete Asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
