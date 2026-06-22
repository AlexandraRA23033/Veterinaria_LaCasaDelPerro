// Suma las cantidades de todos los lotes individuales para entregar un único número que representa el total de existencias de un producto.
export const obtenerStockTotal = (lotes = []) => {
  return lotes.reduce((total, lote) => total + lote.cantidad, 0);
};

// Aplica la regla del inventario de que lo primero que entra es lo primero que sale, descontando las unidades vendidas de los paquetes más antiguos.
export const restarStockPEPS = (lotes, cantidadARestar) => {
  let restante = cantidadARestar;
  let lotesActualizados = lotes.map(lote => ({ ...lote }));

  // Revisa paquete por paquete, empezando por el más viejo, y le descuenta unidades hasta que se cubra toda la venta o se acabe el stock.
  while (restante > 0 && lotesActualizados.length > 0) {
    let primerLote = lotesActualizados[0];

    // Si el paquete más antiguo tiene más unidades de las que necesito restar, le quita solo las necesarias y termina el proceso.
    if (primerLote.cantidad > restante) {
      primerLote.cantidad -= restante;
      restante = 0;
    // Si el paquete antiguo no alcanza, consume todo lo que tiene, lo elimina de la lista y pasa al siguiente paquete de la fila.
    } else {
      restante -= primerLote.cantidad;
      lotesActualizados.shift();
    }
  }

  // Si después de revisar todos los paquetes todavía quedan unidades por restar, detiene el proceso e informa que no hay suficiente stock.
  if (restante > 0) {
    return {
      lotesRestantes: lotes,
      error: `Stock insuficiente en almacén. Faltaron ${restante} unidades.`
    };
  }

  // Si todo salió bien, entrega la lista con las cantidades actualizadas de los paquetes para guardarlas en la base de datos.
  return { lotesRestantes: lotesActualizados, error: null };
};