const ESPECIES = ["Perro", "Gato", "Conejo", "Otro"];
const SEXOS = ["Macho", "Hembra"];

// ── Sección: Datos básicos de la mascota ──────────────────────────────────────
export function SeccionDatosMascota({ form, onChange }) {
  return (
    <div className="card br-3 shadow-sm p-3 mb-3">
      <h3 className="fs-3 fw-bold text-accent">Datos de la Mascota</h3>
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
              placeholder="Ej: Firulais"
              value={form.nombre}
              onChange={onChange}
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
              onChange={onChange}
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
            <label className="label" htmlFor="raza">Raza</label>
            <input
              type="text"
              id="raza"
              name="raza"
              className="input"
              placeholder="Ej: Labrador, Mestizo..."
              value={form.raza || ""}
              onChange={onChange}
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
              onChange={onChange}
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
            <label className="label" htmlFor="edad">Edad (Años)</label>
            <input
              type="number"
              id="edad"
              name="edad"
              className="input"
              placeholder="0"
              min="0"
              max="30"
              value={form.edad || ""}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="col-md-4 mb-2">
          <div className="form-group">
            <label className="label" htmlFor="color">Color / Pelaje</label>
            <input
              type="text"
              id="color"
              name="color"
              className="input"
              placeholder="Ej: Café con blanco"
              value={form.color || ""}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="col-md-4 mb-2">
          <div className="form-group">
            <label className="label" htmlFor="peso">Peso (kg)</label>
            <input
              type="number"
              id="peso"
              name="peso"
              className="input"
              placeholder="Ej: 8.5"
              step="0.1"
              min="0"
              value={form.peso || ""}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="col-md-6 mb-2 pt-2">
          <div className="input-check">
            <input
              type="checkbox"
              name="estaVacunado"
              id="estaVacunado"
              checked={form.estaVacunado || false}
              onChange={onChange}
            />
            <label htmlFor="estaVacunado">¿Está vacunado?</label>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Sección: Historial médico ─────────────────────────────────────────────────
const CAMPOS_HISTORIAL = [
  ["alergias",            "Alergias conocidas",       "Ej: Alérgico al pollo..."],
  ["enfermedadesPrevias", "Enfermedades previas",      "Ej: Parvo a los 2 meses..."],
  ["vacunas",             "Vacunas aplicadas",         "Ej: Rabia (2024)..."],
  ["observaciones",       "Observaciones generales",   "Notas relevantes..."],
];

export function SeccionHistorialMedico({ form, onChange }) {
  return (
    <div className="card br-3 shadow-sm p-3 mb-3">
      <h3 className="fs-3 fw-bold text-accent">Historial Médico Inicial</h3>
      <div className="row">
        {CAMPOS_HISTORIAL.map(([name, label, placeholder]) => (
          <div className="col-md-6 mb-2" key={name}>
            <div className="form-group">
              <label className="label" htmlFor={name}>{label}</label>
              <textarea
                id={name}
                name={name}
                className="textarea"
                rows="3"
                placeholder={placeholder}
                value={form[name] || ""}
                onChange={onChange}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}