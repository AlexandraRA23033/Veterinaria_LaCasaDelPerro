import { useState } from 'react';
import { obtenerStockTotal } from './LogicaPEPS';

const AlertaStock = ({ productos, lotes }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  // Filtra y encuentra cuáles productos están por debajo del umbral crítico (≤ 5 unidades)
  const productosCriticos = productos.filter(prod => {
    const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
    return obtenerStockTotal(lotesDelProd) <= 5;
  });

  // Si no hay productos en estado crítico, el componente no renderiza nada
  if (productosCriticos.length === 0) return null;

  return (
    <div className="danger alerta" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          <strong>ALERTA DE REABASTECIMIENTO:</strong> Se han detectado productos con existencias críticas en el almacén médico (≤ 5 unidades).
        </span>
        <button 
          onClick={() => setVisible(false)} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold', fontSize: '16px' }}
        >
          &times;
        </button>
      </div>
      <div style={{ fontSize: '13px', marginTop: '5px' }}>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          {productosCriticos.map(prod => {
            const lotesDelProd = lotes.filter(l => l.productoNombre === prod.nombre);
            const total = obtenerStockTotal(lotesDelProd);
            return (
              <li key={prod.id}>
                El medicamento <strong>{prod.nombre}</strong> requiere reabastecimiento inmediato. Cantidad total en almacén: <strong>{total} uds</strong>.
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AlertaStock;