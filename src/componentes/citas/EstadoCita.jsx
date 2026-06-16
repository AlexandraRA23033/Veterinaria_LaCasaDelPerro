import { useState } from "react";
import { configurarBD } from "../../base-datos/configuracion";

const EstadoCita = ({ cita, alCambiarEstado, cargarCitas }) => {
    const [procesando, setProcesando] = useState(false);

    const TOKEN = 'EAASPf8N8sxoBRl8l7aZCbaoKXfl7eyV6WTui67l965ZAHkByBESCAe4JTgwrRP0YqrAJ3DxAvuJtt0C826mLfHQTKTBNBnr9GIiLGBiL0cde7hMbDLGnZA9r17wkgkXZCPrk9n01PH0NOxo6aVYlFZC9DL9ltkl8IofTUqzXrENZBNRspjvZCFlGNjBkZB6Cu2yuyhacHh8rXAwZA96ZAO5fPnhL1mCSDQ2IqR1nNxwZCMJp9c1lBjOBhWJ87h7fZAbRN7gwADiceUYKr3kG3xBNGAxDRtvMIwZDZD'; 
    const PHONE_ID = '1199483279910039'; 
    const TELEFONO_DESTINO = '50376948130'; 

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
            return respuesta.ok;
        } catch (error) {
            console.error("Error de conexión con Meta:", error);
            return false;
        }
    };

    // FUNCIÓN ÚNICA DE NOTIFICACIÓN TOTALMENTE DINÁMICA
    const handleNotificarWhatsApp = async () => {
        setProcesando(true);

        // Formatear fecha de YYYY-MM-DD a DD/MM/YYYY
        let fechaFormateada = cita.fecha;
        if (cita.fecha.includes('-')) {
            const [anio, mes, dia] = cita.fecha.split('-');
            fechaFormateada = `${dia}/${mes}/${anio}`;
        }

        let bodyMensaje = '';

        if (cita.estado === 'Pospuesta') {
            // MENSAJE DINÁMICO PARA CITAS POSPUESTAS
            bodyMensaje = `🐾 *La Casa del Perro* 🐾\n\n¡Hola ${cita.dueno}! Te informamos que la cita de tu mascota *${cita.mascota}* para el servicio de *${cita.servicio}* ha sido reprogramada con éxito.\n\n *Su cita es el día:* ${fechaFormateada}\n *A la hora:* ${cita.hora}\n\n¡Te esperamos en este nuevo horario!`;
        } else {
            // MENSAJE DINÁMICO PARA CITAS NUEVAS (PENDIENTES)
            bodyMensaje = `🐾 *La Casa del Perro* 🐾\n\n¡Hola ${cita.dueno}! Queremos confirmarte que la cita para tu mascota *${cita.mascota}* ha sido programada de manera exitosa.\n\n*Su cita es el día:* ${fechaFormateada}\n*A la hora:* ${cita.hora}\n\n¡Te esperamos!`;
        }

        // Enviamos primero la plantilla de control de Meta requerida
        const payloadPlantilla = {
            messaging_product: "whatsapp",
            to: TELEFONO_DESTINO,
            type: "template",
            template: { name: "hello_world", language: { code: "en_US" } }
        };

        const payloadTexto = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: TELEFONO_DESTINO,
            type: "text",
            text: { preview_url: false, body: bodyMensaje }
        };

        const exitoPlantilla = await enviarWhatsAppMeta(payloadPlantilla);
        if (exitoPlantilla) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const exitoTexto = await enviarWhatsAppMeta(payloadTexto);
            
            if (exitoTexto) {
                alert(`¡Cliente notificado por WhatsApp con el formato: "el día ${fechaFormateada} a la hora ${cita.hora}"!`);
                
                // Guardamos en IndexedDB que esta cita ya fue notificada para cambiar el botón
                try {
                    const db = await configurarBD();
                    if (cita.estado === 'Pospuesta') {
                        await db.put("agenda", { ...cita, notificadaComoPospuesta: true });
                    } else {
                        await db.put("agenda", { ...cita, notificadaComoNueva: true });
                    }
                    await cargarCitas(); // Refrescamos la vista
                } catch (e) {
                    console.error(e);
                }
            }
        } else {
            alert(`Hubo un problema con los servidores de Meta o el Token.`);
        }
        setProcesando(false);
    };

    const handleAccionEstado = async (nuevoEstado) => {
        if (nuevoEstado === 'Pospuesta') {
            alCambiarEstado(cita.id, 'Pospuesta');
            return;
        }

        setProcesando(true);
        let mensajeTexto = '';
        if (nuevoEstado === 'Completada') {
            mensajeTexto = `🐾 ¡Hola ${cita.dueno}! Tu mascota ${cita.mascota} ha terminado su atención de "${cita.servicio}". ¡Está listo para ser recogido! Total: $${cita.precio.toFixed(2)}.`;
        } else if (nuevoEstado === 'Cancelada') {
            mensajeTexto = `¡Hola ${cita.dueno}! Te confirmamos que la cita para ${cita.mascota} ha sido cancelada exitosamente.`;
        }

        const payloadTexto = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: TELEFONO_DESTINO,
            type: "text",
            text: { preview_url: false, body: mensajeTexto }
        };

        const exito = await enviarWhatsAppMeta(payloadTexto);
        if (exito) {
            alert(`Estado actualizado a "${nuevoEstado}" y cliente notificado.`);
            alCambiarEstado(cita.id, nuevoEstado);
        }
        setProcesando(false);
    };

    if (cita.estado === 'Completada' || cita.estado === 'Cancelada') {
        return <span className="badge secondary text-muted fs-0-75">Atención Finalizada</span>;
    }

    // Determinar si ya se mandó la notificación según el estado actual
    const yaNotificado = cita.estado === 'Pospuesta' ? cita.notificadaComoPospuesta : cita.notificadaComoNueva;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          
          {!yaNotificado ? (
            <button onClick={handleNotificarWhatsApp} disabled={procesando} className="btn-primary btn-block">
               {cita.estado === 'Pospuesta' ? '1. Notificar Cita Reprogramada' : '1. Notificar Cita Agendada'}
            </button>
          ) : (
            <span style={{ color: '#6E8F6B', fontSize: '12px', fontWeight: 'bold' }}>✓ Cliente Notificado</span>
          )}

          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => handleAccionEstado('Completada')} disabled={procesando} className="btn-success">Completar</button>
            <button onClick={() => handleAccionEstado('Pospuesta')} disabled={procesando} className="btn-warning">Posponer</button>
            <button onClick={() => handleAccionEstado('Cancelada')} disabled={procesando} className="btn-danger">Cancelar</button>
          </div>
        </div>
    );
};

export default EstadoCita;