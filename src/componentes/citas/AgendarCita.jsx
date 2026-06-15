import { useState } from 'react';
import ListaCitas from './ListaCitas';

// RÚBRICA: Catálogo estático de servicios con precios base establecidos para la veterinaria
const SERVICIOS_DISPONIBLES = [
  { id: 'consulta', nombre: 'Consulta', precio: 15 },
  { id: 'sueros', nombre: 'Aplicación de sueros', precio: 15 },
  { id: 'inyecciones', nombre: 'Aplicación de inyecciones', precio: 7 },
  { id: 'curacion', nombre: 'Curación', precio: 10 },
  { id: 'corte_bano', nombre: 'Corte y baño medicado o de belleza', precio: 20 },
  { id: 'bano', nombre: 'Baño medicado o belleza', precio: 18 },
  { id: 'unas', nombre: 'Corte de uñas', precio: 8 },
  { id: 'sondeo', nombre: 'Sondeo', precio: 16 },
  { id: 'cirugia', nombre: 'Pequeñas cirugías', precio: 32.5 },
  { id: 'castracion', nombre: 'Castración', precio: 75 },
  { id: 'dientes', nombre: 'Limpieza de dientes', precio: 16 },
  { id: 'limpieza_profunda', nombre: 'Limpieza profunda', precio: 60 },
  { id: 'lavado_rectal', nombre: 'Lavado rectal', precio: 30 },
  { id: 'enyesado', nombre: 'Enyesado', precio: 65 },
  { id: 'hospedaje', nombre: 'Hospedaje (por día)', precio: 10 }
];

