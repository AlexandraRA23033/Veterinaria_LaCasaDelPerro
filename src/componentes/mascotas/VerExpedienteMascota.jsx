// mascotas/VerExpediente.jsx
// Vista SOLO LECTURA. No tiene botón editar aquí, eso va en VerMascotas.
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader   from "./vistas/encabezadoPagina";
import TarjetaDueno from "./vistas/tarjetaDueno";

const BADGE_ESPECIE = { perro: "success", gato: "info", conejo: "secondary", otro: "muted" };

function Campo({ label, valor }) {
  return (
    <div className="mb-2">
      <p className="text-muted mb-0">{label}</p>
      <p className="fw-bold">{valor || "—"}</p>
    </div>
  );
}

export default function VerExpediente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mascota, nombreUsuario, correoUsuario, telefonoUsuario } = location.state ?? {};

  if (!mascota) {
    return (
      <div className="container mt-3">
        <div className="alerta danger">No se encontró el expediente. Vuelve atrás.</div>
        <button className="btn-outline-secondary mt-2" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    );
  }

  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Expediente Clínico"
        subtitulo="Vista completa del registro de la mascota"
        colorTitulo="text-success"
        onVolver={() => navigate("/mascotas/ver", {
          state: { correoUsuario, nombreUsuario, telefonoUsuario }
        })}
      />

      <TarjetaDueno
        nombreUsuario={nombreUsuario}
        correoUsuario={correoUsuario}
        telefonoUsuario={telefonoUsuario}
      />

      <div className="card br-3 shadow-sm p-3 mb-3">
        <h3 className="fs-3 fw-bold text-info">Datos de la Mascota</h3>
        <div className="row">
          <div className="col-md-3">
            <p className="text-muted mb-0">NOMBRE</p>
            <p className="fw-bold fs-2 text-dark">{mascota.nombre}</p>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">ESPECIE</p>
            <span className={`badge ${BADGE_ESPECIE[mascota.especie] ?? "secondary"}`}>{mascota.especie}</span>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">VACUNAS</p>
            <span className={`badge ${mascota.estaVacunado ? "success" : "secondary"}`}>
              {mascota.estaVacunado ? "Sí" : "No"}
            </span>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">FECHA REGISTRO</p>
            <p className="fw-bold text-dark">
              {mascota.fechaRegistro ? new Date(mascota.fechaRegistro).toLocaleDateString("es-SV") : "—"}
            </p>
          </div>
        </div>
        <hr className="my-2" />
        <div className="row">
          <div className="col-md-3"><Campo label="RAZA"           valor={mascota.raza} /></div>
          <div className="col-md-3"><Campo label="SEXO"           valor={mascota.sexo} /></div>
          <div className="col-md-3"><Campo label="COLOR / PELAJE" valor={mascota.color} /></div>
          <div className="col-md-3"><Campo label="PESO"           valor={mascota.peso ? `${mascota.peso} kg` : null} /></div>
        </div>
      </div>

      <div className="card br-3 shadow-sm p-3 mb-3">
        <h3 className="fs-3 fw-bold text-info">Historial Médico</h3>
        <div className="row">
          {[
            ["ALERGIAS CONOCIDAS",   mascota.alergias,            "Ninguna registrada"],
            ["ENFERMEDADES PREVIAS", mascota.enfermedadesPrevias, "Ninguna registrada"],
            ["VACUNAS APLICADAS",    mascota.vacunas,             "Ninguna registrada"],
            ["OBSERVACIONES",        mascota.observaciones,       "Sin observaciones"],
          ].map(([label, valor, vacio]) => (
            <div className="col-md-6 mb-2" key={label}>
              <p className="text-muted mb-0">{label}</p>
              <div className="card card-light br-2 p-2">
                <p>{valor || vacio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}