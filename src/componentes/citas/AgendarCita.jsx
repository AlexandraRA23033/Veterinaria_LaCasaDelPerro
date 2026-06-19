import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  guardarCitaAgenda, 
  guardarConsultaHistorial,
  obtenerCitasAgenda,
  obtenerServiciosDB 
} from "../../base-datos/configuracion";

export default function AgendarCita() {
  const navigate = useNavigate();
  const location = useLocation();

  // Capturamos el estado enviado por React Router
  const { mascota, nombreUsuario, correoUsuario, telefonoUsuario, citaAEditar } = location.state ?? {};

  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);

  // Estados del Formulario
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]); 
  const [motivo, setMotivo] = useState('');

  // Estados del Modal de Alertas
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalMensaje, setModalMensaje] = useState('');

  const hoy = new Date();
  const fechaMinima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  async function cargarCitas() {
    try {
      const todasLasCitas = await obtenerCitasAgenda();
      setCitas(todasLasCitas || []);
    } catch (err) {
      console.error("Error cargando citas:", err);
    }
  }

  async function cargarServicios() {
    try {
      const listaServicios = await obtenerServiciosDB();
      setServicios(listaServicios || []);
    } catch (err) {
      console.error("Error cargando servicios desde IndexedDB:", err);
    }
  }

  function mostrarAlertaModal(titulo, mensaje) {
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setModalAbierto(true);
  }

  const handleCheckboxChange = (id) => {
    const idStr = id.toString();
    if (serviciosSeleccionados.includes(idStr)) {
      setServiciosSeleccionados(serviciosSeleccionados.filter(item => item !== idStr));
    } else {
      setServiciosSeleccionados([...serviciosSeleccionados, idStr]);
    }
  };

  const calcularTotalPagar = () => {
    return servicios
      .filter(s => serviciosSeleccionados.includes(s.id.toString()))
      .reduce((sum, s) => sum + (Number(s.precio) || 0), 0);
  };

  // Sincronizar datos si es una reprogramación (edición)
  useEffect(() => {
    if (citaAEditar && servicios.length > 0) {
      setFecha(citaAEditar.fecha || '');
      setHora(citaAEditar.hora || '');
      setMotivo(citaAEditar.motivo || '');
      
      if (citaAEditar.servicio) {
        const nombresServiciosEditar = citaAEditar.servicio.split(", ").map(s => s.trim());
        const idsEncontrados = servicios
          .filter(s => nombresServiciosEditar.includes(s.nombre))
          .map(s => s.id.toString());
        setServiciosSeleccionados(idsEncontrados);
      }
    }
  }, [citaAEditar, servicios]);

  // Protección de entrada y carga inicial
  useEffect(() => {
    let tiempoRedireccion;
    if (!mascota && !citaAEditar) {
      mostrarAlertaModal("Atención", "Por favor, selecciona una mascota desde la tabla de vista rápida primero.");
      tiempoRedireccion = setTimeout(() => {
        setModalAbierto(false);
        navigate("/AgendaRapida"); 
      }, 3000);
      return;
    }
    
    cargarCitas();
    cargarServicios();

    return () => {
      if (tiempoRedireccion) clearTimeout(tiempoRedireccion);
    };
  }, [mascota]);

  // Validaciones de Horario Clínico y Solapamientos
  function validarHorarioYChoques(fechaSel, horaSel) {
    if (!horaSel || !fechaSel) return false;

    let [horas, minutos] = horaSel.split(':').map(Number);
    if (horas >= 1 && horas <= 4) horas += 12;

    const tiempoEnMinutos = horas * 60 + minutos; 
    const [anioPart, mesPart, diaPart] = fechaSel.split('-').map(Number);
    const objetoFecha = new Date(Date.UTC(anioPart, mesPart - 1, diaPart, 12, 0, 0)); 
    const diaSemana = objetoFecha.getUTCDay(); 

    if (diaSemana === 0) {
      mostrarAlertaModal("Clínica Cerrada", "La Casa del Perro está cerrada los domingos.");
      return false;
    }

    if (diaSemana >= 1 && diaSemana <= 5) {
      const turnoManana = tiempoEnMinutos >= 480 && tiempoEnMinutos <= 720; 
      const turnoTarde = tiempoEnMinutos >= 780 && tiempoEnMinutos <= 960;  
      if (!turnoManana && !turnoTarde) {
        mostrarAlertaModal("Horario No Disponible", `El horario (${horaSel}) está fuera de tiempo laboral de Lunes a Viernes.`);
        return false;
      }
    } else if (diaSemana === 6) {
      if (tiempoEnMinutos < 480 || tiempoEnMinutos > 720) {
        mostrarAlertaModal("Horario No Disponible", `El horario (${horaSel}) está fuera del tiempo de atención de los Sábados.`);
        return false;
      }
    }

    const DURACION_CITA = 30;
    const conflicto = citas.some((c) => {
      if (!c || !c.hora || !c.fecha) return false;
      if (c.id === citaAEditar?.id) return false; 
      if (c.fecha !== fechaSel || c.estado === 'Cancelada') return false;
      
      let [hE, mE] = c.hora.split(':').map(Number);
      if (hE >= 1 && hE <= 4) hE += 12; 
      
      const minutosE = hE * 60 + mE;
      return Math.abs(tiempoEnMinutos - minutosE) < DURACION_CITA;
    });

    if (conflicto) {
      mostrarAlertaModal("Conflicto de Agenda", "Ya existe otra cita activa en ese bloque de tiempo. Por favor, elige otra hora.");
      return false;
    }

    return true;
  }

  // Guardar datos de forma segura usando las funciones importadas
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!fecha || !hora || !motivo) {
      mostrarAlertaModal('Campos Incompletos', 'Por favor completa la fecha, hora y motivo de consulta.');
      return;
    }

    if (serviciosSeleccionados.length === 0) {
      mostrarAlertaModal('Servicio Requerido', 'Por favor selecciona al menos un servicio para la cita.');
      return;
    }

    try {
      if (!validarHorarioYChoques(fecha, hora)) return;

      const serviciosFiltrados = servicios.filter(s => serviciosSeleccionados.includes(s.id.toString()));
      const nombresConcatenados = serviciosFiltrados.map(s => s.nombre).join(", ");
      const costoTotal = serviciosFiltrados.reduce((sum, s) => sum + Number(s.precio), 0);

      let nuevaCita = {};

      if (citaAEditar) {
        // En lugar de abrir la base de datos de manera externa, mutamos el registro limpio directamente
        nuevaCita = {
          ...citaAEditar, 
          fecha: fecha,
          hora: hora,
          servicio: nombresConcatenados,
          precio: costoTotal,
          motivo: motivo,
          estado: 'Pospuesta',
          notificadaComoNueva: false,
          notificadaComoPospuesta: false 
        };
      } else {
        const idUnico = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
        nuevaCita = {
          id: idUnico,
          mascota: mascota?.nombre || "Mascota",
          mascotaId: mascota?.id || Date.now(),
          dueno: nombreUsuario || "Cliente",
          correoDueno: correoUsuario || "",
          telefono: telefonoUsuario || 'N/A',
          fecha: fecha,
          hora: hora,
          servicio: nombresConcatenados,
          precio: costoTotal,
          motivo: motivo,
          estado: 'Pendiente',
          notificadaComoNueva: false,
          notificadaComoPospuesta: false
        };
      }

      // Guardamos la Cita de forma asíncrona y segura
      await guardarCitaAgenda(nuevaCita);

      // Guardamos en el Historial de Consultas
      const nuevoRegistroConsulta = {
        idCita: nuevaCita.id,
        pacienteId: nuevaCita.mascotaId,
        nombreMascota: nuevaCita.mascota,
        nombreDueno: nuevaCita.dueno,
        fecha: fecha,
        diagnosticoMotivo: motivo,
        treatmentServicio: nombresConcatenados, 
        tratamientoServicio: nombresConcatenados,
        costo: costoTotal
      };
      
      await guardarConsultaHistorial(nuevoRegistroConsulta);
      
      mostrarAlertaModal("¡Registro Guardado!", `La cita de ${nuevaCita.mascota} se procesó de forma correcta.`);
      setTimeout(() => {
        setModalAbierto(false);
        navigate("/historial");
      }, 2000);

    } catch (err) {
      console.error("Error crítico de IndexedDB:", err);
      mostrarAlertaModal("Error de Base de Datos", "No se pudo sincronizar la cita con IndexedDB. Revisa las propiedades de la tabla.");
    }
  }

  return (
    <div className="container mt-2">
      <style>{`
        .modal-emergente-fijo {
          display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.55); z-index: 99999; justify-content: center; align-items: center;
        }
        .modal-emergente-fijo.visible-open { display: flex; }
        .modal-recuadro {
          background: #ffffff; padding: 24px; border-radius: 8px;
          max-width: 480px; width: 90%; box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .modal-titulo-seccion {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;
        }
        .modal-titulo-seccion h3 { margin: 0; font-size: 1.2rem; color: #1a202c; }
        .modal-cerrar-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #718096; }
        .modal-cuerpo-txt { font-size: 0.95rem; color: #4a5568; line-height: 1.5; margin-bottom: 20px; }
        .modal-pie-seccion { display: flex; justify-content: flex-end; }

        .contenedor-servicios-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 8px;
        }
        .tarjeta-servicio-checkbox {
          border: 2px solid #e2e8f0; border-radius: 6px; padding: 12px; text-align: center;
          cursor: pointer; position: relative; background: #fff; transition: all 0.2s ease;
        }
        .tarjeta-servicio-checkbox:hover { border-color: #3a6073; background: #f7fafc; }
        .tarjeta-servicio-checkbox.seleccionada {
          border-color: #3a6073; background: #eef3f5; box-shadow: 0 2px 8px rgba(58, 96, 115, 0.15);
        }
        .chk-oculto { position: absolute; top: 8px; right: 8px; width: 16px; height: 16px; cursor: pointer; }
        .txt-serv-nombre { font-weight: 600; color: #2d3748; font-size: 0.9rem; margin-bottom: 4px; display: block; }
        .txt-serv-precio { color: #4a5568; font-size: 0.85rem; font-weight: bold; }
        .seccion-total { background: #edf2f7; border-radius: 6px; padding: 10px; font-weight: bold; font-size: 1.1rem; color: #2d3748; }
      `}</style>

      <div className="d-flex j-cont-bet align-item mb-2">
        <h2 className="fs-1-75 fw-bold text-dark">Vista de administrador al realizar las citas</h2>
        <button className="btn-outline-secondary btn-sm" onClick={() => navigate("/AgendaRapida")}>
          Volver a Selección
        </button>
      </div>

      {/* ================= DATOS DUEÑO ================= */}
      <div className="card shadow-sm br-2 mb-2" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos del Dueño
        </div>
        <div className="p-2">
          <div className="d-flex gap-4 f-wrap">
            <div style={{ flex: '1', minWidth: '150px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-dark fs-1-1">{citaAEditar ? citaAEditar.dueno : (nombreUsuario || "-")}</div>
            </div>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Correo</div>
              <div className="text-dark fs-1-1">{citaAEditar ? citaAEditar.correoDueno : (correoUsuario || "-")}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Teléfono</div>
              <div className="text-dark fs-1-1">{citaAEditar ? citaAEditar.telefono : (telefonoUsuario || "-")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DATOS MASCOTA ================= */}
      <div className="card shadow-sm br-2 mb-3" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos de la Mascota
        </div>
        <div className="p-2">
          <div className="d-flex j-cont-bet f-wrap gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-accent fs-1-3">{citaAEditar ? citaAEditar.mascota : (mascota?.nombre || "-")}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Especie</div>
              <div><span className="badge info text-lowercase">{mascota?.especie || "-"}</span></div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Vacunas</div>
              <div><span className="badge success">{mascota?.vacunas && mascota.vacunas.trim() !== "" ? mascota.vacunas : "Ninguna"}</span></div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Fecha Registro</div>
              <div className="text-dark">{mascota?.fechaRegistro ? new Date(mascota.fechaRegistro).toLocaleDateString("es-SV") : "-"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm br-2 p-3 mb-3" style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: '#fdfdfd', border: '1px solid #e2e8f0' }}>
        <p className="text-accent fs-0-9 mb-2 fw-medium text-center">
          {citaAEditar ? "Modifica los datos para Reprogramar la Cita" : "Muestra los datos"}
        </p>
        
        <form id="formulario-cita" onSubmit={handleSubmit}>
          
          {/* SECCIÓN CHECKBOXES */}
          <div className="form-group mb-2">
            <label className="label fw-bold text-secondary">Servicios de Clínica / Estética (Selección Múltiple):</label>
            <div className="contenedor-servicios-grid">
              {servicios.length === 0 ? (
                <p className="text-muted fs-0-9">No hay servicios registrados en el sistema...</p>
              ) : (
                servicios.map((s) => {
                  const estaSeleccionado = serviciosSeleccionados.includes(s.id.toString());
                  return (
                    <div 
                      key={s.id} 
                      className={`tarjeta-servicio-checkbox ${estaSeleccionado ? 'seleccionada' : ''}`}
                      onClick={() => handleCheckboxChange(s.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={estaSeleccionado}
                        onChange={() => {}} 
                        className="chk-oculto"
                      />
                      <span className="txt-serv-nombre">{s.nombre}</span>
                      <span className="txt-serv-precio">${Number(s.precio).toFixed(2)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* TOTAL EN TIEMPO REAL */}
          <div className="seccion-total d-flex j-cont-bet align-item mb-1-5">
            <span>Total a pagar:</span>
            <span>${calcularTotalPagar().toFixed(2)}</span>
          </div>

          <div className="form-group mb-1-5">
            <label className="label fw-bold text-secondary">Fecha Programada:</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={fechaMinima} className="input" />
          </div>

          <div className="form-group mb-1-5">
            <label className="label fw-bold text-secondary">Hora Asignada:</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input" />
          </div>

          <div className="form-group mb-2">
            <label className="label fw-bold text-secondary">Motivo o Especificaciones de Visita:</label>
            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="textarea" placeholder="Detalles de la condición..." />
          </div>

          <button type="submit" className="btn-primary btn-block" disabled={servicios.length === 0}>
            {citaAEditar ? "Actualizar y Reprogramar Cita" : "Crear cita (guardar)"}
          </button>
        </form>
      </div>

      {/* MODAL */}
      <div className={`modal-emergente-fijo ${modalAbierto ? 'visible-open' : ''}`}>
        <div className="modal-recuadro">
          <div className="modal-titulo-seccion">
            <h3>{modalTitulo}</h3>
            <button type="button" className="modal-cerrar-btn" onClick={() => setModalAbierto(false)}>×</button>
          </div>
          <div className="modal-cuerpo-txt">
            <p style={{ whiteSpace: 'pre-line' }}>{modalMensaje}</p>
          </div>
          <div className="modal-pie-seccion">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setModalAbierto(false)}>
              Entendido
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}