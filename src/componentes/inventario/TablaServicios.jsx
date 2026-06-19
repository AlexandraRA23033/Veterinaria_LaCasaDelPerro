import { useState, useEffect } from "react";
import { obtenerServiciosDB, registrarServicioDB, actualizarServicioDB, eliminarServicioDB } from "../../base-datos/configuracion"; 

const TablaServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState({ id: null, nombre: '', categoria: 'Medicina', precio: '', disponible: true });

  const recargarLista = async () => {
    try {
      const listaServicios = await obtenerServiciosDB();
      setServicios(listaServicios);
    } catch (err) {
      console.error("Error al recargar servicios:", err);
    }
  };

  useEffect(() => {
    let activo = true;
    async function iniciarCatalogo() {
      try {
        const listaServicios = await obtenerServiciosDB();
        if (activo) setServicios(listaServicios);
      } catch (err) {
        console.error("Error inicial:", err);
      } finally {
        if (activo) setCargando(false);
      }
    }
    iniciarCatalogo();
    return () => { activo = false; };
  }, []);

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formulario.nombre || !formulario.precio) return;

    // Validación estricta anti-precios negativos o gratis
    if (parseFloat(formulario.precio) <= 0) {
      alert("Error: Las prestaciones médicas de la clínica deben tener un precio mayor a $0.00.");
      return;
    }

    const datosServicio = {
      nombre: formulario.nombre,
      categoria: formulario.categoria,
      precio: parseFloat(formulario.precio),
      disponible: formulario.disponible === true || formulario.disponible === "true"
    };

    if (formulario.id) {
      await actualizarServicioDB({ id: formulario.id, ...datosServicio });
    } else {
      await registrarServicioDB(datosServicio);
    }

    setFormulario({ id: null, nombre: '', categoria: 'Medicina', precio: '', disponible: true });
    recargarLista();
  };

  const handleSeleccionarEditar = (s) => {
    setFormulario({ id: s.id, nombre: s.nombre, categoria: s.categoria, precio: s.precio, disponible: s.disponible });
  };

  const handleBorrar = async (id) => {
    if (confirm("¿Estás seguro de suspender permanentemente este servicio?")) {
      await eliminarServicioDB(id);
      recargarLista();
    }
  };

  const filtrados = servicios.filter(
    (s) => s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || s.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Catálogo de Servicios Clínicos</h2>
          <p className="text-muted">{servicios.length} registros activos</p>
        </div>
      </div>

      {/* FORMULARIO CRUD */}
      <div className="card card-light shadow-sm br-1 mb-2">
        <div className="card-header fw-bold text-primary">
          {formulario.id ? `Modificar Servicio Clínico (ID: ${formulario.id})` : "Dar de Alta Nueva Prestación"}
        </div>
        <form onSubmit={handleGuardar} className="card-body d-flex f-wrap gap-1 align-item">
          <div className="form-group f-2">
            <input type="text" className="input" placeholder="Nombre de la Cirugía o Tratamiento" value={formulario.nombre} onChange={e => setFormulario({...formulario, nombre: e.target.value})} required />
          </div>
          <div className="form-group f-1">
            <select className="input" value={formulario.categoria} onChange={e => setFormulario({...formulario, categoria: e.target.value})}>
              <option value="Medicina">Medicina</option>
              <option value="Prevención">Prevención</option>
              <option value="Quirúrgico">Quirúrgico</option>
              <option value="Odontología">Odontología</option>
              <option value="Estética">Estética</option>
            </select>
          </div>
          <div className="form-group f-1">
            {/* min="0.01" bloquea los valores negativos desde las flechas del teclado */}
            <input type="number" step="0.01" min="0.01" className="input" placeholder="Precio ($)" value={formulario.precio} onChange={e => setFormulario({...formulario, precio: e.target.value})} required />
          </div>
          <div className="form-group f-1">
            <select className="input" value={formulario.disponible} onChange={e => setFormulario({...formulario, disponible: e.target.value})}>
              <option value={true}>Habilitado</option>
              <option value={false}>Suspendido</option>
            </select>
          </div>
          <div className="f-1 d-flex gap-1">
            <button type="submit" className="btn btn-primary w-100">{formulario.id ? "Actualizar" : "Registrar"}</button>
            {formulario.id && <button type="button" className="btn btn-secondary" onClick={() => setFormulario({ id: null, nombre: '', categoria: 'Medicina', precio: '', disponible: true })}>✕</button>}
          </div>
        </form>
      </div>

      <div className="form-group mb-2">
        <input type="text" className="input" placeholder="Filtrar catálogo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {cargando ? (
        <p className="text-muted">Leyendo registros...</p>
      ) : filtrados.length === 0 ? (
        <div className="alerta primary text-center">El catálogo está vacío. Comienza a registrar servicios desde cero.</div>
      ) : (
        <div className="table-container shadow-sm br-1 mb-3">
          <table className="table table-clara-primary table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre del Servicio</th>
                <th>Categoría</th>
                <th>Costo / Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((servicio, index) => (
                <tr key={servicio.id}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{servicio.nombre}</td>
                  <td>{servicio.categoria}</td>
                  <td><span className="badge info">${servicio.precio.toFixed(2)}</span></td>
                  <td>{servicio.disponible ? <span className="badge success">ACTIVO</span> : <span className="badge alert">SUSPENDIDO</span>}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button onClick={() => handleSeleccionarEditar(servicio)} className="btn btn-secondary btn-xs">Editar</button>
                      <button onClick={() => handleBorrar(servicio.id)} className="btn btn-alert btn-xs">Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TablaServicios;