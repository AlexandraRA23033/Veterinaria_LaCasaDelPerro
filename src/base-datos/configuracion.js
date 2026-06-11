import { openDB } from "idb";

const NOMBRE_BD = "VeterinariaDB";
const VERSION_BD = 1;

export const configurarBD = async () => {
  return openDB(NOMBRE_BD, VERSION_BD, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("usuarios")) {
        const store = db.createObjectStore("usuarios", { keyPath: "correo" });
        // Admin de prueba con todos los campos completos
        store.add({
          correo: "admin@ues.edu.sv",
          password: "admin123",
          nombre_completo: "Administrador",
          telefono: "2222-3333",
          rol: "admin",
        });
      }
      if (!db.objectStoreNames.contains("pacientes"))
        db.createObjectStore("pacientes", {
          keyPath: "id",
          autoIncrement: true,
        });
      if (!db.objectStoreNames.contains("agenda"))
        db.createObjectStore("agenda", { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("inventario"))
        db.createObjectStore("inventario", {
          keyPath: "id",
          autoIncrement: true,
        });
      if (!db.objectStoreNames.contains("lotes_peps"))
        db.createObjectStore("lotes_peps", {
          keyPath: "id",
          autoIncrement: true,
        });
      if (!db.objectStoreNames.contains("consultas"))
        db.createObjectStore("consultas", {
          keyPath: "id",
          autoIncrement: true,
        });
    },
  });
};

export const buscarUsuario = async (correo) => {
  const db = await configurarBD();
  return db.get("usuarios", correo);
};

export const registrarUsuario = async (usuario) => {
  const db = await configurarBD();
  return db.add("usuarios", usuario);
};

export const actualizarUsuario = async (usuario) => {
  const db = await configurarBD();
  return db.put("usuarios", usuario);
};
