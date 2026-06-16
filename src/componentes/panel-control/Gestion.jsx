import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

export default function ListaMascotas() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [conteos, setConteos] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [usuarioElim, setUsuarioElim] = useState(null);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const db = await configurarBD();
        const [todosLosUsuarios, todosLosPacientes] = await Promise.all([
          db.getAll("usuarios"),
          db.getAll("pacientes"),
        ]);
        const soloClientes = todosLosUsuarios.filter(
          (u) => u.rol === "usuario",
        );
        const mapaConteos = {};
        todosLosPacientes.forEach((p) => {
          mapaConteos[p.emailUsuario] = (mapaConteos[p.emailUsuario] ?? 0) + 1;
        });
        setUsuarios(soloClientes);
        setConteos(mapaConteos);
      } catch (err) {
        console.error("Error al procesar el listado de usuarios:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  async function confirmarEliminarUsuario() {
    try {
      const db = await configurarBD();
      const pacientes = await db.getAll("pacientes");
      for (const m of pacientes.filter(
        (p) => p.emailUsuario === usuarioElim.correo,
      )) {
        await db.delete("pacientes", m.id);
      }
      await db.delete("usuarios", usuarioElim.correo);
      setUsuarioElim(null);
      // Recargar datos después de eliminar
      const [todosLosUsuarios, todosLosPacientes] = await Promise.all([
        (await configurarBD()).getAll("usuarios"),
        (await configurarBD()).getAll("pacientes"),
      ]);
      setUsuarios(todosLosUsuarios.filter((u) => u.rol === "usuario"));
      const mapaConteos = {};
      todosLosPacientes.forEach((p) => {
        mapaConteos[p.emailUsuario] = (mapaConteos[p.emailUsuario] ?? 0) + 1;
      });
      setConteos(mapaConteos);
    } catch (err) {
      console.error("Error eliminando usuario:", err);
    }
  }

  const filtrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div>
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Gestion de Usuarios</h2>
          <p className="text-muted">
            {usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""}{" "}
            registrado{usuarios.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => navigate("/nuevo-expediente")}
        >
          + Nuevo registro
        </button>
      </div>

      <div className="form-group mb-2">
        <input
          type="text"
          className="input"
          placeholder="Buscar usuario por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {cargando ? (
        <p className="text-muted">Cargando registros...</p>
      ) : filtrados.length === 0 ? (
        <div className="alerta primary text-center">
          {busqueda
            ? `Sin resultados para "${busqueda}"`
            : "No hay usuarios clientes registrados en el sistema."}
        </div>
      ) : (
        <div className="table-container shadow-sm br-1">
          <table className="table table-clara-primary table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre Completo</th>
                <th>Correo electrónico</th>
                <th>Teléfono</th>
                <th>Mascotas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={u.correo}>
                  <td>{i + 1}</td>
                  <td className="fw-bold">{u.nombre_completo}</td>
                  <td>{u.correo}</td>
                  <td>{u.telefono || "-"}</td>
                  <td>
                    <span
                      className={`badge ${(conteos[u.correo] ?? 0) > 0 ? "info" : "secondary"}`}
                    >
                      {conteos[u.correo] ?? 0} mascota
                      {(conteos[u.correo] ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1 f-wrap">
                      <button
                        className="btn-info btn-sm"
                        onClick={() =>
                          navigate("/mascotas/ver", {
                            state: {
                              correoUsuario: u.correo,
                              nombreUsuario: u.nombre_completo,
                              telefonoUsuario: u.telefono,
                            },
                          })
                        }
                      >
                        Ver mascotas
                      </button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() =>
                          navigate("/usuarios/ver", { state: { usuario: u } })
                        }
                      >
                        Ver usuario
                      </button>
                      <button
                        className="btn-outline-secondary btn-sm"
                        onClick={() =>
                          navigate("/usuarios/editar", {
                            state: { usuario: u },
                          })
                        }
                      >
                        Editar
                      </button>
                      <button
                        className="btn-alert btn-sm"
                        onClick={() => setUsuarioElim(u)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {usuarioElim && (
        <div className="modal-alert is-open">
          <div className="modal-content">
            <div className="modal-header">
              <h3> Eliminar usuario</h3>
              <button
                className="modal-close"
                onClick={() => setUsuarioElim(null)}
              >
                X
              </button>
            </div>
            <div className="modal-body">
              <p>
                ¿Eliminar a <strong>{usuarioElim.nombre_completo}</strong> y
                todas sus mascotas? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-outline-secondary"
                onClick={() => setUsuarioElim(null)}
              >
                Cancelar
              </button>
              <button className="btn-alert" onClick={confirmarEliminarUsuario}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
