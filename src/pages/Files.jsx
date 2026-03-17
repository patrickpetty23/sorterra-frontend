import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { processedFilesApi } from '../api';
import EmptyState from '../components/EmptyState';
import './Files.css';

const STATUS_CONFIG = {
  completed: { label: 'Completed', className: 'file-status-completed' },
  pending: { label: 'Pending', className: 'file-status-pending' },
  processing: { label: 'Processing', className: 'file-status-processing' },
  failed: { label: 'Failed', className: 'file-status-failed' },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatConfidence(value) {
  if (value == null) return '—';
  return `${(value * 100).toFixed(0)}%`;
}

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const data = await processedFilesApi.getAll();
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const classifiedTypes = useMemo(() => {
    const types = new Set(files.map((f) => f.classifiedType).filter(Boolean));
    return ['all', ...Array.from(types).sort()];
  }, [files]);

  const filtered = useMemo(() => {
    let result = [...files];

    if (statusFilter !== 'all') {
      result = result.filter((f) => f.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((f) => f.classifiedType === typeFilter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.originalName.toLowerCase().includes(term) ||
          (f.newName || '').toLowerCase().includes(term) ||
          (f.originalPath || '').toLowerCase().includes(term) ||
          (f.newPath || '').toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return result;
  }, [files, statusFilter, typeFilter, searchTerm]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const parseMetadata = (raw) => {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw || '{}';
    }
  };

  if (loading) {
    return (
      <div className="files-page">
        <div className="files-toolbar card">
          <div className="skeleton skeleton-toolbar" />
        </div>
        <div className="files-table-wrapper card">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="file-row-skeleton">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="files-page">
        <div className="card">
          <EmptyState
            icon={AlertCircle}
            title="Failed to load files"
            description={error}
            action={fetchFiles}
            actionLabel="Retry"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="files-page">
      {/* Toolbar */}
      <div className="files-toolbar card">
        <div className="toolbar-left">
          <div className="toolbar-search">
            <Search size={16} color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="toolbar-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {classifiedTypes.length > 1 && (
            <select
              className="toolbar-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              {classifiedTypes.map((t) => (
                <option key={t} value={t}>
                  {t === 'all' ? 'All Types' : t}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card">
          {files.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No processed files"
              description="Files will appear here once Sorterra starts processing documents from your connected SharePoint sites."
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No matching files"
              description="Try adjusting your filters or search term."
            />
          )}
        </div>
      ) : (
        <div className="files-table-wrapper card">
          <table className="files-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>File</th>
                <th>Status</th>
                <th>Type</th>
                <th className="th-center col-confidence">Confidence</th>
                <th className="col-path">Destination</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => {
                const sc = STATUS_CONFIG[file.status] || STATUS_CONFIG.pending;
                const isExpanded = expandedId === file.id;
                return (
                  <>
                    <tr
                      key={file.id}
                      className={`file-row${isExpanded ? ' file-row-expanded' : ''}`}
                      onClick={() => toggleExpand(file.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(file.id); } }}
                      tabIndex={0}
                      role="row"
                      aria-expanded={isExpanded}
                    >
                      <td className="td-expand" aria-hidden="true">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td>
                        <div className="file-name-cell">
                          <span className="file-original-name">{file.originalName}</span>
                          {file.newName && file.newName !== file.originalName && (
                            <span className="file-new-name">&rarr; {file.newName}</span>
                          )}
                          {file.fileExtension && (
                            <span className="file-ext-badge">{file.fileExtension}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`file-status-badge ${sc.className}`}>{sc.label}</span>
                      </td>
                      <td>
                        {file.classifiedType ? (
                          <span className="file-type-badge">{file.classifiedType}</span>
                        ) : (
                          <span className="file-muted">—</span>
                        )}
                      </td>
                      <td className="td-center col-confidence">
                        <span className="file-confidence">{formatConfidence(file.classificationConfidence)}</span>
                      </td>
                      <td className="col-path">
                        {file.newPath ? (
                          <code className="file-path">{file.newPath}</code>
                        ) : (
                          <span className="file-muted">—</span>
                        )}
                      </td>
                      <td>
                        <span className="file-date">{formatDate(file.processedAt)}</span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${file.id}-detail`} className="file-detail-row">
                        <td colSpan={7}>
                          <div className="file-detail">
                            <div className="file-detail-grid">
                              <div className="detail-item">
                                <span className="detail-label">Original Path</span>
                                <span className="detail-value">{file.originalPath || '—'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">New Path</span>
                                <span className="detail-value">{file.newPath || '—'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">File Size</span>
                                <span className="detail-value">{formatFileSize(file.fileSizeBytes)}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">MIME Type</span>
                                <span className="detail-value">{file.mimeType || '—'}</span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Created</span>
                                <span className="detail-value">{formatDate(file.createdAt)}</span>
                              </div>
                              {file.appliedRecipeId && (
                                <div className="detail-item">
                                  <span className="detail-label">Recipe ID</span>
                                  <span className="detail-value detail-mono">{file.appliedRecipeId}</span>
                                </div>
                              )}
                            </div>
                            {file.errorMessage && (
                              <div className="file-detail-error">
                                <AlertCircle size={14} />
                                <span>{file.errorMessage}</span>
                              </div>
                            )}
                            <div className="file-detail-meta">
                              <span className="detail-label">Extracted Metadata</span>
                              <pre className="meta-json">{parseMetadata(file.extractedMetadata)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="files-summary">
        {filtered.length} of {files.length} file{files.length !== 1 ? 's' : ''}
        {statusFilter !== 'all' && ` (${statusFilter})`}
      </div>
    </div>
  );
}

export default Files;
