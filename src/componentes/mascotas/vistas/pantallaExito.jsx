export default function PantallaExito({ titulo = "¡Guardado!", mensaje }) {
  return (
    <div className="container mt-3">
      <div className="row j-cont-cent">
        <div className="col-md-6 text-center">
          <div className="card br-3 p-3 shadow-sm">
            <h2 className="text-success fw-bold mt-2 mb-1">{titulo}</h2>
            <p className="text-muted">{mensaje}</p>
            <p className="text-muted">Redirigiendo...</p>
          </div>
        </div>
      </div>
    </div>
  );
}