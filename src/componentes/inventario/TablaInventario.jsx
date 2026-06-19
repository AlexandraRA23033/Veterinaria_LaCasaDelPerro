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

  // Estado para el Producto (Izquierda)
  const [nuevoProd, setNuevoProd] = useState({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
  
  // Estado para el Lote (Derecha)
  const [nuevoLote, setNuevoLote] = useState({ id: null, loteId: '', ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });

  // Estado auxiliar para saber si estamos editando un lote específico directamente
  const [editandoLoteDirecto, setEditandoLoteDirecto] = useState(false);

  // Buscamos el nombre original antes de que el usuario lo edite en el input
  const productoOriginal = productos.find(p => p.id === nuevoProd.id);
  const nombreOriginal = productoOriginal ? productoOriginal.nombre : '';

  const handleCrearOEditarProducto = async (e) => {
    e.preventDefault();
    
    if (parseFloat(nuevoProd.precioVenta) <= 0) {
      alert("El precio de venta debe ser un número positivo.");
      return;
    }

    const nuevoNombreNormalizado = nuevoProd.nombre.trim();

    // Validar duplicados (Sólo si el nombre cambió)
    if (nuevoNombreNormalizado.toLowerCase() !== nombreOriginal.toLowerCase()) {
      const yaExiste = productos.some(p => 
        p.nombre.trim().toLowerCase() === nuevoNombreNormalizado.toLowerCase()
      );
      if (yaExiste) {
        alert(`Error: Ya existe un artículo registrado con el nombre "${nuevoProd.nombre}" en el catálogo del inventario.`);
        return;
      }
    }

    // REGLA: Si cambió el tipo de Accesorio a algo que requiera vencimiento, validar que los lotes existentes o el actual tengan fecha
    if (nuevoProd.tipo !== "Accesorio" && nuevoProd.id) {
      if (!nuevoLote.vencimiento || nuevoLote.vencimiento === "No requiere") {
        alert(`Al cambiar el tipo a ${nuevoProd.tipo}, es obligatorio definir una Fecha de Vencimiento válida.`);
        return;
      }
      if (nuevoLote.vencimiento < fechaHoy) {
        alert("La fecha de vencimiento no puede ser del pasado.");
        return;
      }
    }

    const datosProducto = {
      nombre: nuevoNombreNormalizado,
      precioVenta: parseFloat(nuevoProd.precioVenta),
      tipo: nuevoProd.tipo
    };

    const vencimientoFinalLote = nuevoProd.tipo === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

    if (nuevoProd.id) {
      // 1. Actualizar el producto en la base de datos
      await actualizarProductoDB({ id: nuevoProd.id, ...datosProducto });

      // 2. Actualizar cascada de lotes (Nombre y posible nueva fecha de vencimiento obligada)
      const lotesAAsociar = lotes.filter(l => l.productoNombre === nombreOriginal);
      for (const lote of lotesAAsociar) {
        await registrarLoteDB({
          ...lote,
          productoNombre: nuevoNombreNormalizado,
          vencimiento: lote.vencimiento === "No requiere" ? vencimientoFinalLote : lote.vencimiento
        });
      }
    } else {
      await registrarProductoDB(datosProducto);
    }

    // Al finalizar, reset completo y desaparición de datos del formulario
    handleCancelarTodo();
    window.location.reload();
  };

  // Al presionar editar en la tabla de productos
  const handleSeleccionarEditar = (prod) => {
    setEditandoLoteDirecto(false);
    setNuevoProd({
      id: prod.id,
      nombre: prod.nombre,
      precioVenta: prod.precioVenta,
      tipo: prod.tipo || 'Medicamento'
    });

    const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
    const stockActual = calcularStockTotalPEPS(lotesDelProd);

    setNuevoLote({
      id: null,
      loteId: '',
      productoNombre: prod.nombre,
      ingreso: fechaHoy,
      vencimiento: prod.tipo === 'Accesorio' ? 'No requiere' : '',
      cantidad: stockActual 
    });
  };

  // SOLUCIÓN: Cargar los datos del lote seleccionado directamente en el formulario de la derecha
  const handleSeleccionarEditarLoteDirecto = (lote, tipoProducto) => {
    setEditandoLoteDirecto(true);
    // Limpiamos la sección producto para enfocarnos en el lote
    setNuevoProd({ id: null, nombre: '', precioVenta: '', tipo: tipoProducto });

    setNuevoLote({
      id: lote.id,
      loteId: lote.loteId,
      productoNombre: lote.productoNombre,
      ingreso: lote.ingreso,
      vencimiento: lote.vencimiento,
      cantidad: lote.cantidad
    });
  };

  const handleCancelarTodo = () => {
    setNuevoProd({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
    setNuevoLote({ id: null, loteId: '', ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });
    setEditandoLoteDirecto(false);
  };

  // Ejecuta la acción del formulario de la derecha (Crear Lote o Actualizar Lote Modificado)
  const handleFormularioLoteDerecha = async (e) => {
    e.preventDefault();
    
    if (parseInt(nuevoLote.cantidad) <= 0) {
      alert("La cantidad debe ser mayor o igual a 1 unidad.");
      return;
    }

    if (nuevoLote.ingreso < fechaHoy) {
      alert("Error: La fecha de ingreso no puede ser anterior a hoy.");
      return;
    }

    const esAccesorio = nuevoProd.tipo === "Accesorio";
    if (!esAccesorio) {
      if (!nuevoLote.vencimiento || nuevoLote.vencimiento === "No requiere") {
        alert("La fecha de vencimiento es obligatoria para este tipo de producto.");
        return;
      }
      if (nuevoLote.vencimiento < fechaHoy) {
        alert("Error: La fecha de vencimiento no puede ser menor a hoy.");
        return;
      }
    }

    const fechaVencimientoFinal = esAccesorio ? "No requiere" : nuevoLote.vencimiento;

    if (editandoLoteDirecto && nuevoLote.id) {
      // Guardar cambios del lote editado
      await registrarLoteDB({
        id: nuevoLote.id,
        loteId: nuevoLote.loteId,
        ingreso: nuevoLote.ingreso,
        vencimiento: fechaVencimientoFinal,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre
      });
    } else {
      // Registrar un lote nuevo desde cero
      const numeroSiguiente = lotes.length > 0 ? Math.max(...lotes.map(l => parseInt(l.loteId.replace('LOTE-', '')) || 0)) + 1 : 1;
      const loteIdAutomatico = `LOTE-${String(numeroSiguiente).padStart(3, '0')}`;

      await registrarLoteDB({
        loteId: loteIdAutomatico, 
        ingreso: nuevoLote.ingreso,
        vencimiento: fechaVencimientoFinal,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre
      });
    }
    
    handleCancelarTodo();
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

  const esModoEdicionProducto = nuevoProd.id !== null;
  // REQUISITO: Habilitar de inmediato si el tipo seleccionado NO es Accesorio
  const requiereVencimientoActual = nuevoProd.tipo !== "Accesorio";

  return (
    <div>
      <div className="d-flex f-wrap gap-1 mb-3">
        {/* FORMULARIO PRODUCTO (IZQUIERDA) */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">
            {esModoEdicionProducto ? `Modificar Ficha (ID: ${nuevoProd.id})` : "Añadir Nuevo Insumo / Artículo"}
          </div>
          <form onSubmit={handleCrearOEditarProducto} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Nombre Técnico / Artículo:</label>
              <input type="text" className="input" placeholder="Ej: Collar Antipulgas o Amoxicilina" 
                value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} required disabled={editandoLoteDirecto} />
            </div>
            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Clasificación / Tipo:</label>
                <select className="input" value={nuevoProd.tipo} onChange={e => setNuevoProd({...nuevoProd, tipo: e.target.value})} disabled={editandoLoteDirecto}>
                  <option value="Medicamento">Medicamento</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Higiene">Higiene</option>
                </select>
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Precio Venta ($):</label>
                <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
                  value={nuevoProd.precioVenta} onChange={e => setNuevoProd({...nuevoProd, precioVenta: e.target.value})} required disabled={editandoLoteDirecto} />
              </div>
            </div>
            <div className="d-flex gap-1 mt-1">
              <button type="submit" className="btn btn-primary btn-sm f-1" disabled={editandoLoteDirecto}>
                {esModoEdicionProducto ? "Actualizar Registro" : "Registrar Ficha"}
              </button>
              {(esModoEdicionProducto || editandoLoteDirecto) && (
                <button type="button" onClick={handleCancelarTodo} className="btn btn-secondary btn-sm">Cancelar</button>
              )}
            </div>
          </form>
        </div>

        {/* FORMULARIO LOTE (DERECHA) - MANTIENE SU ESTRUCTURA ORIGINAL PERO RECIBE LOS DATOS DE EDICIÓN */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">
            {editandoLoteDirecto ? `Corregir Parámetros de ${nuevoLote.loteId}` : "Ingresar Lote al Almacén (Cola PEPS)"}
          </div>
          <form onSubmit={handleFormularioLoteDerecha} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Artículo del Catálogo:</label>
              <select className="input" value={nuevoLote.productoNombre} onChange={e => setNuevoLote({...nuevoLote, productoNombre: e.target.value})} required disabled={esModoEdicionProducto || editandoLoteDirecto}>
                <option value="">-- Seleccionar --</option>
                {productos.map(p => <option key={p.id} value={p.nombre}>{p.nombre} ({p.tipo})</option>)}
              </select>
            </div>
            
            <div className="form-group mb-1">
              <label className="fw-bold">Cantidad (Uds):</label>
              <input 
                type="number" 
                className="input" 
                value={nuevoLote.cantidad} 
                onChange={e => setNuevoLote({...nuevoLote, cantidad: e.target.value})} 
                required 
                disabled={esModoEdicionProducto} 
                style={esModoEdicionProducto ? { backgroundColor: '#e9ecef', color: '#495057', fontWeight: 'bold' } : {}}
              />
            </div>

            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Fecha de Ingreso:</label>
                <input type="date" min={fechaHoy} className="input" value={nuevoLote.ingreso} onChange={e => setNuevoLote({...nuevoLote, ingreso: e.target.value})} required disabled={esModoEdicionProducto} />
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Vencimiento Médico:</label>
                {/* REQUISITO: Si no requiere vencimiento se bloquea, pero si cambian a Medicamento se activa solo este input */}
                {!requiereVencimientoActual && !editandoLoteDirecto ? (
                  <input type="text" className="input" value="No requiere vencimiento" disabled style={{ backgroundColor: '#e9ecef', color: '#6c757d' }} />
                ) : (
                  <input type="date" min={fechaHoy} className="input" value={nuevoLote.vencimiento === "No requiere" ? "" : nuevoLote.vencimiento} onChange={e => setNuevoLote({...nuevoLote, vencimiento: e.target.value})} required={requiereVencimientoActual} />
                )}
              </div>
            </div>
            
            <button type="submit" className="btn btn-secondary btn-sm w-100 mt-1" disabled={esModoEdicionProducto && !requiereVencimientoActual}>
              {editandoLoteDirecto ? "Actualizar Parámetros del Lote" : esModoEdicionProducto ? "Actualizar Producto a la Izquierda" : "Acoplar a PEPS"}
            </button>
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

            const tipoProducto = prod.tipo || 'Medicamento';

            return (
              <div key={prod.id} className="mb-2 border-bottom-light pb-1">
                <div className="fw-bold text-primary mb-1">{prod.nombre} ({tipoProducto}):</div>
                {lotesDelProd.length === 0 ? (
                  <span className="badge secondary">SIN STOCK ACTIVO</span>
                ) : (
                  <div className="d-flex gap-1 f-wrap mt-1">
                    {lotesDelProd.map(l => (
                      <div key={l.id} className="p-1 br-1 shadow-sm bg-light d-flex align-item gap-1" style={{ border: nuevoLote?.id === l.id ? '2px solid #0d6efd' : 'none' }}>
                        <div>
                          <div className="text-secondary fw-bold">Lote: {l.loteId}</div>
                          <div className="text-muted fs-sm">Ingresó: {l.ingreso}</div>
                          <div className={`${l.vencimiento === 'No requiere' ? 'text-muted' : 'text-alert'} fw-bold fs-sm`}>
                            Vence: {l.vencimiento}
                          </div>
                          <div className="fw-bold text-dark mt-1">Stock: {l.cantidad} uds</div>
                        </div>
                        <div className="d-flex f-col gap-1 ml-1 justify-center">
                          {/* El botón ahora manda la info directo al formulario de la derecha */}
                          <button onClick={() => handleSeleccionarEditarLoteDirecto(l, tipoProducto)} className="btn btn-secondary btn-xs" title="Modificar cantidad o fechas">✏️</button>
                          <button onClick={() => handleBorrarLote(l.id)} className="btn btn-alert btn-xs">✕</button>
                        </div>
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