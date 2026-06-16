// vistas/EditarExpediente.jsx
import PageHeader            from "./encabezadoPagina";
import TarjetaDueno          from "./tarjetaDueno";
import { SeccionDatosMascota, SeccionHistorialMedico } from "./mascotas";

export default function EditarExpediente({
  form, error, guardando,
  nombreUsuario, correoUsuario, telefonoUsuario,
  onCampo, onGuardar, onCancelar,
}) {
  return (
    <div className="container mt-3 mb-3">
      <PageHeader
        titulo="Editar Mascota"
        subtitulo={<>Modificando expediente de <strong>{form.nombre}</strong></>}
        colorTitulo="text-success"
      >
        <button className="btn-outline-secondary" onClick={onCancelar}>
          ✕ Cancelar edición
        </button>
      </PageHeader>

      <TarjetaDueno
        nombreUsuario={nombreUsuario}
        correoUsuario={correoUsuario}
        telefonoUsuario={telefonoUsuario}
      />

      {error && <div className="alerta danger mb-2">{error}</div>}

      <form onSubmit={onGuardar}>
        <SeccionDatosMascota    form={form} onChange={onCampo} />
        <SeccionHistorialMedico form={form} onChange={onCampo} />

        <div className="d-flex j-cont-end gap-1">
          <button type="submit" className="btn-success" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}