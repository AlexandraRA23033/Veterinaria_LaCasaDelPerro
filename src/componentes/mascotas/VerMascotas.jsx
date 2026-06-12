import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

const BADGE_ESPECIE = { perro: "info", gato: "warning", conejo: "success", ave: "primary", reptil: "secondary", otro: "secondary" };

export default function VerMascotas() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { correoUsuario, nombreUsuario, telefonoUsuario } = location.state ?? {};

    const [mascotas,     setMascotas]     = useState([]);
    const [cargando,     setCargando]     = useState(true);
    const [mascotaElim,  setMascotaElim]  = useState(null);
    const [eliminando,   setEliminando]   = useState(false);

    useEffect(() => {
        async function cargarMascotas() {
            setCargando(true);
            try {
                const db = await configurarBD();
                const todos = await db.getAll("pacientes");
                setMascotas(todos.filter(p => p.emailUsuario === correoUsuario));
            } catch (err) {
                console.error("Error cargando mascotas:", err);
            } finally {
                setCargando(false);
            }
        }
        cargarMascotas();
    }, [correoUsuario]);

    async function confirmarEliminar() {
        setEliminando(true);
        try {
            const db = await configurarBD();
            await db.delete("pacientes", mascotaElim.id);
            setMascotas(prev => prev.filter(m => m.id !== mascotaElim.id));
            setMascotaElim(null);
        } catch (err) {
            console.error("Error eliminando mascota:", err);
        } finally {
            setEliminando(false);
        }
    }

    return (
        <div className="container mt-3 mb-3">

            {/* Encabezado */}
            <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
                <div>
                    <h2 className="fs-2 fw-bold text-primary">Gestion Mascotas</h2>
                    <p className="text-muted">Gestiona las mascotas registradas para este usuario</p>
                </div>
                <button className="btn-outline-secondary" onClick={() => navigate("/gestion")}>
                    ← Volver
                </button>
            </div>

            {/* ── Tarjeta del dueño — solo lectura ── */}
            <div className="card br-3 shadow-sm p-3 mb-3">
                <div className="d-flex align-item gap-1 mb-2">
                    <span style={{ fontSize: "1.4rem" }}>👤</span>
                    <h3 className="fs-3 fw-bold text-accent">Datos del Dueño</h3>
                </div>
                <div className="card card-light br-2 p-2">
                    <div className="d-flex f-wrap gap-3">
                        <div>
                            <p className="text-muted" style={{ fontSize: "0.8rem" }}>NOMBRE COMPLETO</p>
                            <p className="fw-bold">{nombreUsuario}</p>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: "0.8rem" }}>CORREO</p>
                            <p className="fw-bold">{correoUsuario}</p>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: "0.8rem" }}>TELÉFONO</p>
                            <p className="fw-bold">{telefonoUsuario || "No registrado"}</p>
                        </div>
                        <div className="ml-auto">
                            <p className="text-muted" style={{ fontSize: "0.8rem" }}>MASCOTAS</p>
                            <span className={`badge ${mascotas.length > 0 ? "info" : "secondary"}`}>
                                {mascotas.length} mascota{mascotas.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Tabla de mascotas ── */}
            <div className="card br-3 shadow-sm p-3">
                <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
                    <div className="d-flex align-item gap-1">
                        <h3 className="fs-3 fw-bold text-accent">Mascotas Registradas</h3>
                    </div>
                    <button
                        className="btn-primary btn-sm"
                        onClick={() => navigate("/mascotas/formularioMascotas", {
                            state: {
                                correoUsuario,
                                nombreUsuario,
                                telefonoUsuario,
                            },
                        })}
                    >
                        + Agregar mascota
                    </button>
                </div>

                {cargando ? (
                    <p className="text-muted">Cargando mascotas...</p>
                ) : mascotas.length === 0 ? (
                    <div className="alerta primary text-center">
                        Este usuario no tiene mascotas registradas aún.
                    </div>
                ) : (
                    <div className="table-container shadow-sm br-1">
                        <table className="table table-clara-primary table-bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nombre</th>
                                    <th>Especie</th>
                                    <th>Raza</th>
                                    <th>Sexo</th>
                                    <th>Edad</th>
                                    <th>Peso</th>
                                    <th>Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mascotas.map((m, i) => (
                                    <tr key={m.id}>
                                        <td>{i + 1}</td>
                                        <td className="fw-bold">{m.nombre}</td>
                                        <td>
                                            <span className={`badge ${BADGE_ESPECIE[m.especie] ?? "secondary"}`}>
                                                {m.especie}
                                            </span>
                                        </td>
                                        <td>{m.raza || "-"}</td>
                                        <td>{m.sexo || "-"}</td>
                                        <td>{m.edad}</td>
                                        <td>{m.peso ? `${m.peso} kg` : "-"}</td>
                                        <td>{m.fechaRegistro ? new Date(m.fechaRegistro).toLocaleDateString("es-SV") : "-"}</td>
                                        <td>
                                            <div className="d-flex gap-1 f-wrap">
                                                {/* Ver expediente completo */}
                                                <button
                                                    className="btn-success btn-sm"
                                                    onClick={() => navigate("/mascotas/expediente", {
                                                        state: { mascota: m, nombreUsuario, correoUsuario, telefonoUsuario },
                                                    })}
                                                >
                                                    📋 Expediente
                                                </button>

                                                {/* Editar mascota */}
                                                <button
                                                    className="btn-outline-secondary btn-sm"
                                                    onClick={() => navigate("/mascotas/editar", {
                                                        state: { mascota: m, correoUsuario, nombreUsuario, telefonoUsuario },
                                                    })}
                                                >
                                                    ✏️ Editar
                                                </button>

                                                {/* Eliminar mascota */}
                                                <button
                                                    className="btn-alert btn-sm"
                                                    onClick={() => setMascotaElim(m)}
                                                >
                                                    🗑 Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal confirmar eliminar mascota */}
            {mascotaElim && (
                <div className="modal-alert is-open">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⚠️ Eliminar mascota</h3>
                            <button className="modal-close" onClick={() => setMascotaElim(null)}>X</button>
                        </div>
                        <div className="modal-body">
                            <p>
                                ¿Eliminar a <strong>{mascotaElim.nombre}</strong>?
                                Esta acción no se puede deshacer.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-outline-secondary"
                                onClick={() => setMascotaElim(null)}
                                disabled={eliminando}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-alert"
                                onClick={confirmarEliminar}
                                disabled={eliminando}
                            >
                                {eliminando ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}