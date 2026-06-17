//import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";


export default function TarjetaDueno({ nombreUsuario, correoUsuario, telefonoUsuario, cantidadMascotas, onEditarDueno}) {

  // const navigate = useNavigate();
  const {usuario} = useAuth(); //leemos quein esta mirando la tarjeta

  //si el que esta logueado es un usuario comun, habilitamos la funcion
  const esCliente = usuario?.rol === "usuario";
  return (
    <div className="card card-info br-3 shadow-sm p-3 mb-3">
      {/**Contenedor del titulo +boton de editar */}
      <div className="d-flex j-cont-bet align-item mb-1">
        <h3 className="fs-3 fw-bold text-light">Datos del Dueño</h3>
        {/**Solo renderiza el boton si pasamos la funcion onEditar */}
        {(esCliente || usuario?.rol === "admin") && (
          <button type="button" className="btn-light btn-sm fw-bold text-primary shadow-sm"
          onClick={(onEditarDueno)}>Editar Perfil</button>
        )}
      </div>

      <div className="card card-light br-2 p-2 mt-1">
        <div className="d-flex f-wrap gap-3">
          <div>
            <p className="text-muted">NOMBRE</p>
            <p className="fw-bold text-dark">{nombreUsuario}</p>
          </div>
          <div>
            <p className="text-muted">CORREO</p>
            <p className="fw-bold text-dark">{correoUsuario}</p>
          </div>
          <div>
            <p className="text-muted">TELÉFONO</p>
            <p className="fw-bold text-dark">{telefonoUsuario || "No registrado"}</p>
          </div>

          {cantidadMascotas !== undefined && (
            <div className="ml-auto">
              <p className="text-muted">MASCOTAS</p>
              <span className={`badge ${cantidadMascotas > 0 ? "info" : "secondary"}`}>
                {cantidadMascotas} mascota{cantidadMascotas !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}