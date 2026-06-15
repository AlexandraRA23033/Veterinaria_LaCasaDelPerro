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
import VerUsuario from "./componentes/usuarios/VerUsuarios";
import EditarUsuario from "./componentes/usuarios/EditarUsuarios";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarActive, setNavbarActive] = useState(false);
  const { usuario, logout } = useAuth();
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
          className={`sidebar-overlay ${sidebarOpen}`}
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
            <Route
              path="/mascotas/ver"
              element={
                <RutaProtegida rolRequerido="admin">
                  <VerMascotas />
                </RutaProtegida>
              }
            />
            <Route
              path="/inventario"
              element={
                <RutaProtegida rolRequerido="admin">
                  <div className="container mt-3">
                    <h1>Inventario</h1>
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
                  <AgendarCita />
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
                <RutaProtegida rolRequerido="admin">
                  <EditarUsuario />
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
