import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

export default function VistaRapida() {
  const navigate = useNavigate();
  // ESTADOS LOCALES DEL COMPONENTE
  const [usuarios,  setUsuarios]  = useState([]); // Almacena el listado de clientes/propietarios filtrados
  const [pacientes, setPacientes] = useState([]); // Almacena el listado global de mascotas registradas
  const [cargando,  setCargando]  = useState(true); // Flag de control para manejar la interfaz de carga reactiva
  const [busqueda,  setBusqueda]  = useState(""); // Almacena el término de búsqueda ingresado por el usuario

  // EFECTOS Y FLUJOS DE CARGA ASÍNCRONA
  // Gatillo inicial que dispara la recolección de datos desde la base de datos local al montar el componente
  useEffect(() => { 
    cargarDatos(); 
  }, []);

  // Consulta concurrentemente las colecciones de IndexedDB mediante promesas simultáneas
  async function cargarDatos() {
    setCargando(true);
    try {
      const db = await configurarBD();
      // Desestructura el arreglo de resultados de ambas consultas asíncronas paralelas
      const [todosUsuarios, todosPacientes] = await Promise.all([
        db.getAll("usuarios"),
        db.getAll("pacientes"),
      ]);
      // Excluye los perfiles administrativos para listar únicamente a los clientes comunes
      setUsuarios(todosUsuarios.filter(u => u.rol !== "admin"));
      setPacientes(todosPacientes);
    } catch (err) {
      console.error("Error cargando VistaRapida:", err);
    } finally {
      setCargando(false);
    }
  }
  // PROCESAMIENTO Y CRUCE DE INFORMACIÓN (JOIN)
  // Estructura una matriz plana intermedia vinculando cada propietario con sus respectivas mascotas
  const filas = [];
  usuarios.forEach(usuario => {
    // Relaciona mediante clave foránea (emailUsuario -> correo) el dueño con la mascota
    const mascotas = pacientes.filter(p => p.emailUsuario === usuario.correo);
    
    if (mascotas.length === 0) {
      // Si el cliente no posee mascotas asociadas, se genera una fila con referencia nula
      filas.push({ usuario, mascota: null });
    } else {
      // Si el cliente posee una o más mascotas, se desglosa una fila por cada una de ellas
      mascotas.forEach(mascota => filas.push({ usuario, mascota }));
    }
  });

  // Ordenamiento lexicográfico ascendente basado en el nombre completo del propietario
  filas.sort((a, b) => a.usuario.nombre_completo.localeCompare(b.usuario.nombre_completo));

  // FILTRADO DINÁMICO DE DATOS
  const filasFiltradas = filas.filter(({ usuario, mascota }) => {
    const termino = busqueda.toLowerCase();
    // Evalúa si el término coincide de manera parcial con el dueño o el paciente veterinario
    return (
      usuario.nombre_completo?.toLowerCase().includes(termino) ||
      mascota?.nombre?.toLowerCase().includes(termino)
    );
  });

  // NAVEGACIÓN Y TRANSFERENCIA DE ESTADOS
  // Serializa los datos del cliente y su mascota para inyectarlos en el estado del enrutador hacia el formulario de citas
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
          // Estandariza la flag de inmunización en una cadena predecible ('Sí' / 'No')
          vacunas:       mascota.estaVacunado === true || mascota.estaVacunado === "Sí" ? "Sí" : "No",
          fechaRegistro: mascota.fechaRegistro || "",
        },
        nombreUsuario:   usuario.nombre_completo,
        correoUsuario:   usuario.correo,
        telefonoUsuario: usuario.telefono || "",
      },
    });
  }

  // RETORNO Y CONTROL GRÁFICO DEL DOM
  return (
    <div className="container mt-2">

      <header className="mb-2">
        <h2 className="fs-1-75 fw-bold text-dark">Selección de Paciente para Cita</h2>
        <p className="text-muted fs-0-9">
          Listado de propietarios y sus respectivas mascotas en el sistema
        </p>
      </header>

      {/* Componente Buscador Reactivo */}
      <div className="form-group mb-2">
        <input
          type="text"
          className="input"
          placeholder="Buscar por nombre del dueño o nombre de la mascota..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Estado Transicional de Carga */}
      {cargando && <p className="text-muted">Cargando registros...</p>}

      {/* Vista de Excepción: Cero Coincidencias */}
      {!cargando && filasFiltradas.length === 0 && (
        <div className="alerta primary text-center">
          {filas.length === 0
            ? "No hay registros disponibles en la base de datos."
            : "No se encontraron resultados para esa búsqueda."}
        </div>
      )}

      {/* Tabla Matriz Relacional de Datos */}
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
                  {/* Identidad del Propietario */}
                  <td><strong>{usuario.nombre_completo}</strong></td>
                  
                  {/* Identidad del Paciente (Mascota) con validación de existencia */}
                  <td>
                    {mascota
                      ? <span>{mascota.nombre}</span>
                      : <span className="text-muted italic">Sin mascotas registradas</span>}
                  </td>
                  
                  {/* Control de Acciones condicionado por la existencia de la mascota */}
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