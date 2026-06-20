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
  limpiarVentasDB,
} from "../../base-datos/configuracion";

import { restarStockPEPS } from "../inventario/LogicaPEPS";

function fechaHoy() {
  return new Date().toLocaleDateString("es-SV", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function horaAhora() {
  return new Date().toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function idTicket() {
  return "TKT-" + Date.now().toString().slice(-6);
}

const TIPOS_SIN_STOCK = ["servicio"];
const TABS = ["Medicamento", "Alimento", "Accesorio", "Higiene"];

export default function PuntoDeVenta() {
  const { usuario } = useAuth();
  const location = useLocation();

  const clientePre = location.state?.clientePreseleccionado ?? null;

  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [nombreCliente, setNombreCliente] = useState(clientePre?.nombre ?? "");
  const [nombreMascota, setNombreMascota] = useState(clientePre?.mascota ?? "");

  const [erroresCliente, setErroresCliente] = useState({});
  const [erroresCarrito, setErroresCarrito] = useState("");

  const [carrito, setCarrito] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [ticketActual, setTicketActual] = useState(null);
  const [vista, setVista] = useState("venta");
  const [tabCatalogo, setTabCatalogo] = useState("Medicamento");

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [modalMensaje, setModalMensaje] = useState("");
  const [modalAccion, setModalAccion] = useState(null);

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
        setProductos(prods);
        setLotes(ls);
        setServicios(servs.filter((s) => s.disponible));
        setHistorial(ventas.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error("Error cargando catálogo:", err);
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  function limpiarHistorial() {
    setModalMensaje(
      "¿Eliminar todo el historial de ventas? Esta acción no se puede deshacer.",
    );
    setModalAccion("limpiar");
    setModalConfirmacion(true);
  }

  function agregarAlCarrito(item) {
    setCarrito((prev) => {
      const existe = prev.find((c) => c.id === item.id);
      if (existe) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c,
        );
      }
      return [...prev, { ...item, cantidad: 1 }];
    });
    setErroresCarrito("");
  }

  function cambiarCantidad(id, delta) {
    setCarrito((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, cantidad: Math.max(1, c.cantidad + delta) } : c,
      ),
    );
    setErroresCarrito("");
  }

  function quitarDelCarrito(id) {
    setCarrito((prev) => prev.filter((c) => c.id !== id));
    setErroresCarrito("");
  }

  const totalCarrito = carrito.reduce((s, c) => s + c.precio * c.cantidad, 0);

  function requiereStock(tipo) {
    return !TIPOS_SIN_STOCK.includes(tipo?.toLowerCase());
  }

  function validarStock() {
    for (const item of carrito) {
      if (!requiereStock(item.tipo)) continue;
      const lotesItem = lotes.filter((l) => l.productoNombre === item.nombre);
      const stockDisp = calcularStockTotalPEPS(lotesItem);
      if (item.cantidad > stockDisp) {
        return `Stock insuficiente para "${item.nombre}". Disponible: ${stockDisp} uds.`;
      }
    }
    return null;
  }

  function validarFormulario() {
    const errores = {};
    let valido = true;

    if (!nombreCliente.trim()) {
      errores.nombreCliente = "El nombre del cliente es obligatorio.";
      valido = false;
    }

    if (carrito.length === 0) {
      setErroresCarrito("Agrega al menos un producto al carrito.");
      valido = false;
    }

    setErroresCliente(errores);
    return valido;
  }

  async function procesarVenta() {
    if (!validarFormulario()) return;

    const errorStock = validarStock();
    if (errorStock) {
      setErroresCarrito(errorStock);
      return;
    }

    setModalMensaje(
      `¿Confirmar venta para ${nombreCliente} por $${totalCarrito.toFixed(2)}?`,
    );
    setModalAccion("venta");
    setModalConfirmacion(true);
  }

  async function confirmarVenta() {
    setModalConfirmacion(false);

    try {
      let lotesActualizados = [...lotes];

      for (const item of carrito) {
        if (!requiereStock(item.tipo)) continue;

        const lotesItem = lotesActualizados
          .filter((l) => l.productoNombre === item.nombre)
          .sort((a, b) => a.ingreso.localeCompare(b.ingreso));

        const { lotesRestantes, error } = restarStockPEPS(
          lotesItem,
          item.cantidad,
        );
        if (error) {
          setErroresCarrito(error);
          return;
        }

        const idsOriginales = lotesItem.map((l) => l.id);
        const idsRestantes = lotesRestantes.map((l) => l.id);
        const idsAgotados = idsOriginales.filter(
          (id) => !idsRestantes.includes(id),
        );

        for (const id of idsAgotados) await eliminarLoteDB(id);
        for (const lote of lotesRestantes) await actualizarLoteDB(lote);

        lotesActualizados = lotesActualizados
          .filter((l) => !idsAgotados.includes(l.id))
          .map((l) => {
            const actualizado = lotesRestantes.find((r) => r.id === l.id);
            return actualizado ?? l;
          });
      }

      setLotes(lotesActualizados);

      const ticket = {
        id: idTicket(),
        timestamp: Date.now(),
        fecha: new Date().toLocaleDateString("es-SV"),
        hora: horaAhora(),
        cliente: nombreCliente.trim(),
        mascota: nombreMascota.trim() || "—",
        vendidoPor: usuario?.nombre_completo ?? "Administrador",
        items: carrito.map((c) => ({ ...c })),
        total: totalCarrito,
      };

      await guardarVentaDB(ticket);
      setHistorial((prev) => [ticket, ...prev]);
      setTicketActual(ticket);
      setCarrito([]);
      setNombreCliente("");
      setNombreMascota("");
      setErroresCliente({});
      setErroresCarrito("");
      setVista("ticket");
    } catch (err) {
      console.error("Error procesando venta:", err);
      setErroresCarrito("Ocurrió un error al procesar la venta.");
    }
  }

  function stockDe(nombreProd) {
    return calcularStockTotalPEPS(
      lotes.filter((l) => l.productoNombre === nombreProd),
    );
  }

  const porTipo = (tipo) =>
    productos.filter((p) => p.tipo?.toLowerCase() === tipo.toLowerCase());

  if (cargando)
    return (
      <div className="container mt-3 text-center">
        <p className="text-muted">Cargando catálogo de productos...</p>
      </div>
    );

  return (
    <div className="container mt-2">
      {modalConfirmacion && (
        <div className="modal is-open">
            <div className="modal-content">
            <div className="modal-header">
                <h3>{modalAccion === "limpiar" ? "Limpiar historial" : "Confirmar venta"}</h3>
                <button className="modal-close" onClick={() => setModalConfirmacion(false)}>✕</button>
            </div>
            <div className="modal-body">
                <p>{modalMensaje}</p>
            </div>
            <div className="modal-footer">
                <button className="btn-outline-secondary" onClick={() => setModalConfirmacion(false)}>
                Cancelar
                </button>
                <button
                className={modalAccion === "limpiar" ? "btn-alert" : "btn-primary"}
                onClick={modalAccion === "limpiar" ? async () => {
                    setModalConfirmacion(false);
                    await limpiarVentasDB();
                    setHistorial([]);
                } : confirmarVenta}
                >
                {modalAccion === "limpiar" ? "Sí, eliminar todo" : "Confirmar venta"}
                </button>
            </div>
            </div>
        </div>
        )}

      {/* Encabezado */}
      <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
        <div>
          <h2 className="fs-2 fw-bold text-primary">Punto de Venta</h2>
          <p className="text-muted">
            Atendido por: {usuario?.nombre_completo ?? "Administrador"}
          </p>
        </div>
        <div className="d-flex gap-1">
          {vista === "historial" && (
            <button className="btn-alert btn-sm" onClick={limpiarHistorial}>
              Limpiar historial
            </button>
          )}
          <button
            className={
              vista === "venta"
                ? "btn btn-primary btn-sm"
                : "btn-outline-secondary btn-sm"
            }
            onClick={() => setVista("venta")}
          >
            Nueva venta
          </button>
          <button
            className={
              vista === "historial"
                ? "btn btn-primary btn-sm"
                : "btn-outline-secondary btn-sm"
            }
            onClick={() => setVista("historial")}
          >
            Historial ({historial.length})
          </button>
        </div>
      </div>

      {/* TICKET */}
      {vista === "ticket" && ticketActual && (
        <div
          className="card shadow-sm br-1 p-3 mb-3"
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            border: "2px dashed #3a6073",
          }}
        >
          <div className="text-center mb-2">
            <h3 className="fw-bold text-primary">La Casa del Perro</h3>
            <p className="text-muted">7ª Av Sur #803, San Miguel</p>
            <div
              style={{
                borderTop: "1px dashed #aaa",
                marginTop: "0.5rem",
                paddingTop: "0.5rem",
              }}
            >
              <span className="fw-bold">{ticketActual.id}</span>
              <span className="text-muted mx-1">—</span>
              <span className="text-muted">
                {ticketActual.fecha} · {ticketActual.hora}
              </span>
            </div>
          </div>

          <div className="mb-2">
            <div>
              <span className="fw-bold">Cliente:</span> {ticketActual.cliente}
            </div>
            <div>
              <span className="fw-bold">Mascota:</span> {ticketActual.mascota}
            </div>
            <div>
              <span className="fw-bold">Atendido por:</span>{" "}
              {ticketActual.vendidoPor}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px dashed #aaa",
              borderBottom: "1px dashed #aaa",
              padding: "0.5rem 0",
              marginBottom: "0.75rem",
            }}
          >
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
                    <td style={{ textAlign: "right" }}>
                      ${item.precio.toFixed(2)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      ${(item.precio * item.cantidad).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="d-flex j-cont-bet fw-bold mb-2"
            style={{ fontSize: "1.1rem" }}
          >
            <span>TOTAL</span>
            <span style={{ color: "#6E8F6B" }}>
              ${ticketActual.total.toFixed(2)}
            </span>
          </div>

          <p className="text-center text-muted mb-2">¡Gracias por su visita!</p>

          <div className="d-flex gap-1 j-cont-cent">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setVista("venta")}
            >
              Nueva venta
            </button>
            <button
              className="btn-outline-secondary btn-sm"
              onClick={() => setVista("historial")}
            >
              Ver historial
            </button>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {vista === "historial" && (
        <div>
          {historial.length === 0 ? (
            <div className="alerta primary text-center">
              No hay ventas registradas aún.
            </div>
          ) : (
            <>
              <div className="row mb-3">
                <div className="col-md-4 mb-2">
                  <div className="card p-2 text-center shadow-sm br-1">
                    <div className="fs-2 fw-bold text-primary">
                      {historial.length}
                    </div>
                    <div className="text-muted">Ventas del día</div>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="card p-2 text-center shadow-sm br-1">
                    <div className="fs-2 fw-bold text-success">
                      ${historial.reduce((s, t) => s + t.total, 0).toFixed(2)}
                    </div>
                    <div className="text-muted">Total recaudado</div>
                  </div>
                </div>
                <div className="col-md-4 mb-2">
                  <div className="card p-2 text-center shadow-sm br-1">
                    <div className="fs-2 fw-bold text-info">
                      {historial.reduce(
                        (s, t) =>
                          s + t.items.reduce((a, i) => a + i.cantidad, 0),
                        0,
                      )}
                    </div>
                    <div className="text-muted">Productos vendidos</div>
                  </div>
                </div>
              </div>

              <div className="table-container shadow-sm br-1">
                <table className="table table-clara-primary table-bordered">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Hora</th>
                      <th>Cliente / Mascota</th>
                      <th>Items</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((t) => (
                      <tr key={t.id}>
                        <td className="fw-bold text-primary">{t.id}</td>
                        <td>{t.hora}</td>
                        <td>
                          <strong>{t.cliente}</strong>
                          {t.mascota !== "—" && (
                            <>
                              <br />
                              <span className="text-muted">{t.mascota}</span>
                            </>
                          )}
                        </td>
                        <td>
                          {t.items.map((it, i) => (
                            <div key={i} className="text-muted">
                              {it.cantidad}x {it.nombre}
                            </div>
                          ))}
                        </td>
                        <td className="text-right">
                          <strong className="text-success">
                            ${t.total.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <button
            className="btn btn-primary btn-sm mt-2"
            onClick={() => setVista("venta")}
          >
            ← Volver a ventas
          </button>
        </div>
      )}

      {/* VENTA PRINCIPAL */}
      {vista === "venta" && (
        <div className="row">
          <div className="col-lg-8 col-md-7">
            <div className="card shadow-sm br-1 p-2 mb-2">
              <div className="fw-bold text-primary mb-1">Datos del cliente</div>
              <div className="row">
                <div className="col-md-6 mb-1">
                  <div className="form-group">
                    <label className="label fw-bold text-secondary">
                      Nombre del cliente *
                    </label>
                    <input
                      type="text"
                      className={`input ${erroresCliente.nombreCliente ? "input-invalid" : ""}`}
                      placeholder="Ej: María López"
                      value={nombreCliente}
                      onChange={(e) => {
                        setNombreCliente(e.target.value);
                        if (erroresCliente.nombreCliente) {
                          setErroresCliente({});
                        }
                      }}
                    />
                    {erroresCliente.nombreCliente && (
                      <span className="form-text error">
                        {erroresCliente.nombreCliente}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-md-6 mb-1">
                  <div className="form-group">
                    <label className="label fw-bold text-secondary">
                      Nombre de la mascota
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Max (opcional)"
                      value={nombreMascota}
                      onChange={(e) => setNombreMascota(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {erroresCarrito && (
              <div className="alerta danger mb-2">{erroresCarrito}</div>
            )}

            {/* Catálogo */}
            <div className="card shadow-sm br-1 p-2">
              <div className="fw-bold text-primary mb-1">Catálogo</div>

              <div className="d-flex gap-1 mb-2 f-wrap">
                {TABS.map((t) => (
                  <button
                    key={t}
                    className={
                      tabCatalogo === t
                        ? "btn btn-primary btn-sm"
                        : "btn-outline-secondary btn-sm"
                    }
                    onClick={() => setTabCatalogo(t)}
                  >
                    {t}s
                  </button>
                ))}
                <button
                  className={
                    tabCatalogo === "servicios"
                      ? "btn btn-primary btn-sm"
                      : "btn-outline-secondary btn-sm"
                  }
                  onClick={() => setTabCatalogo("servicios")}
                >
                  Servicios
                </button>
              </div>

              {tabCatalogo !== "servicios" &&
                (() => {
                  const lista = porTipo(tabCatalogo);
                  if (lista.length === 0)
                    return (
                      <div className="alerta primary text-center">
                        No hay productos de tipo "{tabCatalogo}" registrados en
                        el inventario.
                      </div>
                    );
                  return (
                    <div className="row">
                      {lista.map((prod) => {
                        const tipoNorm =
                          prod.tipo?.toLowerCase() ?? "medicamento";
                        const usaStock = requiereStock(tipoNorm);
                        const stock = usaStock ? stockDe(prod.nombre) : null;
                        const sinStock = usaStock && stock === 0;

                        return (
                          <div key={prod.id} className="col-md-4 col-sm-6 mb-2">
                            <div
                              className={`card p-1 br-1 shadow-sm ${sinStock ? "card-muted" : ""}`}
                            >
                              <div className="fw-bold">{prod.nombre}</div>
                              <span className="badge info">{prod.tipo}</span>
                              <div className="text-success fw-bold mt-1">
                                ${prod.precioVenta.toFixed(2)}
                              </div>

                              {usaStock && (
                                <div className="text-muted">
                                  Stock: {stock} uds
                                  {stock <= 5 && stock > 0 && (
                                    <span className="text-alert">
                                      {" "}
                                      — crítico
                                    </span>
                                  )}
                                </div>
                              )}

                              <button
                                className="btn btn-primary btn-sm w-100 mt-1"
                                disabled={sinStock}
                                onClick={() =>
                                  agregarAlCarrito({
                                    id: "prod-" + prod.id,
                                    nombre: prod.nombre,
                                    precio: prod.precioVenta,
                                    tipo: tipoNorm,
                                  })
                                }
                              >
                                {sinStock ? "Agotado" : "+ Agregar"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

              {tabCatalogo === "servicios" && (
                <div className="row">
                  {servicios.length === 0 ? (
                    <div className="alerta primary text-center col-12">
                      No hay servicios disponibles.
                    </div>
                  ) : (
                    servicios.map((srv) => (
                      <div key={srv.id} className="col-md-4 col-sm-6 mb-2">
                        <div className="card p-1 br-1 shadow-sm">
                          <div className="fw-bold">{srv.nombre}</div>
                          <span className="badge secondary">
                            {srv.categoria}
                          </span>
                          <div className="text-success fw-bold mt-1">
                            ${srv.precio.toFixed(2)}
                          </div>
                          <button
                            className="btn btn-primary btn-sm w-100 mt-1"
                            onClick={() =>
                              agregarAlCarrito({
                                id: "srv-" + srv.id,
                                nombre: srv.nombre,
                                precio: srv.precio,
                                tipo: "servicio",
                              })
                            }
                          >
                            + Agregar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Carrito */}
          <div className="col-lg-4 col-md-5">
            <div className="card shadow-sm br-1 p-2">
              <div className="fw-bold text-primary mb-1">Carrito</div>

              {carrito.length === 0 ? (
                <div className="text-center text-muted p-2">
                  Agrega productos del catálogo para comenzar
                </div>
              ) : (
                <>
                  {carrito.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex j-cont-bet align-item mb-1 pb-1"
                    >
                      <div className="flex-1">
                        <div className="fw-bold">{item.nombre}</div>
                        <div className="text-muted">
                          ${item.precio.toFixed(2)} c/u
                        </div>
                        <span className="badge secondary">{item.tipo}</span>
                      </div>
                      <div className="d-flex align-item gap-1">
                        <button
                          className="btn-outline-secondary btn-sm"
                          onClick={() => cambiarCantidad(item.id, -1)}
                        >
                          −
                        </button>
                        <span className="fw-bold">{item.cantidad}</span>
                        <button
                          className="btn-outline-secondary btn-sm"
                          onClick={() => cambiarCantidad(item.id, 1)}
                        >
                          +
                        </button>
                        <button
                          className="btn-outline-alert btn-sm"
                          onClick={() => quitarDelCarrito(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  <hr className="my-1" />

                  <div className="d-flex j-cont-bet fw-bold">
                    <span>Total</span>
                    <span className="text-success">
                      ${totalCarrito.toFixed(2)}
                    </span>
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

              <div className="text-muted mt-2">{fechaHoy()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
