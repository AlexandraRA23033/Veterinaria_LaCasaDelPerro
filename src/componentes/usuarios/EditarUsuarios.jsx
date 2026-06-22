import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { editarUsuario } from '../usuarios/usuariosService';
import { useAuth } from "../../context/AuthContext";

export default function EditarUsuario() {
    const { state }    = useLocation();
    const navigate     = useNavigate();
    const { usuario: usuarioLogueado } = useAuth();
    const usuario      = state?.usuario || usuarioLogueado;

    const [datos, setDatos] = useState({
        nombre_completo: usuario?.nombre_completo || "",
        telefono:        usuario?.telefono        || "",
        rol:             usuario?.rol             || "usuario",
    });
    const [guardando, setGuardando] = useState(false);
    const [error,     setError]     = useState("");
    const [exito,     setExito]     = useState(false);

    if (!usuario) {
        navigate("/dashboard-admin");
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'telefono') {
            const soloNumerosYGuiones = value.replace(/[^0-9-]/g, '');
            setDatos({ ...datos, [name]: soloNumerosYGuiones });
        } else {
            setDatos({ ...datos, [name]: value });
        }
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            await editarUsuario(usuario, datos, usuarioLogueado.rol);
            setExito(true);
            setTimeout(() => navigate("/dashboard-admin"), 1500);
        } catch (err) {
            console.error(err);
            setError("Error al guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    };

    return (
    <div className="container"> 
      <div className="d-flex align-item j-cont-bet mb-2">
        <h2 className="fs-2 fw-bold text-primary">Editar usuario</h2>
        <button
          className="btn-outline-secondary btn-ms"
          onClick={() => navigate('/Dashboard-admin/gestion')}
        >
          ← Volver
        </button>
      </div>

      <div className="row j-cont-cent">
        <div className="col-md-8 col-lg-6">
          <div className="card br-3 shadow-sm overflow-hidden">
            <div className="card-header card-primary">
              <div className="d-flex j-cont-bet align-item">
                <span className="fw-bold text-light"> Editar perfil</span>
                <span className="badge badge-pildora bg-light text-primary">
                  {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </div>

            <div className="card-body p-3">
              {error && (
                <aside className="danger alerta mb-3" role="alert">
                  {error}
                </aside>
              )}
              {exito && (
                <aside className="success alerta mb-3" role="alert">
                  Cambios guardados. Redirigiendo...
                </aside>
              )}

              <div className="secondary alerta mb-3 d-flex align-item">
                <span className="badge badge-pildora bg-secondary text-light">i</span>
                <span>El correo electrónico no puede modificarse ya que es el identificador del usuario.</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group mb-3">
                  <label className="label" htmlFor="correo">Correo electrónico</label>
                  <input
                    type="email"
                    id="correo"
                    className="input"
                    value={usuario.correo}
                    disabled
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="label" htmlFor="nombre_completo">Nombre completo</label>
                  <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    className="input"
                    placeholder="Nombre completo"
                    value={datos.nombre_completo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group mb-3">
                  <label className="label" htmlFor="telefono">Teléfono</label>
                  <input
                    type="text"
                    id="telefono"
                    name="telefono"
                    className="input"
                    placeholder="7000-0000"
                    value={datos.telefono}
                    onChange={handleChange}
                    pattern="[0-9-]*"
                    title="Solo se permiten números y guiones"
                  />
                  <p className="form-text">Solo números y guiones (ej. 7000-0000).</p>
                </div>

                {/* Esta parte esta funcional, pero se deshabilitara. No la vayan a borrar*/}
                {/*usuarioLogueado.rol === 'admin' ? (
                  <div className="form-group mb-3">
                    <label className="label" htmlFor="rol">Rol del usuario</label>
                    <select
                      id="rol"
                      name="rol"
                      className="input"
                      value={datos.rol}
                      onChange={handleChange}
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <p className="form-text">
                      Cambiar el rol a administrador le dará acceso total al sistema.
                    </p>
                  </div>
                ) : (
                  <div className="form-group mb-4">
                    <label className="label">Rol</label>
                    <input
                      type="text"
                      className="input"
                      value={usuario.rol}
                      disabled
                    />
                    <p className="form-text">No tienes permisos para cambiar el rol.</p>
                  </div>
                )*/}

                <div className="d-flex gap-1 mt-3">
                  <button
                    type="submit"
                    className="btn-primary btn-md"
                    disabled={guardando || exito}
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline-secondary btn-sm"
                    onClick={() => navigate('/Dashboard-admin/gestion')}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}