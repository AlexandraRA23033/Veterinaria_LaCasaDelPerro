import { openDB } from "idb";

const NOMBRE_BD = "VeterinariaDB";
// Mantenemos estrictamente la versión 1 por requerimiento del proyecto
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

      // Productos de Inventario Iniciará vacío y limpio desde cero
      if (!db.objectStoreNames.contains("inventario")) {
        db.createObjectStore("inventario", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      
      // Lotes PEPS 
      if (!db.objectStoreNames.contains("lotes_peps")) {
        db.createObjectStore("lotes_peps", {
          keyPath: "id",
          autoIncrement: true,
        });
      }

      if (!db.objectStoreNames.contains("consultas"))
        db.createObjectStore("consultas", {
          keyPath: "id",
          autoIncrement: true,
        });

      
      if (!db.objectStoreNames.contains("servicios")) {
         db.createObjectStore("servicios", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      //ventas
      if (!db.objectStoreNames.contains("ventas"))
        db.createObjectStore("ventas", {
       keyPath: "id",
        autoIncrement: true 
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

// CONSULTAS Y AGENDA
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


//MÓDULO DE SERVICIOS
export const obtenerServiciosDB = async () => {
  const db = await configurarBD();
  return db.getAll("servicios");
};


// MÓDULO DE INVENTARIO 
export const obtenerProductosDB = async () => {
  const db = await configurarBD();
  return db.getAll("inventario");
};

export const obtenerLotesDB = async () => {
  const db = await configurarBD();
  return db.getAll("lotes_peps");
};

export const registrarProductoDB = async (producto) => {
  const db = await configurarBD();
  return db.add("inventario", producto);
};

export const actualizarProductoDB = async (producto) => {
  const db = await configurarBD();
  return db.put("inventario", producto);
};

export const eliminarProductoDB = async (id) => {
  const db = await configurarBD();
  return db.delete("inventario", id);
};

//inventario
export const registrarLoteDB = async (lote) => {
  const db = await configurarBD();
  return db.put("lotes_peps", lote);
};

export const actualizarLoteDB = async (lote) => {
  const db = await configurarBD();
  return db.put("lotes_peps", lote);
};

export const eliminarLoteDB = async (id) => {
  const db = await configurarBD();
  return db.delete("lotes_peps", id);
};


export const registrarServicioDB = async (servicio) => {
  const db = await configurarBD();
  return db.add("servicios", servicio);
};

export const actualizarServicioDB = async (servicio) => {
  const db = await configurarBD();
  return db.put("servicios", servicio);
};

export const eliminarServicioDB = async (id) => {
  const db = await configurarBD();
  return db.delete("servicios", id);
};


// Parte de Inventario: Cálculo matemático para auditar el Stock Total unificado
export const calcularStockTotalPEPS = (lotesDelProducto) => {
  return lotesDelProducto.reduce((total, lote) => total + (parseInt(lote.cantidad) || 0), 0);
};

//Punto de venta 
export const guardarVentaDB = async (venta) => {
  const db = await configurarBD();
  return db.add("ventas", venta);
};
export const obtenerVentasDB = async () => {
  const db = await configurarBD();
  return db.getAll("ventas");
};
export const obtenerVentaDB = async (id) => {
  const db = await configurarBD();
  return db.get("ventas", id);
};