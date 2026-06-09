import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarUsuario, buscarUsuario } from '../../base-datos/configuracion';

const Registro = () => {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({
    nombre_completo: '',
    correo: '',
    telefono: '',
    password: '',
    rol: 'usuario'
  });
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleInputChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!datos.correo.endsWith('@ues.edu.sv') && !datos.correo.endsWith('.com')) {
      setError('Solo se permiten correos @ues.edu.sv o .com');
      return;
    }
    if (datos.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setCargando(true);
    try {
      const existente = await buscarUsuario(datos.correo);
      if (existente) { setError('Este correo ya está registrado.'); return; }
      await registrarUsuario(datos);
      setExito(true);
      setTimeout(() => navigate('/ingresar'), 2000);
    } catch (err) {
      console.error(err);
      setError('Error de conexión con la base de datos.');
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
        {/* Panel decorativo */}
        <figure
          className="hide-mobile"
          style={{
            flex: '1',
            margin: '0',
            backgroundImage: 'url("https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=1000&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '560px'
          }}
        />

        {/* Formulario */}
        <div style={{ flex: '1', padding: '3rem 2.5rem' }}>
          <header style={{ marginBottom: '1.75rem' }}>
            <h2 className="text-accent" style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
              Crear cuenta
            </h2>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>
              Registra tus datos para gestionar a tus mascotas
            </p>
          </header>

          {error && (
            <aside className="danger alerta mb-3" role="alert">⚠️ {error}</aside>
          )}
          {exito && (
            <aside className="success alerta mb-3" role="alert">
              ✅ ¡Cuenta creada! Redirigiendo al login...
            </aside>
          )}

          <form onSubmit={handleSubmit}>
            <fieldset style={{ border: 'none', padding: '0', margin: '0' }}>
              <div className="form-group mb-3">
                <label className="label" htmlFor="nombre_completo">Nombre completo</label>
                <input type="text" id="nombre_completo" name="nombre_completo"
                  className="input" placeholder="Ana García López"
                  onChange={handleInputChange} required />
              </div>

              <div className="form-group mb-3">
                <label className="label" htmlFor="correo">Correo electrónico</label>
                <input type="email" id="correo" name="correo"
                  className="input" placeholder="ejemplo@ues.edu.sv"
                  onChange={handleInputChange} required />
              </div>

              <div className="form-group mb-3">
                <label className="label" htmlFor="telefono">Teléfono</label>
                <input type="text" id="telefono" name="telefono"
                  className="input" placeholder="7000-0000"
                  onChange={handleInputChange} required />
              </div>

              <div className="form-group mb-4">
                <label className="label" htmlFor="password">Contraseña</label>
                <input type="password" id="password" name="password"
                  className="input" placeholder="Mínimo 6 caracteres"
                  onChange={handleInputChange} required />
              </div>
            </fieldset>

            <button
              type="submit"
              className="btn-primary btn-block shadow-md"
              style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}
              disabled={cargando || exito}
            >
              {cargando ? 'Creando cuenta...' : 'Registrarse'}
            </button>
          </form>

          <footer style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.88rem' }}>
            <span className="text-muted">¿Ya tienes cuenta? </span>
            <button
              type="button"
              className="text-accent fw-bold"
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.88rem' }}
              onClick={() => navigate('/ingresar')}
            >
              Inicia sesión
            </button>
          </footer>
        </div>
      </article>
    </section>
  );
};

export default Registro;