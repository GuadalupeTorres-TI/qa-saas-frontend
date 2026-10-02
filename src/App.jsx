import { useState } from 'react';
import './index.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  async function handleAnalyze(event) {
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
      setError('Escribe una dirección válida, como https://example.com');
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const response = await fetch(
        'https://guadalupetorres-ti-test.onrender.com/analyze',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: direccion.href }),
          signal: controller.signal
        }
      );

      if (!response.ok) {
        throw new Error(
          `No se pudo completar el análisis (error ${response.status}).`
        );
      }

      const data = await response.json();

      if (typeof data.aiReport !== 'string' || !data.rawData) {
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
  }

  function downloadReport() {
    if (!report) return;

    const blob = new Blob([report.aiReport], {
      type: 'text/plain;charset=utf-8'
    });
    const address = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = address;
    link.download = 'reporte-qa.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(address), 1000);
  }

  const data = report?.rawData;
  const issues = data?.brokenLinks ?? [];
  const consoleErrors = data?.consoleErrors ?? [];
  const httpErrors = issues.filter(item => typeof item.status === 'number');
  const connectionErrors = issues.filter(item => typeof item.status !== 'number');

  return (
    <main className="qa-app">
      <header className="topbar">
        <a className="brand" href="#inicio">
          <span className="brand-icon" aria-hidden="true">QA</span>
          QA Auditor
        </a>
        <span className="tag">Auditoría web automatizada</span>
      </header>

      <section className="hero" id="inicio">
        <p className="eyebrow">EXPLORA · REVISA · MEJORA</p>
        <h1>Conoce mejor<br /><span>tu sitio web.</span></h1>
        <p className="intro">
          Revisa enlaces y errores de consola desde una sola dirección.
          Obtén un reporte claro para orientar tus siguientes pruebas.
        </p>
      </section>

      <section className="panel analyzer" aria-labelledby="analyzer-title">
        <h2 id="analyzer-title">Comienza una revisión</h2>
        <form onSubmit={handleAnalyze}>
          <label htmlFor="url">Dirección de la página</label>
          <div className="input-row">
            <input
              id="url"
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              disabled={loading}
              onChange={event => setUrl(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Analizando…' : 'Analizar sitio →'}
            </button>
          </div>
          <p className="hint">
            Se revisa una página y hasta 20 enlaces HTTP/HTTPS.
          </p>
        </form>

        {loading && (
          <div className="loading-message" role="status">
            <span className="spinner" aria-hidden="true" />
            Revisando la página. El proceso puede tardar hasta dos minutos.
          </div>
        )}

        {error && <p className="error-message" role="alert">{error}</p>}
      </section>

      {report && (
        <section className="results" aria-labelledby="results-title">
          <div className="results-heading">
            <div>
              <p className="eyebrow" role="status">ANÁLISIS COMPLETADO</p>
              <h2 id="results-title">{data.title || 'Página sin título'}</h2>
              <p className="site-address">{data.url}</p>
            </div>
            <div className="actions">
              <button className="secondary" onClick={downloadReport}>
                Descargar TXT
              </button>
              <button className="secondary" onClick={() => window.print()}>
                Imprimir / PDF
              </button>
            </div>
          </div>

          <div className="stats">
            <article className="stat">
              <span>Enlaces revisados</span>
              <strong>{data.checkedLinks ?? '—'}</strong>
              <small>{data.totalLinksFound} encontrados</small>
            </article>
            <article className="stat">
              <span>Respuestas HTTP de error</span>
              <strong className={httpErrors.length ? 'warning' : ''}>
                {httpErrors.length}
              </strong>
              <small>Requieren interpretación</small>
            </article>
            <article className="stat">
              <span>Errores de consola</span>
              <strong className={consoleErrors.length ? 'warning' : ''}>
                {consoleErrors.length}
              </strong>
              <small>Durante la navegación</small>
            </article>
            <article className="stat">
              <span>Apertura y navegación</span>
              <strong>
                {Number.isFinite(data.loadTimeMs)
                  ? `${(data.loadTimeMs / 1000).toFixed(2)} s`
                  : '—'}
              </strong>
              <small>Incluye arranque del navegador</small>
            </article>
          </div>

          <div className="panel findings">
            <h3>Enlaces que requieren revisión</h3>
            <p className="hint">
              Una respuesta de error no confirma por sí sola un enlace roto.
              Comprueba también el acceso desde tu navegador.
            </p>
            {issues.length === 0 ? (
              <p>No se detectaron incidencias en los enlaces revisados.</p>
            ) : (
              <ul className="issue-list">
                {issues.map((item, index) => (
                  <li key={`${item.link}-${index}`}>
                    <span className="badge">
                      {typeof item.status === 'number'
                        ? `HTTP ${item.status}`
                        : 'Sin comprobar'}
                    </span>
                    <span>{item.link}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="hint">
              Enlaces sin comprobar por problemas de conexión: {connectionErrors.length}.
            </p>
          </div>

          <details className="panel report-detail" open>
            <summary>Reporte completo</summary>
            <pre>{report.aiReport}</pre>
          </details>

          <p className="scope">
            Reporte generado mediante reglas automáticas, sin IA.
            Esta revisión no sustituye pruebas funcionales, de accesibilidad
            o de seguridad. El tiempo mostrado no es una medición de Core Web Vitals.
          </p>
        </section>
      )}

      <footer>
        QA Auditor · Proyecto de Guadalupe Torres Reyes
      </footer>
    </main>
  );
}

export default App;
