// Calcula el total acumulado sumando las cantidades individuales de cada lote activo
export const obtenerStockTotal = (lotes = []) => {
  return lotes.reduce((total, lote) => total + lote.cantidad, 0);
};

// Algoritmo PEPS: Descuenta unidades cronológicamente empezando por el lote más antiguo (primer elemento)
export const restarStockPEPS = (lotes, cantidadARestar) => {
  let restante = cantidadARestar;
  // Creamos una copia profunda de los lotes para no alterar el estado original en caso de error
  let lotesActualizados = lotes.map(lote => ({ ...lote }));

  while (restante > 0 && lotesActualizados.length > 0) {
    let primerLote = lotesActualizados[0];

    if (primerLote.cantidad > restante) {
      // El lote más antiguo tiene suficiente stock para cubrir la demanda restante
      primerLote.cantidad -= restante;
      restante = 0;
    } else {
      // El lote más antiguo se agota por completo, se resta su stock del total requerido y se remueve de la cola
      restante -= primerLote.cantidad;
      lotesActualizados.shift();
    }
  }

  // Si la cantidad a restar superaba todas las existencias combinadas de los lotes
  if (restante > 0) {
    return {
      lotesRestantes: lotes,
      error: `Stock insuficiente en almacén. Faltaron ${restante} unidades.`
    };
  }

  return { lotesRestantes: lotesActualizados, error: null };
};