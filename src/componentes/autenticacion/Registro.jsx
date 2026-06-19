import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearUsuario } from '../usuarios/usuariosService';
// Función que evalúa la seguridad de la contraseña (Luego investigo como quitar el error de la tipografia)
const evaluarPassword = (password) => {
  if (!password) return null;
  const criterios = {
    longitud: password.length >= 8,
    mayuscula: /[A-Z]/.test(password),
    numero: /[0-9]/.test(password),
    especial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const puntos = Object.values(criterios).filter(Boolean).length;

  if (password.length < 6) return { nivel: 'invalida', texto: 'Muy corta — mínimo 6 caracteres', clase: 'danger' };
  if (puntos <= 1)         return { nivel: 'baja',     texto: 'Seguridad baja',   clase: 'danger'  };
  if (puntos === 2)        return { nivel: 'media',    texto: 'Seguridad media',  clase: 'warning' };
  if (puntos === 3)        return { nivel: 'alta',     texto: 'Seguridad alta',   clase: 'success' };
  if (puntos === 4)        return { nivel: 'fuerte',   texto: 'Contraseña fuerte ', clase: 'success' };

  return null;
};

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
  const [seguridad, setSeguridad] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    //Filtro nombre: solo letras, acentos, eñes y espacios
    if(name === 'nombre_completo'){
      const reglaLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if(!reglaLetras.test(value)) return;
    }
    //Filtro telefono: solo nuemros y un único guion y no debe pasar de 8 numeros
    if(name === 'telefono'){
      const reglaTel = /^[0-9]*[-]?[0-9]*$/;
      if(!reglaTel.test(value)) return;
      //solo permite 8 digitos + 1 guion = 9 caracteres
      if(value.length >9 )return;
    }

    //Si pasa los filtros, actualiza el useState
    setDatos({ ...datos, [name]: value });
    if (error) setError('');
    if (name === 'password') {
      setSeguridad(evaluarPassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //inspeccion del correo .sv o .com
    const correoLimpio = datos.correo.toLowerCase().trim();
    if (!correoLimpio.endsWith('.sv') && !correoLimpio.endsWith('.com')) {
      setError('Solo se permiten correos que terminen en .sv o .com');
      return;
    }
    // if (datos.password.length < 6) {
    //   setError('La contraseña debe tener al menos 6 caracteres.');
    //   return;
    // }
    setCargando(true);
    try {
      await crearUsuario({ ...datos, correo: correoLimpio});
      setExito(true);
      setTimeout(() =>  navigate('/ingresar'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mt-3">
      <div className="row j-cont-cent">
        <div className="col-md-9 col-lg-7">
          <div className="card br-3 overflow-hidden">
            <div className="row">

              <div className="col-md-6">
                <img
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop"
                  alt="Perro tierno"
                  className="d-block br-2 img-fluid"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div className="col-md-6 p-3">
                <header>
                  <h2 className="text-accent fs-2 mb-1">Crear cuenta</h2>
                  <p className="text-muted">Registra tus datos para gestionar a tus mascotas</p>
                </header>

                {error && (
                  <aside className="danger alerta mb-2" role="alert">
                     {error}
                  </aside>
                )}
                {exito && (
                  <aside className="success alerta mb-2" role="alert">
                     ¡Cuenta creada! Redirigiendo...
                  </aside>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="label" htmlFor="nombre_completo">Nombre completo</label>
                    <input
                      type="text"
                      id="nombre_completo"
                      name="nombre_completo"
                      className="input"
                      placeholder="Ana García López"
                      value={datos.nombre_completo} //enlace de control React
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="correo">Correo electrónico</label>
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      className="input"
                      placeholder="ejemplo@ues.edu.sv"
                      value={datos.correo} 
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="telefono">Teléfono</label>
                    <input
                      type="text"
                      id="telefono"
                      name="telefono"
                      className="input"
                      placeholder="7000-0000"
                      value={datos.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="password">Contraseña</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="input"
                      placeholder="Mínimo 6 caracteres"
                      value={datos.password}
                      onChange={handleInputChange}
                      required
                    />

                    {/* Medidor de seguridad */}
                    {seguridad && (
                      <aside className={`${seguridad.clase} alerta mt-1`} role="status">
                        {seguridad.texto}
                      </aside>
                    )}

                    {seguridad && seguridad.nivel !== 'fuerte' && datos.password.length >= 6 && (
                      <div className="mt-1">
                        <p className="text-muted fs-small mb-1">Para mejorar tu contraseña agrega:</p>
                        {datos.password.length < 8 && (
                          <span className="warning badge mb-1">+ 8 caracteres</span>
                        )}
                        {!/[A-Z]/.test(datos.password) && (
                          <span className="warning badge mb-1">+ Mayúscula</span>
                        )}
                        {!/[0-9]/.test(datos.password) && (
                          <span className="warning badge mb-1">+ Número</span>
                        )}
                        {!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(datos.password) && (
                          <span className="warning badge mb-1 ">+ Símbolo (!@#...)</span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn-primary btn-block btn-md"
                    disabled={cargando || exito || seguridad?.nivel === 'invalida'}
                  >
                    {cargando ? 'Creando cuenta...' : 'Registrarse'}
                  </button>
                </form>

                <footer className="text-center mt-2">
                  <span className="text-muted">¿Ya tienes cuenta? </span>
                  <button
                    type="button"
                    className="text-accent fw-bold"
                    onClick={() => navigate('/ingresar')}
                  >
                    Inicia sesión
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

export default Registro;