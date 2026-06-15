// vistas/VerExpediente.jsx
import { useNavigate } from "react-router-dom";
import PageHeader   from "./encabezadoPagina";
import TarjetaDueno from "./tarjetaDueno";

const BADGE_ESPECIE = { perro: "success", gato: "info", conejo: "secondary", otro: "muted" };

function Campo({ label, valor }) {
  return (
    <div className="mb-2">
      <p className="text-muted mb-0">{label}</p>
      <p className="fw-bold">{valor || "—"}</p>
    </div>
  );
}

export default function VerExpediente({ form, nombreUsuario, correoUsuario, telefonoUsuario, onEditar }) {
  const navigate = useNavigate();

  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Expediente Clínico"
        subtitulo="Vista completa del registro de la mascota"
        colorTitulo="text-success"
        onVolver={() => navigate(-1)}
      >
        <button className="btn-primary" onClick={onEditar}>Editar</button>
      </PageHeader>

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
            <p className="fw-bold fs-2 text-dark">{form.nombre}</p>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">ESPECIE</p>
            <span className={`badge ${BADGE_ESPECIE[form.especie] ?? "secondary"}`}>{form.especie}</span>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">VACUNAS</p>
            <span className={`badge ${form.estaVacunado ? "success" : "secondary"}`}>
              {form.estaVacunado ? "Sí" : "No"}
            </span>
          </div>
          <div className="col-md-3">
            <p className="text-muted mb-0">FECHA REGISTRO</p>
            <p className="fw-bold text-dark">
              {form.fechaRegistro ? new Date(form.fechaRegistro).toLocaleDateString("es-SV") : "—"}
            </p>
          </div>
        </div>
        <hr className="my-2" />
        <div className="row">
          <div className="col-md-3"><Campo label="RAZA"          valor={form.raza} /></div>
          <div className="col-md-3"><Campo label="SEXO"          valor={form.sexo} /></div>
          <div className="col-md-3"><Campo label="COLOR / PELAJE" valor={form.color} /></div>
          <div className="col-md-3"><Campo label="PESO"          valor={form.peso ? `${form.peso} kg` : null} /></div>
        </div>
      </div>

      <div className="card br-3 shadow-sm p-3 mb-3">
        <h3 className="fs-3 fw-bold text-info">Historial Médico</h3>
        <div className="row">
          {[
            ["ALERGIAS CONOCIDAS",   form.alergias,            "Ninguna registrada"],
            ["ENFERMEDADES PREVIAS", form.enfermedadesPrevias, "Ninguna registrada"],
            ["VACUNAS APLICADAS",    form.vacunas,             "Ninguna registrada"],
            ["OBSERVACIONES",        form.observaciones,       "Sin observaciones"],
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