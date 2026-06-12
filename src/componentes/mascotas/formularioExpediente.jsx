import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD, buscarUsuario } from "../../base-datos/configuracion";

const ESPECIES = ["Perro", "Gato", "Conejo", "Otro"];
const SEXOS    = ["Macho", "Hembra"];

const DUENO_INICIAL = {
  nombre_completo: "",
  correo: "",
  telefono: "",
  password: "",
};

const MASCOTA_INICIAL = {
  nombre: "", especie: "", raza: "", sexo: "",
  edad: "", color: "", peso: "",
  estaVacunado: false,
  alergias: "", enfermedadesPrevias: "", vacunas: "", observaciones: "",
};

export default function FormularioExpediente() {
  const navigate = useNavigate();

  const [dueno,    setDueno]    = useState(DUENO_INICIAL);
  const [mascota,  setMascota]  = useState(MASCOTA_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error,    setError]    = useState("");
  const [exito,    setExito]    = useState(false);

  function handleDueno(e) {
    const { name, value } = e.target;
    setDueno(prev => ({ ...prev, [name]: value }));
    setError("");
  }

  function handleMascota(e) {
    const { name, value, type, checked } = e.target;
    setMascota(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function handleGuardar(e) {
    e.preventDefault();

    // Validaciones dueño
    if (!dueno.nombre_completo.trim()) return setError("El nombre completo del dueño es obligatorio.");
    if (!dueno.correo.trim())          return setError("El correo del dueño es obligatorio.");
    if (!dueno.telefono.trim())        return setError("El teléfono del dueño es obligatorio.");
    if (!dueno.password.trim())        return setError("La contraseña del dueño es obligatoria.");

    // Validaciones mascota
    if (!mascota.nombre.trim()) return setError("El nombre de la mascota es obligatorio.");
    if (!mascota.especie)       return setError("Selecciona la especie.");
    if (!mascota.sexo)          return setError("Selecciona el sexo.");

    setGuardando(true);
    setError("");

    try {
      const db = await configurarBD();

      // Verificar que el correo no esté ya registrado
      const existe = await buscarUsuario(dueno.correo.trim());
      if (existe) {
        setError("Ya existe un usuario registrado con ese correo.");
        setGuardando(false);
        return;
      }

      // 1. Crear el usuario (dueño) en la BD
      await db.add("usuarios", {
        correo:         dueno.correo.trim(),
        password:       dueno.password.trim(),
        nombre_completo: dueno.nombre_completo.trim(),
        telefono:       dueno.telefono.trim(),
        rol:            "usuario",
      });

      // 2. Crear la mascota vinculada a ese usuario
      await db.add("pacientes", {
        emailUsuario:        dueno.correo.trim(),
        nombreDueno:         dueno.nombre_completo.trim(),
        telefonoDueno:       dueno.telefono.trim(),
        nombre:              mascota.nombre.trim(),
        especie:             mascota.especie.toLowerCase(),
        raza:                mascota.raza.trim() || "Mixto",
        sexo:                mascota.sexo,
        edad:                mascota.edad ? parseInt(mascota.edad) : null,
        color:               mascota.color.trim(),
        peso:                mascota.peso ? parseFloat(mascota.peso) : null,
        estaVacunado:        mascota.estaVacunado,
        alergias:            mascota.alergias.trim(),
        enfermedadesPrevias: mascota.enfermedadesPrevias.trim(),
        vacunas:             mascota.vacunas.trim(),
        observaciones:       mascota.observaciones.trim(),
        fechaRegistro:       new Date().toISOString(),
        creadoPor:           "admin",
        estado:              "activo",
      });

      setExito(true);
      setTimeout(() => navigate("/gestion"), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (exito) return (
    <div className="container mt-3">
      <div className="row j-cont-cent">
        <div className="col-md-6 text-center">
          <div className="card br-3 p-3 shadow-sm">
            <span style={{ fontSize: "3rem" }}></span>
            <h2 className="text-success fw-bold mt-2 mb-1">¡Expediente creado!</h2>
            <p className="text-muted">
              Se registró a <strong>{dueno.nombre_completo}</strong> y su mascota <strong>{mascota.nombre}</strong> exitosamente.
            </p>
            <p className="text-muted">Redirigiendo...</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mt-3 mb-3">

      {/* Encabezado */}
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-3">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Nuevo Expediente</h2>
          <p className="text-muted">Registra los datos del cliente y su mascota</p>
        </div>
        <button className="btn-outline-secondary" onClick={() => navigate("/gestion")}>← Volver</button>
      </div>

      {error && <div className="danger alerta mb-2">{error}</div>}

      <form onSubmit={handleGuardar}>

        <div className="card br-3 shadow-sm p-3 mb-3">
          <div className="d-flex align-item gap-1 mb-2">
            <h3 className="fs-3 fw-bold text-accent">Datos del Dueño</h3>
          </div>
          <div className="row">

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="nombre_completo">
                Nombre completo <span className="text-alert">*</span>
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                className="input"
                placeholder="Ej: Ana García López"
                value={dueno.nombre_completo}
                onChange={handleDueno}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="correo">
                Correo electrónico <span className="text-alert">*</span>
              </label>
              <input
                type="email"
                id="correo"
                name="correo"
                className="input"
                placeholder="Ej: ana@correo.com"
                value={dueno.correo}
                onChange={handleDueno}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="telefono">
                Teléfono <span className="text-alert">*</span>
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                className="input"
                placeholder="Ej: 7777-8888"
                value={dueno.telefono}
                onChange={handleDueno}
                required
              />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="password">
                Contraseña (para su cuenta) <span className="text-alert">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="input"
                placeholder="Contraseña de acceso"
                value={dueno.password}
                onChange={handleDueno}
                required
              />
            </div>

          </div>
        </div>

        <div className="card br-3 shadow-sm p-3 mb-3">
          <div className="d-flex align-item gap-1 mb-2">
            <h3 className="fs-3 fw-bold text-accent">Datos de la Mascota</h3>
          </div>
          <div className="row">

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="nombre">Nombre <span className="text-alert">*</span></label>
              <input type="text" id="nombre" name="nombre" className="input" placeholder="Ej: Firulais" value={mascota.nombre} onChange={handleMascota} required />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="especie">Especie <span className="text-alert">*</span></label>
              <select id="especie" name="especie" className="select" value={mascota.especie} onChange={handleMascota} required>
                <option value="">-- Seleccionar --</option>
                {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="raza">Raza</label>
              <input type="text" id="raza" name="raza" className="input" placeholder="Ej: Labrador, Mestizo..." value={mascota.raza} onChange={handleMascota} />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="sexo">Sexo <span className="text-alert">*</span></label>
              <select id="sexo" name="sexo" className="select" value={mascota.sexo} onChange={handleMascota} required>
                <option value="">-- Seleccionar --</option>
                {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="edad">Edad (Años)</label>
                <input type="number" id="edad" name="edad" className="input" placeholder="0"
                    min="0" max="30" value={mascota.edad || ""} onChange={handleMascota} />
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <label className="label" htmlFor="color">Color / Pelaje</label>
              <input type="text" id="color" name="color" className="input" placeholder="Ej: Café con blanco" value={mascota.color} onChange={handleMascota} />
            </div>

            <div className="col-md-4 mb-2">
              <label className="label" htmlFor="peso">Peso (kg)</label>
              <input type="number" id="peso" name="peso" className="input" placeholder="Ej: 8.5" step="0.1" min="0" value={mascota.peso} onChange={handleMascota} />
            </div>
            <div className="col-md-6 mb-2 d-flex align-item" style={{ paddingTop: "24px" }}>
            <label className="d-flex align-item gap-1" style={{ cursor: "pointer" }}>
              <input 
                type="checkbox" 
                name="estaVacunado" 
                checked={mascota.estaVacunado} 
                onChange={handleMascota} 
                style={{ width: "18px", height: "18px" }} 
              />
              <span className="label" style={{ margin: 0 }}>
                ¿Está vacunado?
              </span>
            </label>
          </div>
          </div>
        </div>

        {/* ── HISTORIAL MÉDICO ── */}
        <div className="card br-3 shadow-sm p-3 mb-3">
          <div className="d-flex align-item gap-1 mb-2">
            <h3 className="fs-3 fw-bold text-accent">Historial Médico Inicial</h3>
          </div>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="alergias">Alergias conocidas</label>
              <textarea id="alergias" name="alergias" className="input" rows="3" placeholder="Ej: Alérgico al pollo..." value={mascota.alergias} onChange={handleMascota} style={{ resize: "vertical" }} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="enfermedadesPrevias">Enfermedades previas</label>
              <textarea id="enfermedadesPrevias" name="enfermedadesPrevias" className="input" rows="3" placeholder="Ej: Parvo a los 2 meses..." value={mascota.enfermedadesPrevias} onChange={handleMascota} style={{ resize: "vertical" }} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="vacunas">Vacunas aplicadas</label>
              <textarea id="vacunas" name="vacunas" className="input" rows="3" placeholder="Ej: Rabia (2024)..." value={mascota.vacunas} onChange={handleMascota} style={{ resize: "vertical" }} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="observaciones">Observaciones generales</label>
              <textarea id="observaciones" name="observaciones" className="input" rows="3" placeholder="Notas relevantes..." value={mascota.observaciones} onChange={handleMascota} style={{ resize: "vertical" }} />
            </div>
          </div>
        </div>

        <div className="d-flex j-cont-end gap-1">
          <button type="button" className="btn-outline-secondary" onClick={() => navigate("/gestion")} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Crear Expediente"}
          </button>
        </div>

      </form>
    </div>
  );
}