import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";
import ListaCitas from "./ListaCitas";

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

export default function AgendarCita() {
    const navigate = useNavigate();
    const [citas, setCitas] = useState([]);
    const [cargando, setCargando] = useState(true);

    const [mascota, setMascota] = useState('');
    const [dueno, setDueno] = useState('');
    const [telefono, setTelefono] = useState('50376948130');
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [servicioSeleccionado, setServicioSeleccionado] = useState(SERVICIOS_DISPONIBLES[0].id);
    const [motivo, setMotivo] = useState('');

    const hoy = new Date();
    const fechaMinima = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    async function cargarCitas() {
        setCargando(true);
        try {
            const db = await configurarBD();
            const todasLasCitas = await db.getAll("agenda");
            setCitas(todasLasCitas || []);
        } catch (err) {
            console.error("Error cargando citas de IndexedDB:", err);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarCitas();
    }, []);

    async function handleCambiarEstado(citaId, nuevoEstado) {
        try {
            const db = await configurarBD();
            const citaExistente = citas.find(c => c.id === citaId);
            if (citaExistente) {
                const citaActualizada = { ...citaExistente, estado: nuevoEstado };
                await db.put("agenda", citaActualizada);
                await cargarCitas();
            }
        } catch (err) {
            console.error("Error al actualizar estado de la cita:", err);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!mascota || !dueno || !telefono || !fecha || !hora || !motivo) {
            alert('⚠️ Por favor completa todos los campos del formulario.');
            return;
        }

        // --- VALIDACIÓN DE HORARIOS OFICIALES (LA CASA DEL PERRO) ---
        const [horas, minutos] = hora.split(':').map(Number);
        const tiempoEnMinutos = horas * 60 + minutos;

        // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
        // Usamos la fecha desglosada localmente para evitar desfases de zona horaria
        const [anioPart, mesPart, diaPart] = fecha.split('-').map(Number);
        const objetoFecha = new Date(anioPart, mesPart - 1, diaPart);
        const diaSemana = objetoFecha.getDay();

        if (diaSemana === 0) {
            alert('❌ La Casa del Perro está cerrada los domingos. Por favor selecciona otro día.');
            return;
        }

        if (diaSemana >= 1 && diaSemana <= 5) {
            // Lunes a Viernes: 8:00am a 12:00pm (480 a 720 min) y 1:00pm a 4:00pm (780 a 960 min)
            const turnoManana = tiempoEnMinutos >= 480 && tiempoEnMinutos <= 720;
            const turnoTarde = tiempoEnMinutos >= 780 && tiempoEnMinutos <= 960;

            if (!turnoManana && !turnoTarde) {
                alert('❌ Horario no disponible de Lunes a Viernes.\nAtendemos de 8:00 am – 12:00 pm y de 1:00 pm – 4:00 pm.\n(Cerrado por almuerzo de 12:00 pm a 1:00 pm).');
                return;
            }
        } else if (diaSemana === 6) {
            // Sábados: 8:00am a 12:00pm (480 a 720 min)
            const turnoSabado = tiempoEnMinutos >= 480 && tiempoEnMinutos <= 720;

            if (!turnoSabado) {
                alert('❌ Horario no disponible para Sábados.\nAtendemos únicamente de 8:00 am – 12:00 pm.');
                return;
            }
        }

        // --- CONTROL DE CHOQUE DE CITAS (Bloques de 30 minutos) ---
        const DURACION_CITA = 30;
        const conflictoHorario = citas.some((cita) => {
            if (cita.fecha !== fecha || cita.estado === 'Cancelada') return false;
            const [horasExistentes, minutosExistentes] = cita.hora.split(':').map(Number);
            const minutosCitaExistente = horasExistentes * 60 + minutosExistentes;
            return Math.abs(tiempoEnMinutos - minutosCitaExistente) < DURACION_CITA;
        });

        if (conflictoHorario) {
            alert(`❌ Conflicto de agenda: Ya existe otra cita programada en ese bloque de tiempo de ${DURACION_CITA} minutos.`);
            return;
        }

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

        try {
            const db = await configurarBD();
            await db.add("agenda", nuevaCita);
            
            setMascota('');
            setDueno('');
            setFecha('');
            setHora('');
            setMotivo('');
            alert(`📅 ¡Excelente! Cita para ${mascota} guardada con éxito.`);
            await cargarCitas();
        } catch (err) {
            console.error("Error al guardar la cita en la base de datos:", err);
        }
    }

    return (
        <div>
            <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
                <div>
                    <h2 className="fs-2 fw-bold text-primary">Motor de Reservas y Citas</h2>
                    <p className="text-muted">Horarios: Lun a Vie 8am-12pm / 1pm-4pm • Sáb 8am-12pm</p>
                </div>
            </div>

            <div className="card card-hover mb-3" style={{ maxWidth: '600px', margin: '0 auto 30px auto' }}>
                <div className="card-header text-center fs-1-25">🐾 Registrar Nueva Cita</div>
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="form-group">
                        <div className="form-group mb-1">
                            <label className="label">Nombre de la Mascota:</label>
                            <input type="text" value={mascota} onChange={(e) => setMascota(e.target.value)} className="input" placeholder="Ej. Nina" />
                        </div>
                        <div className="form-group mb-1">
                            <label className="label">Nombre del Dueño:</label>
                            <input type="text" value={dueno} onChange={(e) => setDueno(e.target.value)} className="input" placeholder="Ej. Mercedes" />
                        </div>
                        <div className="form-group mb-1">
                            <label className="label">WhatsApp Notificaciones:</label>
                            <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="input" />
                        </div>
                        <div className="form-group mb-1">
                            <label className="label">Servicio Solicitado:</label>
                            <select value={servicioSeleccionado} onChange={(e) => setServicioSeleccionado(e.target.value)} className="select">
                                {SERVICIOS_DISPONIBLES.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} (${s.precio})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group mb-1">
                            <label className="label">Fecha Programada:</label>
                            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={fechaMinima} className="input" />
                        </div>
                        <div className="form-group mb-1">
                            <label className="label">Hora Asignada:</label>
                            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input" />
                        </div>
                        <div className="form-group mb-2">
                            <label className="label">Motivo o Especificaciones:</label>
                            <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} className="textarea" placeholder="Detalles..." />
                        </div>
                        <button type="submit" className="btn-primary btn-block">🚀 Guardar Cita Permanentemente</button>
                    </form>
                </div>
            </div>

            {cargando ? <p className="text-muted">Cargando historial...</p> : <ListaCitas citas={citas} alCambiarEstado={handleCambiarEstado} />}
        </div>
    );
  }