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
  // Estado para formulario de Producto 
  const [nuevoProd, setNuevoProd] = useState({ id: null, nombre: '', precioVenta: '' });
  // Estado para formulario de Lotes
  const [nuevoLote, setNuevoLote] = useState({ loteId: '', ingreso: '', cantidad: '', productoNombre: '' });

  const handleCrearOEditarProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProd.nombre || !nuevoProd.precioVenta) return;

    const datosProducto = {
      nombre: nuevoProd.nombre,
      precioVenta: parseFloat(nuevoProd.precioVenta)
    };

    if (nuevoProd.id) {
     
      await actualizarProductoDB({ id: nuevoProd.id, ...datosProducto });
    } else {
  
      await registrarProductoDB(datosProducto);
    }

    // Limpiar formulario y recargar la app de forma limpia
    setNuevoProd({ id: null, nombre: '', precioVenta: '' });
    window.location.reload();
  };

  const handleSeleccionarEditar = (prod) => {
    setNuevoProd({
      id: prod.id,
      nombre: prod.nombre,
      precioVenta: prod.precioVenta
    });
  };

  const handleCancelarEdicion = () => {
    setNuevoProd({ id: null, nombre: '', precioVenta: '' });
  };

  const handleCrearLote = async (e) => {
    e.preventDefault();
    if (!nuevoLote.loteId || !nuevoLote.ingreso || !nuevoLote.cantidad || !nuevoLote.productoNombre) return;
    await registrarLoteDB({
      loteId: nuevoLote.loteId,
      ingreso: nuevoLote.ingreso,
      cantidad: parseInt(nuevoLote.cantidad),
      productoNombre: nuevoLote.productoNombre
    });
    window.location.reload();
  };

  const handleBorrarProducto = async (id) => {
    if (confirm("¿Estás seguro de eliminar este producto del inventario?")) {
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

  return (
    <div>
      {/* SECCIÓN FORMULARIOS CRUD */}
      <div className="d-flex f-wrap gap-1 mb-3">
        {/* Formulario de Insumo / Medicamento */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">
            {nuevoProd.id ? `Modificar Ficha de Insumo (ID: ${nuevoProd.id})` : "Añadir Nuevo Insumo / Medicamento"}
          </div>
          <form onSubmit={handleCrearOEditarProducto} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Nombre Técnico:</label>
              <input type="text" className="input" placeholder="Ej: Paracetamol Gotas" 
                value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} required />
            </div>
            <div className="form-group mb-1">
              <label className="fw-bold">Precio de Venta ($):</label>
              <input type="number" step="0.01" className="input" placeholder="0.00"
                value={nuevoProd.precioVenta} onChange={e => setNuevoProd({...nuevoProd, precioVenta: e.target.value})} required />
            </div>
            <div className="d-flex gap-1 mt-1">
              <button type="submit" className="btn btn-primary btn-sm f-1">
                {nuevoProd.id ? "Actualizar Producto" : "Registrar Ficha"}
              </button>
              {nuevoProd.id && (
                <button type="button" onClick={handleCancelarEdicion} className="btn btn-secondary btn-sm">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Registro Lote PEPS */}
        <div className="card card-light shadow-sm br-1 f-1">
          <div className="card-header fw-bold text-primary">Ingresar Lote al Almacén (Cola PEPS)</div>
          <form onSubmit={handleCrearLote} className="card-body">
            <div className="form-group mb-1">
              <label className="fw-bold">Seleccionar Producto:</label>
              <select className="input" value={nuevoLote.productoNombre} onChange={e => setNuevoLote({...nuevoLote, productoNombre: e.target.value})} required>
                <option value="">-- Escoger --</option>
                {productos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
            </div>
            <div className="d-flex gap-1 mb-1">
              <div className="form-group f-1">
                <label className="fw-bold">Código Lote:</label>
                <input type="text" className="input" placeholder="LOTE-000"
                  value={nuevoLote.loteId} onChange={e => setNuevoLote({...nuevoLote, loteId: e.target.value})} required />
              </div>
              <div className="form-group f-1">
                <label className="fw-bold">Cantidad Inicial:</label>
                <input type="number" className="input" placeholder="Uds"
                  value={nuevoLote.cantidad} onChange={e => setNuevoLote({...nuevoLote, cantidad: e.target.value})} required />
              </div>
            </div>
            <div className="form-group mb-1">
              <label className="fw-bold">Fecha de Ingreso:</label>
              <input type="date" className="input"
                value={nuevoLote.ingreso} onChange={e => setNuevoLote({...nuevoLote, ingreso: e.target.value})} required />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm w-100 mt-1">Acoplar a PEPS</button>
          </form>
        </div>
      </div>

      {/*TABLA PRINCIPAL DE PRODUCTOS */}
      <div className="table-container shadow-sm br-1 mb-3">
        <table className="table table-clara-primary table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Medicamento / Insumo</th>
              <th>Precio Venta</th>
              <th>Stock Total</th>
              <th>Estado Administrativo</th>
              <th>Acciones Operativas</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod, index) => {
              const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
              // Invocamos la función matemática de la base de datos
              const stock = calcularStockTotalPEPS(lotesDelProd);
              const esCritico = stock <= 5;

              return (
                <tr key={prod.id}>
                  <td>{index + 1}</td>
                  <td className="fw-bold">{prod.nombre}</td>
                  <td>${prod.precioVenta.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${stock > 0 ? "info" : "secondary"}`}>
                      {stock} unidade{stock !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td>
                    {esCritico ? (
                      <span className="badge alert">CRÍTICO</span>
                    ) : (
                      <span className="badge success">ÓPTIMO</span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button onClick={() => handleSeleccionarEditar(prod)} className="btn btn-secondary btn-xs">
                        Editar
                      </button>
                      <button onClick={() => handleBorrarProducto(prod.id)} className="btn btn-alert btn-xs">
                        Retirar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/*AUDITORÍA CRONOLÓGICA DE LOTES ACTIVOS */}
      <div className="card card-light shadow-sm br-1">
        <div className="card-header fw-bold text-dark">
          Auditoría de Fila PEPS (Validación de Lotes en Almacén)
        </div>
        <div className="card-body">
          {productos.map((prod) => {
            const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);

            return (
              <div key={prod.id} className="mb-2 border-bottom-light pb-1">
                <div className="fw-bold text-primary mb-1">{prod.nombre}:</div>
                {lotesDelProd.length === 0 ? (
                  <span className="badge secondary">AGOTADO</span>
                ) : (
                  <div className="d-flex gap-1 f-wrap mt-1">
                    {lotesDelProd.map(l => (
                      <div key={l.id} className="p-1 br-1 shadow-sm bg-light d-flex align-item gap-1">
                        <div>
                          <div className="text-secondary fw-bold">ID: {l.loteId}</div>
                          <div className="text-muted fs-sm">Ingreso: {l.ingreso}</div>
                          <div className="fw-bold text-dark mt-1">Disponibles: {l.cantidad} uds</div>
                        </div>
                        <button onClick={() => handleBorrarLote(l.id)} className="btn btn-alert btn-xs ml-1" title="Consumir / Vaciar Lote">✕</button>
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