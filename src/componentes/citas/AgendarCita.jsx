import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  configurarBD, 
  guardarCitaAgenda, 
  guardarConsultaHistorial,
  obtenerCitasAgenda,
  actualizarCitaAgenda
} from "../../base-datos/configuracion";
import ListaCitas from "./ListaCitas";

export default function AgendarCita() {
  const navigate = useNavigate();
  const location = useLocation();

  // Capturamos la información enviada desde VerMascotas
  const { mascota, nombreUsuario, correoUsuario, telefonoUsuario } = location.state ?? {};

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Estados del Formulario de Cita
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('15'); 
  const [motivo, setMotivo] = useState('');
  
  // Estado clave para controlar la cita que se va a posponer
  const [citaEnEdicion, setCitaEnEdicion] = useState(null);

  const hoy = new Date();
  const fechaMinima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const SERVICIOS_PREDETERMINADOS = {
    "15": { nombre: "Consulta General", precio: 15.00 },
    "25": { nombre: "Vacunación Completa", precio: 25.00 },
    "20": { nombre: "Estética / Baño y Corte", precio: 20.00 },
    "40": { nombre: "Perfil Bioquímico", precio: 40.00 }
  };

  async function cargarCitas() {
    setCargando(true);
    try {
      const todasLasCitas = await obtenerCitasAgenda();
      setCitas(todasLasCitas || []);
    } catch (err) {
      console.error("Error cargando citas de IndexedDB:", err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (!mascota || !correoUsuario) {
      alert("Por favor, selecciona una mascota desde la gestión de expedientes primero.");
      navigate("/Dashboard-admin/gestion");
      return;
    }
    cargarCitas();
  }, [mascota, correoUsuario]);

  // ================= MOTORES DE VALIDACIÓN DE HORARIOS (CORREGIDO PM) =================
  function validarHorarioYChoques(fechaSel, horaSel, idIgnorar = null) {
    let [horas, minutos] = horaSel.split(':').map(Number);

    if (horas >= 1 && horas <= 4) {
      horas += 12;
    }

    const tiempoEnMinutos = horas * 60 + minutos;

    const [anioPart, mesPart, diaPart] = fechaSel.split('-').map(Number);
    const objetoFecha = new Date(Date.UTC(anioPart, mesPart - 1, diaPart, 12, 0, 0)); 
    const diaSemana = objetoFecha.getUTCDay(); 

    const recordatorioHorarios = 
      "\n\n🕒 Horarios de atención en La Casa del Perro:\n" +
      "• Lunes a Viernes:\n" +
      "   - Mañana: 8:00 AM a 12:00 PM\n" +
      "   - Tarde: 1:00 PM a 4:00 PM\n" +
      "• Sábados:\n" +
      "   - Jornada continua: 8:00 AM a 12:00 PM\n" +
      "• Domingos: Cerrado todo el día.";

    if (diaSemana === 0) {
      alert(`La Casa del Perro está cerrada los domingos. Por favor, selecciona otro día.${recordatorioHorarios}`);
      return false;
    }

    if (diaSemana >= 1 && diaSemana <= 5) {
      const turnoManana = tiempoEnMinutos >= 480 && tiempoEnMinutos <= 720; 
      const turnoTarde = tiempoEnMinutos >= 780 && tiempoEnMinutos <= 960;  
      
      if (!turnoManana && !turnoTarde) {
        alert(`El horario seleccionado (${horaSel}) no está disponible de Lunes a Viernes.${recordatorioHorarios}`);
        return false;
      }
    } 
    else if (diaSemana === 6) {
      if (tiempoEnMinutos < 480 || tiempoEnMinutos > 720) {
        alert(`El horario seleccionado (${horaSel}) no está disponible para día Sábado.${recordatorioHorarios}`);
        return false;
      }
    }

    const DURACION_CITA = 30;
    const conflicto = citas.some((c) => {
      if (c.id === idIgnorar || c.fecha !== fechaSel || c.estado === 'Cancelada') return false;
      
      let [hE, mE] = c.hora.split(':').map(Number);
      if (hE >= 1 && hE <= 4) hE += 12; 
      
      const minutosE = hE * 60 + mE;
      return Math.abs(tiempoEnMinutos - minutosE) < DURACION_CITA;
    });

    if (conflicto) {
      alert(`Conflicto de agenda: Ya existe otra cita activa en ese mismo bloque de tiempo o interfiere con un margen menor a 30 minutos. Por favor, selecciona otra hora.`);
      return false;
    }

    return true;
  }

  // ================= MANEJADOR DE CAMBIOS DE ESTADO =================
  async function handleCambiarEstado(citaId, nuevoEstado) {
    const citaExistente = citas.find(c => c.id === citaId);
    if (!citaExistente) return;

    if (nuevoEstado === 'Pospuesta') {
      setCitaEnEdicion(citaExistente);
      setFecha(citaExistente.fecha);
      setHora(citaExistente.hora);
      setMotivo(citaExistente.motivo);
      
      const encontrado = Object.keys(SERVICIOS_PREDETERMINADOS).find(
        key => SERVICIOS_PREDETERMINADOS[key].nombre === citaExistente.servicio
      );
      if (encontrado) setServicioSeleccionado(encontrado);

      window.scrollTo({ top: 0, behavior: 'smooth' });
      alert("Modo de Reprogramación: Modifica la Fecha y Hora en el formulario de arriba para posponer la cita.");
      return;
    }

    try {
      const db = await configurarBD();
      const citaActualizada = { ...citaExistente, estado: nuevoEstado };
      await db.put("agenda", citaActualizada);
      await cargarCitas();
      alert(`Cita marcada como ${nuevoEstado} con éxito.`);
    } catch (err) {
      console.error("Error al actualizar estado:", err);
    }
  }

  // ================= GUARDAR / ACTUALIZAR CITA =================
  async function handleSubmit(e) {
    e.preventDefault();
    if (!fecha || !hora || !motivo) {
      alert('Por favor completa la fecha, hora y motivo.');
      return;
    }

    const idIgnorar = citaEnEdicion ? citaEnEdicion.id : null;
    if (!validarHorarioYChoques(fecha, hora, idIgnorar)) return;

    const datosServicio = SERVICIOS_PREDETERMINADOS[servicioSeleccionado];

    try {
      if (citaEnEdicion) {
        const citaActualizada = {
          ...citaEnEdicion,
          fecha,
          hora,
          servicio: datosServicio.nombre,
          precio: datosServicio.precio,
          motivo,
          estado: 'Pospuesta',
          notificadaComoPospuesta: false 
        };

        await actualizarCitaAgenda(citaActualizada);
        alert(`Su cita de ${mascota.nombre} ha sido reprogramada con éxito.`);
        setCitaEnEdicion(null);
      } else {
        const nuevaCita = {
          id: Date.now(),
          mascota: mascota.nombre,
          mascotaId: mascota.id,
          dueno: nombreUsuario,
          correoDueno: correoUsuario,
          telefono: telefonoUsuario || '1223-9075',
          fecha,
          hora,
          servicio: datosServicio.nombre,
          precio: datosServicio.precio,
          motivo,
          estado: 'Pendiente'
        };

        await guardarCitaAgenda(nuevaCita);

        const nuevoRegistroConsulta = {
          idCita: nuevaCita.id,
          pacienteId: mascota.id,
          nombreMascota: mascota.nombre,
          nombreDueno: nombreUsuario,
          fecha: fecha,
          diagnosticoMotivo: motivo,
          treatmentServicio: nuevaCita.servicio, 
          tratamientoServicio: nuevaCita.servicio,
          costo: nuevaCita.precio
        };
        await guardarConsultaHistorial(nuevoRegistroConsulta);
        alert(`¡Excelente! Cita para ${mascota.nombre} guardada con éxito.`);
      }

      setFecha('');
      setHora('');
      setMotivo('');
      await cargarCitas();
    } catch (err) {
      console.error("Error al procesar la cita:", err);
    }
  }

  function cancelarEdicion() {
    setCitaEnEdicion(null);
    setFecha('');
    setHora('');
    setMotivo('');
  }

  return (
    <div className="container mt-2">
      <div className="d-flex j-cont-bet align-item mb-2">
        <h2 className="fs-1-75 fw-bold text-dark">Vista de administrador al realizar las citas</h2>
        <button className="btn-outline-secondary btn-sm" onClick={() => navigate("/Dashboard-admin/gestion")}>
          ← Volver a Gestión
        </button>
      </div>

      {/* ================= DATOS DEL DUEÑO (CORREGIDO Y SEPARADO) ================= */}
      <div className="card shadow-sm br-2 mb-2" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos del Dueño
        </div>
        <div className="p-2">
          <div className="d-flex gap-4 f-wrap">
            <div style={{ flex: '1', minWidth: '150px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-dark fs-1-1">{nombreUsuario || "vilma"}</div>
            </div>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Correo</div>
              <div className="text-dark fs-1-1">{correoUsuario || "vilma@ues.edu.sv"}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Teléfono</div>
              <div className="text-dark fs-1-1">{telefonoUsuario || "76948130"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DATOS DE LA MASCOTA (CORREGIDO Y SEPARADO) ================= */}
      <div className="card shadow-sm br-2 mb-3" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos de la Mascota
        </div>
        <div className="p-2">
          <div className="d-flex j-cont-bet f-wrap gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-accent fs-1-3">{mascota?.nombre || "Nina"}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Especie</div>
              <div><span className="badge info text-lowercase">{mascota?.especie || "perro"}</span></div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Vacunas</div>
              <div><span className="badge success">{mascota?.vacunas || "Rabia (2025)"}</span></div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Fecha Registro</div>
              <div className="text-dark">{mascota?.fechaRegistro ? new Date(mascota.fechaRegistro).toLocaleDateString("es-SV") : "12/6/2026"}</div>
            </div>
          </div>

          <div className="d-flex j-cont-bet f-wrap gap-2">
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Raza</div>
              <div className="text-dark fw-medium">{mascota?.raza || "Recogido"}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Sexo</div>
              <div className="text-dark">{mascota?.sexo || "Hembra"}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Color / Pelaje</div>
              <div className="text-dark">{mascota?.color || "Café"}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Peso</div>
              <div className="text-dark fw-bold">{mascota?.peso ? `${mascota.peso} kg` : "1 kg"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm br-2 p-3 mb-3" style={{ 
        maxWidth: '650px', 
        margin: '0 auto', 
        backgroundColor: '#fdfdfd', 
        border: citaEnEdicion ? '2px solid #f0ad4e' : '1px solid #e2e8f0' 
      }}>
        <p className="text-accent fs-0-9 mb-2 fw-medium text-center">
          {citaEnEdicion ? "MODO REPROGRAMACIÓN" : "Muestra los datos"}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-1-5">
            <label className="label fw-bold text-secondary">Servicio de Clínica / Estética:</label>
            <select value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)} className="select">
              <option value="15">Consulta ($15.00)</option>
              <option value="25">Vacunación ($25.00)</option>
              <option value="20">Estética / Corte y Baño ($20.00)</option>
              <option value="40">Chequeo General / Laboratorio ($40.00)</option>
            </select>
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

          <div className="d-flex gap-1">
            <button type="submit" className={citaEnEdicion ? "btn-warning btn-block" : "btn-primary btn-block"}>
              {citaEnEdicion ? 'Actualizar e Informar Cambio' : 'Guardar Cita e Historial'}
            </button>
            {citaEnEdicion && (
              <button type="button" onClick={cancelarEdicion} className="btn-outline-secondary">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Listado inferior */}
      {cargando ? (
        <p className="text-muted">Cargando registros...</p>
      ) : (
        <ListaCitas 
          citas={citas.filter(c => c.correoDueno === correoUsuario)} 
          alCambiarEstado={handleCambiarEstado} 
          cargarCitas={cargarCitas} 
        />
      )}
    </div>
  );
}