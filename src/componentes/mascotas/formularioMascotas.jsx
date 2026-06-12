
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

const ESPECIES = ["Perro", "Gato", "Conejo", "Ave", "Reptil", "Otro"];
const SEXOS    = ["Macho", "Hembra"];

const INICIAL = {
  nombre: "", especie: "", raza: "", sexo: "",
  edad: "", color: "", peso: "",
  estaVacunado: false,
  alergias: "", enfermedadesPrevias: "", vacunas: "", observaciones: "",
};

export default function FormularioMascotas() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Datos del dueño que vienen automáticos desde el modal ──
  const { correoUsuario, nombreUsuario, telefonoUsuario } = location.state ?? {};

  const [mascota,  setMascota]  = useState(INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [error,    setError]    = useState("");
  const [exito,    setExito]    = useState(false);

  // Si por algún motivo no hay state, redirigir
  if (!correoUsuario) {
    return (
      <div className="container mt-3">
        <div className="alerta danger">
          No se recibieron los datos del dueño. Vuelve a la gestión y usa el botón "Agregar mascota".
        </div>
        <button className="btn-outline-secondary mt-2" onClick={() => navigate("/gestion")}>
          ← Volver a Gestión
        </button>
      </div>
    );
  }

  function handleCampo(e) {
    const { name, value, type, checked } = e.target;
    setMascota(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!mascota.nombre.trim()) return setError("El nombre de la mascota es obligatorio.");
    if (!mascota.especie)       return setError("Selecciona la especie.");
    if (!mascota.sexo)          return setError("Selecciona el sexo.");

    setGuardando(true);
    try {
      const db = await configurarBD();
      await db.add("pacientes", {
        emailUsuario:       correoUsuario,
        nombreDueno:        nombreUsuario,
        telefonoDueno:      telefonoUsuario,
        nombre:             mascota.nombre.trim(),
        especie:            mascota.especie.toLowerCase(),
        raza:               mascota.raza.trim() || "Mixto",
        sexo:               mascota.sexo,
        edad:               mascota.edad ? parseInt(mascota.edad) : null,
        color:              mascota.color.trim(),
        peso:               mascota.peso ? parseFloat(mascota.peso) : null,
        estaVacunado:       mascota.estaVacunado === true ? "Sí" : "No",
        vacunas:            mascota.vacunas,
        alergias:           mascota.alergias.trim(),
        enfermedadesPrevias: mascota.enfermedadesPrevias.trim(),
        observaciones:      mascota.observaciones.trim(),
        fechaRegistro:      new Date().toISOString(),
        creadoPor:          "admin",
        estado:             "activo",
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
            <span className="fs-1">🐾</span>
            <h2 className="text-success fw-bold mt-2 mb-1">¡Mascota registrada!</h2>
            <p className="text-muted">
              <strong>{mascota.nombre}</strong> fue agregada al expediente de <strong>{nombreUsuario}</strong>.
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
          <h2 className="fs-2 fw-bold text-primary">Agregar Mascota</h2>
          <p className="text-muted">Nueva mascota para el cliente seleccionado</p>
        </div>
        <button className="btn-outline-secondary" onClick={() => navigate("/gestion")}>← Volver</button>
      </div>

      {/* Tarjeta dueño — solo lectura, automático */}
      <div className="card br-3 shadow-sm p-3 mb-3">
        <h3 className="fs-3 fw-bold text-accent d-flex align-item gap-1">
          👤 Dueño
        </h3>
        <div className="card card-light br-2 p-2 mt-1">
          <div className="d-flex f-wrap gap-2">
            <div>
              <p className="text-muted">NOMBRE</p>
              <p className="fw-bold">{nombreUsuario}</p>
            </div>
            <div>
              <p className="text-muted">CORREO</p>
              <p className="fw-bold">{correoUsuario}</p>
            </div>
            <div>
              <p className="text-muted">TELÉFONO</p>
              <p className="fw-bold">{telefonoUsuario || "No registrado"}</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alerta danger mb-2">{error}</div>}

      <form onSubmit={handleGuardar}>

        {/* Datos básicos */}
        <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-accent d-flex align-item gap-1">
            🐾 Datos de la Mascota
          </h3>
          <div className="row">
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="nombre">Nombre <span className="text-alert">*</span></label>
                <input type="text" id="nombre" name="nombre" className="input" placeholder="Ej: Firulais" value={mascota.nombre} onChange={handleCampo} required />
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="especie">Especie <span className="text-alert">*</span></label>
                <select id="especie" name="especie" className="select" value={mascota.especie} onChange={handleCampo} required>
                  <option value="">-- Seleccionar --</option>
                  {ESPECIES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="raza">Raza</label>
                <input type="text" id="raza" name="raza" className="input" placeholder="Ej: Labrador, Mestizo..." value={mascota.raza} onChange={handleCampo} />
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="sexo">Sexo <span className="text-alert">*</span></label>
                <select id="sexo" name="sexo" className="select" value={mascota.sexo} onChange={handleCampo} required>
                  <option value="">-- Seleccionar --</option>
                  {SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="edad">Edad (Años)</label>
                <input type="number" id="edad" name="edad" className="input" placeholder="0"
                    min="0" max="30" value={mascota.edad || ""} onChange={handleCampo} />
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="color">Color / Pelaje</label>
                <input type="text" id="color" name="color" className="input" placeholder="Ej: Café con blanco" value={mascota.color} onChange={handleCampo} />
              </div>
            </div>
            <div className="col-md-4 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="peso">Peso (kg)</label>
                <input type="number" id="peso" name="peso" className="input" placeholder="Ej: 8.5" step="0.1" min="0" value={mascota.peso} onChange={handleCampo} />
              </div>
            </div>
            <div className="col-md-6 mb-2 pt-2">
              <div className="input-check">
                <input type="checkbox"  name="estaVacunado"  id="estaVacunado" checked={mascota.estaVacunado}  onChange={handleCampo} />
                <label htmlFor="estaVacunado">¿Está vacunado?</label>
              </div>
            </div>
          </div>
        </div>

        {/* Historial médico */}
        <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-accent d-flex align-item gap-1">
            🩺 Historial Médico Inicial
          </h3>
          <div className="row">
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="alergias">Alergias conocidas</label>
                <textarea id="alergias" name="alergias" className="textarea" rows="3" placeholder="Ej: Alérgico al pollo..." value={mascota.alergias} onChange={handleCampo}></textarea>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="enfermedadesPrevias">Enfermedades previas</label>
                <textarea id="enfermedadesPrevias" name="enfermedadesPrevias" className="textarea" rows="3" placeholder="Ej: Parvo a los 2 meses..." value={mascota.enfermedadesPrevias} onChange={handleCampo}></textarea>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="vacunas">Vacunas aplicadas</label>
                <textarea id="vacunas" name="vacunas" className="textarea" rows="3" placeholder="Ej: Rabia (2024), Parvovirus (2023)..." value={mascota.vacunas} onChange={handleCampo}></textarea>
              </div>
            </div>
            <div className="col-md-6 mb-2">
              <div className="form-group">
                <label className="label" htmlFor="observaciones">Observaciones generales</label>
                <textarea id="observaciones" name="observaciones" className="textarea" rows="3" placeholder="Notas relevantes para el expediente..." value={mascota.observaciones} onChange={handleCampo}></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex j-cont-end gap-1">
          <button type="button" className="btn-outline-secondary" onClick={() => navigate("/gestion")} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Mascota"}
          </button>
        </div>

      </form>
    </div>
  );
}