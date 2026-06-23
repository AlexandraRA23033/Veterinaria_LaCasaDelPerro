import { useState } from "react";
import { obtenerStockTotal } from "./LogicaPEPS";

const AlertaStock = ({ productos, lotes }) => {
  // Guarda un interruptor para recordar si el usuario decidió cerrar el recuadro de advertencia haciendo clic en la "X".
  const [visible, setVisible] = useState(true);

  // Si el usuario cerró el recuadro, esta línea hace que el aviso desaparezca por completo de la pantalla.
  if (!visible) return null;

  // Revisa todo el catálogo y separa en una lista únicamente aquellos artículos que tienen 5 o menos unidades disponibles en total.
  const productosCriticos = productos.filter((prod) => {
    const lotesDelProd = lotes.filter((l) => l.productoNombre === prod.nombre);
    return obtenerStockTotal(lotesDelProd) <= 5;
  });

  // Si después de revisar el inventario no se encuentra ningún artículo con stock bajo, no muestra nada en pantalla para no incomodar.
  if (productosCriticos.length === 0) return null;

  return (
    // Contenedor visual llamativo de color rojo que avisa al personal de la clínica sobre la escasez de mercancía.
    <div className="alerta danger mb-2">
      <div className="d-flex j-cont-bet align-item">
        <div>
          <strong className="text-dark">ALERTA DE STOCK CRÍTICO:</strong>
          {/* Muestra en forma de lista ordenada cada uno de los artículos que se detectaron con stock bajo, detallando cuántas unidades le quedan */}
          <ul className="mb-0 mt-1">
            {productosCriticos.map((prod) => {
              const total = obtenerStockTotal(
                lotes.filter((l) => l.productoNombre === prod.nombre),
              );
              return (
                <li key={prod.id}>
                  El medicamento <strong>{prod.nombre}</strong> requiere
                  reabastecimiento inmediato. Unidades restantes:{" "}
                  <span className="fw-bold">{total} uds</span>.
                </li>
              );
            })}
          </ul>
        </div>
        {/* Botón de cierre que desactiva la visibilidad del recuadro cuando el usuario ya leyó el aviso y desea liberar espacio en la interfaz */}
        <button
          className="btn-outline-secondary btn-sm"
          onClick={() => setVisible(false)}
        >
          X
        </button>
      </div>
    </div>
  );
};

export default AlertaStock;
