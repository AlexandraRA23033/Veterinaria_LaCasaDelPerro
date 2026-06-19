import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerProductosDB,
  obtenerLotesDB,
  obtenerServiciosDB,
  actualizarLoteDB,
  eliminarLoteDB,
  calcularStockTotalPEPS,
  guardarVentaDB,
  obtenerVentasDB,
} from "../../base-datos/configuracion";

import { restarStockPEPS } from "../inventario/LogicaPEPS";

function fechaHoy() {
  return new Date().toLocaleDateString("es-SV", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function horaAhora() {
  return new Date().toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" });
}

function idTicket() {
  return "TKT-" + Date.now().toString().slice(-6);
}

// ── Categorías de accesorios (sin stock PEPS, siempre disponibles) ─────────
// Estos son productos de venta libre que NO requieren stock de lotes
const ACCESORIOS_FIJOS = [
  { id: "acc-1", nombre: "Collar ajustable", precioVenta: 5.00, tipo: "accesorio" },
  { id: "acc-2", nombre: "Correa estándar", precioVenta: 4.50, tipo: "accesorio" },
  { id: "acc-3", nombre: "Comedero plástico", precioVenta: 3.00, tipo: "accesorio" },
  { id: "acc-4", nombre: "Bebedero portátil", precioVenta: 6.00, tipo: "accesorio" },
  { id: "acc-5", nombre: "Cama para mascota", precioVenta: 18.00, tipo: "accesorio" },
  { id: "acc-6", nombre: "Juguete mordedor", precioVenta: 3.50, tipo: "accesorio" },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function PuntoDeVenta() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === "admin";
  const location = useLocation();

  // Si viene desde VistaRapida con cliente preseleccionado
  const clientePre = location.state?.clientePreseleccionado ?? null;

  // Catálogos
  const [medicamentos, setMedicamentos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Datos del cliente — prellenados si vienen de VistaRapida
  const [nombreCliente, setNombreCliente] = useState(clientePre?.nombre  ?? "");
  const [nombreMascota, setNombreMascota] = useState(clientePre?.mascota ?? "");

  // Carrito: [{ id, nombre, tipo, precio, cantidad }]
  const [carrito, setCarrito] = useState([]);

  // Historial de ventas (tickets generados en esta sesión)
  const [historial, setHistorial] = useState([]);
  const [ticketActual, setTicketActual] = useState(null); // ticket recién generado
  const [vista, setVista] = useState("venta"); // "venta" | "historial"

  // Pestaña del catálogo
  const [tabCatalogo, setTabCatalogo] = useState("accesorios"); // "accesorios" | "medicamentos" | "servicios"
useEffect(() => {
  let activo = true;

  async function cargar() {
    setCargando(true);
    try {
      const [prods, ls, servs, ventas] = await Promise.all([
        obtenerProductosDB(),
        obtenerLotesDB(),
        obtenerServiciosDB(),
        obtenerVentasDB(),
      ]);
      if (!activo) return;
      setMedicamentos(prods);
      setLotes(ls);
      setServicios(servs.filter(s => s.disponible));
      setHistorial(ventas.sort((a, b) => b.timestamp - a.timestamp));
    } catch (err) {
      console.error("Error cargando catálogo:", err);
    } finally {
      if (activo) setCargando(false);
    }
  }

  cargar();
  return () => { activo = false; };
}, []);
  // ── Carrito ───────────────────────────────────────────────────────────────

  function agregarAlCarrito(item) {
    setCarrito(prev => {
      const existe = prev.find(c => c.id === item.id);
      if (existe) {
        return prev.map(c => c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c);
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
  }

  function cambiarCantidad(id, delta) {
    setCarrito(prev =>
      prev.map(c => c.id === id ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c)
    );
  }

  function quitarDelCarrito(id) {
    setCarrito(prev => prev.filter(c => c.id !== id));
  }

  const totalCarrito = carrito.reduce((s, c) => s + c.precio * c.cantidad, 0);

  // ── Validar stock antes de cobrar ─────────────────────────────────────────

  function validarStock() {
    for (const item of carrito) {
      if (item.tipo !== "medicamento") continue;
      const lotesItem = lotes.filter(l => l.productoNombre === item.nombre);
      const stockDisp = calcularStockTotalPEPS(lotesItem);
      if (item.cantidad > stockDisp) {
        return `Stock insuficiente para "${item.nombre}". Disponible: ${stockDisp} uds.`;
      }
    }
    return null;
  }

  // ── Procesar venta ────────────────────────────────────────────────────────

  async function procesarVenta() {
    if (!nombreCliente.trim()) {
      alert("Ingresa el nombre del cliente antes de continuar.");
      return;
    }
    if (carrito.length === 0) {
      alert("Agrega al menos un producto al carrito.");
      return;
    }

    const errorStock = validarStock();
    if (errorStock) { alert(errorStock); return; }

    try {
      // Descontar stock PEPS para medicamentos
      let lotesActualizados = [...lotes];
      for (const item of carrito) {
        if (item.tipo !== "medicamento") continue;

        const lotesItem = lotesActualizados
          .filter(l => l.productoNombre === item.nombre)
          .sort((a, b) => a.ingreso.localeCompare(b.ingreso)); // PEPS: más antiguo primero

        const { lotesRestantes, error } = restarStockPEPS(lotesItem, item.cantidad);
        if (error) { alert(error); return; }

        // Determinar qué lotes se agotaron y cuáles se modificaron
        const idsOriginales = lotesItem.map(l => l.id);
        const idsRestantes  = lotesRestantes.map(l => l.id);
        const idsAgotados   = idsOriginales.filter(id => !idsRestantes.includes(id));

        // Eliminar lotes agotados de IndexedDB
        for (const id of idsAgotados) {
          await eliminarLoteDB(id);
        }
        // Actualizar cantidades de lotes parcialmente consumidos
        for (const lote of lotesRestantes) {
          await actualizarLoteDB(lote);
        }

        // Actualizar estado local
        lotesActualizados = lotesActualizados
          .filter(l => !idsAgotados.includes(l.id))
          .map(l => {
            const actualizado = lotesRestantes.find(r => r.id === l.id);
            return actualizado ?? l;
          });
      }

      setLotes(lotesActualizados);

      // Generar ticket
      const ticket = {
        id: idTicket(),
        timestamp: Date.now(),
        fecha: new Date().toLocaleDateString("es-SV"),
        hora: horaAhora(),
        cliente: nombreCliente.trim(),
        mascota: nombreMascota.trim() || "—",
        vendidoPor: usuario?.nombre_completo ?? "Mostrador (sin sesión)",
        items: carrito.map(c => ({ ...c })),
        total: totalCarrito,
        tipo: esAdmin ? "completa" : "accesorios",
      };

      await guardarVentaDB(ticket);
      setHistorial(prev => [ticket, ...prev]);
      setTicketActual(ticket);
      setCarrito([]);
      setNombreCliente("");
      setNombreMascota("");
      setVista("ticket");

    } catch (err) {
      console.error("Error procesando venta:", err);
      alert("Ocurrió un error al procesar la venta.");
    }
  }

  // ── Stock de un producto ──────────────────────────────────────────────────
  function stockDe(nombreProd) {
    return calcularStockTotalPEPS(lotes.filter(l => l.productoNombre === nombreProd));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (cargando) return (
    <div className="container mt-3 text-center">
      <p className="text-muted">Cargando catálogo de productos...</p>
    </div>
  );

  return (
    <div className="container mt-2">

      {/* ── Encabezado ── */}
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Punto de Venta</h2>
          <p className="text-muted">
            {esAdmin
              ? "Modo Admin — accesorios, medicamentos y servicios"
              : "Modo público — solo accesorios disponibles"}
          </p>
        </div>
        <div className="d-flex gap-1">
          <button
            className={vista === "venta" ? "btn btn-primary btn-sm" : "btn-outline-secondary btn-sm"}
            onClick={() => setVista("venta")}
          > Nueva venta</button>
          <button
            className={vista === "historial" ? "btn btn-primary btn-sm" : "btn-outline-secondary btn-sm"}
            onClick={() => setVista("historial")}
          >Historial ({historial.length})</button>
        </div>
      </div>

      {/* ══════════════ VISTA: TICKET GENERADO ══════════════ */}
      {vista === "ticket" && ticketActual && (
        <div className="card shadow-sm br-1 p-3 mb-3" style={{ maxWidth: "520px", margin: "0 auto", border: "2px dashed #3a6073" }}>
          <div className="text-center mb-2">
            <div className="fs-2">🐾</div>
            <h3 className="fw-bold text-primary fs-1-5">La Casa del Perro</h3>
            <p className="text-muted fs-0-85">7ª Av Sur #803, San Miguel</p>
            <div style={{ borderTop: "1px dashed #aaa", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
              <span className="fw-bold">{ticketActual.id}</span>
              <span className="text-muted mx-1">—</span>
              <span className="text-muted fs-0-85">{ticketActual.fecha} · {ticketActual.hora}</span>
            </div>
          </div>

          <div className="mb-2">
            <div><span className="fw-bold">Cliente:</span> {ticketActual.cliente}</div>
            <div><span className="fw-bold">Mascota:</span> {ticketActual.mascota}</div>
            <div><span className="fw-bold">Atendido por:</span> {ticketActual.vendidoPor}</div>
          </div>

          <div style={{ borderTop: "1px dashed #aaa", borderBottom: "1px dashed #aaa", padding: "0.5rem 0", marginBottom: "0.75rem" }}>
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Producto</th>
                  <th style={{ textAlign: "center" }}>Cant.</th>
                  <th style={{ textAlign: "right" }}>Precio</th>
                  <th style={{ textAlign: "right" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {ticketActual.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.nombre}</td>
                    <td style={{ textAlign: "center" }}>{item.cantidad}</td>
                    <td style={{ textAlign: "right" }}>${item.precio.toFixed(2)}</td>
                    <td style={{ textAlign: "right" }}>${(item.precio * item.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex j-cont-bet fw-bold fs-1-2 mb-2">
            <span>TOTAL</span>
            <span style={{ color: "#6E8F6B" }}>${ticketActual.total.toFixed(2)}</span>
          </div>

          <p className="text-center text-muted fs-0-85 mb-2">¡Gracias por su visita! </p>

          <div className="d-flex gap-1 j-cont-cent">
            <button className="btn btn-primary btn-sm" onClick={() => setVista("venta")}>
              Nueva venta
            </button>
            <button className="btn-outline-secondary btn-sm" onClick={() => setVista("historial")}>
               Ver historial
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ VISTA: HISTORIAL ══════════════ */}
      {vista === "historial" && (
        <div>
          {historial.length === 0 ? (
            <div className="alerta primary text-center">
              No hay ventas registradas en esta sesión aún.
            </div>
          ) : (
            <>
              {/* Resumen del día */}
              <div className="d-flex gap-2 mb-3 f-wrap" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", display: "grid" }}>
                <div className="card p-2 text-center shadow-sm br-1" style={{ borderTop: "4px solid #3a6073" }}>
                  <div className="fs-2 fw-bold text-primary">{historial.length}</div>
                  <div className="text-muted fs-0-85">Ventas del día</div>
                </div>
                <div className="card p-2 text-center shadow-sm br-1" style={{ borderTop: "4px solid #6E8F6B" }}>
                  <div className="fs-2 fw-bold" style={{ color: "#6E8F6B" }}>
                    ${historial.reduce((s, t) => s + t.total, 0).toFixed(2)}
                  </div>
                  <div className="text-muted fs-0-85"> Total recaudado</div>
                </div>
                <div className="card p-2 text-center shadow-sm br-1" style={{ borderTop: "4px solid #4A90B8" }}>
                  <div className="fs-2 fw-bold" style={{ color: "#4A90B8" }}>
                    {historial.reduce((s, t) => s + t.items.reduce((a, i) => a + i.cantidad, 0), 0)}
                  </div>
                  <div className="text-muted fs-0-85">Productos vendidos</div>
                </div>
              </div>

              {/* Tabla historial */}
              <div className="table-container shadow-sm br-1">
                <table className="table table-clara-primary table-bordered">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Hora</th>
                      <th>Cliente / Mascota</th>
                      <th>Items</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(t => (
                      <tr key={t.id}>
                        <td className="fw-bold text-primary">{t.id}</td>
                        <td>{t.hora}</td>
                        <td>
                          <strong>{t.cliente}</strong>
                          {t.mascota !== "—" && <><br /><span className="text-muted fs-0-85">🐾 {t.mascota}</span></>}
                        </td>
                        <td>
                          {t.items.map((it, i) => (
                            <div key={i} className="fs-0-85">
                              {it.cantidad}× {it.nombre}
                            </div>
                          ))}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong style={{ color: "#6E8F6B" }}>${t.total.toFixed(2)}</strong>
                        </td>
                        <td>
                          <span className={`badge ${t.tipo === "completa" ? "success" : "info"}`}>
                            {t.tipo === "completa" ? "Admin" : "Público"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <button className="btn btn-primary btn-sm mt-2" onClick={() => setVista("venta")}>
            ← Volver a ventas
          </button>
        </div>
      )}

      {/* ══════════════ VISTA: VENTA PRINCIPAL ══════════════ */}
      {vista === "venta" && (
        <div className="d-flex gap-2 f-wrap" style={{ alignItems: "flex-start" }}>

          <div style={{ flex: "2", minWidth: "300px" }}>

            <div className="card shadow-sm br-1 p-2 mb-2">
              <div className="fw-bold text-primary mb-1">Datos del cliente</div>
              <div className="d-flex gap-1 f-wrap">
                <div className="form-group f-1" style={{ minWidth: "160px" }}>
                  <label className="label fw-bold text-secondary fs-0-85">Nombre del cliente *</label>
                  <input
                    type="text" className="input"
                    placeholder="Ej: María López"
                    value={nombreCliente}
                    onChange={e => setNombreCliente(e.target.value)}
                  />
                </div>
                <div className="form-group f-1" style={{ minWidth: "160px" }}>
                  <label className="label fw-bold text-secondary fs-0-85">Nombre de la mascota</label>
                  <input
                    type="text" className="input"
                    placeholder="Ej: Max (opcional)"
                    value={nombreMascota}
                    onChange={e => setNombreMascota(e.target.value)}
                  />
                </div>
              </div>
              {!esAdmin && (
                <div className="alerta primary mt-1" style={{ fontSize: "0.8rem" }}>
                  Sesión pública — solo puedes vender accesorios. Para medicamentos o servicios inicia sesión como admin.
                </div>
              )}
            </div>

            {/* Pestañas del catálogo */}
            <div className="card shadow-sm br-1 p-2">
              <div className="fw-bold text-primary mb-1"> Catálogo</div>

              {/* Tabs */}
              <div className="d-flex gap-1 mb-2" style={{ borderBottom: "2px solid #e2e8f0" }}>
                <button
                  onClick={() => setTabCatalogo("accesorios")}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0.75rem",
                    fontWeight: tabCatalogo === "accesorios" ? "bold" : "normal",
                    color: tabCatalogo === "accesorios" ? "#3a6073" : "#888",
                    borderBottom: tabCatalogo === "accesorios" ? "2px solid #3a6073" : "none",
                    marginBottom: "-2px",
                  }}
                >Accesorios</button>

                {esAdmin && (
                  <>
                    <button
                      onClick={() => setTabCatalogo("medicamentos")}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0.75rem",
                        fontWeight: tabCatalogo === "medicamentos" ? "bold" : "normal",
                        color: tabCatalogo === "medicamentos" ? "#3a6073" : "#888",
                        borderBottom: tabCatalogo === "medicamentos" ? "2px solid #3a6073" : "none",
                        marginBottom: "-2px",
                      }}
                    > Medicamentos</button>
                    <button
                      onClick={() => setTabCatalogo("servicios")}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0.75rem",
                        fontWeight: tabCatalogo === "servicios" ? "bold" : "normal",
                        color: tabCatalogo === "servicios" ? "#3a6073" : "#888",
                        borderBottom: tabCatalogo === "servicios" ? "2px solid #3a6073" : "none",
                        marginBottom: "-2px",
                      }}
                    >🩺 Servicios</button>
                  </>
                )}
              </div>

              {/* Tab: Accesorios */}
              {tabCatalogo === "accesorios" && (
                <div className="d-flex gap-1 f-wrap">
                  {ACCESORIOS_FIJOS.map(acc => (
                    <div key={acc.id} className="card p-1 br-1 shadow-sm" style={{ minWidth: "140px", flex: "1" }}>
                      <div className="fw-bold fs-0-9">{acc.nombre}</div>
                      <div style={{ color: "#6E8F6B" }} className="fw-bold">${acc.precioVenta.toFixed(2)}</div>
                      <button
                        className="btn btn-primary btn-xs mt-1 w-100"
                        onClick={() => agregarAlCarrito({ id: acc.id, nombre: acc.nombre, precio: acc.precioVenta, tipo: "accesorio" })}
                      >+ Agregar</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Medicamentos (solo admin) */}
              {tabCatalogo === "medicamentos" && esAdmin && (
                <div className="d-flex gap-1 f-wrap">
                  {medicamentos.map(med => {
                    const stock = stockDe(med.nombre);
                    const sinStock = stock === 0;
                    return (
                      <div
                        key={med.id}
                        className="card p-1 br-1 shadow-sm"
                        style={{ minWidth: "150px", flex: "1", opacity: sinStock ? 0.5 : 1 }}
                      >
                        <div className="fw-bold fs-0-9">{med.nombre}</div>
                        <div style={{ color: "#6E8F6B" }} className="fw-bold">${med.precioVenta.toFixed(2)}</div>
                        <div className="fs-0-8 text-muted">Stock: {stock} uds</div>
                        {stock <= 5 && stock > 0 && (
                          <div className="fs-0-8" style={{ color: "#E85C5C" }}>⚠️ Stock crítico</div>
                        )}
                        <button
                          className="btn btn-primary btn-xs mt-1 w-100"
                          disabled={sinStock}
                          onClick={() => agregarAlCarrito({ id: "med-" + med.id, nombre: med.nombre, precio: med.precioVenta, tipo: "medicamento" })}
                        >{sinStock ? "Agotado" : "+ Agregar"}</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab: Servicios (solo admin) */}
              {tabCatalogo === "servicios" && esAdmin && (
                <div className="d-flex gap-1 f-wrap">
                  {servicios.map(srv => (
                    <div key={srv.id} className="card p-1 br-1 shadow-sm" style={{ minWidth: "150px", flex: "1" }}>
                      <div className="fw-bold fs-0-9">{srv.nombre}</div>
                      <span className="badge secondary fs-0-8">{srv.categoria}</span>
                      <div style={{ color: "#6E8F6B" }} className="fw-bold mt-1">${srv.precio.toFixed(2)}</div>
                      <button
                        className="btn btn-primary btn-xs mt-1 w-100"
                        onClick={() => agregarAlCarrito({ id: "srv-" + srv.id, nombre: srv.nombre, precio: srv.precio, tipo: "servicio" })}
                      >+ Agregar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Columna derecha: carrito ── */}
          <div style={{ flex: "1", minWidth: "260px", position: "sticky", top: "1rem" }}>
            <div className="card shadow-sm br-1 p-2">
              <div className="fw-bold text-primary mb-1">Carrito</div>

              {carrito.length === 0 ? (
                <div className="text-center text-muted p-2" style={{ fontSize: "0.85rem" }}>
                  Agrega productos del catálogo para comenzar
                </div>
              ) : (
                <>
                  {carrito.map(item => (
                    <div
                      key={item.id}
                      className="d-flex j-cont-bet align-item mb-1 pb-1"
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold fs-0-9">{item.nombre}</div>
                        <div className="text-muted fs-0-8">
                          {item.tipo === "medicamento" ? "💊" : item.tipo === "servicio" ? "🩺" : "🎀"}
                          {" "}${item.precio.toFixed(2)} c/u
                        </div>
                      </div>
                      <div className="d-flex align-item gap-1">
                        <button
                          onClick={() => cambiarCantidad(item.id, -1)}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer", fontSize: "0.9rem" }}
                        >−</button>
                        <span className="fw-bold">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.id, 1)}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer", fontSize: "0.9rem" }}
                        >+</button>
                        <button
                          onClick={() => quitarDelCarrito(item.id)}
                          style={{ marginLeft: "4px", color: "#E85C5C", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
                        >✕</button>
                      </div>
                    </div>
                  ))}

                  <div
                    className="d-flex j-cont-bet fw-bold mt-1 pt-1"
                    style={{ borderTop: "2px solid #3a6073", fontSize: "1.1rem" }}
                  >
                    <span>Total</span>
                    <span style={{ color: "#6E8F6B" }}>${totalCarrito.toFixed(2)}</span>
                  </div>

                  <button
                    className="btn btn-primary w-100 mt-2"
                    onClick={procesarVenta}
                  >
                    Cobrar y generar ticket
                  </button>
                  <button
                    className="btn-outline-secondary btn-sm w-100 mt-1"
                    onClick={() => setCarrito([])}
                  >
                    Vaciar carrito
                  </button>
                </>
              )}

              {/* Info de fecha */}
              <div className="text-muted mt-2" style={{ fontSize: "0.75rem", borderTop: "1px dashed #ddd", paddingTop: "0.5rem" }}>
                {fechaHoy()}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}