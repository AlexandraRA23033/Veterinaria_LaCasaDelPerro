import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarUsuario } from '../../base-datos/configuracion';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [datos, setDatos] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const user = await buscarUsuario(datos.correo);
      if (user && user.password === datos.password) {
        login(user);
        navigate(user.rol === 'admin' ? '/dashboard-admin' : '/expedientes');
      } else {
        setError('Correo o contraseña incorrectos.');
      }
    } catch {
      setError('Error al conectar con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'linear-gradient(135deg, #EFEBCE 0%, #D8A39D33 100%)'
      }}
    >
      <article
        className="card card-light shadow-lg"
        style={{
          display: 'flex',
          flexDirection: 'row',
          maxWidth: '820px',
          width: '100%',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px'
        }}
      >
        {/* Panel izquierdo decorativo */}
        <div
          className="bg-primary"
          style={{
            flex: '1',
            background: 'linear-gradient(160deg, #BB8588 0%, #D8A39D 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem 2rem',
            minHeight: '420px'
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🐾</div>
          <h2
            className="text-light"
            style={{ fontFamily: 'Georgia, serif', textAlign: 'center', fontSize: '1.6rem', marginBottom: '0.75rem' }}
          >
            La Casa del Perro
          </h2>
          <p className="text-light" style={{ textAlign: 'center', opacity: 0.85, fontSize: '0.9rem', lineHeight: '1.6' }}>
            Salud y bienestar para tus mascotas. Inicia sesión para gestionar tus citas.
          </p>
        </div>

        {/* Panel derecho: formulario */}
        <div style={{ flex: '1', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <header style={{ marginBottom: '2rem' }}>
            <h2 className="text-accent" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              Iniciar sesión
            </h2>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              Ingresa tus credenciales para continuar
            </p>
          </header>

          {error && (
            <aside className="danger alerta mb-3" role="alert">
              ⚠️ {error}
            </aside>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group mb-3">
              <label className="label" htmlFor="correo-login">Correo electrónico</label>
              <input
                type="email"
                id="correo-login"
                name="correo"
                className="input"
                placeholder="ejemplo@ues.edu.sv"
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group mb-4">
              <label className="label" htmlFor="password-login">Contraseña</label>
              <input
                type="password"
                id="password-login"
                name="password"
                className="input"
                placeholder="••••••••"
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-block shadow-md"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              disabled={cargando}
            >
              {cargando ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          <footer style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
            <span className="text-muted">¿Aún no tienes cuenta? </span>
            <button
              type="button"
              className="text-accent fw-bold"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.88rem' }}
              onClick={() => navigate('/registro')}
            >
              Regístrate aquí
            </button>
          </footer>
        </div>
      </article>
    </section>
  );
};

export default Login;