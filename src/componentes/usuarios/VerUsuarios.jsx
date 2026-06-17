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
        <div className="container mt-3">
            <div className="d-flex align-item mb-3">
                <button className="btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
                    ← Volver
                </button>
                <h2 className="fs-2 fw-bold text-primary">Detalle del usuario</h2>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card br-3 p-2">

                        <div className="d-flex j-cont-bet align-item mb-3">
                            <h3 className="text-accent fw-bold">{usuario.nombre_completo}</h3>
                            <span className="secondary badge">
                                {usuario.rol === "admin" ? "Administrador" : "Cliente"}
                            </span>
                        </div>

                        <hr className="mb-3" />

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <p className="text-muted fs-small">Nombre completo</p>
                                <p className="fw-bold">{usuario.nombre_completo}</p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <p className="text-muted fs-small">Correo electrónico</p>
                                <p className="fw-bold">{usuario.correo}</p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <p className="text-muted fs-small">Teléfono</p>
                                <p className="fw-bold">{usuario.telefono || "—"}</p>
                            </div>
                            <div className="col-md-6 mb-3">
                                <p className="text-muted fs-small">Rol</p>
                                <p className="fw-bold">{usuario.rol}</p>
                            </div>
                        </div>

                        <div className="d-flex mt-2">
                            <button
                                className="btn-primary btn-sm"
                                onClick={() => navigate("/usuarios/editar", { state: { usuario } })}
                            >
                                 Editar usuario
                            </button>
                            <button
                                className="btn-outline-secondary btn-sm"
                                onClick={() => navigate(-1)}
                            >
                                Cancelar
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}