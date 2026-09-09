import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    const res = await fetch('https://guadalupetorres-ti-test.onrender.com/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>QA Auditor</h1>
      <input
        type="text"
        placeholder="https://ejemplo.com"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ width: '70%', padding: 8 }}
      />
      <button onClick={handleAnalyze} style={{ padding: 8, marginLeft: 10 }}>
        {loading ? 'Analizando...' : 'Analizar'}
      </button>

      {report && (
        <div style={{ marginTop: 30 }}>
          <h3>Reporte</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: 15 }}>
            {report.aiReport}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;