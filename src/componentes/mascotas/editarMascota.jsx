// mascotas/EditarExpediente.jsx
// Vista SOLO EDICIÓN. Recibe la mascota por location.state y guarda en IndexedDB.
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

import PageHeader            from "./vistas/encabezadoPagina";
import TarjetaDueno          from "./vistas/tarjetaDueno";
import PantallaExito         from "./vistas/pantallaExito";
import { SeccionDatosMascota, SeccionHistorialMedico } from "./vistas/mascotas";
import useMascotaForm        from "./vistas/useMascotaform";

export default function EditarExpediente() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mascota: original, nombreUsuario, correoUsuario, telefonoUsuario } = location.state ?? {};

  const { form,  error, setError, handleCampo, validar, getDatosNormalizados } = useMascotaForm(original);
  const [guardando, setGuardando] = useState(false);
  const [exito,     setExito]     = useState(false);

  if (!original) {
    return (
      <div className="container mt-3">
        <div className="alerta danger">No se encontró el expediente. Vuelve atrás.</div>
        <button className="btn-outline-secondary mt-2" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    );
  }

  async function handleGuardar(e) {
    e.preventDefault();
    if (!validar()) return;

    setGuardando(true);
    try {
      const db = await configurarBD();
      await db.put("pacientes", { ...form, ...getDatosNormalizados() });
      setExito(true);
      setTimeout(() =>
        navigate("/mascotas/ver", {
          state: { correoUsuario, nombreUsuario, telefonoUsuario },
        }), 1800
      );
    } catch (err) {
      console.error(err);
      setError("Error al guardar los cambios. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (exito) return (
    <PantallaExito
      titulo="¡Cambios guardados!"
      mensaje={<>El expediente de <strong>{form.nombre}</strong> fue actualizado.</>}
    />
  );

  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Editar Expediente"
        subtitulo={<>Modificando expediente de <strong>{original.nombre}</strong></>}
        colorTitulo="text-success"
        onVolver={() => {
          // Vuelve al expediente sin guardar
          navigate("/mascotas/expediente", {
            state: { mascota: original, nombreUsuario, correoUsuario, telefonoUsuario },
          });
        }}
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
          <button
            type="button"
            className="btn-outline-secondary"
            disabled={guardando}
            onClick={() => navigate("/mascotas/expediente", {
              state: { mascota: original, nombreUsuario, correoUsuario, telefonoUsuario },
            })}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-success" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}