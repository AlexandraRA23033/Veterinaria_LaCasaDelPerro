import Inicio from "./componentes/panel-control/Inicio";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useState } from "react";
import "./main.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaProtegida from "./componentes/autenticacion/RutaProtegida";
import Login from "./componentes/autenticacion/Login";
import Registro from "./componentes/autenticacion/Registro";
import DashboardAdmin from "./componentes/panel-control/DashboardAdmin";
import Gestion from "./componentes/panel-control/Gestion";
import FormularioExpediente from "./componentes/mascotas/formularioExpediente"; // ← import correcto
import FormularioMascotas from "./componentes/mascotas/formularioMascotas"; // ← import correcto
import AgendarCita from "./componentes/citas/AgendarCita";
//import EstadoCita from "./componentes/citas/EstadoCita";
//import ListaCitas from "./componentes/citas/ListaCitas";
import VerMascotas from "./componentes/mascotas/VerMascotas";



//  Importaciones del Inventario Inteligente PEPS ──
import TablaInventario from "./componentes/inventario/TablaInventario";
import AlertaStock from "./componentes/inventario/AlertaStock";
import { restarStockPEPS } from "./componentes/inventario/LogicaPEPS";
import { obtenerProductosDB, obtenerLotesDB, actualizarLoteDB, eliminarLoteDB } from "./configuracion";


