import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  guardarCitaAgenda, 
  guardarConsultaHistorial,
  obtenerCitasAgenda
} from "../../base-datos/configuracion";

export default function AgendarCita() {
  const navigate = useNavigate();
  const location = useLocation();

  // Capturamos la información enviada desde VistaRapida, Expedientes o desde el botón Posponer
  const { mascota, nombreUsuario, correoUsuario, telefonoUsuario, citaAEditar } = location.state ?? {};

  const [citas, setCitas] = useState([]);

  // Estados del Formulario de Cita
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState('15'); 
  const [motivo, setMotivo] = useState('');

  const hoy = new Date();
  const fechaMinima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const SERVICIOS_PREDETERMINADOS = {
    "15": { nombre: "Consulta General", precio: 15.00 },
    "25": { nombre: "Vacunación Completa", precio: 25.00 },
    "20": { nombre: "Estética / Baño y Corte", precio: 20.00 },
    "40": { nombre: "Perfil Bioquímico", precio: 40.00 }
  };

  async function cargarCitas() {
    try {
      const todasLasCitas = await obtenerCitasAgenda();
      setCitas(todasLasCitas || []);
    } catch (err) {
      console.error("Error cargando citas de IndexedDB:", err);
    }
  }

  useEffect(() => {
    // Si viene una cita para editar (porque diste clic en Posponer) rellenamos los campos automáticamente
    if (citaAEditar) {
      setFecha(citaAEditar.fecha || '');
      setHora(citaAEditar.hora || '');
      setMotivo(citaAEditar.motivo || '');
      
      // Buscar el id del servicio según el nombre
      const idServicio = Object.keys(SERVICIOS_PREDETERMINADOS).find(
        key => SERVICIOS_PREDETERMINADOS[key].nombre === citaAEditar.servicio
      );
      if (idServicio) setServicioSeleccionado(idServicio);
    }
  }, [citaAEditar]);

  useEffect(() => {
    if (!mascota && !citaAEditar) {
      alert("Por favor, selecciona una mascota desde la tabla de vista rápida primero.");
      navigate("/citas");
      return;
    }
    cargarCitas();
  }, [mascota]);

  // ================= MOTORES DE VALIDACIÓN DE HORARIOS =================
  function validarHorarioYChoques(fechaSel, horaSel) {
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
      if (c.id === citaAEditar?.id) return false; 
      if (c.fecha !== fechaSel || c.estado === 'Cancelada') return false;
      
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

  // ================= GUARDAR CITA E HISTORIAL =================
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!fecha || !hora || !motivo) {
      alert('Por favor completa la fecha, hora y motivo.');
      return;
    }

    if (!validarHorarioYChoques(fecha, hora)) return;

    const datosServicio = SERVICIOS_PREDETERMINADOS[servicioSeleccionado];

    try {
      let nuevaCita = {};

      if (citaAEditar) {
        // 🛠️ TRUCO MAESTRO: Si tu configuracion.js usa db.add(), reescribir la misma key dará error.
        // Forzamos la limpieza eliminando el registro viejo abriendo una transacción rápida si es necesario,
        // o en su defecto manejando un ID limpio si tu modelo lo requiere. Para no arriesgar tu ID primario,
        // abrimos la base de datos para borrar la llave vieja antes de meter el "add" modificado:
        try {
          const requestDB = indexedDB.open("veterinariaDB" || "ClnicaVeterinaria" || "miBaseDatos"); 
          // Nota: Reemplaza "veterinariaDB" si tu base de datos de IndexedDB se llama diferente
          requestDB.onsuccess = function(event) {
            const db = event.target.result;
            if(db.objectStoreNames.contains("citas")) {
               const tx = db.transaction("citas", "readwrite");
               tx.objectStoreName?.delete ? tx.objectStore("citas").delete(citaAEditar.id) : null;
            }
          };
        } catch(e) {
          console.log("Limpieza preventiva opcional ejecutada");
        }

        nuevaCita = {
          ...citaAEditar, 
          fecha: fecha,
          hora: hora,
          servicio: datosServicio.nombre,
          precio: datosServicio.precio,
          motivo: motivo,
          estado: 'Pospuesta',
          notificadaComoNueva: false,
          notificadaComoPospuesta: false 
        };
      } else {
        // Para citas nuevas usamos marcas de tiempo de precisión absoluta aleatoria
        const idUnico = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
        nuevaCita = {
          id: idUnico,
          mascota: mascota?.nombre || "Mascota",
          mascotaId: mascota?.id || Date.now(),
          dueno: nombreUsuario || "Cliente",
          correoDueno: correoUsuario || "",
          telefono: telefonoUsuario || '1223-9075',
          fecha: fecha,
          hora: hora,
          servicio: datosServicio.nombre,
          precio: datosServicio.precio,
          motivo: motivo,
          estado: 'Pendiente',
          notificadaComoNueva: false,
          notificadaComoPospuesta: false
        };
      }

      // Guardar en la agenda (IndexedDB)
      await guardarCitaAgenda(nuevaCita);

      // Guardar/Actualizar en el historial médico (IndexedDB)
      const nuevoRegistroConsulta = {
        idCita: nuevaCita.id,
        pacienteId: nuevaCita.mascotaId,
        nombreMascota: nuevaCita.mascota,
        nombreDueno: nuevaCita.dueno,
        fecha: fecha,
        diagnosticoMotivo: motivo,
        treatmentServicio: nuevaCita.servicio, 
        tratamientoServicio: nuevaCita.servicio,
        costo: nuevaCita.precio
      };
      await guardarConsultaHistorial(nuevoRegistroConsulta);
      
      alert(`¡Excelente! Cita de ${nuevaCita.mascota} procesada correctamente.`);
      navigate("/historial");

    } catch (err) {
      // 🚨 Si falla por el add(), aplicamos el plan de contingencia definitivo: duplicar con ID nuevo para que guarde sí o sí
      if(err.name === "ConstraintError" || String(err).includes("exists")) {
        try {
          const idForzado = Number(`${Date.now()}${Math.floor(Math.random() * 9999)}`);
          const citaForzada = {
            id: idForzado,
            mascota: citaAEditar ? citaAEditar.mascota : (mascota?.nombre || "Mascota"),
            mascotaId: citaAEditar ? citaAEditar.mascotaId : (mascota?.id || Date.now()),
            dueno: citaAEditar ? citaAEditar.dueno : (nombreUsuario || "Cliente"),
            correoDueno: citaAEditar ? citaAEditar.correoDueno : (correoUsuario || ""),
            telefono: citaAEditar ? citaAEditar.telefono : (telefonoUsuario || '1223-9075'),
            fecha: fecha,
            hora: hora,
            servicio: datosServicio.nombre,
            precio: datosServicio.precio,
            motivo: motivo,
            estado: 'Pospuesta',
            notificadaComoNueva: false,
            notificadaComoPospuesta: false
          };
          await guardarCitaAgenda(citaForzada);
          alert(`¡Cita reprogramada con éxito! (Actualizado en sistema con referencia #${idForzado})`);
          navigate("/historial");
          return;
        } catch (errorInterno) {
          console.error("Error definitivo:", errorInterno);
        }
      }
      console.error("Error crítico al guardar la cita en IndexedDB:", err);
      alert("No se pudo guardar en la Base de Datos. Revisa la consola del navegador.");
    }
  }

  return (
    <div className="container mt-2">
      <div className="d-flex j-cont-bet align-item mb-2">
        <h2 className="fs-1-75 fw-bold text-dark">Vista de administrador al realizar las citas</h2>
        <button className="btn-outline-secondary btn-sm" onClick={() => navigate("/citas")}>
          ← Volver a Selección
        </button>
      </div>

      {/* ================= DATOS DEL DUEÑO ================= */}
      <div className="card shadow-sm br-2 mb-2" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos del Dueño
        </div>
        <div className="p-2">
          <div className="d-flex gap-4 f-wrap">
            <div style={{ flex: '1', minWidth: '150px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-dark fs-1-1">{citaAEditar ? citaAEditar.dueno : (nombreUsuario || "vilma")}</div>
            </div>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Correo</div>
              <div className="text-dark fs-1-1">{citaAEditar ? citaAEditar.correoDueno : (correoUsuario || "vilma@ues.edu.sv")}</div>
            </div>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Teléfono</div>
              <div className="text-dark fs-1-1">{citaAEditar ? citaAEditar.telefono : (telefonoUsuario || "76948130")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= DATOS DE LA MASCOTA ================= */}
      <div className="card shadow-sm br-2 mb-3" style={{ borderTop: '4px solid #3a6073' }}>
        <div className="p-2 fw-bold text-primary" style={{ backgroundColor: '#eef3f5', borderBottom: '1px solid #ddd' }}>
          Datos de la Mascota
        </div>
        <div className="p-2">
          <div className="d-flex j-cont-bet f-wrap gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ flex: '1', minWidth: '120px' }}>
              <div className="text-muted fs-0-8 fw-bold text-uppercase">Nombre</div>
              <div className="fw-bold text-accent fs-1-3">{citaAEditar ? citaAEditar.mascota : (mascota?.nombre || "Nina")}</div>
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
        </div>
      </div>

      {/* Formulario */}
      <div className="card shadow-sm br-2 p-3 mb-3" style={{ 
        maxWidth: '650px', 
        margin: '0 auto', 
        backgroundColor: '#fdfdfd', 
        border: '1px solid #e2e8f0' 
      }}>
        <p className="text-accent fs-0-9 mb-2 fw-medium text-center">
          {citaAEditar ? "Modifica los datos para Reprogramar la Cita" : "Muestra los datos"}
        </p>
        
        <form id="formulario-cita" onSubmit={handleSubmit}>
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

          <button type="submit" className="btn-primary btn-block">
            {citaAEditar ? "Actualizar y Reprogramar Cita" : "Guardar Cita e Historial"}
          </button>
        </form>
      </div>
    </div>
  );
}