const AgendarCita = () => {
  // ESTADO CENTRAL: Almacena la lista de citas activas en memoria para renderizarlas en la tabla
  const [citas, setCitas] = useState([
    { id: 1, mascota: 'Max', dueno: 'Vilma', telefono: '50376948130', fecha: '2026-06-15', hora: '10:00', servicio: 'Consulta', precio: 15, motivo: 'Revisión general', estado: 'Pendiente' },
    { id: 2, mascota: 'Luna', dueno: 'Juliana', telefono: '50376948130', fecha: '2026-06-16', hora: '14:30', servicio: 'Corte y baño medicado o de belleza', precio: 20, motivo: 'Peluquería higiénica', estado: 'Pendiente' }
  ]);

  // ESTADOS DEL FORMULARIO: Controlan los inputs de forma síncrona (Formulario Controlado en React)
  const [mascota, setMascota] = useState('');
  const [dueno, setDueno] = useState('');
  const [telefono, setTelefono] = useState('50376948130'); // Teléfono por defecto de El Salvador
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [servicioSeleccionado, setServicioSeleccionado] = useState(SERVICIOS_DISPONIBLES[0].id);
  const [motivo, setMotivo] = useState('');

  // VALIDACIÓN TEMPORAL: Obtenemos la fecha actual del sistema en formato ISO (YYYY-MM-DD) para restringir el pasado
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses en JS comienzan en 0
  const dia = String(hoy.getDate()).padStart(2, '0');
  const fechaMinima = `${anio}-${mes}-${dia}`;

  // ARQUITECTURA EN CASCADA: Función intermedia para actualizar el estado de una cita desde el componente hijo
  const handleCambiarEstado = (citaId, nuevoEstado) => {
    setCitas(citas.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
  };

  // MANEJADOR DEL ENVÍO: Procesa, valida e inserta el nuevo registro
  const handleSubmit = (e) => {
    e.preventDefault();

    // VALIDACIÓN DE CAMPOS: Asegura la integridad de los datos requeridos antes de procesar
    if (!mascota || !dueno || !telefono || !fecha || !hora || !motivo) {
      alert('Por favor completa todos los campos del formulario.');
      return;
    }

    // --- ALGORITMO DE CONTROL DE TIEMPO (RÚBRICA AVANZADA) ---
    // Convertimos la hora elegida (ej: "07:41") a minutos totales desde la medianoche para poder operar matemáticamente
    const [horasNuevas, minutosNuevos] = hora.split(':').map(Number);
    const minutosNuevaCita = horasNuevas * 60 + minutosNuevos;
    
    // Definimos el lapso protegido (Duración promedio de una atención en minutos)
    const DURACION_CITA = 30;

    // Buscamos si existe conflicto de colisión de tiempo en la misma fecha
    const conflictoHorario = citas.some((cita) => {
      // Ignoramos las citas del mismo día que ya fueron canceladas
      if (cita.fecha !== fecha || cita.estado === 'Cancelada') return false;

      // Convertimos la hora de la cita ya guardada a minutos totales
      const [horasExistentes, minutosExistentes] = cita.hora.split(':').map(Number);
      const minutosCitaExistente = horasExistentes * 60 + minutosExistentes;

      // Calculamos la diferencia absoluta en minutos entre ambas citas
      const diferenciaTiempo = Math.abs(minutosNuevaCita - minutosCitaExistente);

      // Si la diferencia es menor a 30 minutos, hay choque de horario
      return diferenciaTiempo < DURACION_CITA;
    });

    if (conflictoHorario) {
      alert(`Conflicto de agenda: El horario seleccionado se cruza con otra cita en desarrollo. Cada servicio requiere un bloque mínimo de ${DURACION_CITA} minutos.`);
      return;
    }
    // ---------------------------------------------------------

    const datosServicio = SERVICIOS_DISPONIBLES.find(s => s.id === servicioSeleccionado);

    const nuevaCita = {
      id: Date.now(),
      mascota,
      dueno,
      telefono,
      fecha,
      hora,
      servicio: datosServicio.nombre,
      precio: datosServicio.precio,
      motivo,
      estado: 'Pendiente'
    };

    setCitas([...citas, nuevaCita]);

    // LIMPIEZA DE CAMPOS
    setMascota('');
    setDueno('');
    setFecha('');
    setHora('');
    setMotivo('');
    alert(`¡Excelente! Cita para ${mascota} guardada en el sistema.`);
  };

  return (
    <div>
      {/* SECCIÓN DEL FORMULARIO DE RESERVAS */}
      <div className="card card-hover" style={{ maxWidth: '600px', margin: '0 auto 30px auto' }}>
        <div className="card-header" style={{ textAlign: 'center', fontSize: '1.25rem' }}>
          Motor de Reservas y Gestión de Citas
        </div>
        
        <div className="card-body">
          <form onSubmit={handleSubmit} className="form-group">
            
            <div className="form-group">
              <label className="label">Nombre de la Mascota:</label>
              <input type="text" value={mascota} onChange={(e) => setMascota(e.target.value)} className="input" placeholder="Ej. Nina" />
            </div>

            <div className="form-group">
              <label className="label">Nombre del Dueño:</label>
              <input type="text" value={dueno} onChange={(e) => setDueno(e.target.value)} className="input" placeholder="Ej. Mercedes" />
            </div>

            <div className="form-group">
              <label className="label">WhatsApp Notificaciones:</label>
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" />
            </div>

            <div className="form-group">
              <label className="label">Servicio de Clínica / Estética:</label>
              <select value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)} className="select">
                {SERVICIOS_DISPONIBLES.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Fecha Programada:</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                min={fechaMinima} 
                className="input" 
              />
            </div>

            <div className="form-group">
              <label className="label">Hora Asignada:</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input" />
            </div>

            <div className="form-group">
              <label className="label">Motivo o Especificaciones de Visita:</label>
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="textarea" placeholder="Detalles de la condición de salud o estilo de corte..." />
            </div>

            <button type="submit" className="btn-primary btn-block" style={{ marginTop: '10px' }}>
              Agendar y Guardar Registro
            </button>
          </form>
        </div>
      </div>

      {/* TABLA ADMINISTRATIVA */}
      <ListaCitas citas={citas} alCambiarEstado={handleCambiarEstado} />
    </div>
  );
};

export default AgendarCita;