import { useState, useEffect } from "react";
import { obtenerCitasAgenda, actualizarCitaAgenda } from "../../base-datos/configuracion";
import ListaCitas from "./ListaCitas"; //Importación del componente que renderiza la tabla

export default function HistorialCitas() {
  // ESTADOS LOCALES DEL COMPONENTE
  const [citas, setCitas] = useState([]); // Almacena la lista completa de citas recuperadas de la base de datos
  const [cargando, setCargando] = useState(true); // Controla el renderizado de la pantalla de carga preliminar

  // FLUJO DE CARGA DE DATOS
  // Consulta la base de datos IndexedDB para obtener los registros actualizados de la agenda
  const cargarCitasDelSistema = async () => {
    try {
      const datos = await obtenerCitasAgenda();
      setCitas(datos || []);
    } catch (err) {
      console.error("Error cargando el historial de citas:", err);
    } finally {
      setCargando(false);
    }
  };

  // Ejecuta la carga inicial de datos en el ciclo de montaje del componente
  useEffect(() => {
    cargarCitasDelSistema();
  }, []);

  // MANEJADORES DE EVENTOS / CALLBACKS
  // Modifica de forma asíncrona el estado de una cita y sincroniza los cambios de forma persistente
  const handleCambiarEstado = async (idCita, nuevoEstado) => {
    try {
      const citaExistente = citas.find(c => c.id === idCita);
      if (!citaExistente) return;

      const citaActualizada = { 
        ...citaExistente, 
        estado: nuevoEstado 
      };

      // Actualiza el registro persistente en el almacenamiento local
      await actualizarCitaAgenda(citaActualizada);
      
      // Refresca la memoria de la aplicación consultando nuevamente la base de datos
      await cargarCitasDelSistema(); 
    } catch (err) {
      console.error("Error al actualizar el estado e intentar notificar:", err);
    }
  };

 // MÉTRICAS Y PROCESAMIENTO DE DATOS
  // Filtra las citas completadas y calcula la sumatoria totalizada de ingresos monetarios
  const totalIngresosRealizados = citas
    .filter(cita => cita.estado === 'Completada')
    .reduce((suma, cita) => suma + (Number(cita.precio) || 0), 0);

  // Contadores analíticos basados en la longitud de arreglos filtrados por estado
  const totalCompletadas = citas.filter(cita => cita.estado === 'Completada').length;
  const totalPospuestas = citas.filter(cita => cita.estado === 'Pospuesta').length;
  const totalCanceladas = citas.filter(cita => cita.estado === 'Cancelada').length;

  // RENDERIZADO DE LA INTERFAZ DE USUARIO
  return (
    <div className="container mt-2">
      {cargando ? (
        <p className="text-muted">Cargando historial clínico y citas...</p>
      ) : (
        <>
          {/* SECCIÓN SUPERIOR: TARJETAS DE INDICADORES ANALÍTICOS */}
          <div className="d-flex gap-2 mb-3 f-wrap">
            
            {/* Tarjeta de Ingresos */}
            <div className="card shadow-sm br-2 p-2" style={{ flex: '2', minWidth: '220px', borderLeft: '5px solid #28a745', backgroundColor: '#f4faf6' }}>
              <span className="text-muted fs-0-8 fw-bold text-uppercase d-block">Total de Ingresos (Realizadas)</span>
              <h3 className="fw-bold text-success fs-1-75" style={{ margin: 0 }}>
                ${totalIngresosRealizados.toFixed(2)}
              </h3>
            </div>

            {/* Tarjeta de Completadas */}
            <div className="card shadow-sm br-2 p-2 text-center" style={{ flex: '1', minWidth: '120px', borderTop: '4px solid #28a745' }}>
              <span className="text-muted fs-0-75 fw-bold text-uppercase d-block">Completadas</span>
              <span className="badge success fs-1-1 fw-bold mt-0-5">{totalCompletadas}</span>
            </div>

            {/* Tarjeta de Pospuestas */}
            <div className="card shadow-sm br-2 p-2 text-center" style={{ flex: '1', minWidth: '120px', borderTop: '4px solid #ffc107' }}>
              <span className="text-muted fs-0-75 fw-bold text-uppercase d-block">Pospuestas</span>
              <span className="badge warning fs-1-1 fw-bold mt-0-5">{totalPospuestas}</span>
            </div>

            {/* Tarjeta de Canceladas */}
            <div className="card shadow-sm br-2 p-2 text-center" style={{ flex: '1', minWidth: '120px', borderTop: '4px solid #dc3545' }}>
              <span className="text-muted fs-0-75 fw-bold text-uppercase d-block">Canceladas</span>
              <span className="badge danger fs-1-1 fw-bold mt-0-5">{totalCanceladas}</span>
            </div>
          </div>

          {/* VISTA DE TABLA: Transferencia de propiedades y manejadores al subcomponente */}
          <ListaCitas 
            citas={citas} 
            alCambiarEstado={handleCambiarEstado} 
            cargarCitas={cargarCitasDelSistema} 
          />
        </>
      )}
    </div>
  );
}