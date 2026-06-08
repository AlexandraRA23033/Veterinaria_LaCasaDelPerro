import { openDB } from "idb";

export const configurarBD = async () => {
  return openDB("VeterinariaDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('usuarios')) {
        db.createObjectStore('usuarios', { keyPath: 'correo' });
      }
      if(!db.objectStoreNames.contains('propietarios')){
        db.createObjectStore('propietario', {keyPath: 'dui'})
      }
      if(!db.objectStoreNames.contains('pacientes')){
        db.createObjectStore('paciente', {keyPath: 'id', autoIncrement: true})
      }
      if (!db.objectStoreNames.contains('agenda')) {
        db.createObjectStore('agenda', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('inventario')) {
        db.createObjectStore('inventario', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('lotes_peps')) {
        db.createObjectStore('lotes_peps', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('consultas')) {
        db.createObjectStore('consultas', { keyPath: 'id', autoIncrement: true });
      }
    }
  });
};
