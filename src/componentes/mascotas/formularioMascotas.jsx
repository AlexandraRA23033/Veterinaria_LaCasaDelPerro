import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

import PantallaExito from "./vistas/pantallaExito";
import { SeccionDatosMascota, SeccionHistorialMedico } from "./vistas/mascotas";
import useMascotaForm from "./vistas/useMascotaform";
import PageHeader from "./vistas/encabezadoPagina";
import TarjetaDueno from "./vistas/tarjetaDueno";

export default function FormularioMascotas() {
  const navigate = useNavigate();
  const location = useLocation();
  const { correoUsuario, nombreUsuario, telefonoUsuario } = location.state ?? {};

  const { form, error, setError, handleCampo, validar, getDatosNormalizados } = useMascotaForm();
  const [guardando, setGuardando] = useState(false);
  const [exito,     setExito]     = useState(false);

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

  async function handleGuardar(e) {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    try {
      const db = await configurarBD();
      await db.add("pacientes", {
        ...getDatosNormalizados(),
        emailUsuario:  correoUsuario,
        nombreDueno:   nombreUsuario,
        telefonoDueno: telefonoUsuario,
        fechaRegistro: new Date().toISOString(),
        creadoPor:     "admin",
        estado:        "activo",
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
      titulo="¡Mascota registrada!"
      mensaje={<>
        <strong>{form.nombre}</strong> fue agregada al expediente de <strong>{nombreUsuario}</strong>.
      </>}
    />
  );

  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Agregar Mascota"
        subtitulo="Nueva mascota para el cliente seleccionado"
        onVolver={() => navigate(-1)}
      />

      <TarjetaDueno
        nombreUsuario={nombreUsuario}
        correoUsuario={correoUsuario}
        telefonoUsuario={telefonoUsuario}
      />

      {error && <div className="alerta danger mb-2">{error}</div>}

      <form onSubmit={handleGuardar}>
        <SeccionDatosMascota    form={form} onChange={handleCampo} />
        <SeccionHistorialMedico form={form} onChange={handleCampo} />

        <div className="d-flex j-cont-end gap-1">
          <button type="button" className="btn-outline-secondary" onClick={() => navigate(-1)} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar Mascota"}
          </button>
        </div>
      </form>
    </div>
  );
}