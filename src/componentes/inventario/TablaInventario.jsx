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
  const fechaHoy = new Date().toISOString().split('T')[0];

  // Estado estructural para entidades de inventario
  const [nuevoProd, setNuevoProd] = useState({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
  const [nuevoLote, setNuevoLote] = useState({ id: null, loteId: '', ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });

  // Estados de control para flujos alternativos de edición
  const [esEdicionProducto, setEsEdicionProducto] = useState(false);
  const [esEdicionLote, setEsEdicionLote] = useState(false);

  // Estados reactivos intermedios para la trazabilidad del cambio de nombre
  const [modalAlerta, setModalAlerta] = useState({ abierto: false, titulo: '', mensaje: '' });
  const [modalConfirmar, setModalConfirmar] = useState({ abierto: false, mensaje: '', accion: null });

  const productoOriginal = productos.find(p => p.id === nuevoProd.id);
  const nombreOriginal = productoOriginal ? productoOriginal.nombre : '';

  // Interfaz de abstracción para el control de ventanas emergentes
  const dispararAlerta = (titulo, mensaje) => {
    setModalAlerta({ abierto: true, titulo, mensaje });
  };

  const dispararConfirmacion = (mensaje, accionAAceptar) => {
    setModalConfirmar({ abierto: true, mensaje, accion: accionAAceptar });
  };

  // Inicialización y limpieza del estado local de los formularios
  const handleCancelarTodo = () => {
    setNuevoProd({ id: null, nombre: '', precioVenta: '', tipo: 'Medicamento' });
    setNuevoLote({ id: null, loteId: '', ingreso: fechaHoy, vencimiento: '', cantidad: '', productoNombre: '' });
    setEsEdicionProducto(false);
    setEsEdicionLote(false);
  };

  // Mapeo de datos del catálogo hacia el formulario de edición de productos
  const handleSeleccionarEditarProducto = (prod) => {
    setEsEdicionLote(false);
    setEsEdicionProducto(true);

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

  // Mapeo de datos cronológicos hacia el formulario de corrección de lotes
  const handleSeleccionarEditarLoteDirecto = (lote, tipoProducto) => {
    setEsEdicionProducto(false);
    setEsEdicionLote(true);

    setNuevoProd({ id: null, nombre: lote.productoNombre, precioVenta: '', tipo: tipoProducto });

    setNuevoLote({
      id: lote.id, 
      loteId: lote.loteId,
      productoNombre: lote.productoNombre,
      ingreso: lote.ingreso,
      vencimiento: lote.vencimiento === "No requiere" ? "" : lote.vencimiento,
      cantidad: lote.cantidad
    });
  };

  // Orquestador transaccional para la persistencia de datos (Estrategia de Botón Único Global)
  const handleGuardarCambiosFormulario = async (e) => {
    if (e) e.preventDefault();

    // Contexto: Modificación de parámetros de un Lote específico
    if (esEdicionLote && nuevoLote.id) {
      if (parseInt(nuevoLote.cantidad) <= 0) {
        dispararAlerta("Cantidad Invalida", "La cantidad debe ser mayor o igual a 1 unidad.");
        return;
      }

      if (nuevoProd.tipo !== "Accesorio") {
        if (!nuevoLote.vencimiento) {
          dispararAlerta("Campo Requerido", "La fecha de vencimiento es obligatoria.");
          return;
        }
        if (nuevoLote.vencimiento < fechaHoy) {
          dispararAlerta("Error de Fecha", "La fecha de vencimiento no puede ser menor al día de hoy.");
          return;
        }
      }

      const vencimientoFinal = nuevoProd.tipo === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

      await registrarLoteDB({
        id: nuevoLote.id, 
        loteId: nuevoLote.loteId,
        ingreso: nuevoLote.ingreso,
        vencimiento: vencimientoFinal,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre
      });

    // Contexto: Modificación de metadatos de un Producto y actualización en cascada de lotes
    } else if (esEdicionProducto && nuevoProd.id) {
      if (parseFloat(nuevoProd.precioVenta) <= 0) {
        dispararAlerta("Precio Invalido", "El precio de venta debe ser un número positivo.");
        return;
      }

      const nuevoNombreNormalizado = nuevoProd.nombre.trim();

      if (nuevoNombreNormalizado.toLowerCase() !== nombreOriginal.toLowerCase()) {
        const yaExiste = productos.some(p => p.nombre.trim().toLowerCase() === nuevoNombreNormalizado.toLowerCase());
        if (yaExiste) {
          dispararAlerta("Duplicacion de Ficha", `Ya existe un artículo con el nombre "${nuevoProd.nombre}".`);
          return;
        }
      }

      let vencimientoCascada = "";
      if (nuevoProd.tipo === "Accesorio") {
        vencimientoCascada = "No requiere";
      } else {
        if (!nuevoLote.vencimiento || nuevoLote.vencimiento === "No requiere") {
          dispararAlerta("Clasificacion Cambiada", "Al cambiar la clasificación, es obligatorio asignar una fecha de vencimiento para actualizar los lotes.");
          return;
        }
        vencimientoCascada = nuevoLote.vencimiento;
      }

      await actualizarProductoDB({
        id: nuevoProd.id,
        nombre: nuevoNombreNormalizado,
        precioVenta: parseFloat(nuevoProd.precioVenta),
        tipo: nuevoProd.tipo
      });

      const lotesModificables = lotes.filter(l => l.productoNombre === nombreOriginal);
      const promesasLotes = lotesModificables.map(lote => 
        registrarLoteDB({
          id: lote.id, 
          loteId: lote.loteId,
          cantidad: lote.cantidad,
          ingreso: lote.ingreso,
          productoNombre: nuevoNombreNormalizado,
          vencimiento: nuevoProd.tipo === "Accesorio" ? "No requiere" : (lote.vencimiento === "No requiere" ? vencimientoCascada : lote.vencimiento)
        })
      );
      
      await Promise.all(promesasLotes);

    // Contexto: Inserción de un nuevo Lote (Generación del correlativo incremental PEPS)
    } else if (nuevoLote.productoNombre) {
      if (parseInt(nuevoLote.cantidad) <= 0) {
        dispararAlerta("Cantidad Invalida", "La cantidad debe ser mayor o igual a 1 unidad.");
        return;
      }

      const prodAsociado = productos.find(p => p.nombre === nuevoLote.productoNombre);
      const tipoAsociado = prodAsociado ? prodAsociado.tipo : 'Medicamento';
      const vencimientoNuevo = tipoAsociado === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

      if (tipoAsociado !== "Accesorio" && (!nuevoLote.vencimiento || nuevoLote.vencimiento < fechaHoy)) {
        dispararAlerta("Fecha Invalida", "Asigna una fecha de vencimiento válida posterior o igual a hoy.");
        return;
      }

      const numeroSiguiente = lotes.length > 0 ? Math.max(...lotes.map(l => parseInt(l.loteId.replace('LOTE-', '')) || 0)) + 1 : 1;
      const loteIdAutomatico = `LOTE-${String(numeroSiguiente).padStart(3, '0')}`;

      await registrarLoteDB({
        loteId: loteIdAutomatico,
        ingreso: nuevoLote.ingreso,
        vencimiento: vencimientoNuevo,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre
      });

    // Contexto: Inserción de una nueva Ficha de Producto en el catálogo base
    } else if (nuevoProd.nombre.trim()) {
      if (parseFloat(nuevoProd.precioVenta) <= 0) {
        dispararAlerta("Precio Invalido", "El precio debe ser positivo.");
        return;
      }
      const yaExiste = productos.some(p => p.nombre.trim().toLowerCase() === nuevoProd.nombre.trim().toLowerCase());
      if (yaExiste) {
        dispararAlerta("Catalogo Duplicado", "Este artículo ya existe en el catálogo.");
        return;
      }

      await registrarProductoDB({
        nombre: nuevoProd.nombre.trim(),
        precioVenta: parseFloat(nuevoProd.precioVenta),
        tipo: nuevoProd.tipo
      });
    } else {
      dispararAlerta("Campos Vacios", "Por favor rellene los campos del formulario antes de procesar.");
      return;
    }

    handleCancelarTodo();
    window.location.reload();
  };

  // Eliminación lógica/física de entidades vinculadas a la persistencia IndexedDB
  const handleBorrarProducto = (id) => {
    dispararConfirmacion("¿Estás seguro de eliminar este artículo del inventario?", async () => {
      await eliminarProductoDB(id);
      window.location.reload();
    });
  };

  const handleBorrarLote = (id) => {
    dispararConfirmacion("¿Deseas dar de baja este lote de la cola PEPS?", async () => {
      await eliminarLoteDB(id);
      window.location.reload();
    });
  };

  const requiereVencimientoFiltro = nuevoProd.tipo !== "Accesorio";

  return (
    <div>
      {/* Componente Modular: Modales de Interfaz de Usuario Personalizados */}
      <div className={`modal-alert ${modalAlerta.abierto ? 'is-open' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>{modalAlerta.titulo}</h3>
            <button className="modal-close" onClick={() => setModalAlerta({ ...modalAlerta, abierto: false })}>×</button>
          </div>
          <div className="modal-body">
            <p style={{ color: '#000', fontSize: '15px' }}>{modalAlerta.mensaje}</p>
          </div>
          <div className="modal-footer">
            <button className="modal-form input" style={{ backgroundColor: '#BB8588', color: '#fff', cursor: 'pointer', border: 'none', padding: '8px 20px' }} 
              onClick={() => setModalAlerta({ ...modalAlerta, abierto: false })}>
              Entendido
            </button>
          </div>
        </div>
      </div>

      <div className={`modal ${modalConfirmar.abierto ? 'is-open' : ''} modal-primary`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3>Confirmar Operación</h3>
            <button className="modal-close" onClick={() => setModalConfirmar({ ...modalConfirmar, abierto: false })}>×</button>
          </div>
          <div className="modal-body">
            <p style={{ color: '#000', fontSize: '15px', textAlign: 'center' }}>{modalConfirmar.mensaje}</p>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'center', gap: '15px' }}>
            <button className="modal-form input" style={{ backgroundColor: '#2F332B', color: '#fff', cursor: 'pointer', border: 'none' }}
              onClick={() => {
                if (modalConfirmar.accion) modalConfirmar.accion();
                setModalConfirmar({ ...modalConfirmar, abierto: false });
              }}>
              Confirmar
            </button>
            <button className="modal-form input" style={{ backgroundColor: '#6c757d', color: '#fff', cursor: 'pointer', border: 'none' }}
              onClick={() => setModalConfirmar({ ...modalConfirmar, abierto: false })}>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Componente Modular: Formulario de Configuración de Artículos */}
      <div className="d-flex f-wrap gap-1 mb-2">
        <div className="card card-light shadow-sm br-1 f-1" style={{ opacity: esEdicionLote ? 0.6 : 1 }}>
          <div className="card-header fw-bold text-primary">
            {esEdicionProducto ? `Modificar Ficha (ID: ${nuevoProd.id})` : "Añadir Nuevo Insumo / Artículo"}
          </div>
          <div className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Nombre Técnico / Artículo:</label>
              <input type="text" className="input" placeholder="Ej: Collar Antipulgas" 
                value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} disabled={esEdicionLote} />
            </div>
            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Clasificación / Tipo:</label>
                <select className="input" value={nuevoProd.tipo} onChange={e => setNuevoProd({...nuevoProd, tipo: e.target.value})} disabled={esEdicionLote}>
                  <option value="Medicamento">Medicamento</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Higiene">Higiene</option>
                </select>
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Precio Venta ($):</label>
                <input type="number" step="0.01" min="0.01" className="input" placeholder="0.00"
                  value={nuevoProd.precioVenta} onChange={e => setNuevoProd({...nuevoProd, precioVenta: e.target.value})} disabled={esEdicionLote} />
              </div>
            </div>
          </div>
        </div>

        {/* Componente Modular: Formulario de Asignación de Cola PEPS */}
        <div className="card card-light shadow-sm br-1 f-1" style={{ opacity: esEdicionProducto && !requiereVencimientoFiltro ? 0.6 : 1 }}>
          <div className="card-header fw-bold text-primary">
            {esEdicionLote ? `Corregir Parámetros de ${nuevoLote.loteId}` : "Ingresar Lote al Almacén (Cola PEPS)"}
          </div>
          <div className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Artículo del Catálogo:</label>
              <select className="input" value={nuevoLote.productoNombre} onChange={e => setNuevoLote({...nuevoLote, productoNombre: e.target.value})} disabled={esEdicionProducto || esEdicionLote}>
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
                disabled={esEdicionProducto} 
                style={esEdicionProducto ? { backgroundColor: '#e9ecef', color: '#495057', fontWeight: 'bold' } : {}}
              />
            </div>

            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Fecha de Ingreso:</label>
                <input type="date" className="input" value={nuevoLote.ingreso} onChange={e => setNuevoLote({...nuevoLote, ingreso: e.target.value})} disabled={esEdicionProducto} />
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Vencimiento Médico:</label>
                {!requiereVencimientoFiltro && !esEdicionLote ? (
                  <input type="text" className="input" value="No requiere vencimiento" disabled style={{ backgroundColor: '#e9ecef', color: '#6c757d' }} />
                ) : (
                  <input type="date" min={fechaHoy} className="input" value={nuevoLote.vencimiento} onChange={e => setNuevoLote({...nuevoLote, vencimiento: e.target.value})} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente Modular: Disparador Unificado Dinámico */}
      <div className="card shadow-sm p-1 mb-3 bg-light br-1 d-flex gap-1">
        <button type="button" onClick={handleGuardarCambiosFormulario} className="btn btn-primary fw-bold f-1" style={{ padding: '12px', fontSize: '15px' }}>
          {esEdicionProducto ? "Guardar Cambios del Producto" : 
           esEdicionLote ? "Guardar Cambios del Lote" : "Registrar / Guardar Datos de Inventario"}
        </button>
        {(esEdicionProducto || esEdicionLote || nuevoProd.nombre || nuevoLote.productoNombre) && (
          <button type="button" onClick={handleCancelarTodo} className="btn btn-secondary fw-bold" style={{ padding: '12px' }}>
            Cancelar / Limpiar Formulario
          </button>
        )}
      </div>

      {/* Componente Modular: Tabla Analítica de Existencias Totales */}
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
            {productos.map((prod, index) => {
              const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
              const stock = calcularStockTotalPEPS(lotesDelProd);
              const esCritico = stock <= 5;
              const tipoElemento = prod.tipo || 'Medicamento';

              return (
                <tr key={prod.id} style={{ backgroundColor: nuevoProd.id === prod.id ? '#eef2ff' : 'transparent' }}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{prod.nombre}</td>
                  <td><span className="badge info">{tipoElemento}</span></td>
                  <td>${prod.precioVenta.toFixed(2)}</td>
                  <td><span className={`badge ${stock > 0 ? "success" : "secondary"}`}>{stock} uds</span></td>
                  <td>
                    <span className={`badge ${esCritico ? "alert" : "success"}`}>{esCritico ? "CRÍTICO" : "ÓPTIMO"}</span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button onClick={() => handleSeleccionarEditarProducto(prod)} className="btn btn-secondary btn-xs" disabled={esEdicionLote || esEdicionProducto}>Editar</button>
                      <button onClick={() => handleBorrarProducto(prod.id)} className="btn btn-alert btn-xs" disabled={esEdicionLote || esEdicionProducto}>Retirar</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Componente Modular: Línea Temporal y Auditoría de Inventario (PEPS) */}
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
                          <button onClick={() => handleSeleccionarEditarLoteDirecto(l, tipoProducto)} className="btn btn-secondary btn-xs" disabled={esEdicionProducto || esEdicionLote} title="Corregir este lote">Editar</button>
                          <button onClick={() => handleBorrarLote(l.id)} className="btn btn-alert btn-xs" disabled={esEdicionProducto || esEdicionLote}>Eliminar</button>
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