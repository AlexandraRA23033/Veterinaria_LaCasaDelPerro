import { useState } from 'react';
import { obtenerStockTotal } from './LogicaPEPS';

const AlertaStock = ({ productos, lotes }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  // Filtra qué productos están por debajo o igual al umbral crítico de 5 unidades
  const productosCriticos = productos.filter(prod => {
    const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
    return obtenerStockTotal(lotesDelProd) <= 5;
  });

  if (productosCriticos.length === 0) return null;

  return (
    <div className="alerta danger mb-2">
      <div className="d-flex j-cont-bet align-item">
        <div>
          <strong className="text-dark">ALERTA DE STOCK CRÍTICO:</strong>
          <ul className="mb-0 mt-1">
            {productosCriticos.map(prod => {
              const total = obtenerStockTotal(lotes.filter(l => l.productoNombre === prod.nombre));
              return (
                <li key={prod.id}>
                  El medicamento <strong>{prod.nombre}</strong> requiere reabastecimiento inmediato. Unidades restantes: <span className="fw-bold">{total} uds</span>.
                </li>
              );
            })}
          </ul>
        </div>
        <button className="btn-outline-secondary btn-sm" onClick={() => setVisible(false)}>
          X
        </button>
      </div>
    </div>
  );
};

export default AlertaStock;