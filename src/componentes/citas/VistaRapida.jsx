import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

export default function VistaRapida() {
  const navigate = useNavigate();

  const [usuarios,  setUsuarios]  = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [busqueda,  setBusqueda]  = useState("");

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setCargando(true);
    try {
      const db = await configurarBD();
      const [todosUsuarios, todosPacientes] = await Promise.all([
        db.getAll("usuarios"),
        db.getAll("pacientes"),
      ]);
      setUsuarios(todosUsuarios.filter(u => u.rol !== "admin"));
      setPacientes(todosPacientes);
    } catch (err) {
      console.error("Error cargando VistaRapida:", err);
    } finally {
      setCargando(false);
    }
  }

  // Una fila por cada par dueño-mascota
  const filas = [];
  usuarios.forEach(usuario => {
    const mascotas = pacientes.filter(p => p.emailUsuario === usuario.correo);
    if (mascotas.length === 0) {
      filas.push({ usuario, mascota: null });
    } else {
      mascotas.forEach(mascota => filas.push({ usuario, mascota }));
    }
  });

  // Ordenar alfabéticamente por nombre del dueño
  filas.sort((a, b) => a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo));

  // Filtrado por nombre de dueño o de mascota
  const filasFiltradas = filas.filter(({ usuario, mascota }) => {
    const termino = busqueda.toLowerCase();
    return (
      usuario.nombre_completo?.toLowerCase().includes(termino) ||
      mascota?.nombre?.toLowerCase().includes(termino)
    );
  });

  function irAgendarCita(usuario, mascota) {
    navigate("/citas", {
      state: {
        mascota: {
          id:            mascota.id,
          nombre:        mascota.nombre,
          especie:       mascota.especie       || "",
          raza:          mascota.raza          || "",
          sexo:          mascota.sexo          || "",
          color:         mascota.color         || "",
          peso:          mascota.peso          || "",
          vacunas:       mascota.vacunas       || "",
          fechaRegistro: mascota.fechaRegistro || "",
        },
        nombreUsuario:   usuario.nombre_completo,
        correoUsuario:   usuario.correo,
        telefonoUsuario: usuario.telefono || "",
      },
    });
  }

  return (
    <div className="container mt-2">

      <header className="mb-2">
        <h2 className="fs-1-75 fw-bold text-dark">Selección de Paciente para Cita</h2>
        <p className="text-muted fs-0-9">
          Listado de propietarios y sus respectivas mascotas en el sistema
        </p>
      </header>

      {/* Buscador */}
      <div className="form-group mb-2">
        <input
          type="text"
          className="input"
          placeholder="Buscar por nombre del dueño o nombre de la mascota..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {cargando && <p className="text-muted">Cargando registros...</p>}

      {!cargando && filasFiltradas.length === 0 && (
        <div className="alerta primary text-center">
          {filas.length === 0
            ? "No hay registros disponibles en la base de datos."
            : "No se encontraron resultados para esa búsqueda."}
        </div>
      )}

      {!cargando && filasFiltradas.length > 0 && (
        <div className="table-container shadow-sm br-1">
          <table className="table table-clara-primary table-bordered">
            <thead style={{ backgroundColor: "#3a6073", color: "white" }}>
              <tr>
                <th>Nombre del Dueño</th>
                <th>Nombre de la Mascota</th>
                <th style={{ textAlign: "center" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map(({ usuario, mascota }, index) => (
                <tr key={index}>
                  <td><strong>{usuario.nombre_completo}</strong></td>
                  <td>
                    {mascota
                      ? <span>{mascota.nombre}</span>
                      : <span className="text-muted italic">Sin mascotas registradas</span>}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {mascota ? (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => irAgendarCita(usuario, mascota)}
                      >
                        Agendar Cita
                      </button>
                    ) : (
                      <span className="badge secondary">Sin mascota</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}