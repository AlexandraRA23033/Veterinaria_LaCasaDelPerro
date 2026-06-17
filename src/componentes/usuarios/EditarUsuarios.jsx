import { useState, useEffect } from "react";
import {  useLocation, useNavigate } from "react-router-dom";
import { actualizarUsuario, configurarBD } from "../../base-datos/configuracion";
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

     //identificamis el rol de la persona que utiliza la pantalla actualmente
    const esAdmin = usuarioLogueado?.rol === "admin";
    const rutaRetorno = esAdmin ? "/dashboard-admin" : "/expedientes";

    useEffect(() =>{
        async function cargarDatosActualizadosDB() {

            const correoActivo = usuario?.correo || usuario?.email;
            if(!correoActivo) return;
            try{
                const db = await configurarBD();
                const usuarioDB = await db.get("usuarios", correoActivo);
                if(usuarioDB){
                    setDatos({
                        nombre_completo: usuarioDB.nombre_completo || "",
                        telefono: usuarioDB.telefono || "",
                        rol: usuarioDB.rol || "usuario"
                    });
                }
            }catch(err){
                console.error("Error al sincronizar formulario con IndexedDB:", err);
            }
            
        }
        cargarDatosActualizadosDB();
    }, [usuario]);

    if (!usuario) {
        //navigate(rutaRetorno);
        navigate("/ingresar");
        return null;
    }

   

    const handleChange = (e) => {
        setDatos({ ...datos, [e.target.name]: e.target.value });
        if (error) setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!datos.nombre_completo.trim()) {
            setError("El nombre no puede estar vacío.");
            return;
        }
        setGuardando(true);
        try {

            const correoActivo = usuario.correo || usuario.email;
            const usuarioActualizado ={
                ...usuario,
                correo: correoActivo,
                nombre_completo: datos.nombre_completo.trim(),
                telefono: datos.telefono.trim(),
                rol: esAdmin ? datos.rol : (usuario.rol || "usuario"),

            }; 
            await actualizarUsuario(usuarioActualizado);
            
            // ({
            //     ...usuario,
            //     nombre_completo: datos.nombre_completo.trim(),
            //     telefono:        datos.telefono.trim(),
            //     // Solo guarda el rol si quien edita es admin
            //     // rol: usuarioLogueado.rol === "admin" ? datos.rol : usuario.rol,
            //     //Seguridad: solo guarda el rol del select si quien edita es un admin
            //     rol: esAdmin ? datos.rol : usuario.rol,
            // });
            setExito(true);
            setTimeout(() => { navigate(rutaRetorno, {
                replace: true,
                state: {
                    correoUsuario: correoActivo,
                    nombreUsuario: usuarioActualizado.nombre_completo,
                    telefonoUsuario: usuarioActualizado.telefono
                }
            });
        }, 1500);
        } catch (err) {
            console.error(err);
            setError("Error al guardar los cambios.");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container mt-3">
            <div className="d-flex align-item mb-3">
                <button
                    className="btn-outline-secondary btn-sm"
                    onClick={() => navigate(rutaRetorno)}
                >
                    ← Volver
                </button>
                <h2 className="fs-2 fw-bold text-primary">Editar usuario</h2>
            </div>

            <div className="row">
                <div className="col-md-8">
                    <div className="card br-3 p-4">

                        {exito && (
                            <aside className="success alerta mb-3" role="alert">
                                 Cambios guardados. Redirigiendo...
                            </aside>
                        )}
                        {error && (
                            <aside className="danger alert mb-3" role="alert">
                                 {error}
                            </aside>
                        )}

                        <div className="secondary alerta mb-3">
                             El correo electrónico no puede modificarse ya que es el identificador del usuario.
                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="form-group mb-3">
                                <label className="label" htmlFor="correo">
                                    Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    id="correo"
                                    className="input"
                                    value={usuario.correo || usuario.email || ""}
                                    disabled
                                />
                            </div>

                            <div className="form-group mb-3">
                                <label className="label" htmlFor="nombre_completo">
                                    Nombre completo
                                </label>
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
                                <label className="label" htmlFor="telefono">
                                    Teléfono
                                </label>
                                <input
                                    type="text"
                                    id="telefono"
                                    name="telefono"
                                    className="input"
                                    placeholder="7000-0000"
                                    value={datos.telefono}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Cambio de rol: este SOLO esta visible para administradores */}
                            {usuarioLogueado.rol === "admin" ? (
                                <div className="form-group mb-3">
                                    <label className="label" htmlFor="rol">
                                        Rol del usuario
                                    </label>
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
                                <div className="form-group mb-3">
                                    <label className="label">Rol</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={usuario.rol}
                                        disabled
                                    />
                                    <p className="form-text">
                                        No tienes permisos para cambiar el rol.
                                    </p>
                                </div>
                            )}

                            <div className="d-flex">
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={guardando || exito}
                                >
                                    {guardando ? "Guardando..." : "Guardar cambios"}
                                </button>
                                <button
                                    type="button"
                                    className="btn-outline-secondary"
                                    onClick={() => navigate(rutaRetorno)}
                                >
                                    Cancelar
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}