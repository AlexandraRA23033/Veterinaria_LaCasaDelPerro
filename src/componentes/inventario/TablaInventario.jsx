import React from 'react';
import { obtenerStockTotal } from './LogicaPEPS';

const TablaInventario = ({ productos, lotes }) => {
  return (
    <div className="card text-dark">
      <div className="card-header">
        Control de Stock e Insumos Médicos (Clínica Veterinaria)
      </div>
      <div className="card-body">
        {/* TABLA PRINCIPAL DE PRODUCTOS */}
        <div className="table-container">
          <table className="table table-striped table-oscura-secondary">
            <thead>
              <tr>
                <th>Medicamento / Insumo</th>
                <th>Precio Venta</th>
                <th>Stock Total</th>
                <th>Estado Administrativo</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((prod) => {
                const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
                const stock = obtenerStockTotal(lotesDelProd);
                const esCritico = stock <= 5;

                return (
                  <tr key={prod.id}>
                    <td><strong>{prod.nombre}</strong></td>
                    <td>${prod.precioVenta.toFixed(2)}</td>
                    <td>{stock} unidades</td>
                    <td>
                      {esCritico ? (
                        <span className="danger badge">CRÍTICO</span>
                      ) : (
                        <span className="success badge">ÓPTIMO</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AUDITORÍA DETALLADA DE LOTES (SISTEMA DE FILA CRONOLÓGICA) */}
        <div className="card card-light" style={{ marginTop: '20px' }}>
          <div className="card-header" style={{ color: '#000', fontWeight: 'bold' }}>
            Auditoría Detallada de Lotes Activos (Fila PEPS)
          </div>
          <div className="card-body">
            {productos.map((prod) => {
              const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
              
              return (
                <div key={prod.id} style={{ marginBottom: '12px', fontSize: '14px' }}>
                  <strong style={{ color: '#2F332B' }}>{prod.nombre}:</strong>
                  {lotesDelProd.length === 0 ? (
                    <span className="alert badge" style={{ marginLeft: '10px' }}>AGOTADO EN ALMACÉN</span>
                  ) : (
                    <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', color: '#4E5748', listStyleType: 'square' }}>
                      {lotesDelProd.map(l => (
                        <li key={l.id}>
                          Código Lote: <code>{l.loteId}</code> | Fecha Ingreso: {l.ingreso} | Cantidad Remanente: <strong>{l.cantidad} uds</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaInventario;