import Inicio from "./componentes/panel-control/Inicio";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import "./main.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import RutaProtegida from "./componentes/autenticacion/RutaProtegida";
import Login from "./componentes/autenticacion/Login";
import Registro from "./componentes/autenticacion/Registro";
import VerUsuario from "./componentes/usuarios/VerUsuarios";
import EditarUsuario from "./componentes/usuarios/EditarUsuarios";
import DashboardAdmin from "./componentes/panel-control/DashboardAdmin";
import Gestion from "./componentes/panel-control/Gestion";
import FormularioExpediente from "./componentes/mascotas/formularioExpediente";
import FormularioMascotas from "./componentes/mascotas/formularioMascotas";
import AgendarCita from "./componentes/citas/AgendarCita";
import VistaRapida from "./componentes/citas/VistaRapida";
import HistorialCitas from "./componentes/citas/HistorialCitas";
import VerMascotas from "./componentes/mascotas/VerMascotas";
import VerExpedienteMascota from "./componentes/mascotas/VerExpedienteMascota";
import EditarExpediente from "./componentes/mascotas/editarMascota";
import MisMascotas from "./componentes/usuarios/misMascotas";

import TablaInventario from "./componentes/inventario/TablaInventario";
import AlertaStock from "./componentes/inventario/AlertaStock";
import TablaServicios from "./componentes/inventario/TablaServicios";
import { obtenerProductosDB, obtenerLotesDB } from "./base-datos/configuracion";
import DashboardUsuario from "./componentes/panel-control/DashboardUsuario";
import PuntoDeVenta from "./componentes/ventas/puntoVenta";


function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarActive, setNavbarActive] = useState(false);
  const { usuario, logout } = useAuth();

  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);

  useEffect(() => {
    async function cargarInventarioBD() {
      try {
        const prodsBD = await obtenerProductosDB();
        const lotesBD = await obtenerLotesDB();
        setProductos(prodsBD);
        setLotes(lotesBD);
      } catch (error) {
        console.error("Error cargando inventario en App.jsx:", error);
      }
    }
    if (usuario) {
      cargarInventarioBD();
    }
  }, [usuario]);

  const navigate = useNavigate();
  const location = useLocation();

  // Rutas donde NO se muestra el sidebar
  const rutasSinSidebar = ["/", "/ingresar", "/registro"];
  const mostrarSidebar =
    usuario && !rutasSinSidebar.includes(location.pathname);

  //evalua si nos encontramos en la raiz de inicio
  const estaEnInicio = location.pathname === "/";

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
          
          {/**Seccion de accesos directos segun el rol (solo visibles en inicio) */}
          {usuario && estaEnInicio && (
            <>
              {usuario.rol === "admin" ? (
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goTo("/dashboard-admin");
                    }}
                  >
                    Panel de Administración
                  </a>
                </li>
              ) : (
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      goTo("/expedientes");
                    }}
                  >
                    Expediente
                  </a>
                </li>
              )}
            </>
          )}

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
          className={`sidebar-overlay ${sidebarOpen}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

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
                          goTo("/Dashboard-admin/gestion");
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
                          goTo("/Dashboard-admin/inventario");
                        }}
                      >
                        Inventario
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/Dashboard-admin/servicios");
                        }}
                      >
                        Servicios Veterinarios
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          goTo("/ventas");
                        }}
                      >
                        punto de venta
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
                          goTo("/mis-mascotas");
                        }}
                      >
                        Mis citas
                      </a>
                    </li>
                  </>
                )}
              </ul>
                 {/**--Seccion Acciones: solo para admin */}
              {usuario.rol === "admin" && (
                <>
                  <div className="sidebar-header">
                    <strong>Acciones</strong>
                  </div>
                  <div className="p-2">
                    <button 
                      className='btn-dark btn-block btn-md mb-2' 
                      onClick={() => goTo('/AgendaRapida')}
                      >
                      Agendar Cita
                    </button>
                    <button 
                      className='btn-dark btn-block btn-md mb-2' 
                      onClick={() => goTo('/historial')}>
                      Historial
                    </button>
                  </div>
                </>
              )}

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
            <Route
              path="/dashboard-admin"
              element={
                <RutaProtegida rolRequerido="admin">
                  <DashboardAdmin />
                </RutaProtegida>
              }
            />
            <Route
              path="/Dashboard-admin/gestion"
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
                <RutaProtegida>     
                  <FormularioMascotas />
                </RutaProtegida>
              }
            />
            <Route path="/mascotas/ver" element={
              <RutaProtegida rolRequerido="admin"><VerMascotas />
              </RutaProtegida>
            }/>
            <Route path="/mascotas/expediente" element={
              <RutaProtegida ><VerExpedienteMascota />    
              </RutaProtegida>
            }/>
            <Route path="/mascotas/editar" element={
              <RutaProtegida><EditarExpediente /> 
              </RutaProtegida>
            }/>
            <Route path="/ventas" element={
              <RutaProtegida><PuntoDeVenta /> 
              </RutaProtegida>
            }/>
            <Route
              path="/Dashboard-admin/inventario"
              element={
                <RutaProtegida rolRequerido="admin">
                  <div className="container mt-2">
                    <header className="mb-2">
                      <h2 className="fs-2 fw-bold text-primary">Panel de Inventario </h2>
                      <p className="text-muted"> Almacén de Inventario y Lotes </p>
                    </header>
                    <AlertaStock productos={productos} lotes={lotes} />
                    <TablaInventario productos={productos} lotes={lotes} />
                  </div>
                </RutaProtegida>
              }
            />
            <Route
              path="/Dashboard-admin/servicios"
              element={
                <RutaProtegida rolRequerido="admin">
                  <div className="container mt-2">
                    <TablaServicios />
                  </div>
                </RutaProtegida>
              }
            />
            <Route
              path="/expedientes"
              element={
                <RutaProtegida rolRequerido="usuario">
                  {/* <div className="container mt-3">
                    <h1>Mis mascotas</h1>
                  </div> */}
                  <DashboardUsuario />
                </RutaProtegida>
              }
            />
            <Route
              path="/citas"
              element={
                <RutaProtegida rolRequerido="admin">
                  <AgendarCita />
                </RutaProtegida>
              }
            />
                <Route
              path="/AgendaRapida"
              element={
                <RutaProtegida rolRequerido="admin">
                  <VistaRapida />
                </RutaProtegida>
              }
            />
            <Route
              path="/historial"
              element={
                <RutaProtegida rolRequerido="admin">
                  <HistorialCitas />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios/ver"
              element={
                <RutaProtegida rolRequerido="admin">
                  <VerUsuario />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios/editar"
              element={
                <RutaProtegida > 
                  <EditarUsuario />
                </RutaProtegida>
              }
            />
            <Route
              path="/mis-mascotas"
              element={
                <RutaProtegida > 
                  <MisMascotas />
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