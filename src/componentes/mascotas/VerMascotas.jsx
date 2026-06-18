import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";


import PageHeader   from "./vistas/encabezadoPagina";
import TarjetaDueno from "./vistas/tarjetaDueno";

const BADGE_ESPECIE = {
  perro: "info", gato: "warning", conejo: "success",
  ave: "primary", reptil: "secondary", otro: "secondary",
};

//añadimos la prop esAdmin con valor por defecto true
export default function VerMascotas({esAdmin = true, onEditarDueno, nombreProp, correoProp, telefonoProp}) {
  const navigate = useNavigate();
  const location = useLocation();
 
  const datosRuta = location.state ?? {};

  const correoUsuario = esAdmin ?  datosRuta.correoUsuario : (correoProp || datosRuta.correoUsuario);
  const nombreUsuario = esAdmin ? datosRuta.nombreUsuario : (nombreProp || datosRuta.nombreUsuario); 
  const telefonoUsuario =  esAdmin ? datosRuta.telefonoUsuario : (telefonoProp || datosRuta.telefonoUsuario);

  const [mascotas,    setMascotas]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [mascotaElim, setMascotaElim] = useState(null);
  const [eliminando,  setEliminando]  = useState(false);

  useEffect(() => {
    async function cargarMascotas() {
        if(!correoUsuario) return;
      setCargando(true);
      try {
        const db    = await configurarBD();
        const todos = await db.getAll("pacientes");
        setMascotas(todos.filter((p) => p.emailUsuario === correoUsuario));
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
      setMascotas((prev) => prev.filter((m) => m.id !== mascotaElim.id));
      setMascotaElim(null);
    } catch (err) {
      console.error("Error eliminando mascota:", err);
    } finally {
      setEliminando(false);
    }
  }

  const state = { nombreUsuario, correoUsuario, telefonoUsuario };

  return (
    <div className="container mt-3 mb-3">
        {esAdmin && (
            <PageHeader
            titulo="Gestión Mascotas"
            subtitulo="Gestiona las mascotas registradas para este usuario"
            colorTitulo="text-primary"
            onVolver={() => navigate("/gestion")}
            />

        )}
      
      <TarjetaDueno
        nombreUsuario={nombreUsuario}
        correoUsuario={correoUsuario}
        telefonoUsuario={telefonoUsuario}
        cantidadMascotas={mascotas.length}
        onEditarDueno={onEditarDueno} //le pasa el puente a la tarjeta
      />

      <div className="card br-3 shadow-sm p-3">
        <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
          <h3 className="fs-3 fw-bold text-accent">Mascotas Registradas</h3>
          <button
            className="btn-primary btn-sm"
            onClick={() => navigate("/mascotas/formularioMascotas", { state })}
          >
            + Agregar mascota
          </button>
        </div>

        {cargando ? (
          <p className="text-muted">Cargando mascotas...</p>
        ) : mascotas.length === 0 ? (
          <div className="alerta primary text-center">
            {esAdmin 
            ? "Este usuario no tiene mascotas registradas aún."
            : "No tienes mascotas registradas aún."
            }
            
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
                    <td>{m.edad ?? "-"}</td>
                    <td>{m.peso ? `${m.peso} kg` : "-"}</td>
                    <td>
                      {m.fechaRegistro
                        ? new Date(m.fechaRegistro).toLocaleDateString("es-SV")
                        : "-"}
                    </td>
                    <td>
                      <div className="d-flex gap-1 f-wrap">
                        {/* → /mascotas/expediente  (solo lectura) */}
                        <button
                          className="btn-success btn-sm"
                          onClick={() => navigate("/mascotas/expediente", {
                            state: { mascota: m, ...state },
                          })}
                        >
                          Expediente
                        </button>

                        {/* → /mascotas/editar  (formulario exclusivo) */}
                        <button
                          className="btn-outline-secondary btn-sm"
                          onClick={() => navigate("/mascotas/editar", {
                            state: { mascota: m, ...state },
                          })}
                        >
                          Editar
                        </button>

                        <button
                          className="btn-alert btn-sm"
                          onClick={() => setMascotaElim(m)}
                        >
                          Eliminar
                        </button>
                          {/**solo el admin puede agendar citas en el calendario global */}
                          {esAdmin && (
                            <button
                                className="btn-outline-secondary btn-sm"
                                onClick={() => navigate("/citas", {
                                state: { mascota: m, ...state },
                            })}
                            >
                            Cita
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar */}
      {mascotaElim && (
        <div className="modal-alert is-open">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Eliminar mascota</h3>
              <button className="modal-close" onClick={() => setMascotaElim(null)}>X</button>
            </div>
            <div className="modal-body">
              <p>
                ¿Eliminar a <strong>{mascotaElim.nombre}</strong>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-outline-secondary" onClick={() => setMascotaElim(null)} disabled={eliminando}>
                Cancelar
              </button>
              <button className="btn-alert" onClick={confirmarEliminar} disabled={eliminando}>
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
