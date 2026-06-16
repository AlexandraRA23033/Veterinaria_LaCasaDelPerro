export default function PageHeader({ titulo, subtitulo, colorTitulo = "text-primary", onVolver, children }) {
  return (
    <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
      <div>
        <h2 className={`fs-2 fw-bold ${colorTitulo}`}>{titulo}</h2>
        {subtitulo && <p className="text-muted">{subtitulo}</p>}
      </div>
      <div className="d-flex gap-1">
        {children}
        {onVolver && (
          <button className="btn-outline-secondary" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>
    </div>
  );
}