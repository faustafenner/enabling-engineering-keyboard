import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Stats() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const state = (window.history && window.history.state && window.history.state && window.history.state.usr) ? window.history.state.usr : null;
  // react-router puts navigate state under history.state.usr in many setups; fall back to localStorage
  const saved = localStorage.getItem('perLetterStats');
  const statsFromStorage = saved ? JSON.parse(saved) : {};
  const stats = state && state.perLetterStats ? state.perLetterStats : statsFromStorage;

  // Build a sorted list of letters A-Z that have data
  const letters = Object.keys(stats).sort();

  function downloadCSV() {
    const rows = [['Letter', 'Count', 'Avg(ms)', 'Samples (last 10)']];
    letters.forEach(letter => {
      const arr = stats[letter] || [];
      const avg = arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : '';
      const row = [letter.toUpperCase(), arr.length, avg, arr.slice(-10).map(v => Math.round(v)).join(';')];
      rows.push(row);
    });
    const csv = rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typing_stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function computeAvg(arr) {
    if (!arr || arr.length === 0) return null;
    const sum = arr.reduce((s, v) => s + v, 0);
    return Math.round(sum / arr.length);
  }

  return (
    <div style={{ padding: 24, color: '#fff' }}>
      <h1>Typing Stats</h1>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)}>Back</button>
        <button onClick={downloadCSV}>Download CSV</button>
        <button
          onClick={() => {
            try { 
              localStorage.removeItem('perLetterStats'); 
              localStorage.removeItem('intervals'); 
            } catch(e) {}
            // Trigger re-render by updating state instead of reloading page
            setRefreshKey(prev => prev + 1);
          }}
          style={{ background: '#d32f2f', color: '#fff' }}
        >Reset</button>
      </div>
      {letters.length === 0 ? (
        <p>No data yet. Type some letters in the Display page to collect timings.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Letter</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Count</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Avg (ms)</th>
              <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #444' }}>Samples (last 10)</th>
            </tr>
          </thead>
          <tbody>
            {letters.map(letter => (
              <tr key={letter}>
                <td style={{ padding: 8, borderBottom: '1px solid #333' }}>{letter.toUpperCase()}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #333' }}>{stats[letter].length}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #333' }}>{computeAvg(stats[letter]) ?? '—'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #333' }}>{(stats[letter].slice(-10).map(v => Math.round(v))).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Stats;
