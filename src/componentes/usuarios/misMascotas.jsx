import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { obtenerCitasAgenda } from "../../base-datos/configuracion";

const BADGE_ESTADO = {
  Pendiente:  "badge info",
  Pospuesta:  "badge warning",
  Completada: "badge success",
  Cancelada:  "badge danger",
};

const COLOR_HEADER = {
  Pendiente:  "bg-info",
  Pospuesta:  "bg-warning",
  Completada: "bg-success",
  Cancelada:  "bg-danger",
};

// Formatear fecha en formato largo
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString("es-SV", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

// Formatear hora en formato 12 horas (no militar)
function formatearHora(horaStr) {
  if (!horaStr) return "";
  
  // Si ya tiene AM/PM, devolverla tal cual
  if (horaStr.includes("AM") || horaStr.includes("PM")) {
    return horaStr;
  }
  
  // Convertir de formato militar (HH:MM) a 12 horas
  const [horas, minutos] = horaStr.split(":");
  const hora = parseInt(horas);
  const ampm = hora >= 12 ? "PM" : "AM";
  const hora12 = hora % 12 || 12;
  return `${hora12}:${minutos} ${ampm}`;
}

export default function MisCitas() {
  const { usuario } = useAuth();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarMisCitas();
  }, []);

  async function cargarMisCitas() {
    setCargando(true);
    try {
      const todas = await obtenerCitasAgenda();
      const mias = (todas || []).filter(
        (c) => c.correoDueno === usuario?.correo
      );
      mias.sort((a, b) => {
        const da = new Date(`${a.fecha}T${a.hora}`);
        const db = new Date(`${b.fecha}T${b.hora}`);
        return db - da;
      });
      setCitas(mias);
    } catch (err) {
      console.error("Error al cargar mis citas:", err);
    } finally {
      setCargando(false);
    }
  }

  const proximaCita = citas.find(c => {
    if (c.estado !== "Pendiente") return false;
    const fechaCita = new Date(`${c.fecha}T${c.hora}`);
    return fechaCita >= new Date();
  });

  const totalPendientes = citas.filter(c => c.estado === "Pendiente").length;
  const totalCompletadas = citas.filter(c => c.estado === "Completada").length;

  return (
    <div className="container mt-2">

      {/* Encabezado */}
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Mis Citas</h2>
          <p className="text-muted">
            Gestiona las citas de tus mascotas, <strong>{usuario?.nombre_completo || usuario?.correo}</strong>
          </p>
        </div>
        <div className="d-flex gap-1">
          <span className="badge info">{totalPendientes} pendientes</span>
          <span className="badge success">{totalCompletadas} completadas</span>
        </div>
      </div>

      {cargando ? (
        <p className="text-muted text-center">Cargando tus citas...</p>
      ) : (
        <>
          {/* Alerta de próxima cita */}
          {proximaCita && (
            <div className="alerta info mb-3">
              <strong>Próxima cita:</strong>
              <span className="fw-bold text-primary"> {proximaCita.mascota}</span>
              <span> - {proximaCita.servicio}</span>
              <span> - {formatearFecha(proximaCita.fecha)} a las </span>
              <span className="fw-bold">{formatearHora(proximaCita.hora)}</span>
            </div>
          )}

          {/* Lista de citas */}
          {citas.length === 0 ? (
            <div className="alerta primary text-center">
              Aún no tienes citas registradas. Contacta a la clínica para agendar una.
            </div>
          ) : (
            <>
              <div className="row">
                {citas.map((cita) => {
                  const headerColor = COLOR_HEADER[cita.estado] || "bg-secondary";
                  const textColor = cita.estado === "Pospuesta" ? "text-dark" : "text-light";
                  
                  return (
                    <div key={cita.id} className="col-md-6 col-lg-4 mb-3">
                      <div className="card shadow-sm br-2">
                        {/* Header con color del estado */}
                        <div className={`card-header ${headerColor} ${textColor}`}>
                          <div className="d-flex j-cont-bet align-item">
                            <div>
                              <h4 className="mb-0">{cita.mascota}</h4>
                              <span style={{ opacity: 0.85 }}>{cita.servicio}</span>
                            </div>
                            <span className={BADGE_ESTADO[cita.estado] || "badge secondary"}>
                              {cita.estado}
                            </span>
                          </div>
                        </div>
                        
                        {/* Body en color claro */}
                        <div className="card-light card-body">
                          <div className="row">
                            <div className="col-12">
                              <p className="text-dark mb-0">Fecha</p>
                              <p className="fw-bold text-success">{formatearFecha(cita.fecha)}</p>
                            </div>
                            <div className="col-6">
                              <p className="text-dark mb-0">Hora</p>
                              <p className="fw-bold text-success">{formatearHora(cita.hora)}</p>
                            </div>
                            <div className="col-6">
                              <p className="text-dark mb-0">Costo</p>
                              <p className="fw-bold text-success">${Number(cita.precio || 0).toFixed(2)}</p>
                            </div>
                            {cita.motivo && (
                              <div className="col-12">
                                <p className="text-dark mb-0">Motivo</p>
                                <p className="text-success">{cita.motivo}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-muted text-center mt-2">
                Mostrando {citas.length} cita{citas.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}