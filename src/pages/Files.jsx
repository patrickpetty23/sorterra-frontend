import { useState, useEffect, useMemo } from 'react';
import { Search, FileText, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { processedFilesApi } from '../api';
import EmptyState from '../components/EmptyState';
import './Files.css';



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



function parseDestination(raw) {
  if (!raw) return '—';
  // Safely grab the first path enclosed in backticks (paths starting with a slash)
  const match = raw.match(/`(\/[^`]+)`/);
  return match && match[1] ? match[1].trim() : raw;
}

function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      // Temporarily injecting mock data for UI testing
      // const data = await processedFilesApi.getAll();
      
      const data = [
        {
          id: 'mock-1',
          originalName: 'IS 515 Syllabus--Winter 2026-v2 (2).pdf',
          fileExtension: '.pdf',
          status: 'pending',
          newPath: '**✓ Done** **File:** IS 515 Syllabus--Winter 2026-v2.pdf **Destination:** `/sites/sorterratesting/Shared Documents/School/IS 515/` **Actions taken:** 1. Cleaned filename (removed duplicate version suffix) 2. Created subject subfolder "IS 515" under School 3. Moved syllabus to School/IS 515 **Reason:** This is a course syllabus for IS 515, matching the [School] recipe rule for class-related documents sorted by subject.',
          processedAt: '2026-03-19T20:30:00Z',
          createdAt: '2026-03-19T20:30:00Z'
        },
        {
          id: 'mock-2',
          originalName: 'Redo_AEO_Strategy_Report_Formal.pdf',
          fileExtension: '.pdf',
          status: 'pending',
          newPath: '**✓ Sorted successfully** **File:** Redo_AEO_Strategy_Report_Formal.pdf **Destination:** `/sites/sorterratesting/Shared Documents/Technical/Strategy/` **Reason:** This is a formal strategy report (AEO Strategy Report), which qualifies as a technical/analytical document. Sorted into Technical with a new "Strategy" subfolder to organize strategic analysis documents.',
          processedAt: '2026-03-19T20:30:00Z',
          createdAt: '2026-03-19T20:30:00Z'
        },
        {
          id: 'mock-3',
          originalName: 'Final_Exam_Practice_1.docx',
          fileExtension: '.docx',
          status: 'pending',
          newPath: '**✓ Done** **Final_Exam_Practice_1.docx** → `/User_test/Technical/Python/` **Why:** Despite the misleading filename, the document contains a Python package installation error log (spacy NLP model deployment issue). Applied the **Technical recipe** and sorted into a Python subfolder based on the technical topic.',
          processedAt: '2026-03-19T20:27:00Z',
          createdAt: '2026-03-19T20:27:00Z'
        },
        {
          id: 'mock-4',
          originalName: 'PDF_Loader_Comp (1).pdf',
          fileExtension: '.pdf',
          status: 'pending',
          newPath: '**✓ Done** **File:** PDF_Loader_Comp.pdf **Moved to:** `/sites/sorterratesting/Shared Documents/Technical/PDF Processing/` **Actions taken:** 1. Renamed file to remove "(1)" suffix 2. Created new **Technical** folder (blue tag) with **PDF Processing** subfolder 3. Moved document to Technical/PDF Processing **Reason:** The document name suggests it\'s a technical document related to PDF loading/comparison functionality, matching the [Technical] sorting rule for technical documents organized by topic.',
          processedAt: '2026-03-19T20:27:00Z',
          createdAt: '2026-03-19T20:27:00Z'
        }
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let result = [...files];

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
  }, [files, searchTerm]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
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

                <th className="col-path">Destination</th>
                <th>Processed</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file) => {

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

                      <td className="col-path">
                        {file.newPath ? (
                          <code className="file-path">{parseDestination(file.newPath)}</code>
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
                        <td colSpan={4}>
                          <div className="file-detail">
                            {file.errorMessage && (
                              <div className="file-detail-error" style={{ marginBottom: '1rem' }}>
                                <AlertCircle size={14} />
                                <span>{file.errorMessage}</span>
                              </div>
                            )}
                            {file.newPath ? (
                              <div className="file-detail-meta">
                                <span className="detail-label">Agent Output</span>
                                <pre className="meta-json" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                                  {file.newPath}
                                </pre>
                              </div>
                            ) : (
                              <div className="file-muted">No agent output recorded</div>
                            )}
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

      </div>
    </div>
  );
}

export default Files;
