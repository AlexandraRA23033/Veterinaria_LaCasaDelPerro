import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { configurarBD } from "../../base-datos/configuracion";

const EstadoCita = ({ cita, alCambiarEstado, cargarCitas }) => {
    // ESTADOS LOCALES Y HOOKS
    const [procesando, setProcesando] = useState(false); // Evita clics repetidos bloqueando la interfaz mientras se conecta con la API o IndexedDB
    const navigate = useNavigate(); // Permite la redirección de pantallas (usado al reprogramar/posponer)
    
    // Estados para controlar dinámicamente el Modal de confirmación o error
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalTitulo, setModalTitulo] = useState('');
    const [modalMensaje, setModalMensaje] = useState('');

    // Helper rápido para configurar texto y abrir el modal personalizado
    const mostrarModal = (titulo, mensaje) => {
        setModalTitulo(titulo);
        setModalMensaje(mensaje);
        setModalAbierto(true);
    };

    //CREDENCIALES DE LA API CLOUD DE WHATSAPP
    const TOKEN = 'EAASPf8N8sxoBRZBFxR9yXiPKfpfk6JWkNz4onc8w59EHlIlhHTEMeugawz4jomqZBZAiFdieTMGncJMTkOaHIHJcZCHAPtoW4Nr6lqDcZBCIy08LVNRyjMwSuVdSVItFFkBYXTeieZCJJFjeJZBClOWV7r4kOxXG3Mq9ZCwI3nV2g9cg9Dna3u9FTjhuUyJGH62ABKfkbQ5tudS8cYCkw7fkc6EwUx0RgQpuHB5qWjqGcOZBLjwNwwqJwuvLCclQZCMSvUKXrRQVM7xUZAd2zuQyMnkz8EA'; //token generado de 24 horas
    const PHONE_ID = '1199483279910039'; //identificador de numero

    //FUNCIONES AUXILIARES Y DE RED
    // Limpia caracteres extraños del string de teléfono y valida/asigna el código de área de El Salvador ('503')
    const obtenerTelefonoDestino = () => {
        if (cita && cita.telefono) {
            const numeroLimpio = cita.telefono.replace(/[^0-9]/g, '');
            return numeroLimpio.startsWith('503') ? numeroLimpio : `503${numeroLimpio}`;
        }
        return '50376948130'; // Teléfono de respaldo por seguridad
    };

    // Realiza la petición HTTP POST asíncrona directa hacia los servidores oficiales de Meta (Facebook Graph API)
    const enviarWhatsAppMeta = async (payload) => {
        const url = `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`;
        try {
            const respuesta = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            return respuesta.ok; // Retorna true si el servidor devolvió un código 200-299
        } catch (error) {
            console.error("Error de conexión con Meta:", error);
            return false;
        }
    };

    // NOTIFICACIÓN DE APERTURA / REPROGRAMACIÓN
    const handleNotificarWhatsApp = async () => {
        setProcesando(true);
        const destinoFinal = obtenerTelefonoDestino();

        // Conversión estética del formato YYYY-MM-DD al clásico DD/MM/YYYY
        let fechaFormateada = cita.fecha || "Sin fecha";
        if (cita.fecha && cita.fecha.includes('-')) {
            const [anio, mes, dia] = cita.fecha.split('-');
            fechaFormateada = `${dia}/${mes}/${anio}`;
        }

        const horaFormateada = cita.hora || "Sin hora";
        let bodyMensaje = '';

        // Condicional para cambiar dinámicamente el mensaje personalizado dependiendo del estado actual
        if (cita.estado === 'Pospuesta') {
            bodyMensaje = `*La Casa del Perro* \n\n¡Hola ${cita.dueno}! Te informamos que la cita de tu mascota *${cita.mascota}* para el servicio de *${cita.servicio}* ha sido reprogramada con éxito.\n\n *Su cita es el día:* ${fechaFormateada}\n *A la hora:* ${horaFormateada}\n\n¡Te esperamos en este nuevo horario!`;
        } else {
            bodyMensaje = `*La Casa del Perro* \n\n¡Hola ${cita.dueno}! Queremos confirmarte que la cita para tu mascota *${cita.mascota}* ha sido programada de manera exitosa.\n\n*Su cita es el día:* ${fechaFormateada}\n*A la hora:* ${horaFormateada}\n\n¡Te esperamos!`;
        }

        // TRUCO DE LA API: Payload obligatorio con la plantilla por defecto ("hello_world") para abrir la ventana de conversación de 24 horas
        const payloadPlantilla = {
            messaging_product: "whatsapp",
            to: destinoFinal,
            type: "template",
            template: { name: "hello_world", language: { code: "en_US" } }
        };

        // Payload con el mensaje real personalizado de "La Casa del Perro"
        const payloadTexto = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: destinoFinal,
            type: "text",
            text: { preview_url: false, body: bodyMensaje }
        };

        console.log(`Enviando plantilla a: ${destinoFinal}`);
        const exitoPlantilla = await enviarWhatsAppMeta(payloadPlantilla);
        
        if (exitoPlantilla) {
            // Delay forzado de 1.5 segundos para dar tiempo a que Meta procese la plantilla antes del texto libre
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log(`Enviando mensaje personalizado a: ${destinoFinal}`);
            const exitoTexto = await enviarWhatsAppMeta(payloadTexto);
            
            if (exitoTexto) {
                mostrarModal("Notificación Exitosa", `¡Cliente notificado por WhatsApp al número: ${destinoFinal}!`);
                
                // Actualiza los flags de control en IndexedDB para saber que esta cita ya fue notificada y no repetir el proceso
                try {
                    const db = await configurarBD();
                    if (cita.estado === 'Pospuesta') {
                        await db.put("agenda", { ...cita, notificadaComoPospuesta: true });
                    } else {
                        await db.put("agenda", { ...cita, notificadaComoNueva: true });
                    }
                    await cargarCitas(); // Re-renderiza la tabla principal con los nuevos datos de la DB
                } catch (e) {
                    console.error("Error al guardar en IndexedDB:", e);
                }
            }
        } else {
            mostrarModal("Error de Conexión", "Hubo un problema con los servidores de Meta o el Token ha expirado.");
        }
        setProcesando(false);
    };
    //Cambio de estados completar/posponer/cancelar
    const handleAccionEstado = async (nuevoEstado) => {
        setProcesando(true);
        const destinoFinal = obtenerTelefonoDestino();

        // Accion especial : 'Pospuesta' no envía mensaje inmediato, guarda el estado y redirige al formulario de citas
        if (nuevoEstado === 'Pospuesta') {
            try {
                const db = await configurarBD();
                await db.put("agenda", { 
                    ...cita, 
                    estado: 'Pospuesta',
                    notificadaComoPospuesta: false // Resetea la notificación para obligar a enviar el nuevo WhatsApp
                });
                
                mostrarModal("Reprogramación", "Redirigiendo al formulario para reprogramar la información de la cita...");
                setTimeout(() => {
                    setModalAbierto(false);
                    // Viaja a la pantalla de agendar inyectando los datos de la cita actual mediante el state de React Router
                    navigate("/citas", { state: { citaAEditar: cita } });
                }, 2000);
                
                alCambiarEstado(cita.id, 'Pospuesta');
                await cargarCitas();
            } catch (e) {
                console.error("Error al posponer en IndexedDB:", e);
            }
            setProcesando(false);
            return;
        }

        // Redacción de mensajes instantáneos para cierres de cita
        let mensajeTexto = '';
        if (nuevoEstado === 'Completada') {
            mensajeTexto = `¡Hola ${cita.dueno}! Tu mascota ${cita.mascota} ha terminado su atención de "${cita.servicio}". ¡Está listo para ser recogido! Total: $${cita.precio.toFixed(2)}.`;
        } else if (nuevoEstado === 'Cancelada') {
            mensajeTexto = `¡Hola ${cita.dueno}! Te confirmamos que la cita para ${cita.mascota} ha sido cancelada exitosamente.`;
        }

        const payloadTexto = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: destinoFinal,
            type: "text",
            text: { preview_url: false, body: mensajeTexto }
        };

        // Lanza la notificación de cierre por WhatsApp
        const exito = await enviarWhatsAppMeta(payloadTexto);

        if (exito) {
            mostrarModal("Estado Actualizado", `Estado actualizado a "${nuevoEstado}" y cliente notificado.`);
        } else {
            mostrarModal("Actualización Local", "El estado se cambió localmente, pero no se pudo enviar la notificación por WhatsApp.");
        }
        
        // Ejecuta el callback padre para sincronizar los cambios de estado en el componente contenedor
        if (alCambiarEstado) alCambiarEstado(cita.id, nuevoEstado);
        setProcesando(false);
    };

    // RENDERIZADO CONDICIONAL DE LA INTERFA
    // Clausura: Si la cita ya terminó o se canceló, se destruyen los botones y solo muestra una etiqueta estática
    if (cita.estado === 'Completada' || cita.estado === 'Cancelada') {
        return <span className="badge secondary text-muted fs-0-75">Atención Finalizada</span>;
    }

    // Comprueba dinámicamente cuál flag de notificación evaluar según el estado de la cita
    const yaNotificado = cita.estado === 'Pospuesta' ? cita.notificadaComoPospuesta : cita.notificadaComoNueva;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          
          {/* CONTROL DEL BOTÓN PRINCIPAL DE WHATSAPP (Desaparece y muestra un check si el cliente ya fue notificado) */}
          {!yaNotificado ? (
            <button onClick={handleNotificarWhatsApp} disabled={procesando} className="btn-primary btn-block">
               {cita.estado === 'Pospuesta' ? '1. Notificar Cita Reprogramada' : '1. Notificar Cita Agendada'}
            </button>
          ) : (
            <span style={{ color: '#6E8F6B', fontSize: '12px', fontWeight: 'bold' }}>✓ Cliente Notificado</span>
          )}

          {/* CONTROL DE LOS BOTONES DE ACCIÓN (Deshabilitados hasta que el administrador envíe obligatoriamente el primer WhatsApp) */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button 
                onClick={() => handleAccionEstado('Completada')} 
                disabled={!yaNotificado || procesando} 
                className="btn-success"
            >
                Completar
            </button>
            <button 
                onClick={() => handleAccionEstado('Pospuesta')} 
                disabled={!yaNotificado || procesando} 
                className="btn-warning"
            >
                Posponer
            </button>
            <button 
                onClick={() => handleAccionEstado('Cancelada')} 
                disabled={!yaNotificado || procesando} 
                className="btn-danger"
            >
                Cancelar
            </button>
          </div>
          
          {/* ESTRUCTURA DEL MODAL INTERNO */}
          <div className={`modal ${modalAbierto ? 'is-open' : ''}`}>
            <div className="modal-content" style={{ padding: '20px', maxWidth: '400px', margin: 'auto', background: '#ffff', borderRadius: '8px' }}>
                <div className="modal-header d-flex j-cont-bet align-item mb-1" style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                    <h4 className="fw-bold text-dark">{modalTitulo}</h4>
                    <button className="btn-close" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setModalAbierto(false)}>×</button>
                </div>
                <div className="modal-body mb-2">
                    <p className="text-secondary fs-0-95">{modalMensaje}</p>
                </div>
                <div className="modal-footer d-flex j-cont-end">
                    <button className="btn-primary btn-sm" onClick={() => setModalAbierto(false)}>
                        Aceptar
                    </button>
                </div>
            </div>
          </div>
        </div>
    );
};

export default EstadoCita;