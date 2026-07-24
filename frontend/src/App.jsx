import { useState } from 'react';
import './index.css';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const handleAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch('http://localhost:5000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🌐 Website Health & SEO Auditor</h1>
      <p>Enter any URL to get an instant technical audit report.</p>

      <form onSubmit={handleAudit} className="audit-form">
        <input
          type="text"
          placeholder="e.g. https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Auditing...' : 'Audit URL'}
        </button>
      </form>

      {error && <div className="error-card">⚠️ {error}</div>}

      {report && (
        <div className="report-card">
          <h2>Audit Report for: <span>{report.url}</span></h2>
          
          <div className="metrics-grid">
            <div className="metric">
              <label>HTTP Status</label>
              <span className={`badge ${report.status === 200 ? 'success' : 'warning'}`}>
                {report.status}
              </span>
            </div>

            <div className="metric">
              <label>Response Time</label>
              <span>⚡ {report.responseTimeMs} ms</span>
            </div>

            <div className="metric">
              <label>H1 Headers</label>
              <span>{report.h1Count} found</span>
            </div>

            <div className="metric">
              <label>Missing Alt Images</label>
              <span className={report.imagesMissingAlt > 0 ? 'text-warn' : ''}>
                🖼️ {report.imagesMissingAlt} / {report.totalImages}
              </span>
            </div>

            <div className="metric">
              <label>Approx. Word Count</label>
              <span>📝 {report.wordCount} words</span>
            </div>
          </div>

          <div className="details-section">
            <div className="detail-item">
              <strong>Page Title:</strong>
              <p>{report.title}</p>
            </div>
            <div className="detail-item">
              <strong>Meta Description:</strong>
              <p>{report.metaDescription}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}