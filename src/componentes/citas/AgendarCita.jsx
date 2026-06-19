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

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalTitulo, setModalTitulo] = useState('');
  const [modalMensaje, setModalMensaje] = useState('');

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

// Función interna para disparar los modales en vez de alert()
  function mostrarAlertaModal(titulo, mensaje) {
    setModalTitulo(titulo);
    setModalMensaje(mensaje);
    setModalAbierto(true);
  }

  useEffect(() => {
    if (citaAEditar) {
      setFecha(citaAEditar.fecha || '');
      setHora(citaAEditar.hora || '');
      setMotivo(citaAEditar.motivo || '');
      
      const idServicio = Object.keys(SERVICIOS_PREDETERMINADOS).find(
        key => SERVICIOS_PREDETERMINADOS[key].nombre === citaAEditar.servicio
      );
      if (idServicio) setServicioSeleccionado(idServicio);
    }
  }, [citaAEditar]);

  useEffect(() => {
    if (!mascota && !citaAEditar) {
      mostrarAlertaModal("Atención", "Por favor, selecciona una mascota desde la tabla de vista rápida primero.");
      setTimeout(() => {
        setModalAbierto(false);
        navigate("/citas");
      }, 3000);
      return;
    }
    cargarCitas();
  }, [mascota]);

  // ================= MOTORES DE VALIDACIÓN DE HORARIOS =================
  function validarHorarioYChoques(fechaSel, horaSel) {
    if (!horaSel || !fechaSel) return false;

    let [horas, minutos] = horaSel.split(':').map(Number);
    if (horas >= 1 && horas <= 4) {
      horas += 12;
    }

    const tiempoEnMinutos = horas * 60 + minutos;
    const [anioPart, mesPart, diaPart] = fechaSel.split('-').map(Number);
    const objetoFecha = new Date(Date.UTC(anioPart, mesPart - 1, diaPart, 12, 0, 0)); 
    const diaSemana = objetoFecha.getUTCDay(); 

    const recordatorioHorarios = 
      "\n\n🕒 Horarios de atención:\n" +
      "• Lunes a Viernes: 8:00 AM - 12:00 PM y 1:00 PM - 4:00 PM\n" +
      "• Sábados: 8:00 AM - 12:00 PM\n" +
      "• Domingos: Cerrado.";

    if (diaSemana === 0) {
      mostrarAlertaModal(`La Casa del Perro está cerrada los domingos. Por favor, selecciona otro día.${recordatorioHorarios}`);
      return false;
    }

    if (diaSemana >= 1 && diaSemana <= 5) {
      const turnoManana = tiempoEnMinutos >= 480 && tiempoEnMinutos <= 720; 
      const turnoTarde = tiempoEnMinutos >= 780 && tiempoEnMinutos <= 960;  
      if (!turnoManana && !turnoTarde) {
        mostrarAlertaModal(`El horario seleccionado (${horaSel}) no está disponible de Lunes a Viernes.${recordatorioHorarios}`);
        return false;
      }
    } else if (diaSemana === 6) {
      if (tiempoEnMinutos < 480 || tiempoEnMinutos > 720) {
        mostrarAlertaModal(`El horario seleccionado (${horaSel}) no está disponible para día Sábado.${recordatorioHorarios}`);
        return false;
      }
    }

    const DURACION_CITA = 30;
    const conflicto = citas.some((c) => {
      if (!c || !c.hora || !c.fecha) return false; // 🛡️ Blindaje contra objetos corruptos de la DB
      if (c.id === citaAEditar?.id) return false; 
      if (c.fecha !== fechaSel || c.estado === 'Cancelada') return false;
      
      let [hE, mE] = c.hora.split(':').map(Number);
      if (hE >= 1 && hE <= 4) hE += 12; 
      
      const minutosE = hE * 60 + mE;
      return Math.abs(tiempoEnMinutos - minutosE) < DURACION_CITA;
    });

    if (conflicto) {
      mostrarAlertaModal(`Conflicto de agenda: Ya existe otra cita activa en ese mismo bloque de tiempo o interfiere con un margen menor a 30 minutos. Por favor, selecciona otra hora.`);
      return false;
    }

    return true;
  }

  // ================= GUARDAR CITA E HISTORIAL =================
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!fecha || !hora || !motivo) {
      mostrarAlertaModal('Por favor completa la fecha, hora y motivo.');
      return;
    }

    try {
      // 🛡️ Ahora la validación corre adentro del try-catch por seguridad total
      if (!validarHorarioYChoques(fecha, hora)) return;

      const datosServicio = SERVICIOS_PREDETERMINADOS[servicioSeleccionado];
      let nuevaCita = {};

      if (citaAEditar) {
        try {
          const requestDB = indexedDB.open("veterinariaDB"); 
          requestDB.onsuccess = function(event) {
            const db = event.target.result;
            if(db.objectStoreNames.contains("citas")) {
               const tx = db.transaction("citas", "readwrite");
               tx.objectStore("citas").delete(citaAEditar.id);
            }
          };
        } catch(e) {
          console.log("Limpieza preventiva omitida");
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

      await guardarCitaAgenda(nuevaCita);

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
      
      mostrarAlertaModal(`¡Excelente! Cita de ${nuevaCita.mascota} procesada correctamente.`);
      setTimeout(() => {
        setModalAbierto(false);
        navigate("/historial");
      }, 2500);

    } catch (err) {
      console.error("Error crítico detectado:", err);
      
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
            servicio: SERVICIOS_PREDETERMINADOS[servicioSeleccionado].nombre,
            precio: SERVICIOS_PREDETERMINADOS[servicioSeleccionado].precio,
            motivo: motivo,
            estado: 'Pospuesta',
            notificadaComoNueva: false,
            notificadaComoPospuesta: false
          };
          await guardarCitaAgenda(citaForzada);
          mostrarAlertaModal(`¡Cita reprogramada con éxito! (Actualizado en sistema con referencia #${idForzado})`);
          setTimeout(() => {
            setModalAbierto(false);
            navigate("/historial");
          }, 2500);
          return;
        } catch (errorInterno) {
          console.error("Error definitivo:", errorInterno);
        }
      }
      console.error("Error crítico al guardar la cita en IndexedDB:", err);
      mostrarAlertaModal("No se pudo guardar en la Base de Datos. Revisa la consola del navegador.");
    }
  }

  return (
    <div className="container mt-2">
      {/* 🛠️ CAPA CSS EMBEBIDA PARA ASEGURAR QUE TU MODAL SE VEA SÍ O SÍ */}
      <style>{`
        .modal-emergente-fijo {
          display: none;
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.55);
          z-index: 99999;
          justify-content: center;
          align-items: center;
        }
        .modal-emergente-fijo.visible-open {
          display: flex;
        }
        .modal-recuadro {
          background: #ffffff;
          padding: 24px;
          border-radius: 8px;
          max-width: 480px;
          width: 90%;
          box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .modal-titulo-seccion {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 16px;
        }
        .modal-titulo-seccion h3 { margin: 0; font-size: 1.2rem; color: #1a202c; }
        .modal-cerrar-btn { background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #718096; }
        .modal-cuerpo-txt { font-size: 0.95rem; color: #4a5568; line-height: 1.5; margin-bottom: 20px; }
        .modal-pie-seccion { display: flex; justify-content: flex-end; }
      `}</style>

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
      {/* ================= CONTAINER DEL MODAL DINÁMICO (LIBRERÍA PROPIA) ================= */}
      <div className={`modal ${modalAbierto ? 'open' : ''}`} id="modalAlertaApp">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{modalTitulo}</h3>
            <button type="button" onClick={() => setModalAbierto(false)}>×</button>
          </div>
          <div className="modal-body">
            <p style={{ whiteSpace: 'pre-line' }}>{modalMensaje}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setModalAbierto(false)}>
              Entendido
            </button>
          </div>
        </div>
      </div>

    </div>
    
  );
}