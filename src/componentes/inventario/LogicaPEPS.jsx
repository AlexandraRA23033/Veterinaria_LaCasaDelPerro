
export const obtenerStockTotal = (lotes = []) => {
  return lotes.reduce((total, lote) => total + lote.cantidad, 0);
};

// Algoritmo PEPS
export const restarStockPEPS = (lotes, cantidadARestar) => {
  let restante = cantidadARestar;
  let lotesActualizados = lotes.map(lote => ({ ...lote }));

  while (restante > 0 && lotesActualizados.length > 0) {
    let primerLote = lotesActualizados[0];

    if (primerLote.cantidad > restante) {
      primerLote.cantidad -= restante;
      restante = 0;
    } else {
      restante -= primerLote.cantidad;
      lotesActualizados.shift();
    }
  }

  if (restante > 0) {
    return {
      lotesRestantes: lotes,
      error: `Stock insuficiente en almacén. Faltaron ${restante} unidades.`
    };
  }

  return { lotesRestantes: lotesActualizados, error: null };
};