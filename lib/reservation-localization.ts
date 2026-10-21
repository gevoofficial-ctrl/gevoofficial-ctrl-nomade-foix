import type { Lang } from './menu';

const copy={
  fr:{origin:'Origine non valide',large:'Requête trop volumineuse',invalid:'Requête non valide',details:'Vérifiez les informations de réservation',closed:'Le restaurant est fermé à cette date',availability:'La disponibilité est momentanément indisponible. Appelez le restaurant.',unavailable:'Les réservations sont momentanément indisponibles. Appelez le restaurant.',rate:'Trop de demandes. Appelez le restaurant.',failed:'Impossible d’envoyer la réservation. Appelez le restaurant.',subject:'Confirmation de votre réservation chez NOMADE',greeting:'Bonjour',message:'Votre réservation a bien été enregistrée, merci et à bientôt !',signoff:'Cordialement'},
  en:{origin:'Invalid origin',large:'Request too large',invalid:'Invalid request',details:'Please check the reservation details',closed:'The restaurant is closed on this date',availability:'Availability is temporarily unavailable. Please call the restaurant.',unavailable:'Reservations are temporarily unavailable. Please call the restaurant.',rate:'Too many requests. Please call the restaurant.',failed:'Unable to send the booking. Please call the restaurant.',subject:'Confirmation of your booking at NOMADE',greeting:'Hello',message:'Your booking has been registered. Thank you, and see you soon!',signoff:'Best regards'},
  es:{origin:'Origen no válido',large:'Solicitud demasiado grande',invalid:'Solicitud no válida',details:'Revisa los datos de la reserva',closed:'El restaurante está cerrado en esta fecha',availability:'No se puede comprobar la disponibilidad temporalmente. Llama al restaurante.',unavailable:'Las reservas no están disponibles temporalmente. Llama al restaurante.',rate:'Demasiadas solicitudes. Llama al restaurante.',failed:'No se pudo enviar la reserva. Llama al restaurante.',subject:'Confirmación de tu reserva en NOMADE',greeting:'Hola',message:'Tu reserva se ha registrado. ¡Gracias y hasta pronto!',signoff:'Un cordial saludo'},
};
export function reservationCopy(lang:Lang){return copy[lang];}
export function reservationConfirmation(lang:Lang,name:string){
  const t=copy[lang];
  return {subject:t.subject,text:`${t.greeting} ${name},\n\n${t.message}\n\n${t.signoff},\nNOMADE`};
}
