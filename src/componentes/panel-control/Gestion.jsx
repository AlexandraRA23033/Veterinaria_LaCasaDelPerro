import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { configurarBD } from "../../base-datos/configuracion";

const BADGE_ESPECIE = {perro: "info", gato: "warning", conejo: "success", otro: "secondary"};

function ModalMascotas({usuario, onCerrar, onActualizar}){
    const navigate = useNavigate(); //inicalizamos el hook para cambiar de ruta
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [mascotaElim, setMascotaElim] = useState(null);

    useEffect(() =>{
        if(!usuario) return;

        async function cargarMascotas() {
        setCargando(true);
        try{
            const db = await configurarBD();
            const todosLosPacientes = await db.getAll("pacientes");
            //filtramos las mascotas que le pertenecen al usuario actual
            setMascotas(todosLosPacientes.filter((p) => p.emailUsuario == usuario.correo));
        }catch (err){
            console.log("Error al cargar mascotas del usuario:", err);
        }finally{
            setCargando(false);
        }
    }
    cargarMascotas();

    },[usuario]);

    

    async function confirmarEliminar() {
        try{
            const db = await configurarBD();
            //eliminamos de IndexedDB
            await db.delete("pacientes", mascotaElim.id);
            //filtramos el estado local para quitar la mascota borrada al instante
            const mascotasRestantes = mascotas.filter((m) => m.id !==mascotaElim.id);
            setMascotas(mascotasRestantes);
            //cerramos el modal alerta y notificamos a la vista de atras
            setMascotaElim(null);
            onActualizar();
        }catch(err){
            console.error("Error al eliminar mascota:", err);
        }
    }

    function irAgregarMascota(){
        navigate("/mascotas/formularioMascotas", {
            state: {
                correoUsuario: usuario.correo,
                nombreUsuario: usuario.nombre_completo,
                telefonoUsuario: usuario.telefono,
            },
        });
    }
    if(!usuario) return null;

    return(
        <div className="modal is-open">
            <div className="modal-content">
                <div className="modal-header modal-primary">
                    <h3>🐾 Mascotas de {usuario.nombre_completo} </h3>
                    <button className="modal-close" onClick={onCerrar}>X</button>
                </div>

                <div className="modal-body">
                    {/*Tarjeta de informacion del Usuario */}
                    <div className="card card-light br-1 mb-2 p-1">
                        <div className="d-flex gap-2 f-wrap align-item">
                            <div>
                                <span className="text-muted">CLIENTE / USUARIO</span>
                                <p className="fw-bold text-dark">{usuario.nombre_completo}</p>
                            </div>
                            <div>
                                <span className="text-muted">CORREO</span>
                                <p>{usuario.correo}</p>
                            </div>
                            <div>
                                <span className="text-muted">TELÉFONO</span>
                                <p>{usuario.telefono || "-"}</p>
                            </div>
                            <div className="ml-auto">
                                <span className={`badge ${mascotas.length > 0 ? "info" : "secondary"}`}>{mascotas.length} mascota{mascotas.length !== 1 ? "s" : ""} </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-2">
                        <button className="btn-primary" onClick={irAgregarMascota}>+ Agregar mascota a este usuario</button>
                    </div>

                    {cargando ? (
                        <p className="text-muted">Cargando mascotas...</p>
                    ) : mascotas.length === 0 ?(
                        <div className="alerta primary text-center">
                            Este usuario no tiene mascotas registradas aún.
                        </div>
                    ) : (
                        <div className="table-container shadow-sm br-1">
                            <table className="table table-clara-primary table-bordered">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Nombre</th>
                                        <th>Especie</th>
                                        <th>Raza</th>
                                        <th>Sexo</th>
                                        <th>Edad</th>
                                        <th>Peso</th>
                                        <th>Vacunas</th>
                                        <th>Registro</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mascotas.map((m, i) => (
                                        <tr key={m.id}>
                                            <td>{i + 1} </td>
                                            <td className="fw-bold">{m.nombre} </td>
                                            <td> 
                                                <span className={`badge ${BADGE_ESPECIE[m.especie] ?? "secondary"}`} >{m.especie} </span>
                                            </td>
                                            <td>{m.raza || "-"}</td>
                                            <td>{m.sexo}</td>
                                            <td>{m.edad ?? "-"} años</td>
                                            <td>{m.peso ?? "-"} kg</td>
                                            <td> 
                                                <span className={`badge ${m.estaVacunado ? "success" : "alert"}`}>{m.estaVacunado ? "Al día ✓" : "Pendiente"} </span>
                                            </td>
                                            <td>{m.fechaRegistro ? new Date(m.fechaRegistro).toLocaleDateString("es-SV") : "-"}</td>
                                            <td>
                                                <button className="btn-outline-alert btn-sm" onClick={() => setMascotaElim(m)}>🗑 Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-outline-secondary" onClick={onCerrar}>Cerrar</button>
                </div>
            </div>

            {mascotaElim && (
                <div className="modal-alert is-open">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>⚠️ Eliminar mascotas</h3>
                            <button className="modal-close" onClick={() => setMascotaElim(null)}>X</button>
                        </div>
                        <div className="modal-body">
                            <p>¿Eliminar a <strong>{mascotaElim.nombre}</strong>? Esta acción no se puede deshacer.</p>
                        </div>
                        <div className="modal-footer">
                            <p>¿Eliminar a <strong>{mascotaElim.nombre}</strong>? Esta acción no se puede deshacer.</p>
                            <button className="btn-outline-secondary" onClick={() => setMascotaElim(null)}>Cancelar</button>
                            <button className="btn-alert" onClick={confirmarEliminar}>Sí, eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

}

//vista principal :listado de usuarios

export default function ListaMascotas(){
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [conteos, setConteos] = useState({});
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [userSeleccionado, setUserSeleccionado] = useState(null);

    useEffect(() => {cargarDatos(); }, []);

        async function cargarDatos() {
            setCargando(true);
        try{
            const db = await configurarBD();
            const [todosLosUsuarios, todosLosPacientes] = await Promise.all([
                db.getAll("usuarios"),
                db.getAll("pacientes"),
            ]);
            const soloClientes = todosLosUsuarios.filter((u) =>u.rol === "usuario");
            const mapaConteos = {};
            todosLosPacientes.forEach((p) => {
                mapaConteos[p.emailUsuario] = (mapaConteos[p.emailUsuario] ?? 0) + 1;

            });
            setUsuarios(soloClientes);
            setConteos(mapaConteos);
        }catch(err){
            console.error("Error al procesar el listado de usuarios:", err);
        }finally{
            setCargando(false);
        }
    }

    const filtrados = usuarios.filter(
        (u) => 
            u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || u.correo.toLowerCase().includes(busqueda.toLowerCase())

    );

    return(
        <div>
            <div className="d-flex j-cont-bet align-item f-wrap gap-1 mb-2">
                <div>
                    <h2 className="fs-2 fw-bold text-primary">Usuarios y sus Mascotas</h2>
                    <p className="text-muted">{usuarios.length} usuario{usuarios.length !== 1 ? "s" : ""} registrado{usuarios.length !== 1 ? "s" : ""} </p>

                </div>
                <button className="btn-primary" onClick={() => navigate("/nuevo-expediente")}> + Nuevo registro</button>
            </div>

            <div className="form-group mb-2">
                <input 
                    type = "text"
                    className="input"
                    placeholder="Buscar usuario por nombre o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>
            {cargando ? (
                <p className="text-muted">Cargando registros...</p>
            ) : filtrados.length === 0 ? (
                <div className="alerta primary text-center">
                    {busqueda ? `Sin resultados para "${busqueda}"` : "No hay usuarios clientes registrados en el sistema."}
                </div>
            ) : (
                <div className="table-container shadow-sm br-1">
                    <table className="table table-clara-primary table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre Completo</th>
                                <th>Correo electrónico</th>
                                <th>Teléfono</th>
                                <th>Mascotas</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtrados.map((u, i) => (
                                <tr key={u.correo}>
                                    <td>{i + 1} </td>
                                    <td className="fw-bold">{u.nombre_completo} </td>
                                    <td>{u.correo}</td>
                                    <td>{u.telefono}</td>
                                    <td> 
                                        <span className={`badge ${(conteos[u.correo] ?? 0) > 0 ?  "info" : "secondary"}`}>{conteos[u.correo] ?? 0} miemb{(conteos[u.correo] ?? 0) === 1 ? "ro" : "ros"} </span>
                                    </td>       
                                    <td>
                                        <button className="btn-info btn-sm" onClick={() => setUserSeleccionado(u)}>Ver mascotas</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ModalMascotas

            usuario={userSeleccionado}
            onCerrar={() => setUserSeleccionado(null)}
            onActualizar={cargarDatos}
            />
        </div>
            
    
        
    );


}