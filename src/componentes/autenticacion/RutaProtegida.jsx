import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RutaProtegida = ({ children, rolRequerido }) => {
  const { usuario } = useAuth();

  // Si no hay sesión iniciada, al login
  if (!usuario) {
    return <Navigate to="/ingresar" />;
  }

  // Si es usuario normal e intenta entrar a admin -> al dashboard de usuario
  if (rolRequerido === 'admin' && usuario.rol !== 'admin') {
    return <Navigate to="/expedientes" />; 
  }

  // Si es admin e intenta entrar a rutas de usuario -> al dashboard admin
  if (rolRequerido === 'usuario' && usuario.rol !== 'usuario') {
    return <Navigate to="/dashboard-admin" />;
  }

  return children;
};

export default RutaProtegida;