import { useEffect, useState } from "react";
import EstadoCita from './EstadoCita';

const ListaCitas = ({ citas, alCambiarEstado, cargarCitas }) => {
  
  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'badge info';        
      case 'Pospuesta': return 'badge warning';     
      case 'Completada': return 'badge success';    
      case 'Cancelada': return 'badge danger';      
      default: return 'badge secondary';
    }
  };

  return (
    <div className="mt-3">
      <div className="d-flex j-cont-bet align-item mb-1">
        <div>
          <h3 className="fs-1-5 fw-bold text-primary"> Panel de Gestión de Citas</h3>
          <p className="text-muted">
            {citas.length} registro{citas.length !== 1 ? "s" : ""} en el sistema de reservas
          </p>
        </div>
      </div>

      {citas.length === 0 ? (
        <div className="alerta primary text-center">
          No hay ninguna cita registrada en el sistema de reservas.
        </div>
      ) : (
        <div className="table-container shadow-sm br-1">
          <table className="table table-clara-primary table-bordered">
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
                    <strong className="text-primary"> {cita.mascota}</strong>
                    <br />
                    <span className="text-muted fs-0-85">Dueño: {cita.dueno}</span>
                  </td>

                  <td>
                    <div> {cita.fecha}</div>
                    <span className="fw-bold text-accent"> {cita.hora}</span>
                  </td>

                  <td>
                    <span className="fw-bold" style={{ color: 'var(--text-dark, #2F332B)' }}>
                      {cita.servicio}
                    </span>
                  </td>

                  <td>
                    <span 
                      style={{ display: 'block', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                      title={cita.motivo}
                      className="text-muted fs-0-85 italic"
                    >
                      {cita.motivo}
                    </span>
                    <strong style={{ color: '#6E8F6B' }}>${cita.precio.toFixed(2)}</strong>
                  </td>

                  <td>
                    <span className={obtenerClaseEstado(cita.estado)}>
                      {cita.estado}
                    </span>
                  </td>

                  <td>

                    <EstadoCita 
                      cita={cita} 
                      alCambiarEstado={alCambiarEstado} 
                      cargarCitas={cargarCitas} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListaCitas;