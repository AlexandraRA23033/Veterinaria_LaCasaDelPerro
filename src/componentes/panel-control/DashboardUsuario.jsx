import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { configurarBD } from "../../base-datos/configuracion";
import VerMascotas from "../mascotas/VerMascotas";

export default function DashboardUsuario(){
    const {usuario} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    //estado local para pintar los datos de la base de datos en tiempo real
    const [datosUsuario, setDatosUsuario] = useState({
        correo: location.state?.correoUsuario || usuario?.correo || usuario?.email || "",
        nombre: location.state?.nombreUsuario || usuario?.nombre_completo || usuario?.nombre || "",
        telefono: location.state?.telefonoUsuario ||  usuario?.telefono || ""
    });
    // const correoUsuario = usuario?.correo || usuario?.email;
    // const nombreUsuario = usuario?.nombre_completo || usuario?.nombre;
    // const telefonoUsuario = usuario?.telefono || "";

    //cada ves que el cliente cargue la pantalla o vuelva del formulario , leeamos la db
    //Efecto1: consulta la base de datos al montar la pantalla o regresar del formulario
    useEffect(() =>{
        async function refrescarDatosPerfil() {
            const correoActivo = usuario?.correo || usuario?.email;
            if(!correoActivo) return;
            try{
                const db = await configurarBD();
                //buscamos directamente en el almacen usuarios 
                const usuarioDB = await db.get("usuarios", correoActivo);
                if(usuarioDB){
                    setDatosUsuario({
                        correo: usuarioDB.correo,
                        nombre: usuarioDB.nombre_completo,
                        telefono: usuarioDB.telefono || ""
                    });
                }
            }catch (err){
                console.error("Error al refrescar perfil desde IndexedDB:", err);
            } 
        }
        refrescarDatosPerfil();
    }, [usuario, location.key]); //location.key cambia cada vez que navegas de regreso forzando la re-lectura

        //Efecto 2: mantiene sincronizado el historial de navegacion por seguridad
    useEffect(() =>{
        
        //si no hay estado en la ruta (ej. venimos recien logueados), lo inicializamos
        //ya no vigila datosUsuario completo para no crear bucles
        if(!location.state && datosUsuario.correo){
            navigate("/expedientes", {
                replace: true,
                state: {
                    correoUsuario: datosUsuario.correo,
                    nombreUsuario: datosUsuario.nombre, 
                    telefonoUsuario: datosUsuario.telefono
                }
            });
        }
    }, [location.state, datosUsuario,navigate]);

        //pantalla obligatoria de React Router mientras se inicializa el state de la ruta
    if(!location.state){
        return(
            <div className="container mt-3">
                <p className="text-muted text-center p-3">Sincronizando expedientes clínicos...</p>
            </div>
        );
    }

    return(
        <div className="container mt-2">
            <div className="card bg-light p-3 br-2 mb-1 shadow-sm d-flex j-cont-bet align-item f-wrap gap-1">
                {/**usamos el estado local datosUsuario que lee de IndexedDB */}
                <h2 className="text-primary  fw-bold mb-1">¡Bienvenid@, {datosUsuario.nombre}!</h2>
                <p className="text-muted fs-3">Desde aquí puedes gestionar los datos y consultar el historial clínico de tus mascotas.</p>
            </div>
            <button type="button" className="btn-primary btn-md fw-bold shadow-sm" onClick={()=> navigate("/usuarios/editar", {state:{usuario:datosUsuario}})}>
                Editar Perfil
            </button>

            <VerMascotas esAdmin={false}  
            nombreProp={datosUsuario.nombre}
            correoProp={datosUsuario.correo}
            telefonoProp={datosUsuario.telefono}
            />
        </div>
    );
}
