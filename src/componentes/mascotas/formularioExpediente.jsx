import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD, buscarUsuario } from "../../base-datos/configuracion";

import PageHeader from "./vistas/encabezadoPagina";
import PantallaExito from "./vistas/pantallaExito";
import { SeccionDatosMascota, SeccionHistorialMedico } from "./vistas/mascotas";
import useMascotaForm from "./vistas/useMascotaform";

const DUENO_INICIAL = {
  nombre_completo: "",
  correo: "",
  telefono: "",
  password: "",
};

export default function FormularioExpediente() {
  const navigate = useNavigate();

  const { form: mascota, error, setError, handleCampo, validar, getDatosNormalizados } = useMascotaForm();
  const [dueno,     setDueno]     = useState(DUENO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [exito,     setExito]     = useState(false);

  function handleDueno(e) {
    const { name, value } = e.target;
    setDueno((prev) => ({ ...prev, [name]: value }));
    setError("");
  }

  async function handleGuardar(e) {
    e.preventDefault();

    // Validaciones del dueño
    if (!dueno.nombre_completo.trim()) return setError("El nombre completo del dueño es obligatorio.");
    if (!dueno.correo.trim())          return setError("El correo del dueño es obligatorio.");
    if (!dueno.telefono.trim())        return setError("El teléfono del dueño es obligatorio.");
    if (!dueno.password.trim())        return setError("La contraseña del dueño es obligatoria.");

    // Validaciones de mascota (del hook)
    if (!validar()) return;

    setGuardando(true);
    try {
      const db = await configurarBD();

      const existe = await buscarUsuario(dueno.correo.trim());
      if (existe) {
        setError("Ya existe un usuario registrado con ese correo.");
        return;
      }

      await db.add("usuarios", {
        correo:          dueno.correo.trim(),
        password:        dueno.password.trim(),
        nombre_completo: dueno.nombre_completo.trim(),
        telefono:        dueno.telefono.trim(),
        rol:             "usuario",
      });

      await db.add("pacientes", {
        ...getDatosNormalizados(),
        emailUsuario:        dueno.correo.trim(),
        nombreDueno:         dueno.nombre_completo.trim(),
        telefonoDueno:       dueno.telefono.trim(),
        fechaRegistro:       new Date().toISOString(),
        creadoPor:           "admin",
        estado:              "activo",
      });

      setExito(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      console.error(err);
      setError("Error al guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (exito) return (
    <PantallaExito
      titulo="¡Expediente creado!"
      mensaje={<>
        Se registró a <strong>{dueno.nombre_completo}</strong> y su mascota <strong>{mascota.nombre}</strong> exitosamente.
      </>}
    />
  );

  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Nuevo Expediente"
        subtitulo="Registra los datos del cliente y su mascota"
        colorTitulo="text-primary"
        onVolver={() => navigate("/gestion")}
      />

      {error && <div className="danger alerta mb-2">{error}</div>}

      <form onSubmit={handleGuardar}>
        {/* ── Datos del dueño (solo en este formulario) ── */}
        <div className="card br-3 shadow-sm p-3 mb-3">
          <h3 className="fs-3 fw-bold text-accent">Datos del Dueño</h3>
          <div className="row">

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="nombre_completo">
                Nombre completo <span className="text-alert">*</span>
              </label>
              <input type="text" id="nombre_completo" name="nombre_completo" className="input"
                placeholder="Ej: Ana García López" value={dueno.nombre_completo} onChange={handleDueno} required />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="correo">
                Correo electrónico <span className="text-alert">*</span>
              </label>
              <input type="email" id="correo" name="correo" className="input"
                placeholder="Ej: ana@correo.com" value={dueno.correo} onChange={handleDueno} required />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="telefono">
                Teléfono <span className="text-alert">*</span>
              </label>
              <input type="tel" id="telefono" name="telefono" className="input"
                placeholder="Ej: 7777-8888" value={dueno.telefono} onChange={handleDueno} required />
            </div>

            <div className="col-md-6 mb-2">
              <label className="label" htmlFor="password">
                Contraseña (para su cuenta) <span className="text-alert">*</span>
              </label>
              <input type="password" id="password" name="password" className="input"
                placeholder="Contraseña de acceso" value={dueno.password} onChange={handleDueno} required />
            </div>

          </div>
        </div>

        {/* ── Mascota e historial: componentes compartidos ── */}
        <SeccionDatosMascota    form={mascota} onChange={handleCampo} />
        <SeccionHistorialMedico form={mascota} onChange={handleCampo} />

        <div className="d-flex j-cont-end gap-1">
          <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)} disabled={guardando}>
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