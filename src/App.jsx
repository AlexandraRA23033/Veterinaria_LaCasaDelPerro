import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './main.css';
// Arriba de todo, junto a los otros imports
import Login from './componentes/autenticacion/Login';


// Creamos un componente interno para poder usar useNavigate
function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarActive, setNavbarActive] = useState(false);
  const navigate = useNavigate(); // Herramienta para navegar por código

  // ESTA FUNCIÓN ES LA CLAVE:
  // Primero cierra todo, y LUEGO te mueve de página manualmente.
  const goTo = (path) => {
    setSidebarOpen(false);
    setNavbarActive(false);
    document.body.style.overflow = "auto";
    navigate(path); // Navega instantáneamente
  };

  return (
    <div className="bg-claro" style={{ minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav className="navbar--primary">
        <span className="nav-brand"> La Casa del Perro</span>
        <button 
          className={`nav-toggle ${navbarActive ? 'is-active' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setNavbarActive(!navbarActive);
          }}
        >
          &#9776;
        </button>
        <ul className={`nav-menu ${navbarActive ? 'is-active' : ''}`}>
          <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/'); }}>Inicio</a></li>
          <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/ingresar'); }}>Login</a></li>

        </ul>
      </nav>

      {/* OVERLAY */}
      <div 
        className={`sidebar-overlay ${sidebarOpen }`} 
        onClick={() => { setSidebarOpen(false); setNavbarActive(false); }}
      ></div>

      <div className="main-wrapper has-navbar">
        {/* SIDEBAR */}
        <aside className={`sidebar-main sidebar-secondary ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="sidebar-header">Menú Principal</div>
          <ul className="sidebar-menu">
            <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/expedientes'); }}>Mascotas</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/citas'); }}>Citas</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/inventario'); }}>Inventario</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); goTo('/dashboard'); }}>Estadísticas</a></li>
          </ul>
        </aside>

        {/* BOTÓN TOGGLE SIDEBAR */}
        <button 
          className={`sidebar-toggle-btn ${sidebarOpen ? 'is-open' : ''}`} 
          onClick={(e) => {
            e.preventDefault();
            setSidebarOpen(!sidebarOpen);
          }}
        >
          &#9776;
        </button>

        <main className="main-content">
          <div className="container">
            <Routes>
              <Route path="/" element={<div className="card card-light"><div className="card-body"><h1>Inicio</h1><p>¡Dime si ahora sí cambia al primer clic!</p></div></div>} />
              <Route path="/expedientes" element={<h1>Módulo Mascotas</h1>} />
              <Route path="/citas" element={<h1>Módulo Citas</h1>} />
              <Route path="/inventario" element={<h1>Módulo Inventario</h1>} />
              <Route path="/dashboard" element={<h1>Módulo Estadísticas</h1>} />
              <Route path="/ingresar" element={<Login />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

// El componente principal solo envuelve todo en el Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;