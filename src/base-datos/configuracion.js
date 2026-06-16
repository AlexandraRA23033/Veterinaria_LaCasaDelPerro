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

      // Inicializar almacén de Productos de Inventario ──
      if (!db.objectStoreNames.contains("inventario")) {
        const storeInven = db.createObjectStore("inventario", {
          keyPath: "id",
          autoIncrement: true,
        });
        storeInven.add({ id: 1, nombre: "Vacuna Antirrábica", precioVenta: 15.00 });
        storeInven.add({ id: 2, nombre: "Desparasitante Oral", precioVenta: 8.50 });
        storeInven.add({ id: 3, nombre: "Antibiótico Amoxicilina", precioVenta: 12.00 });
      }
      
      //Inicializar almacén de Lotes PEPS (Ordenados por fecha) ──
      if (!db.objectStoreNames.contains("lotes_peps")) {
        const storeLotes = db.createObjectStore("lotes_peps", {
          keyPath: "id",
          autoIncrement: true,
        });
        storeLotes.add({ id: 1, loteId: "LOTE-001", ingreso: "2026-01-10", cantidad: 3, productoNombre: "Vacuna Antirrábica" });
        storeLotes.add({ id: 2, loteId: "LOTE-002", ingreso: "2026-02-15", cantidad: 8, productoNombre: "Vacuna Antirrábica" });
        storeLotes.add({ id: 3, loteId: "LOTE-101", ingreso: "2026-03-01", cantidad: 4, productoNombre: "Desparasitante Oral" });
        storeLotes.add({ id: 4, loteId: "LOTE-201", ingreso: "2026-02-20", cantidad: 15, productoNombre: "Antibiótico Amoxicilina" });
      }

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


export const obtenerPacientes = async () => {
  const db = await configurarBD();
  return db.getAll("pacientes");
};

export const buscarPaciente = async (id) => {
  const db = await configurarBD();
  return db.get("pacientes", id);
};

export const registrarPaciente = async (paciente) => {
  const db = await configurarBD();
  return db.add("pacientes", paciente);
};

export const actualizarPaciente = async (paciente) => {
  const db = await configurarBD();
  return db.put("pacientes", paciente);
};

export const eliminarPaciente = async (id) => {
  const db = await configurarBD();
  return db.delete("pacientes", id);
};


// ============================================================================
// FUNCIONES EXCLUSIVAS PARA EL MÓDULO DE INVENTARIO PEPS
// ============================================================================
export const obtenerProductosDB = async () => {
  const db = await configurarBD();
  return db.getAll("inventario");
};

export const obtenerLotesDB = async () => {
  const db = await configurarBD();
  return db.getAll("lotes_peps");
};

export const actualizarLoteDB = async (lote) => {
  const db = await configurarBD();
  return db.put("lotes_peps", lote);
};

export const eliminarLoteDB = async (id) => {
  const db = await configurarBD();
  return db.delete("lotes_peps", id);
};


// ============================================================================
// NUEVAS FUNCIONES DE ENLACE: CONSULTAS Y AGENDA
// ============================================================================
export const guardarCitaAgenda = async (cita) => {
  const db = await configurarBD();
  return db.add("agenda", cita);
};

export const actualizarCitaAgenda = async (cita) => {
  const db = await configurarBD();
  return db.put("agenda", cita);
};

export const obtenerCitasAgenda = async () => {
  const db = await configurarBD();
  return db.getAll("agenda");
};

export const guardarConsultaHistorial = async (consulta) => {
  const db = await configurarBD();
  return db.add("consultas", consulta);
};

export const obtenerConsultasHistorial = async () => {
  const db = await configurarBD();
  return db.getAll("consultas");
};