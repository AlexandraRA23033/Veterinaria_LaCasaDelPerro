export default function TarjetaDueno({ nombreUsuario, correoUsuario, telefonoUsuario, cantidadMascotas }) {
  return (
    <div className="card card-info br-3 shadow-sm p-3 mb-3">
      <h3 className="fs-3 fw-bold text-light">Datos del Dueño</h3>
      <div className="card card-light br-2 p-2 mt-1">
        <div className="d-flex f-wrap gap-3">
          <div>
            <p className="text-muted">NOMBRE</p>
            <p className="fw-bold text-dark">{nombreUsuario}</p>
          </div>
          <div>
            <p className="text-muted">CORREO</p>
            <p className="fw-bold text-dark">{correoUsuario}</p>
          </div>
          <div>
            <p className="text-muted">TELÉFONO</p>
            <p className="fw-bold text-dark">{telefonoUsuario || "No registrado"}</p>
          </div>

          {cantidadMascotas !== undefined && (
            <div className="ml-auto">
              <p className="text-muted">MASCOTAS</p>
              <span className={`badge ${cantidadMascotas > 0 ? "info" : "secondary"}`}>
                {cantidadMascotas} mascota{cantidadMascotas !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}