function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarActive, setNavbarActive] = useState(false);
  const { usuario, logout } = useAuth();


  // Estados dinámicos vinculados a IndexedDB ──
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [insumoSeleccionado, setInsumoSeleccionado] = useState("");
  const [cantidadUsada, setCantidadUsada] = useState(1);

  // Cargar registros automáticamente desde IndexedDB al abrir la App
  useEffect(() => {
    const cargarDatosInventario = async () => {
      try {
        const prodsDB = await obtenerProductosDB();
        const lotesDB = await obtenerLotesDB();
        setProductos(prodsDB);
        setLotes(lotesDB);
        if (prodsDB.length > 0) {
          setInsumoSeleccionado(prodsDB[0].nombre);
        }
      } catch (err) {
        console.error("Error al cargar datos del inventario desde IndexedDB", err);
      }
    };
    cargarDatosInventario();
  }, []);

  // Algoritmo Operativo PEPS para el descuento automatizado en la base de datos
  const manejarCitaCompletada = async (e) => {
    e.preventDefault();
    const cantidad = parseInt(cantidadUsada);

    const lotesDelProducto = lotes.filter(l => l.productoNombre === insumoSeleccionado);
    const lotesOriginalesProducto = [...lotesDelProducto];

    const { lotesRestantes, error } = restarStockPEPS(lotesDelProducto, cantidad);

    if (error) {
      alert(`❌ Error operativo: ${error}`);
      return;
    }

    try {
      for (let loteOrig of lotesOriginalesProducto) {
        const loteActualizado = lotesRestantes.find(l => l.id === loteOrig.id);
        if (!loteActualizado) {
          await eliminarLoteDB(loteOrig.id);
        } else if (loteActualizado.cantidad !== loteOrig.cantidad) {
          await actualizarLoteDB(loteActualizado);
        }
      }

      const lotesActualizadosDB = await obtenerLotesDB();
      setLotes(lotesActualizadosDB);

      alert(`✅ Cita Procesada:\nSe han deducido ${cantidad} unidades de "${insumoSeleccionado}" de la BD local aplicando PEPS.`);
    } catch (dbErr) {
      alert("Error al guardar cambios en IndexedDB");
    }
  };


  const navigate = useNavigate();
  const location = useLocation();

  // Rutas donde NO se muestra el sidebar
  const rutasSinSidebar = ["/", "/ingresar", "/registro"];
  const mostrarSidebar =
    usuario && !rutasSinSidebar.includes(location.pathname);

  const goTo = (path) => {
    setSidebarOpen(false);
    setNavbarActive(false);
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    goTo("/ingresar");
  };

  return (
    <>
      {/* ── NAVBAR ── */}
      <nav className="navbar--dark">
        <h3
          className="nav-brand text-light"
          onClick={() => goTo("/")}
          style={{ cursor: "pointer" }}
        >
          🐾 La Casa del Perro
          <span className="badge badge-pildora bg-light text-primary ml-2">
            Veterinaria
          </span>
        </h3>
        <button
          className={`nav-toggle ${navbarActive ? "is-active" : ""}`}
          onClick={() => setNavbarActive(!navbarActive)}
        >
          ☰
        </button>
        <ul className={`nav-menu ${navbarActive ? "is-active" : ""}`}>
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goTo("/");
              }}
            >
              Inicio
            </a>
          </li>
          {!usuario ? (
            <>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo("/ingresar");
                  }}
                >
                  Iniciar sesión
                </a>
              </li>
              <li>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goTo("/registro");
                  }}
                >
                  Registrarse
                </a>
              </li>
            </>
          ) : (
            <li>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                className="text-light fw-bold"
              >
                Cerrar sesión ({usuario.nombre_completo?.split(" ")[0]})
              </a>
            </li>
          )}
        </ul>
      </nav>
      {mostrarSidebar && (
        <div
          className={`sidebar-overlay ${sidebarOpen ? "is-active" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LAYOUT ── */}
      <div className={mostrarSidebar ? "main-wrapper has-navbar" : ""}>
        {mostrarSidebar && (
          <>
            <aside
              className={`sidebar-main sidebar-secondary ${sidebarOpen ? "is-open" : ""}`}
            >
              <header className="sidebar-header">
                <strong>Menú</strong> —{" "}
                {usuario.rol === "admin" ? "Administrador" : "Cliente"}
              </header>
              <ul className="sidebar-menu">
                {usuario.rol === "admin" ? (
                  <>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/dashboard-admin");
                        }}
                      >
                        Panel de control
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/gestion");
                        }}
                      >
                        Gestión
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/inventario");
                        }}
                      >
                        Inventario
                      </a>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/expedientes");
                        }}
                      >
                        Mis mascotas
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/citas");
                        }}
                      >
                        Mis citas
                      </a>
                    </li>
                  </>
                )}
              </ul>
            </aside>
            <button
              className={`sidebar-toggle-btn ${sidebarOpen ? "is-open" : ""}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "✕" : "☰"}
            </button>
          </>
        )}

        <main className={mostrarSidebar ? "main-content" : ""}>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Inicio />} />
            <Route path="/ingresar" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            {/* Admin */}
            <Route
              path="/dashboard-admin"
              element={
                <RutaProtegida rolRequerido="admin">
                  <DashboardAdmin />
                </RutaProtegida>
              }
            />
            <Route
              path="/gestion"
              element={
                <RutaProtegida rolRequerido="admin">
                  <Gestion />
                </RutaProtegida>
              }
            />
            <Route
              path="/nuevo-expediente"
              element={
                <RutaProtegida rolRequerido="admin">
                  <FormularioExpediente />
                </RutaProtegida>
              }
            />
            <Route
              path="/mascotas/formularioMascotas"
              element={
                <RutaProtegida rolRequerido="admin">
                  <FormularioMascotas />
                </RutaProtegida>
              }
            />
            

            <Route path="/mascotas/ver" element={
              <RutaProtegida rolRequerido="admin"><VerMascotas />
              </RutaProtegida>
            }/>
            {/* Ruta del panel e interfaz del Inventario Inteligente PEPS */}
            <Route
              path="/inventario"
              element={
                <RutaProtegida rolRequerido="admin">
                  <div style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto' }}>
                    <header style={{ marginBottom: '25px' }}>
                      <h2 style={{ color: '#4E5748', marginBottom: '5px' }}>Panel de Inventario Inteligente</h2>
                      <p style={{ color: '#B8B2A0', margin: 0, fontSize: '14px' }}>Gestión de Almacén Médica Vinculada a IndexedDB</p>
                    </header>

                    <AlertaStock productos={productos} lotes={lotes} />

                    <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginTop: '15px' }}>
                      <div style={{ flex: '2', minWidth: '350px' }}>
                        <TablaInventario productos={productos} lotes={lotes} />
                      </div>

                      <div style={{ flex: '1', minWidth: '280px' }}>
                        <div className="form">
                          <h3 style={{ color: '#2F332B', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>Simulador: Descuento PEPS</h3>
                          <form onSubmit={manejarCitaCompletada}>
                            <div className="form-group">
                              <label className="label">Medicamento Utilizado:</label>
                              <select className="select" value={insumoSeleccionado} onChange={(e) => setInsumoSeleccionado(e.target.value)}>
                                {productos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="label">Cantidad Utilizada:</label>
                              <input type="number" className="input" min="1" value={cantidadUsada} onChange={(e) => setCantidadUsada(e.target.value)} />
                            </div>
                            <button type="submit" className="input" style={{ backgroundColor: '#4E5748', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px', width: '100%' }}>
                              Simular Resta en Cita
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </RutaProtegida>
              }
            />
            {/* Usuario */}
            <Route
              path="/expedientes"
              element={
                <RutaProtegida rolRequerido="usuario">
                  <div className="container mt-3">
                    <h1>Mis mascotas</h1>
                  </div>
                </RutaProtegida>
              }
            />
            <Route
              path="/citas"
              element={
                <RutaProtegida rolRequerido="admin">
                  <AgendarCita/>
                </RutaProtegida>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
