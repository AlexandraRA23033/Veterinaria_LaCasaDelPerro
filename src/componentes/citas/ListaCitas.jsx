import {useState} from 'react';
import EstadoCita from './EstadoCita';

const ListaCitas = ({ citas, alCambiarEstado }) => {
  
  // Mapeamos los estados directamente a las clases de alertas/badges de tu framework CSS
  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'form-text error';   // Tus tonos de alerta base
      case 'Pospuesta': return 'form-text';         // Tono muted/neutral de tu CSS
      case 'Completada': return 'form-text success'; // Tu verde #6E8F6B
      case 'Cancelada': return 'form-text error';    // Tu rojo #E85C5C
      default: return 'form-text';
    }
  };

  return (
    // Reemplazamos el contenedor inline por tu clase estructurada ".card"
    <div className="card">
      <div className="card-header">
        📋 Panel de Gestión de Citas (Administrador)
      </div>

      <div className="card-body">
        {citas.length === 0 ? (
          <p className="form-text" style={{ textAlign: 'center', padding: '20px 0' }}>
            No hay ninguna cita registrada en el sistema de reservas.
          </p>
        ) : (
          <div>
            {/* Aplicamos tu clase nativa ".table" */}
            <table className="table">
              <thead>
                <tr>
                  <th>Mascota / Dueño</th>
                  <th>Fecha / Hora</th>
                  <th>Servicio Solicitado</th>
                  <th>Motivo / Costo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Acciones de Control</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((cita) => (
                  <tr key={cita.id}>
                    <td>
                      {/* Eliminamos el azul #007bff de Bootstrap y dejamos que herede tu color de fuente */}
                      <strong>{cita.mascota}</strong> <br />
                      <span className="form-text">Dueño: {cita.dueno}</span>
                    </td>
                    <td>
                      <span>📅 {cita.fecha}</span> <br />
                      <span className="form-text">{cita.hora}</span>
                    </td>
                    <td>
                      {/* Usamos una estructura limpia para resaltar el servicio */}
                      <span style={{ fontWeight: '500' }}>
                        {cita.servicio}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{ display: 'block', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                        title={cita.motivo}
                      >
                        {cita.motivo}
                      </span>
                      {/* Cambiamos el verde Bootstrap por tu tono primario o de éxito */}
                      <strong style={{ color: '#6E8F6B' }}>${cita.precio.toFixed(2)}</strong>
                    </td>
                    <td>
                      {/* Renderizado dinámico con tus clases de validación automatizada */}
                      <span className={obtenerClaseEstado(cita.estado)} style={{ fontWeight: 'bold' }}>
                        {cita.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {/* Inyección del componente de botones de estado */}
                      <EstadoCita cita={cita} alCambiarEstado={alCambiarEstado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaCitas;