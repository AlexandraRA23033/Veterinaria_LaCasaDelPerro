import { useState } from 'react';

const EstadoCita = ({ cita, alCambiarEstado }) => {
  const [procesando, setProcesando] = useState(false);
  const [citaAgendadaNotificada, setCitaAgendadaNotificada] = useState(false);

  // 1. CREDENCIALES DE META DEVELOPERS (API)
  const TOKEN = 'EAASPf8N8sxoBRmLM1FrU3aaCn5KBewg0ZCE1IZBgXG4IZBFgs2CKd2lrp0eSpTXb7YFJG6WTVXRJFOojhckZCJ0iZBAvsAYDk0gBS4dS8IvZCZCssjk8Y2KZC7l9HBZBtBcYk1Ia5BWGtFzQ5ItybM7F39KFmCuWKAQgMKTHZA2YsKQIHppfU2qzlVWThbDXJnnhFaEV6gIxVslA33B6399SY7uf1NsiAOMwthIdg3Rf6ciHsQk6f7bq45DN59FOr778cDrTHuzXyqjrEuLeWnLSJIa5PO'; 
  const PHONE_ID = '1199483279910039'; 

//numero verificado en meta
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

  // FLUJO DE CONEXIÓN SEGURO: Plantilla de Meta + Texto personalizado inmediato
  const handleNotificarAgendada = async () => {
    setProcesando(true);

    const payloadPlantilla = {
      messaging_product: "whatsapp",
      to: TELEFONO_DESTINO,
      type: "template",
      template: {
        name: "hello_world", 
        language: { code: "en_US" }
      }
    };

    const payloadTextoEspanol = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: TELEFONO_DESTINO,
      type: "text",
      text: { 
        preview_url: false,
        body: `🐾 ¡Hola ${cita.dueno}! Te saluda La Casa del Perro. Queremos confirmarte que la cita para tu mascota ${cita.mascota} ha sido programada exitosamente. ¡Te esperamos!` 
      }
    };

    const exitoPlantilla = await enviarWhatsAppMeta(payloadPlantilla);
    
    if (exitoPlantilla) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const exitoTexto = await enviarWhatsAppMeta(payloadTextoEspanol);
      
      if (exitoTexto) {
        alert(`¡Cita Notificada exitosamente en español!`);
        setCitaAgendadaNotificada(true);
      }
    } else {
      alert(`Hubo un problema con los servidores de Meta o el Token.`);
    }

    setProcesando(false);
  };

  // Actualizaciones de estados posteriores
  const handleAccionEstado = async (nuevoEstado) => {
    setProcesando(true);
    
    let mensajeTexto = '';
    if (nuevoEstado === 'Completada') {
      mensajeTexto = `🐾 ¡Hola ${cita.dueno}! Tu mascota ${cita.mascota} ha terminado su atención de "${cita.servicio}" en La Casa del Perro. ¡Está listo para ser recogido! Total a pagar: $${cita.precio ? cita.precio.toFixed(2) : '0.00'}. ¡Gracias por su preferencia!`;
    } else if (nuevoEstado === 'Pospuesta') {
      mensajeTexto = `¡Hola ${cita.dueno}! Te informamos que la cita de ${cita.mascota} ha sido pospuesta por inconvenientes de agenda. Nos comunicaremos pronto para reprogramar el horario.`;
    } else if (nuevoEstado === 'Cancelada') {
      mensajeTexto = `¡Hola ${cita.dueno}! Te confirmamos que la cita para ${cita.mascota} ha sido cancelada exitosamente en nuestro sistema.`;
    }

    const payloadTexto = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: TELEFONO_DESTINO,
      type: "text",
      text: { 
        preview_url: false,
        body: mensajeTexto 
      }
    };

    const exito = await enviarWhatsAppMeta(payloadTexto);
    if (exito) {
      alert(`Estado actualizado a "${nuevoEstado}" y cliente notificado.`);
      alCambiarEstado(cita.id, nuevoEstado);
    }
    setProcesando(false);
  };

  if (cita.estado === 'Completada' || cita.estado === 'Cancelada') {
    return <span style={{ color: '#B8B2A0', fontSize: '13px', fontStyle: 'italic' }}>Atención Finalizada</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
      
      {/* PASO 1: Notificación inicial usando tus clases .btn-primary y .btn-block */}
      {!citaAgendadaNotificada ? (
        <button
          onClick={handleNotificarAgendada}
          disabled={procesando}
          className="btn-primary btn-block"
        >
           1. Notificar Cita Agendada
        </button>
      ) : (
        <span style={{ color: '#6E8F6B', fontSize: '12px', fontWeight: 'bold' }}>✓ Cliente Notificado del Registro</span>
      )}

      {/* PASO 2: Botones usando tus clases exactas de CSS .btn-success, .btn-warning y .btn-danger */}
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          onClick={() => handleAccionEstado('Completada')} 
          disabled={procesando || !citaAgendadaNotificada}
          className="btn-success"
        >
          Completar
        </button>

        <button 
          onClick={() => handleAccionEstado('Pospuesta')} 
          disabled={procesando || !citaAgendadaNotificada}
          className="btn-warning"
        >
          Posponer
        </button>

        <button 
          onClick={() => handleAccionEstado('Cancelada')} 
          disabled={procesando || !citaAgendadaNotificada}
          className="btn-danger"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default EstadoCita;