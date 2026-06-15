import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

const ESPECIES = ["Perro", "Gato", "Conejo", "Otro"];
const SEXOS = ["Macho", "Hembra"];
const BADGE_ESPECIE = { perro: "success", gato: "info", conejo: "secondary", otro: "muted" };

function Campo({ label, valor }) {
  return (
    <div className="mb-2">
      <p className="text-muted mb-0">{label}</p>
      <p className="fw-bold">{valor || "—"}</p>
    </div>
  );
}

function TarjetaDueno({ nombreUsuario, correoUsuario, telefonoUsuario }) {
  return (
    <div className="card card-info br-3 shadow-sm p-3 mb-3">
      <h3 className="fs-3 fw-bold text-light">Datos del Dueño</h3>
      <div className="card card-light br-2 p-2 mt-1">
        <div className="d-flex f-wrap gap-3">
          <div>
            <p className="text-muted">NOMBRE</p>
            <p className="fw-bold text-dark">{nombreUsuario}</p>
          </div>
          <div>
            <p className="text-muted">CORREO</p>
            <p className="fw-bold text-dark">{correoUsuario}</p>
          </div>
          <div>
            <p className="text-muted">TELÉFONO</p>
            <p className="fw-bold text-dark">{telefonoUsuario || "No registrado"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExpedienteMascota() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mascota: original, nombreUsuario, correoUsuario, telefonoUsuario } = location.state ?? {};

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ ...original });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  if (!original) {
    return (
      <div className="container mt-3">
        <div className="alerta danger">No se encontró el expediente. Vuelve atrás.</div>
        <button className="btn-outline-secondary mt-2" onClick={() => navigate(-1)}>
          ← Volver
        </button>
      </div>
    );
  }

  function handleCampo(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.especie) return setError("Selecciona la especie.");
    if (!form.sexo) return setError("Selecciona el sexo.");

    setGuardando(true);
    try {
      const db = await configurarBD();
      await db.put("pacientes", {
        ...form,
        nombre: form.nombre.trim(),
        especie: form.especie.toLowerCase(),
        raza: form.raza?.trim() || "Mixto",
        peso: form.peso ? parseFloat(form.peso) : null,
      });
      setExito(true);
      setTimeout(
        () =>
          navigate("/mascotas/ver", {
            state: { correoUsuario, nombreUsuario, telefonoUsuario },
          }),
        1800
      );
    } catch (err) {
      console.error(err);
      setError("Error al guardar los cambios. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (exito) {
    return (
      <div className="container mt-3">
        <div className="row j-cont-cent">
          <div className="col-md-6 text-center">
            <div className="card br-3 p-3 shadow-sm">
              <h2 className="text-success fw-bold mt-2 mb-1">¡Cambios guardados!</h2>
              <p className="text-muted">
                El expediente de <strong>{form.nombre}</strong> fue actualizado.
              </p>
              <p className="text-muted">Redirigiendo...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  //  MODO VER 
  if (!editando) {
    return (
      <div className="container mt-3 mb-3">
        <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
          <div>
            <h2 className="fs-2 fw-bold text-success">Expediente Clínico</h2>
            <p className="text-muted">Vista completa del registro de la mascota</p>
          </div>
          <div className="d-flex gap-1">
            <button className="btn-primary" onClick={() => setEditando(true)}>
              Editar
            </button>
            <button className="btn-outline-secondary" onClick={() => navigate(-1)}>
              ← Volver
            </button>
          </div>
        </div>

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
              <span className={`badge ${BADGE_ESPECIE[form.especie] ?? "secondary"}`}>
                {form.especie}
              </span>
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
                {form.fechaRegistro
                  ? new Date(form.fechaRegistro).toLocaleDateString("es-SV")
                  : "—"}
              </p>
            </div>
          </div>
          <hr className="my-2" />
          <div className="row">
            <div className="col-md-3">
              <Campo label="RAZA" valor={form.raza} />
            </div>
            <div className="col-md-3">
              <Campo label="SEXO" valor={form.sexo} />
            </div>
            <div className="col-md-3">
              <Campo label="COLOR / PELAJE" valor={form.color} />
            </div>
            <div className="col-md-3">
              <Campo label="PESO" valor={form.peso ? `${form.peso} kg` : null} />
            </div>
          </div>
        </div>
        <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-info">Historial Médico</h3>
          <div className="row">
            {[
              ["ALERGIAS CONOCIDAS", form.alergias, "Ninguna registrada"],
              ["ENFERMEDADES PREVIAS", form.enfermedadesPrevias, "Ninguna registrada"],
              ["VACUNAS APLICADAS", form.vacunas, "Ninguna registrada"],
              ["OBSERVACIONES", form.observaciones, "Sin observaciones"],
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

  // MODO EDITAR
  return (
    <div className="container mt-3 mb-3">
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
        <div>
          <h2 className="fs-2 fw-bold text-success">Editar Mascota</h2>
          <p className="text-muted">
            Modificando expediente de <strong>{original.nombre}</strong>
          </p>
        </div>
        <button
          className="btn-outline-secondary"
          onClick={() => {
            setEditando(false);
            setForm({ ...original });
            setError("");
          }}
        >
          ✕ Cancelar edición
        </button>
      </div>

      <TarjetaDueno
        nombreUsuario={nombreUsuario}
        correoUsuario={correoUsuario}
        telefonoUsuario={telefonoUsuario}
      />

      {error && <div className="alerta danger mb-2">{error}</div>}

      <form onSubmit={handleGuardar}>
      <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-info">Datos de la Mascota</h3>
          <div className="row">
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="nombre">
                  Nombre <span className="text-alert">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  className="input"
                  value={form.nombre}
                  onChange={handleCampo}
                  required
                />
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="especie">
                  Especie <span className="text-alert">*</span>
                </label>
                <select
                  id="especie"
                  name="especie"
                  className="select"
                  value={form.especie}
                  onChange={handleCampo}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {ESPECIES.map((e) => (
                    <option key={e} value={e.toLowerCase()}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="raza">
                  Raza
                </label>
                <input
                  type="text"
                  id="raza"
                  name="raza"
                  className="input"
                  value={form.raza || ""}
                  onChange={handleCampo}
                />
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="sexo">
                  Sexo <span className="text-alert">*</span>
                </label>
                <select
                  id="sexo"
                  name="sexo"
                  className="select"
                  value={form.sexo}
                  onChange={handleCampo}
                  required
                >
                  <option value="">-- Seleccionar --</option>
                  {SEXOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="color">
                  Color / Pelaje
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  className="input"
                  value={form.color || ""}
                  onChange={handleCampo}
                />
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="peso">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  id="peso"
                  name="peso"
                  className="input"
                  step="0.1"
                  min="0"
                  value={form.peso || ""}
                  onChange={handleCampo}
                />
              </div>
            </div>
            <div className="col-md-4 mb-2 pt-2">
              <div className="input-check">
                <input
                  type="checkbox"
                  name="estaVacunado"
                  id="estaVacunado"
                  checked={form.estaVacunado || false}
                  onChange={handleCampo}
                />
                <label htmlFor="estaVacunado">¿Está vacunado?</label>
              </div>
            </div>
          </div>
        </div>
        <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-info">Historial Médico</h3>
          <div className="row">
            {[
              ["alergias", "Alergias conocidas"],
              ["enfermedadesPrevias", "Enfermedades previas"],
              ["vacunas", "Vacunas aplicadas"],
              ["observaciones", "Observaciones generales"],
            ].map(([name, label]) => (
              <div className="col-md-6 mb-2" key={name}>
                <div className="form-group">
                  <label className="label" htmlFor={name}>
                    {label}
                  </label>
                  <textarea
                    id={name}
                    name={name}
                    className="textarea"
                    rows="3"
                    value={form[name] || ""}
                    onChange={handleCampo}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex j-cont-end gap-1">
          <button type="submit" className="btn-success" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}