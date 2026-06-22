import { openDB } from "idb";
import { hashPassword } from "../componentes/usuarios/EncriptacionService";

const NOMBRE_BD = "VeterinariaDB";
// Mantenemos estrictamente la versión 1 
const VERSION_BD = 1;

export const configurarBD = async () => {
  const db = await openDB(NOMBRE_BD, VERSION_BD, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("usuarios")) {
        db.createObjectStore("usuarios", { keyPath: "correo" });
      }
      if (!db.objectStoreNames.contains("pacientes"))
        db.createObjectStore("pacientes", {
          keyPath: "id",
          autoIncrement: true,
        });
        
      if (!db.objectStoreNames.contains("agenda"))
        db.createObjectStore("agenda", { keyPath: "id", autoIncrement: true });

      // Productos de Inventario Inicia vacio
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


  //Este bloque de codigo sirve para hashear la contraseña del admin si aun no existe e n la db
   const adminExistente = await db.get("usuarios", "admin@ues.edu.sv");
  if (!adminExistente) {
    const { hash, salt } = await hashPassword("Admin.Vet2026");
    await db.add("usuarios", {
      correo: "admin@ues.edu.sv",
      password: hash,
      salt,
      nombre_completo: "Administrador",
      telefono: "7712-8139",
      rol: "admin",
    });
  }

  return db;
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
  // Se cambia .add() por .put() para que actualice si la cita ya existe (al posponer)
  return db.put("agenda", cita);
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
  // Se cambia .add() por .put() para evitar colisiones de ID duplicados en el historial
  return db.put("consultas", consulta);
};

export const obtenerConsultasHistorial = async () => {
  const db = await configurarBD();
  return db.getAll("consultas");
};


// Permite consultar y traer la lista completa de todos los tratamientos y atenciones médicas registradas.
export const obtenerServiciosDB = async () => {
  const db = await configurarBD();
  return db.getAll("servicios");
};

// Trae la lista de todos los nombres de artículos e insumos guardados en el sistema para mostrarlos en la tabla principal.
export const obtenerProductosDB = async () => {
  const db = await configurarBD();
  return db.getAll("inventario");
};

// Extrae todos los paquetes de stock con sus respectivas fechas de vencimiento para poder ordenarlos por orden de llegada.
export const obtenerLotesDB = async () => {
  const db = await configurarBD();
  return db.getAll("lotes_peps");
};

// Guarda un nuevo artículo o insumo en el catálogo para que la clínica sepa que ahora cuenta con ese tipo de producto.
export const registrarProductoDB = async (producto) => {
  const db = await configurarBD();
  return db.add("inventario", producto);
};

// Sobreescribe los datos de un artículo (como cambiar su nombre o tipo) cuando el usuario edita su ficha desde el formulario.
export const actualizarProductoDB = async (producto) => {
  const db = await configurarBD();
  return db.put("inventario", producto);
};

// Quita de forma definitiva un tipo de producto del catálogo cuando la clínica ya no planea manejarlo más.
export const eliminarProductoDB = async (id) => {
  const db = await configurarBD();
  return db.delete("inventario", id);
};

// Registra la entrada al almacén de un paquete nuevo de unidades con su propia fecha de vencimiento y cantidad.
export const registrarLoteDB = async (lote) => {
  const db = await configurarBD();
  return db.put("lotes_peps", lote);
};

// Modifica los datos de cantidad o fechas de un paquete específico de mercadería en caso de que se haya cometido un error al digitarlo.
export const actualizarLoteDB = async (lote) => {
  const db = await configurarBD();
  return db.put("lotes_peps", lote);
};

// Da de baja o elimina un paquete de stock específico del sistema cuando se acaba o cuando vence.
export const eliminarLoteDB = async (id) => {
  const db = await configurarBD();
  return db.delete("lotes_peps", id);
};

// Añade una nueva prestación o servicio al menú clínico para que el personal pueda empezar a ofrecerlo y cobrarlo.
export const registrarServicioDB = async (servicio) => {
  const db = await configurarBD();
  return db.add("servicios", servicio);
};

// Guarda los cambios de nombre, categoría o precio de un servicio de la clínica cuando se necesitan actualizar los costos.
export const actualizarServicioDB = async (servicio) => {
  const db = await configurarBD();
  return db.put("servicios", servicio);
};

// Desactiva o borra permanentemente una prestación médica que la clínica ya no va a ofrecer a los clientes.
export const eliminarServicioDB = async (id) => {
  const db = await configurarBD();
  return db.delete("servicios", id);
};

// Suma las cantidades individuales de cada paquete o lote que pertenezca a un mismo artículo para mostrar el inventario total disponible.
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
export const limpiarVentasDB = async () => {
  const db = await configurarBD();
  return db.clear("ventas");
};