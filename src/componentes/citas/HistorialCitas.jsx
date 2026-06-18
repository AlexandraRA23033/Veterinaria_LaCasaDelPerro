import { useEffect, useState } from "react";
import { obtenerCitasAgenda, actualizarCitaAgenda } from "../../base-datos/configuracion";
import ListaCitas from "./ListaCitas"; 

export default function HistorialCitas() {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

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

  useEffect(() => {
    cargarCitasDelSistema();
  }, []);

  const handleCambiarEstado = async (idCita, nuevoEstado) => {
    try {
      const citaExistente = citas.find(c => c.id === idCita);
      if (!citaExistente) return;

      const citaActualizada = { 
        ...citaExistente, 
        estado: nuevoEstado 
      };

      await actualizarCitaAgenda(citaActualizada);
      await cargarCitasDelSistema(); 
    } catch (err) {
      console.error("Error al actualizar el estado e intentar notificar:", err);
    }
  };

  return (
    <div className="container mt-2">
      {cargando ? (
        <p className="text-muted">Cargando historial clínico y citas...</p>
      ) : (
        /* 👇 CORREGIDO: Pasamos cargarCitas para que llegue hasta EstadoCita */
        <ListaCitas 
          citas={citas} 
          alCambiarEstado={handleCambiarEstado} 
          cargarCitas={cargarCitasDelSistema} 
        />
      )}
    </div>
  );
}