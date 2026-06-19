import { useState } from 'react';
import { 
  registrarProductoDB, 
  actualizarProductoDB, 
  registrarLoteDB, 
  eliminarProductoDB, 
  eliminarLoteDB,
  calcularStockTotalPEPS 
} from '../../base-datos/configuracion';

const TablaInventario = ({ productos, lotes }) => {
  // Obtener fecha actual en formato YYYY-MM-DD para las validaciones de rango (Año actual 2026)
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estado para el Producto
  const [nuevoProd, setNuevoProd] = useState({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
  
  // Estado para el Lote (Inicializado con fecha de ingreso de hoy)
  const [nuevoLote, setNuevoLote] = useState({ ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });

  const handleCrearOEditarProducto = async (e) => {
    e.preventDefault();
    
    if (parseFloat(nuevoProd.precioVenta) <= 0) {
      alert("El precio de venta debe ser un número positivo.");
      return;
    }

    // Validar que no se ingresen 2 o más productos con el mismo nombre
    const nombreNormalizado = nuevoProd.nombre.trim().toLowerCase();
    const yaExiste = productos.some(p => 
      p.nombre.trim().toLowerCase() === nombreNormalizado && p.id !== nuevoProd.id
    );

    if (yaExiste) {
      alert(`Error: Ya existe un artículo registrado con el nombre "${nuevoProd.nombre}" en el catálogo del inventario.`);
      return;
    }

    const datosProducto = {
      nombre: nuevoProd.nombre.trim(),
      precioVenta: parseFloat(nuevoProd.precioVenta),
      tipo: nuevoProd.tipo
    };

    if (nuevoProd.id) {
      await actualizarProductoDB({ id: nuevoProd.id, ...datosProducto });
    } else {
      await registrarProductoDB(datosProducto);
    }

    // Limpieza total y reseteo
    setNuevoProd({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
    setNuevoLote({ ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });
    window.location.reload();
  };

  // Al editar, posiciona los datos en ambos formularios de manera sincronizada
  const handleSeleccionarEditar = (prod) => {
    setNuevoProd({
      id: prod.id,
      nombre: prod.nombre,
      precioVenta: prod.precioVenta,
      tipo: prod.tipo || 'Medicamento'
    });

    setNuevoLote(prev => ({
      ...prev,
      productoNombre: prod.nombre
    }));
  };

  const handleCancelarEdicion = () => {
    setNuevoProd({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
    setNuevoLote({ ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });
  };

  const handleCrearLote = async (e) => {
    e.preventDefault();
    
    if (parseInt(nuevoLote.cantidad) <= 0) {
      alert("La cantidad inicial debe ser mayor o igual a 1 unidad.");
      return;
    }

    // CORRECCIÓN: La fecha de ingreso NO puede ser anterior al día de hoy (fechas pasadas)
    if (nuevoLote.ingreso < fechaHoy) {
      alert("Error: La fecha de ingreso no puede ser una fecha anterior al día de hoy.");
      return;
    }

    // Detectar el tipo del producto seleccionado para aplicar la regla de vencimiento
    const productoAsociado = productos.find(p => p.nombre === nuevoLote.productoNombre);
    const tipoProducto = productoAsociado ? productoAsociado.tipo : 'Medicamento';

    // Validar vencimiento solo para Medicamento, Alimento e Higiene
    if (tipoProducto !== "Accesorio") {
      if (!nuevoLote.vencimiento) {
        alert(`El campo de fecha de vencimiento es obligatorio para la categoría: ${tipoProducto}.`);
        return;
      }
      if (nuevoLote.vencimiento < fechaHoy) {
        alert("Error: No se pueden registrar lotes vencidos o con fechas anteriores a hoy.");
        return;
      }
    }

    const fechaVencimientoFinal = tipoProducto === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

    // Generar código de lote correlativo automático basado en el total de registros de lotes
    const numeroSiguiente = lotes.length > 0 ? Math.max(...lotes.map(l => parseInt(l.loteId.replace('LOTE-', '')) || 0)) + 1 : 1;
    const loteIdAutomatico = `LOTE-${String(numeroSiguiente).padStart(3, '0')}`;

    await registrarLoteDB({
      loteId: loteIdAutomatico, 
      ingreso: nuevoLote.ingreso,
      vencimiento: fechaVencimientoFinal,
      cantidad: parseInt(nuevoLote.cantidad),
      productoNombre: nuevoLote.productoNombre
    });
    
    window.location.reload();
  };

  const handleBorrarProducto = async (id) => {
    if (confirm("¿Estás seguro de eliminar este artículo del inventario?")) {
      await eliminarProductoDB(id);
      window.location.reload();
    }
  };

  const handleBorrarLote = async (id) => {
    if (confirm("¿Deseas dar de baja este lote de la auditoría PEPS?")) {
      await eliminarLoteDB(id);
      window.location.reload();
    }
  };

  // Auxiliar para saber dinámicamente qué tipo de producto está seleccionado en la sección de lotes
  const productoSeleccionadoEnLotes = productos.find(p => p.nombre === nuevoLote.productoNombre);
  const esAccesorioSeleccionado = productoSeleccionadoEnLotes?.tipo === "Accesorio";

  return (
    <div>
      <div className="d-flex f-wrap gap-1 mb-3">
        {/* FORMULARIO PRODUCTO */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">
            {nuevoProd.id ? `Modificar Ficha (ID: ${nuevoProd.id})` : "Añadir Nuevo Insumo / Artículo"}
          </div>
          <form onSubmit={handleCrearOEditarProducto} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Nombre Técnico / Artículo:</label>
              <input type="text" className="input" placeholder="Ej: Collar Antipulgas o Amoxicilina" 
                value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} required />
            </div>
            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Clasificación / Tipo:</label>
                <select className="input" value={nuevoProd.tipo} onChange={e => setNuevoProd({...nuevoProd, tipo: e.target.value})}>
                  <option value="Medicamento">Medicamento</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Higiene">Higiene</option>
                </select>
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Precio Venta ($):</label>
                <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
                  value={nuevoProd.precioVenta} onChange={e => setNuevoProd({...nuevoProd, precioVenta: e.target.value})} required />
              </div>
            </div>
            <div className="d-flex gap-1 mt-1">
              <button type="submit" className="btn btn-primary btn-sm f-1">
                {nuevoProd.id ? "Actualizar Registro" : "Registrar Ficha"}
              </button>
              {nuevoProd.id && (
                <button type="button" onClick={handleCancelarEdicion} className="btn btn-secondary btn-sm">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        {/* FORMULARIO LOTE */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">Ingresar Lote al Almacén (Cola PEPS)</div>
          <form onSubmit={handleCrearLote} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Seleccionar Artículo del Catálogo:</label>
              <select className="input" value={nuevoLote.productoNombre} onChange={e => setNuevoLote({...nuevoLote, productoNombre: e.target.value})} required>
                <option value="">-- Seleccionar --</option>
                {productos.map(p => <option key={p.id} value={p.nombre}>{p.nombre} ({p.tipo})</option>)}
              </select>
            </div>
            
            <div className="form-group mb-1">
              <label className="fw-bold">Cantidad (Uds):</label>
              <input type="number" min="1" className="input" placeholder="Cantidad que ingresa" value={nuevoLote.cantidad} onChange={e => setNuevoLote({...nuevoLote, cantidad: e.target.value})} required />
            </div>

            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Fecha de Ingreso:</label>
                {/* CORRECCIÓN: min={fechaHoy} bloquea que se elijan días del pasado */}
                <input type="date" min={fechaHoy} className="input" value={nuevoLote.ingreso} onChange={e => setNuevoLote({...nuevoLote, ingreso: e.target.value})} required />
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Vencimiento Médico:</label>
                {esAccesorioSeleccionado ? (
                  <input type="text" className="input" value="No requiere vencimiento" disabled style={{ backgroundColor: '#e9ecef', color: '#6c757d' }} />
                ) : (
                  <input type="date" min={fechaHoy} className="input" value={nuevoLote.vencimiento} onChange={e => setNuevoLote({...nuevoLote, vencimiento: e.target.value})} required={!esAccesorioSeleccionado} />
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-secondary btn-sm w-100 mt-1">Acoplar a PEPS</button>
          </form>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="table-container shadow-sm br-1 mb-3">
        <table className="table table-clara-primary table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Artículo / Insumo</th>
              <th>Tipo</th>
              <th>Precio Venta</th>
              <th>Stock Total</th>
              <th>Estado / Alerta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr><td colSpan="7" className="text-center text-muted p-2">No hay artículos cargados en el inventario desde cero.</td></tr>
            ) : (
              productos.map((prod, index) => {
                const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
                const stock = calcularStockTotalPEPS(lotesDelProd);
                const esCritico = stock <= 5;
                const tipoElemento = prod.tipo || 'Medicamento';

                return (
                  <tr key={prod.id}>
                    <td>{index + 1}</td>
                    <td className="fw-bold">{prod.nombre}</td>
                    <td><span className="badge info">{tipoElemento}</span></td>
                    <td>${prod.precioVenta.toFixed(2)}</td>
                    <td><span className={`badge ${stock > 0 ? "success" : "secondary"}`}>{stock} uds</span></td>
                    <td>
                      {esCritico ? (
                        <span className="badge alert fw-bold">Falta {tipoElemento}</span>
                      ) : (
                        <span className="badge success">ÓPTIMO</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button onClick={() => handleSeleccionarEditar(prod)} className="btn btn-secondary btn-xs">Editar</button>
                        <button onClick={() => handleBorrarProducto(prod.id)} className="btn btn-alert btn-xs">Retirar</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* AUDITORÍA DE LOTES */}
      <div className="card card-light shadow-sm br-1">
        <div className="card-header fw-bold text-dark">Línea Cronológica PEPS (Vencimientos y Almacenamiento)</div>
        <div className="card-body">
          {productos.map((prod) => {
            const lotesDelProd = lotes
              .filter(l => l.productoNombre === prod.nombre)
              .sort((a, b) => new Date(a.ingreso) - new Date(b.ingreso));

            return (
              <div key={prod.id} className="mb-2 border-bottom-light pb-1">
                <div className="fw-bold text-primary mb-1">{prod.nombre} ({prod.tipo || 'Medicamento'}):</div>
                {lotesDelProd.length === 0 ? (
                  <span className="badge secondary">SIN STOCK ACTIVO</span>
                ) : (
                  <div className="d-flex gap-1 f-wrap mt-1">
                    {lotesDelProd.map(l => (
                      <div key={l.id} className="p-1 br-1 shadow-sm bg-light d-flex align-item gap-1">
                        <div>
                          <div className="text-secondary fw-bold">Lote: {l.loteId}</div>
                          <div className="text-muted fs-sm">Ingresó: {l.ingreso}</div>
                          <div className={`${l.vencimiento === 'No requiere' ? 'text-muted' : 'text-alert'} fw-bold fs-sm`}>
                            Vence: {l.vencimiento}
                          </div>
                          <div className="fw-bold text-dark mt-1">Stock: {l.cantidad} uds</div>
                        </div>
                        <button onClick={() => handleBorrarLote(l.id)} className="btn btn-alert btn-xs ml-1">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TablaInventario;