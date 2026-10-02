import { useState } from 'react';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async (event) => {
    event.preventDefault();
    if (loading) return;

    setError('');
    setReport(null);

    let direccion;

    try {
      direccion = new URL(url.trim());

      if (!['http:', 'https:'].includes(direccion.protocol)) {
        throw new Error();
      }
    } catch {
      setError('Escribe una dirección válida, como https://ejemplo.com');
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const res = await fetch(
        'https://guadalupetorres-ti-test.onrender.com/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: direccion.href }),
          signal: controller.signal
        }
      );

      if (!res.ok) {
        throw new Error(
          `El servidor no pudo completar el análisis (error ${res.status}).`
        );
      }

      const data = await res.json();

      if (typeof data.aiReport !== 'string') {
        throw new Error('El servidor respondió sin un reporte válido.');
      }

      setReport(data);
    } catch (err) {
      setError(
        err.name === 'AbortError'
          ? 'El análisis tardó demasiado. Inténtalo nuevamente.'
          : err.message || 'No se pudo conectar con el servidor.'
      );
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <main style={{
      maxWidth: 700,
      margin: '50px auto',
      padding: 20,
      fontFamily: 'sans-serif'
    }}>
      <h1>QA Auditor</h1>

      <form onSubmit={handleAnalyze}>
        <label htmlFor="url">Página web que quieres analizar</label>

        <input
          id="url"
          type="url"
          required
          placeholder="https://ejemplo.com"
          value={url}
          onChange={event => setUrl(event.target.value)}
          style={{
            display: 'block',
            boxSizing: 'border-box',
            width: '100%',
            padding: 12,
            margin: '12px 0'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: '10px 20px' }}
        >
          {loading ? 'Analizando...' : 'Analizar'}
        </button>
      </form>

      {loading && (
        <p role="status">Revisando la página. Esto puede tardar un momento.</p>
      )}

      {error && (
        <p role="alert" style={{
          background: '#fee2e2',
          color: '#991b1b',
          padding: 16,
          borderRadius: 8
        }}>
          {error}
        </p>
      )}

      {report && (
        <section style={{ marginTop: 30 }}>
          <h2>Reporte</h2>
          <pre style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            background: '#f4f4f4',
            color: '#172033',
            padding: 20,
            borderRadius: 8
          }}>
            {report.aiReport}
          </pre>
        </section>
      )}
    </main>
  );
}

export default App;
