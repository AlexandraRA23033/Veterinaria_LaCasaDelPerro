import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { configurarBD } from "../../base-datos/configuracion";

const EstadoCita = ({ cita, alCambiarEstado, cargarCitas }) => {
    const [procesando, setProcesando] = useState(false);
    const navigate = useNavigate(); // 🚀 Inicialización del navegador de rutas
    
    // ➕ AGREGAR ESTO:
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalTitulo, setModalTitulo] = useState('');
    const [modalMensaje, setModalMensaje] = useState('');

    // Función auxiliar para abrir el modal cómodamente
    const mostrarModal = (titulo, mensaje) => {
        setModalTitulo(titulo);
        setModalMensaje(mensaje);
        setModalAbierto(true);
    };

    const TOKEN = 'EAASPf8N8sxoBR2dj0oOBVYZAtik4Tf1eEooyHTFZBJ6LiGqFQm7YMDlZAiT31mnLVraeyMKRrsHogE9alqlj32rsDl642aHLH69MJM9CBksghkYZA9vw53UAm6P4eMr1MlQynAVTvUbkcUj6oZCAHqbOxZAooMYZB4qtdaQsKAhcqer67Bqu3tZBqtKIEzJ2nZB7hjxX3glDtVPuWZAjgZAGnSwtRdVi6mctmPyMQibtZAEfu9dZA0ZBeWm13G3T90MZBxP5ChBuZC5kcT7zKJofadthiZA6EGY6s'; 
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

    const handleNotificarWhatsApp = async () => {
        setProcesando(true);

        let fechaFormateada = cita.fecha || "Sin fecha";
        if (cita.fecha && cita.fecha.includes('-')) {
            const [anio, mes, dia] = cita.fecha.split('-');
            fechaFormateada = `${dia}/${mes}/${anio}`;
        }

        const horaFormateada = cita.hora || "Sin hora";
        let bodyMensaje = '';

        if (cita.estado === 'Pospuesta') {
            bodyMensaje = `🐾 *La Casa del Perro* 🐾\n\n¡Hola ${cita.dueno}! Te informamos que la cita de tu mascota *${cita.mascota}* para el servicio de *${cita.servicio}* ha sido reprogramada con éxito.\n\n *Su cita es el día:* ${fechaFormateada}\n *A la hora:* ${horaFormateada}\n\n¡Te esperamos en este nuevo horario!`;
        } else {
            bodyMensaje = `🐾 *La Casa del Perro* 🐾\n\n¡Hola ${cita.dueno}! Queremos confirmarte que la cita para tu mascota *${cita.mascota}* ha sido programada de manera exitosa.\n\n*Su cita es el día:* ${fechaFormateada}\n*A la hora:* ${horaFormateada}\n\n¡Te esperamos!`;
        }

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
                mostrarModal("Notificación Exitosa", `¡Cliente notificado por WhatsApp con el formato: "el día ${fechaFormateada} a la hora ${horaFormateada}"!`);
                
                try {
                    const db = await configurarBD();
                    if (cita.estado === 'Pospuesta') {
                        await db.put("agenda", { ...cita, notificadaComoPospuesta: true });
                    } else {
                        await db.put("agenda", { ...cita, notificadaComoNueva: true });
                    }
                    await cargarCitas(); 
                } catch (e) {
                    console.error("Error al guardar en IndexedDB:", e);
                }
            }
        } else {
            mostrarModal("Error de Conexión", "Hubo un problema con los servidores de Meta o el Token.");
        }
        setProcesando(false);
    };

    const handleAccionEstado = async (nuevoEstado) => {
        setProcesando(true);

        if (nuevoEstado === 'Pospuesta') {
            try {
                const db = await configurarBD();
                await db.put("agenda", { 
                    ...cita, 
                    estado: 'Pospuesta',
                    notificadaComoPospuesta: false 
                });
                
                mostrarModal("Reprogramación", "Redirigiendo al formulario para reprogramar la información de la cita...");
                setTimeout(() => {
                    setModalAbierto(false);
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
            mostrarModal("Estado Actualizado", `Estado actualizado a "${nuevoEstado}" y cliente notificado.`);
        } else {
            mostrarModal("Actualización Local", "El estado se cambió localmente, pero no se pudo enviar la notificación por WhatsApp.");
        }
        if (alCambiarEstado) alCambiarEstado(cita.id, nuevoEstado);
        };

        if (cita.estado === 'Completada' || cita.estado === 'Cancelada') {
            return <span className="badge secondary text-muted fs-0-75">Atención Finalizada</span>;
        }

    const yaNotificado = cita.estado === 'Pospuesta' ? cita.notificadaComoPospuesta : cita.notificadaComoNueva;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          
          {/* BOTÓN DE NOTIFICACIÓN */}
          {!yaNotificado ? (
            <button onClick={handleNotificarWhatsApp} disabled={procesando} className="btn-primary btn-block">
               {cita.estado === 'Pospuesta' ? '1. Notificar Cita Reprogramada' : '1. Notificar Cita Agendada'}
            </button>
          ) : (
            <span style={{ color: '#6E8F6B', fontSize: '12px', fontWeight: 'bold' }}>✓ Cliente Notificado</span>
          )}

          {/* BOTONES DE ACCIÓN */}
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
        <div className={`modal ${modalAbierto ? 'is-open' : ''}`}>
            <div className="modal-content" style={{ padding: '20px', maxWidth: '400px', margin: 'auto', background: '#fff', borderRadius: '8px' }}>
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