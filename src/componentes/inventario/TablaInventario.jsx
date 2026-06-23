import { useState } from "react";
import {
  registrarProductoDB,
  actualizarProductoDB,
  registrarLoteDB,
  eliminarProductoDB,
  eliminarLoteDB,
  calcularStockTotalPEPS,
} from "../../base-datos/configuracion";

const TablaInventario = ({ productos, lotes }) => {
  // Guarda el día de hoy para saber que las cosas no estén vencidas
  const fechaHoy = new Date().toISOString().split("T")[0];

  // Papeles en blanco para anotar lo que la gente escribe en las cajitas de los formularios
  const [nuevoProd, setNuevoProd] = useState({
    id: null,
    nombre: "",
    precioVenta: "",
    tipo: "Medicamento",
  });
  const [nuevoLote, setNuevoLote] = useState({
    id: null,
    loteId: "",
    ingreso: fechaHoy,
    vencimiento: "",
    cantidad: "",
    productoNombre: "",
  });

  // Interruptores para avisarle al sistema si estamos metiendo algo nuevo o cambiando algo viejo
  const [esEdicionProducto, setEsEdicionProducto] = useState(false);
  const [esEdicionLote, setEsEdicionLote] = useState(false);

  // Cosas para controlar cuándo se abren los carteles de aviso en la pantalla
  const [modalAlerta, setModalAlerta] = useState({
    abierto: false,
    titulo: "",
    mensaje: "",
  });
  const [modalConfirmar, setModalConfirmar] = useState({
    abierto: false,
    mensaje: "",
    accion: null,
  });

  // El .find revisa toda la lista de productos buscando el primero que coincida con el id que tenemos guardado
  const productoOriginal = productos.find((p) => p.id === nuevoProd.id);
  const nombreOriginal = productoOriginal ? productoOriginal.nombre : "";

  // Carteles que saltan en la pantalla para avisar si algo falta o para pedir permiso antes de hacer algo
  const dispararAlerta = (titulo, mensaje) => {
    setModalAlerta({ abierto: true, titulo, mensaje });
  };

  const dispararConfirmacion = (mensaje, accionAAceptar) => {
    setModalConfirmar({ abierto: true, mensaje, accion: accionAAceptar });
  };

  // Limpia todas las cajitas para escribir y deja los formularios vacíos como al principio
  // Se usa la palabra handle al inicio para dejar claro que esta función se va a encargar de controlar un evento o acción del usuario
  const handleCancelarTodo = () => {
    setNuevoProd({
      id: null,
      nombre: "",
      precioVenta: "",
      tipo: "Medicamento",
    });
    setNuevoLote({
      id: null,
      loteId: "",
      ingreso: fechaHoy,
      vencimiento: "",
      cantidad: "",
      productoNombre: "",
    });
    setEsEdicionProducto(false);
    setEsEdicionLote(false);
  };

  // Agarra el producto que tocamos en la tabla y lo pasa arriba para poder cambiarle los datos
  // Lleva handle porque controla lo que pasa cuando el usuario hace clic en el botón de editar de la tabla
  const handleSeleccionarEditarProducto = (prod) => {
    setEsEdicionLote(false);
    setEsEdicionProducto(true);

    setNuevoProd({
      id: prod.id,
      nombre: prod.nombre,
      precioVenta: prod.precioVenta,
      tipo: prod.tipo || "Medicamento",
    });

    // El .filter actúa como un colador que revisa todos los lotes y se queda solo con los que pertenecen al producto seleccionado
    const lotesDelProd = lotes.filter((l) => l.productoNombre === prod.nombre);
    const stockActual = calcularStockTotalPEPS(lotesDelProd);

    setNuevoLote({
      id: null,
      loteId: "",
      productoNombre: prod.nombre,
      ingreso: fechaHoy,
      vencimiento: prod.tipo === "Accesorio" ? "No requiere" : "",
      cantidad: stockActual,
    });
  };

  // Agarra un paquete específico de abajo para poder cambiarle la cantidad o la fecha si nos equivocamos escribiendo
  // función flecha con el signo igual y mayor que porque es una forma directa y limpia de empaquetar estas instrucciones
  const handleSeleccionarEditarLoteDirecto = (lote, tipoProducto) => {
    setEsEdicionProducto(false);
    setEsEdicionLote(true);

    setNuevoProd({
      id: null,
      nombre: lote.productoNombre,
      precioVenta: "",
      tipo: tipoProducto,
    });

    setNuevoLote({
      id: lote.id,
      loteId: lote.loteId,
      productoNombre: lote.productoNombre,
      ingreso: lote.ingreso,
      vencimiento: lote.vencimiento === "No requiere" ? "" : lote.vencimiento,
      cantidad: lote.cantidad,
    });
  };

  // El cerebro que revisa todo antes de guardar, mira si falta rellenar algo y decide si guarda algo nuevo o cambia lo viejo
  // Lleva async antes de los argumentos porque adentro vamos a conectarnos con la base de datos externa y esa conexión toma su tiempo
  const handleGuardarCambiosFormulario = async (e) => {
    if (e) e.preventDefault();

    // Revisa que la cantidad sea mayor a cero y que la fecha no sea del pasado cuando cambiamos un paquete viejo
    if (esEdicionLote && nuevoLote.id) {
      if (parseInt(nuevoLote.cantidad) <= 0) {
        dispararAlerta(
          "Cantidad Invalida",
          "La cantidad debe ser mayor o igual a 1 unidad.",
        );
        return;
      }

      if (nuevoProd.tipo !== "Accesorio") {
        if (!nuevoLote.vencimiento) {
          dispararAlerta(
            "Campo Requerido",
            "La fecha de vencimiento es obligatoria.",
          );
          return;
        }
        if (nuevoLote.vencimiento < fechaHoy) {
          dispararAlerta(
            "Error de Fecha",
            "La fecha de vencimiento no puede ser menor al día de hoy.",
          );
          return;
        }
      }

      const vencimientoFinal =
        nuevoProd.tipo === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

      // await para obligar al código a frenarse aquí y esperar a que la base de datos termine de guardar el lote antes de seguir con la siguiente línea
      await registrarLoteDB({
        id: nuevoLote.id,
        loteId: nuevoLote.loteId,
        ingreso: nuevoLote.ingreso,
        vencimiento: vencimientoFinal,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre,
      });

      // Cambia los datos del producto y se mete a cambiarle el nombre a todos sus paquetes viejos para que sigan amarrados
    } else if (esEdicionProducto && nuevoProd.id) {
      if (
        !nuevoProd.precioVenta ||
        nuevoProd.precioVenta.toString().trim() === "" ||
        isNaN(parseFloat(nuevoProd.precioVenta))
      ) {
        dispararAlerta(
          "Precio Requerido",
          "Por favor asigne un precio de venta para poder guardar el producto.",
        );
        return;
      }

      if (parseFloat(nuevoProd.precioVenta) <= 0) {
        dispararAlerta(
          "Precio Invalido",
          "El precio de venta debe ser un número positivo.",
        );
        return;
      }

      const nuevoNombreNormalizado = nuevoProd.nombre.trim();

      if (
        nuevoNombreNormalizado.toLowerCase() !== nombreOriginal.toLowerCase()
      ) {
        // El .some es un chismoso que revisa la lista y te dice 'verdadero' si encuentra aunque sea un solo producto que ya use ese nuevo nombre
        const yaExiste = productos.some(
          (p) =>
            p.nombre.trim().toLowerCase() ===
            nuevoNombreNormalizado.toLowerCase(),
        );
        if (yaExiste) {
          dispararAlerta(
            "Duplicacion de Ficha",
            `Ya existe un artículo con el nombre "${nuevoProd.nombre}".`,
          );
          return;
        }
      }

      let vencimientoCascada = "";
      if (nuevoProd.tipo === "Accesorio") {
        vencimientoCascada = "No requiere";
      } else {
        if (!nuevoLote.vencimiento || nuevoLote.vencimiento === "No requiere") {
          dispararAlerta(
            "Clasificacion Cambiada",
            "Al cambiar la clasificación, es obligatorio asignar una fecha de vencimiento para actualizar los lotes.",
          );
          return;
        }
        vencimientoCascada = nuevoLote.vencimiento;
      }

      // El await asegura que el producto cambie primero en la base de datos antes de pasar a modifier todos los lotes juntos
      await actualizarProductoDB({
        id: nuevoProd.id,
        nombre: nuevoNombreNormalizado,
        precioVenta: parseFloat(nuevoProd.precioVenta),
        tipo: nuevoProd.tipo,
      });

      // El .filter aparta únicamente los lotes del viejo nombre que necesitamos renombrar en cascada
      const lotesModificables = lotes.filter(
        (l) => l.productoNombre === nombreOriginal,
      );
      // El .map agarra esa lista colada y la transforma en un grupo de tareas pendientes listas para mandarse a guardar con el nombre cambiado
      const promesasLotes = lotesModificables.map((lote) =>
        registrarLoteDB({
          id: lote.id,
          loteId: lote.loteId,
          cantidad: lote.cantidad,
          ingreso: lote.ingreso,
          productoNombre: nuevoNombreNormalizado,
          vencimiento:
            nuevoProd.tipo === "Accesorio"
              ? "No requiere"
              : lote.vencimiento === "No requiere"
                ? vencimientoCascada
                : lote.vencimiento,
        }),
      );

      // Promise.all junta todas las tareas de los lotes y el await hace que esperemos a que la última de ellas termine con éxito
      await Promise.all(promesasLotes);

      // Mete un paquete nuevo a la lista, le fabrica un código automático ordenado y revisa que las fechas estén bien
    } else if (nuevoLote.productoNombre) {
      if (parseInt(nuevoLote.cantidad) <= 0) {
        dispararAlerta(
          "Cantidad Invalida",
          "La cantidad debe ser mayor o igual a 1 unidad.",
        );
        return;
      }

      // El .find busca el producto dueño de este lote para ver su información y saber si se vence o no
      const prodAsociado = productos.find(
        (p) => p.nombre === nuevoLote.productoNombre,
      );
      const tipoAsociado = prodAsociado ? prodAsociado.tipo : "Medicamento";
      const vencimientoNuevo =
        tipoAsociado === "Accesorio" ? "No requiere" : nuevoLote.vencimiento;

      if (
        tipoAsociado !== "Accesorio" &&
        (!nuevoLote.vencimiento || nuevoLote.vencimiento < fechaHoy)
      ) {
        dispararAlerta(
          "Fecha Invalida",
          "Asigna una fecha de vencimiento válida posterior o igual a hoy.",
        );
        return;
      }

      // El .map aquí sirve para extraer de cada lote solamente su numerito ID y que el Math.max pueda calcular cuál es el más alto de todos
      const numeroSiguiente =
        lotes.length > 0
          ? Math.max(
              ...lotes.map((l) => parseInt(l.loteId.replace("LOTE-", "")) || 0),
            ) + 1
          : 1;
      const loteIdAutomatico = `LOTE-${String(numeroSiguiente).padStart(3, "0")}`;

      // Detiene la ejecución esperando la confirmación de guardado del nuevo lote en la nube o disco
      await registrarLoteDB({
        loteId: loteIdAutomatico,
        ingreso: nuevoLote.ingreso,
        vencimiento: vencimientoNuevo,
        cantidad: parseInt(nuevoLote.cantidad),
        productoNombre: nuevoLote.productoNombre,
      });

      // Agrega un producto que no existía antes en el catálogo y revisa que no estemos repitiendo el nombre de otro
    } else if (nuevoProd.nombre.trim()) {
      if (
        !nuevoProd.precioVenta ||
        nuevoProd.precioVenta.toString().trim() === "" ||
        isNaN(parseFloat(nuevoProd.precioVenta))
      ) {
        dispararAlerta(
          "Precio Requerido",
          "Por favor asigne un precio de venta para poder registrar el producto.",
        );
        return;
      }

      if (parseFloat(nuevoProd.precioVenta) <= 0) {
        dispararAlerta("Precio Invalido", "El precio debe ser positivo.");
        return;
      }
      //  .some que revisa rápido todo el catálogo para gritar un error si intentas meter un nombre repetido
      const yaExiste = productos.some(
        (p) =>
          p.nombre.trim().toLowerCase() ===
          nuevoProd.nombre.trim().toLowerCase(),
      );
      if (yaExiste) {
        dispararAlerta(
          "Catalogo Duplicado",
          "Este artículo ya existe en el catálogo.",
        );
        return;
      }

      // Pausa el proceso para garantizar que el nuevo registro del catálogo quede bien asentado en el sistema externo
      await registrarProductoDB({
        nombre: nuevoProd.nombre.trim(),
        precioVenta: parseFloat(nuevoProd.precioVenta),
        tipo: nuevoProd.tipo,
      });
    } else {
      dispararAlerta(
        "Campos Vacios",
        "Por favor rellene los campos del formulario antes de procesar.",
      );
      return;
    }

    handleCancelarTodo();
    window.location.reload();
  };

  // Busca los paquetes que se llaman igual que el producto para borrarlos todos de un solo golpe de la base de datos antes de borrar el producto de la tabla principal
  // Lleva handle porque controla la acción de retirar y adentro tiene instrucciones asíncronas para limpiar la base de datos
  const handleBorrarProducto = (id) => {
    // El .find localiza qué producto quieres borrar usando su número de ID
    const prodEncontrado = productos.find((p) => p.id === id);
    const nombreProd = prodEncontrado ? prodEncontrado.nombre : "";

    // El segundo argumento es una función flecha async porque contiene los await que van a borrar los datos en orden uno por uno
    dispararConfirmacion(
      `¿Estás seguro de eliminar "${nombreProd}"? Esto borrará permanentemente todos sus lotes guardados en la base de datos.`,
      async () => {
        // El .filter junta en una sublista todos los paquetes sueltos que están amarrados a este producto que va a desaparecer
        const lotesAsociados = lotes.filter(
          (l) => l.productoNombre === nombreProd,
        );

        // El .map transforma cada lote de la sublista en una orden directa de borrado para la base de datos
        const promesasEliminarLotes = lotesAsociados.map((lote) =>
          eliminarLoteDB(lote.id),
        );
        // Espera a que termine de borrarse el último lote de la lista antes de pasar a borrar el producto
        await Promise.all(promesasEliminarLotes);

        // Espera a que el producto se borre por completo de la base de datos para recién ahí recargar la pantalla
        await eliminarProductoDB(id);
        window.location.reload();
      },
    );
  };

  // Borra un solo paquete de los de abajo usando su id único para sacarlo de la base de datos y vuelve a cargar la página para ver los cambios
  // Es una acción directa del usuario clicando el botón por eso arranca con la palabra handle
  const handleBorrarLote = (id) => {
    // La función flecha con async adentro le permite al cartel de confirmación ejecutar el borrado y usar el await correctamente
    dispararConfirmacion(
      "¿Deseas eliminar este lote de PEPS?",
      async () => {
        // Congela la recarga de la página hasta que la base de datos confirme que el lote individual ya no existe
        await eliminarLoteDB(id);
        window.location.reload();
      },
    );
  };

  // Mira si es un accesorio para esconder la cajita del calendario porque esos no se vencen
  const requiereVencimientoFiltro = nuevoProd.tipo !== "Accesorio";

  // De acá para abajo empieza el dibujo de todo lo que el usuario ve en la pantalla usando etiquetas de estilo HTML
  return (
    // El div principal funciona como una caja grande contenedora para meter todas las partes de la pantalla adentro
    <div class="container">
      {/* Esta es la estructura del cartel de alerta que se prende agregando la clase is-open si modalAlerta.abierto es verdadero */}
      <div class={`modal modal-alert ${modalAlerta.abierto ? "is-open" : ""}`}>
        <div class="modal-content">
          <div class="modal-header">
            <h3>{modalAlerta.titulo}</h3>
            {/* () => para crear una función rápida ahí mismo que cambia el estado cuando presionas la X */}
            <button
              class="modal-close"
              onClick={() => setModalAlerta({ ...modalAlerta, abierto: false })}
            >
              &times;
            </button>
          </div>
          <div class="modal-body">
            <p class="text-dark">{modalAlerta.mensaje}</p>
          </div>
          <div class="modal-footer">
            {/* función flecha en una sola línea que se activa únicamente cuando el usuario hace clic en Entendido */}
            <button
              class="btn btn-primary btn-sm"
              onClick={() => setModalAlerta({ ...modalAlerta, abierto: false })}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>

      {/* el signo && para que este cartel de confirmación se dibuje en la pantalla solo cuando modalConfirmar.abierto sea verdadero */}
      {modalConfirmar.abierto && (
        <div class="modal modal-primary is-open">
          <div class="modal-content">
            {/* Pone el título y la X de cerrar bien alineados a los lados en el cartel de confirmación */}
            <div class="modal-header">
              <h3>Confirmar Operación</h3>
              <button
                class="modal-close"
                onClick={() =>
                  setModalConfirmar({ ...modalConfirmar, abierto: false })
                }
              >
                &times;
              </button>
            </div>
            <div class="modal-body">
              <p class="text-dark text-center text-medium">
                {modalConfirmar.mensaje}
              </p>
            </div>
            <div class="modal-footer justify-center flex-gap">
              {/* Esta función flecha lleva async antes de arrancar porque adentro va a disparar la acción de borrar que necesita conectarse a la base de datos */}
              <button
                type="button"
                class="btn btn-dark btn-md text-bold"
                onClick={async () => {
                  // El await hace que el cartel se quede abierto hasta que la función de borrado termine por completo su trabajo en la base de datos
                  if (modalConfirmar.accion) await modalConfirmar.accion();
                  setModalConfirmar({ ...modalConfirmar, abierto: false });
                }}
              >
                Confirmar
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-md text-bold"
                onClick={() =>
                  setModalConfirmar({ ...modalConfirmar, abierto: false })
                }
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El formulario de la izquierda para poner el nombre, tipo y precio de lo que vendes */}
      <div class="d-flex f-wrap gap-1 mb-2">
        {/* La propiedad style cambia la transparencia usando opacidad 0.6 para ponerse borroso si estamos editando un lote de abajo */}
        <div
          class={`card card-light shadow-sm br-1 f-1 ${esEdicionLote ? "opacity-disabled" : "opacity-full"}`}
        >
          <div class="card-header fw-bold text-primary">
            {/* El signo de pregunta sirve para mostrar un título si esEdicionProducto es verdadero o poner otro si es falso */}
            {esEdicionProducto
              ? `Modificar Ficha (ID: ${nuevoProd.id})`
              : "Añadir Nuevo Insumo / Artículo"}
          </div>
          <div class="card-body">
            <div class="form-group mb-1">
              <label class="fw-bold">Nombre:</label>
              {/* Uso una función flecha directo en el onChange para capturar lo que la persona escribe letra por letra y guardarlo en la memoria al instante */}
              <input
                type="text"
                class="input"
                placeholder="Ej: Collar Antipulgas"
                value={nuevoProd.nombre}
                onChange={(e) =>
                  setNuevoProd({ ...nuevoProd, nombre: e.target.value })
                }
                disabled={esEdicionLote}
              />
            </div>
            <div class="d-flex gap-1 mb-1">
              <div class="form-group f-1">
                <label class="fw-bold">Clasificación / Tipo:</label>
                <select
                  class="input"
                  value={nuevoProd.tipo}
                  onChange={(e) =>
                    setNuevoProd({ ...nuevoProd, tipo: e.target.value })
                  }
                  disabled={esEdicionLote}
                >
                  <option value="Medicamento">Medicamento</option>
                  <option value="Accesorio">Accesorio</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Higiene">Higiene</option>
                </select>
              </div>
              <div class="form-group f-1">
                <label class="fw-bold">Precio Venta ($):</label>
                {/* Usa el nombre exacto de precioVenta todo junto para que se guarde bien en la memoria */}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  class="input"
                  placeholder="0.00"
                  value={nuevoProd.precioVenta}
                  onChange={(e) =>
                    setNuevoProd({ ...nuevoProd, precioVenta: e.target.value })
                  }
                  disabled={esEdicionLote}
                />
              </div>
            </div>
          </div>
        </div>

        {/* El formulario de la derecha para meter las cantidades nuevas, las fechas en que entran y cuándo vencen */}
        <div
          class={`card card-light shadow-sm br-1 f-1 ${esEdicionProducto && !requiereVencimientoFiltro ? "opacity-disabled" : "opacity-full"}`}
        >
          <div class="card-header fw-bold text-primary">
            {esEdicionLote
              ? `Corregir Parámetros de ${nuevoLote.loteId}`
              : "Ingresar Nuevo Lote al Almacén "}
          </div>
          <div class="card-body">
            <div class="form-group mb-1">
              <label class="fw-bold">Artículo del Catálogo:</label>
              {/* Se fija qué elegiste de la lista para esconder el calendario de vencimiento enseguida si elegiste un accesorio */}
              <select
                class="input"
                value={nuevoLote.productoNombre}
                onChange={(e) => {
                  const nombreSeleccionado = e.target.value;
                  // El .find busca el objeto del producto dueño de ese nombre para averiguar su tipo
                  const prodEncontrado = productos.find(
                    (p) => p.nombre === nombreSeleccionado,
                  );
                  const tipoEncontrado = prodEncontrado
                    ? prodEncontrado.tipo
                    : "Medicamento";

                  setNuevoProd((prev) => ({ ...prev, tipo: tipoEncontrado }));
                  setNuevoLote((prev) => ({
                    ...prev,
                    productoNombre: nombreSeleccionado,
                    vencimiento:
                      tipoEncontrado === "Accesorio" ? "No requiere" : "",
                  }));
                }}
                disabled={esEdicionProducto || esEdicionLote}
              >
                <option value="">-- Seleccionar --</option>
                {/* El .map agarra la lista completa de productos uno por uno y los transforma en opciones visuales para que puedas elegirlos en el menú desplegable */}
                {productos.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre} ({p.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div class="form-group mb-1">
              <label class="fw-bold">Cantidad (Uds):</label>
              <input
                type="number"
                class={`input ${esEdicionProducto ? "form-control-disabled text-bold bg-muted-light text-dark" : ""}`}
                value={nuevoLote.cantidad}
                onChange={(e) =>
                  setNuevoLote({ ...nuevoLote, cantidad: e.target.value })
                }
                disabled={esEdicionProducto}
              />
            </div>

            <div class="d-flex gap-1 mb-1">
              <div class="form-group f-1">
                <label class="fw-bold">Fecha de Ingreso:</label>
                <input
                  type="date"
                  class="input"
                  value={nuevoLote.ingreso}
                  onChange={(e) =>
                    setNuevoLote({ ...nuevoLote, ingreso: e.target.value })
                  }
                  disabled={esEdicionProducto}
                />
              </div>
              <div class="form-group f-1">
                <label class="fw-bold">Vencimiento Médico:</label>
                {/* El signo de exclamación al inicio revisa si NO requiere vencimiento para dibujar el texto plano, si no dibuja el calendario de fechas */}
                {!requiereVencimientoFiltro && !esEdicionLote ? (
                  <input
                    type="text"
                    class="input form-control-disabled bg-muted-light text-muted text-medium"
                    value="No requiere vencimiento"
                    disabled
                  />
                ) : (
                  <input
                    type="date"
                    min={fechaHoy}
                    class="input"
                    value={nuevoLote.vencimiento}
                    onChange={(e) =>
                      setNuevoLote({
                        ...nuevoLote,
                        vencimiento: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* El botón grande del medio que cambia de texto según lo que estés haciendo en ese momento */}
      <div class="card shadow-sm p-1 mb-3 bg-light br-1 d-flex gap-1">
        <button
          type="button"
          onClick={handleGuardarCambiosFormulario}
          class="btn btn-primary btn-md text-bold f-1"
        >
          {esEdicionProducto
            ? "Guardar Cambios del Producto"
            : esEdicionLote
              ? "Guardar Cambios del Lote"
              : "Registrar / Guardar Datos de Inventario"}
        </button>
        {/* El signo && hace que el botón de cancelar aparezca en pantalla solo si hay algo escrito o si estamos editando cosas de la lista */}
        {(esEdicionProducto ||
          esEdicionLote ||
          nuevoProd.nombre ||
          nuevoLote.productoNombre) && (
          <button
            type="button"
            onClick={handleCancelarTodo}
            class="btn btn-secondary btn-md text-bold"
          >
            Cancelar / Limpiar Formulario
          </button>
        )}
      </div>

      {/* La tabla del medio donde se ven todos los productos con cuánto stock queda en total y si hay alertas */}
      <div class="table-container shadow-sm br-1 mb-3">
        <table class="table table-clara-primary table-bordered">
          <thead>
            <tr>
              <th>#</th>
              <th>Artículo / Insumo</th>
              <th>Tipo</th>
              <th>Precio Venta</th>
              <th>Stock Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* El .map lee la lista completa de productos y va fabricando una fila visual para cada uno en la tabla de la pantalla */}
            {productos.map((prod, index) => {
              // El .filter separa solo los lotes de este artículo para poder sumarlos
              const lotesDelProd = lotes.filter(
                (l) => l.productoNombre === prod.nombre,
              );
              const stock = calcularStockTotalPEPS(lotesDelProd);
              const esCritico = stock <= 5;
              const tipoElemento = prod.tipo || "Medicamento";

              return (
                // La propiedad key= sirve para darle un número de documento de identidad único a cada fila para que la pantalla no se confunda al reordenar
                <tr
                  key={prod.id}
                  class={
                    nuevoProd.id === prod.id
                      ? "table-row-active bg-highlight"
                      : "table-row-normal"
                  }
                >
                  <td>{index + 1}</td>
                  <td class="fw-bold">{prod.nombre}</td>
                  <td>
                    <span class="badge info">{tipoElemento}</span>
                  </td>
                  <td>${prod.precioVenta.toFixed(2)}</td>
                  {/* El signo de pregunta acá adentro elige el color verde si el stock es mayor a cero, de lo contrario lo pinta de gris */}
                  <td>
                    <span
                      class={`badge ${stock > 0 ? "success" : "secondary"}`}
                    >
                      {stock} uds
                    </span>
                  </td>
                  <td>
                    <span class={`badge ${esCritico ? "alert" : "success"}`}>
                      {esCritico ? "CRÍTICO" : "ÓPTIMO"}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      {/* Funciones flecha rápidas adentro del onClick para mandar a llamar las acciones handle cuando el usuario hace clic */}
                      <button
                        onClick={() => handleSeleccionarEditarProducto(prod)}
                        class="btn btn-secondary btn-xs"
                        disabled={esEdicionLote || esEdicionProducto}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleBorrarProducto(prod.id)}
                        class="btn btn-alert btn-xs"
                        disabled={esEdicionLote || esEdicionProducto}
                      >
                        Retirar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Las tarjetitas de abajo del todo que te muestran qué paquetes llegaron primero para sacarlos en orden */}
      <div class="card card-light shadow-sm br-1">
        <div class="card-header fw-bold text-dark">
         PEPS (Vencimientos y Almacenamiento)
        </div>
        <div class="card-body">
          {productos.map((prod) => {
            // El .filter separa los lotes del producto y el .sort los acomoda cronológicamente restando sus fechas para dejar los más viejos primero
            const lotesDelProd = lotes
              .filter((l) => l.productoNombre === prod.nombre)
              .sort((a, b) => new Date(a.ingreso) - new Date(b.ingreso));

            const tipoProducto = prod.tipo || "Medicamento";

            return (
              <div key={prod.id} class="mb-2 border-bottom-light pb-1">
                <div class="fw-bold text-primary mb-1">
                  {prod.nombre} ({tipoProducto})
                </div>
                {/* El === 0 ? revisa si la lista de paquetes está totalmente vacía para poner el cartel gris, si tiene paquetes pasa al bloque de abajo */}
                {lotesDelProd.length === 0 ? (
                  <span class="badge secondary">SIN STOCK ACTIVO</span>
                ) : (
                  <div class="d-flex gap-1 f-wrap mt-1">
                    {/* El .map de los lotes dibuja cada tarjetita gris con los datos individuales de stock, fecha de entrada y vencimiento */}
                    {lotesDelProd.map((l) => (
                      <div
                        key={l.id}
                        class={`p-1 br-1 shadow-sm bg-light d-flex align-item gap-1 card-cronologia ${nuevoLote?.id === l.id ? "card-selected-border" : "card-border-none"}`}
                      >
                        <div>
                          <div class="text-secondary fw-bold">
                            Lote {l.loteId}
                          </div>
                          <div class="text-muted fs-sm">
                            Ingresó {l.ingreso}
                          </div>
                          {/* signo de pregunta que pinta las letras de gris si el artículo no se vence o de rojo si tiene fecha médica */}
                          <div
                            class={`${l.vencimiento === "No requiere" ? "text-muted" : "text-alert"} fw-bold fs-sm`}
                          >
                            Vence {l.vencimiento}
                          </div>
                          <div class="fw-bold text-dark mt-1">
                            Stock {l.cantidad} uds
                          </div>
                        </div>
                        <div class="d-flex f-col gap-1 ml-1 justify-center">
                          {/* funciones flecha en los clics para mandar los datos específicos de este lote hacia las funciones que los procesan */}
                          <button
                            onClick={() =>
                              handleSeleccionarEditarLoteDirecto(
                                l,
                                tipoProducto,
                              )
                            }
                            class="btn btn-secondary btn-xs"
                            disabled={esEdicionProducto || esEdicionLote}
                            title="Corregir este lote"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleBorrarLote(l.id)}
                            class="btn btn-alert btn-xs"
                            disabled={esEdicionProducto || esEdicionLote}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TablaInventario;
