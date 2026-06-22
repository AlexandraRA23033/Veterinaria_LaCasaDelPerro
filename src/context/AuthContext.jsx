/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext } from 'react';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Recupera sesión si el usuario recargó la página
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = sessionStorage.getItem('vet_usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  const login = (datosUsuario) => {
    setUsuario(datosUsuario);
    sessionStorage.setItem('vet_usuario', JSON.stringify(datosUsuario));
  };

  const logout = () => {
    setUsuario(null);
    sessionStorage.removeItem('vet_usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};