import { useState, useEffect } from "react";
import { obtenerServiciosDB, registrarServicioDB, actualizarServicioDB, eliminarServicioDB } from "../../base-datos/configuracion"; 

const TablaServicios = () => {
  // Lista en memoria para guardar todos los servicios clínicos que se traen de la base de datos.
  const [servicios, setServicios] = useState([]);
  
  // Guarda el texto que el usuario escribe para buscar o filtrar un servicio específico en la tabla.
  const [busqueda, setBusqueda] = useState("");
  
  // Controla si se muestra un mensaje de espera en pantalla mientras los datos terminan de cargar.
  const [cargando, setCargando] = useState(true);
  
  // Espacio temporal para guardar los datos que el usuario escribe al crear o editar un servicio.
  const [formulario, setFormulario] = useState({ id: null, nombre: '', categoria: 'Medicina', precio: '', disponible: true });

  // Trae la lista actualizada de servicios desde la base de datos para refrescar la pantalla después de hacer un cambio.
  const recargarLista = async () => {
    try {
      const listaServicios = await obtenerServiciosDB();
      setServicios(listaServicios);
    } catch (err) {
      console.error("Error al recargar servicios:", err);
    }
  };

  // Se ejecuta automáticamente al abrir la pantalla para cargar los servicios por primera vez y quitar el mensaje de espera.
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

  // Procesa el envío del formulario. Revisa que el precio sea válido y decide si guarda un servicio nuevo o actualiza uno existente.
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formulario.nombre || !formulario.precio) return;

    // Bloquea el proceso si el precio es cero o negativo para evitar pérdidas o errores de cobro en la clínica.
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

    // Vacía los campos del formulario y refresca la tabla para reflejar los cambios de inmediato.
    setFormulario({ id: null, nombre: '', categoria: 'Medicina', precio: '', disponible: true });
    recargarLista();
  };

  // Toma los datos del servicio seleccionado en la tabla y los monta en el formulario para poder editarlos.
  const handleSeleccionarEditar = (s) => {
    setFormulario({ id: s.id, nombre: s.nombre, categoria: s.categoria, precio: s.precio, disponible: s.disponible });
  };

  // Solicita una confirmación al usuario antes de borrar o dar de baja permanentemente un servicio médico.
  const handleBorrar = async (id) => {
    if (confirm("¿Estás seguro de suspender permanentemente este servicio?")) {
      await eliminarServicioDB(id);
      recargarLista();
    }
  };

  // Compara el texto de búsqueda con los nombres y categorías para mostrar solo los servicios que coincidan.
  const filtrados = servicios.filter(
    (s) => s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || s.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* Encabezado principal que muestra el título de la sección y la cantidad de servicios que tiene la clínica */}
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Catálogo de Servicios Clínicos</h2>
          <p className="text-muted">{servicios.length} registros activos</p>
        </div>
      </div>

      {/* Formulario adaptativo que sirve tanto para añadir un servicio nuevo como para modificar uno existente */}
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

      {/* Barra de texto que permite al usuario buscar servicios rápidamente por su nombre o categoría */}
      <div className="form-group mb-2">
        <input type="text" className="input" placeholder="Filtrar catálogo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

      {/* Valida el estado de la aplicación para mostrar un texto de carga, un mensaje de catálogo vacío o la tabla de datos */}
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
              {/* Recorre y dibuja cada uno de los servicios filtrados en filas de la tabla */}
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