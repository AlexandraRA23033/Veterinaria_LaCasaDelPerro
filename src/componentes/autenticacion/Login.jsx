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
  const [verPassword, setVerPassword] = useState(false);

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
    <div className="container mt-3">
      <div className="row j-cont-cent">
        <div className="col-md-9 col-lg-7">
          <div className="card shadow-sm br-3 overflow-hidden">
            <div className="row">
              <div className="col-md-6 bg-accent d-flex f-colum align-item j-cont-cent text-center p-3">
                <img src="/huellas-de-perro.png" alt="Huellas de perro" className="mb-2" />
                <h2 className="text-light fw-bold mt-3 mb-2">La Casa del Perro</h2>
                <div className="badge badge-pildora bg-warning text-dark mt-2 mb-2">Clínica Veterinaria</div>
                <p className="text-light">
                  Salud y bienestar para tus mascotas. Inicia sesión para gestionar tus citas.
                </p>
              </div>

              <div className="col-md-6 p-3">
                <header>
                  <h2 className="text-primary fs-2 mb-1">Iniciar sesión</h2>
                  <p className="text-muted">Ingresa tus credenciales para continuar</p>
                </header>

                {error && (
                  <aside className="danger alerta mb-4" role="alert">
                    {error}
                  </aside>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
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

                  <div className="form-group">
                    <label className="label" htmlFor="password-login">Contraseña</label>
                    <div className="d-flex gap-1 align-item">
                      <input
                        type={verPassword ? 'text' : 'password'}
                        id="password-login"
                        name="password"
                        className="input"
                        placeholder="••••••••"
                        onChange={handleChange}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn-outline-secondary btn-sm"
                        onClick={() => setVerPassword(!verPassword)}
                      >
                        {verPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-info btn-block btn-md"
                    disabled={cargando}
                  >
                    {cargando ? 'Verificando...' : 'Ingresar'}
                  </button>
                </form>

                <footer className="text-center">
                  <span className="text-muted">¿Aún no tienes cuenta? </span>
                  <button
                    type="button"
                    className="text-accent fw-bold"
                    onClick={() => navigate('/registro')}
                  >
                    Regístrate aquí
                  </button>
                </footer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;