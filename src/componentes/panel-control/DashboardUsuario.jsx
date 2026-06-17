import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import VerMascotas from "../mascotas/VerMascotas";

export default function DashboardUsuario(){
    const {usuario} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    //mapeamos los datos del usuario autenticado en la sesion activa
    const correoUsuario = usuario?.correo || usuario?.email;
    const nombreUsuario = usuario?.nombre_completo || usuario?.nombre;
    const telefonoUsuario = usuario?.telefono || "";

    useEffect(() =>{
        if(!location.state && correoUsuario){
            navigate("/expedientes", {
                replace: true,
                state: {correoUsuario, nombreUsuario, telefonoUsuario}
            });
        }
    }, [location.state, correoUsuario, nombreUsuario, telefonoUsuario, navigate]);

    if(!location.state){
        return(
            <div className="container mt-3">
                <p className="text-muted text-center p-3">Sincronizando expedientes clínicos...</p>
            </div>
        );
    }

    return(
        <div className="container mt-2">
            <div className="card bg-light p-3 br-2 mb-1 shadow-sm">
                <h2 className="text-primary  fw-bold mb-0">¡Bienvenido de vuelta, {nombreUsuario}!</h2>
                <p className="text-muted fs-3">Desde aquí puedes gestionar los datos y consultar el historial clínico de tus mascotas.</p>
            </div>

            <VerMascotas esAdmin={false} />
        </div>
    );
}
