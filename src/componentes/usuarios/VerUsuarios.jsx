import { useLocation, useNavigate } from "react-router-dom";

export default function VerUsuario() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const usuario = state?.usuario;

  if (!usuario) {
    navigate("/usuarios");
    return null;
  }

  return (
    <div>
      <div className="container">
        <div className="d-flex align-item j-cont-bet mb-2">
          <h2 className="fs-2 fw-bold text-primary">Detalle del usuario</h2>
          <button
            className="btn-outline-secondary btn-sm"
            onClick={() => navigate(-1)}
          >
            ← Volver
          </button>
        </div>

        <div className="row j-cont-cent">
          <div className="col-md-8 col-lg-6">
            <div className="card br-3 shadow-sm overflow-hidden">
              <div className="card-header card-primary">
                <div className="d-flex j-cont-bet align-item">
                  <span className="fw-bold text-light">
                    {usuario.nombre_completo}
                  </span>
                  <span className="badge badge-pildora bg-light text-primary">
                    {usuario.rol === "admin" ? "Administrador" : "Cliente"}
                  </span>
                </div>
              </div>

              <div className="card-body p-3">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1">Nombre completo</p>
                    <p className="fw-bold text-dark">
                      {usuario.nombre_completo}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1">Correo electrónico</p>
                    <p className="fw-bold text-dark">{usuario.correo}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1">Teléfono</p>
                    <p className="fw-bold text-dark">
                      {usuario.telefono || "—"}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="text-muted mb-1">Rol</p>
                    <p className="fw-bold text-dark">
                      {usuario.rol === "admin" ? "Administrador" : "Usuario"}
                    </p>
                  </div>
                </div>

                <hr className="mb-3 mt-2" />

                <div className="d-flex gap-1">
                  <button
                    className="btn-primary btn-md"
                    onClick={() =>
                      navigate("/usuarios/editar", { state: { usuario } })
                    }
                  >
                    Editar usuario
                  </button>
                  <button
                    className="btn-outline-secondary btn-md"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
