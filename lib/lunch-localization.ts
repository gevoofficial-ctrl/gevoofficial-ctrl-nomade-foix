export type LunchLanguage = 'fr' | 'en' | 'es';
export const lunchLanguage = (value:unknown):LunchLanguage => value === 'en' || value === 'es' ? value : 'fr';

export const lunchMessages = {
  fr: {
    origin:'Origine de la requête invalide.', tooLarge:'La demande est trop volumineuse.', invalidRequest:'Requête invalide.', invalidAttempt:'Identifiant de tentative invalide.',
    invalidDetails:'Veuillez vérifier les informations de commande.', closed:'Le restaurant est fermé à cette date.',
    availability:'La disponibilité est momentanément indisponible. Réessayez plus tard ou appelez-nous au 07 45 26 28 23.',
    addDish:'Ajoutez au moins un plat à votre commande.', priceMissing:'Le prix habituel de cette sélection est momentanément indisponible. Choisissez une autre sélection ou appelez-nous.',
    unavailable:'Le service est temporairement indisponible. Appelez-nous au 07 45 26 28 23.', pending:'Envoi en cours…',
    uncertain:'L’envoi de la commande {order} nécessite une vérification. Appelez-nous au 07 45 26 28 23.',
    retry:'Service temporairement indisponible. Conservez votre tentative et réessayez.', mismatch:'Cette tentative correspond à une autre commande.',
    rateLimited:'Trop de nouvelles demandes. Patientez 15 minutes avant de réessayer ou appelez-nous au 07 45 26 28 23.',
    title:'Déjeuner à emporter', subject:'Confirmation de votre commande', accepted:'Votre commande {order} est bien enregistrée.', greeting:'Bonjour',
    thanks:'Merci pour votre commande et pour votre choix de NOMADE. Vous trouverez ci-dessous le récapitulatif de votre commande.',
    pickup:'Retrait', time:'Heure', mains:'Plats', drinks:'Boissons', none:'Aucun', comment:'Commentaire', total:'Total',
    payment:'Le règlement sera effectué sur place le jour du retrait.', goodbye:'Nous vous attendons avec plaisir chez NOMADE. À très bientôt.',
  },
  en: {
    origin:'Invalid request origin.', tooLarge:'The request is too large.', invalidRequest:'Invalid request.', invalidAttempt:'Invalid attempt identifier.',
    invalidDetails:'Please check your order details.', closed:'The restaurant is closed on this date.',
    availability:'Availability is temporarily unavailable. Try again later or call +33 7 45 26 28 23.',
    addDish:'Add at least one main to your order.', priceMissing:'The regular price for this selection is temporarily unavailable. Choose another selection or call us.',
    unavailable:'The service is temporarily unavailable. Call +33 7 45 26 28 23.', pending:'Sending…',
    uncertain:'Delivery of order {order} needs to be checked. Call +33 7 45 26 28 23.',
    retry:'The service is temporarily unavailable. Keep this attempt and try again.', mismatch:'This attempt belongs to a different order.',
    rateLimited:'Too many new requests. Wait 15 minutes before trying again or call +33 7 45 26 28 23.',
    title:'Takeaway lunch', subject:'Confirmation of your order', accepted:'Your order {order} has been received.', greeting:'Hello',
    thanks:'Thank you for your order and for choosing NOMADE. Your order summary is below.',
    pickup:'Pickup', time:'Time', mains:'Mains', drinks:'Drinks', none:'None', comment:'Comment', total:'Total',
    payment:'Payment will be made on site on the pickup day.', goodbye:'We look forward to welcoming you to NOMADE. See you soon.',
  },
  es: {
    origin:'Origen de la solicitud no válido.', tooLarge:'La solicitud es demasiado grande.', invalidRequest:'Solicitud no válida.', invalidAttempt:'Identificador de intento no válido.',
    invalidDetails:'Revisa los datos del pedido.', closed:'El restaurante está cerrado en esta fecha.',
    availability:'La disponibilidad no está accesible temporalmente. Inténtalo más tarde o llama al +33 7 45 26 28 23.',
    addDish:'Añade al menos un plato a tu pedido.', priceMissing:'El precio habitual de esta selección no está disponible temporalmente. Elige otra selección o llámanos.',
    unavailable:'El servicio no está disponible temporalmente. Llama al +33 7 45 26 28 23.', pending:'Enviando…',
    uncertain:'Es necesario comprobar el envío del pedido {order}. Llama al +33 7 45 26 28 23.',
    retry:'El servicio no está disponible temporalmente. Conserva este intento y vuelve a intentarlo.', mismatch:'Este intento corresponde a otro pedido.',
    rateLimited:'Demasiadas solicitudes nuevas. Espera 15 minutos antes de volver a intentarlo o llama al +33 7 45 26 28 23.',
    title:'Almuerzo para llevar', subject:'Confirmación de tu pedido', accepted:'Tu pedido {order} ha sido recibido.', greeting:'Hola',
    thanks:'Gracias por tu pedido y por elegir NOMADE. A continuación encontrarás el resumen de tu pedido.',
    pickup:'Recogida', time:'Hora', mains:'Platos', drinks:'Bebidas', none:'Ninguna', comment:'Comentario', total:'Total',
    payment:'El pago se realizará en el local el día de la recogida.', goodbye:'Te esperamos con mucho gusto en NOMADE. Hasta pronto.',
  },
} as const;

type EmailLine = {dish:{translations:Record<LunchLanguage,{name:string}>};quantity:number;total:number};
type CustomerOrder = {lang:LunchLanguage; firstName:string; orderNumber:string; date:string; time:string; dishes:EmailLine[]; drinks:EmailLine[]; total:number; comment:string};
const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export function customerLunchMail(order:CustomerOrder) {
  const {lang,firstName,orderNumber,time,comment}=order, t=lunchMessages[lang];
  const money=(cents:number)=>new Intl.NumberFormat(lang,{style:'currency',currency:'EUR'}).format(cents/100);
  const name=(line:EmailLine)=>line.dish.translations[lang].name || line.dish.translations.fr.name;
  const date=new Intl.DateTimeFormat(lang,{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(new Date(`${order.date}T12:00:00Z`));
  const lineText=(lines:EmailLine[])=>lines.length?lines.map(line=>`- ${name(line)} × ${line.quantity} — ${money(line.total)}`).join('\n'):`- ${t.none}`;
  const accepted=t.accepted.replace('{order}',orderNumber);
  const summary=`${t.pickup} : ${date}\n${t.time} : ${time} (Europe/Paris)\n42 Rue des Chapeliers · 09000 Foix\n\n${t.mains} :\n${lineText(order.dishes)}\n\n${t.drinks} :\n${lineText(order.drinks)}\n\n${comment?`${t.comment} : ${comment}\n`:''}${t.total} : ${money(order.total)}\n\n${t.payment}`;
  const rows=[...order.dishes,...order.drinks].map(line=>`<tr><td style="padding:12px 0;border-bottom:1px solid #dfd5c5">${escapeHtml(name(line))} × ${line.quantity}</td><td style="padding:12px 0;text-align:right;border-bottom:1px solid #dfd5c5">${escapeHtml(money(line.total))}</td></tr>`).join('');
  return {
    subject:`${t.subject} ${orderNumber} — NOMADE`,
    text:`${t.greeting} ${firstName},\n\n${accepted}\n\n${t.thanks}\n\n${summary}\n\n${t.goodbye}`,
    html:`<!doctype html><html lang="${lang}"><body style="margin:0;background:#f1eadf;color:#29241d;font-family:Arial,sans-serif"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;background:#fffaf2"><tr><td style="padding:32px;background:#17140f;color:#e9e1d1"><p style="letter-spacing:5px;font-size:14px">NOMADE · FOIX</p><h1 style="font-family:Georgia,serif;font-size:34px;font-weight:normal">${t.title}</h1><p>${escapeHtml(accepted)}</p></td></tr><tr><td style="padding:32px"><p>${t.greeting} ${escapeHtml(firstName)},</p><p>${t.thanks}</p><p><strong>${t.pickup} : ${escapeHtml(date)} · ${escapeHtml(time)} (Europe/Paris)</strong><br><a href="https://www.google.com/maps/search/?api=1&amp;query=NOMADE%2C%2042%20Rue%20des%20Chapeliers%2C%2009000%20Foix%2C%20France">42 Rue des Chapeliers · 09000 Foix</a></p><table width="100%" style="border-collapse:collapse">${rows}<tr><td style="padding:18px 0"><strong>${t.total}</strong></td><td style="text-align:right;font-size:24px">${escapeHtml(money(order.total))}</td></tr></table>${comment?`<p><strong>${t.comment}</strong><br>${escapeHtml(comment).replace(/\n/g,'<br>')}</p>`:''}<p style="padding:16px;background:#f1eadf">${t.payment}</p><p>${t.goodbye}</p><p><a href="tel:+33745262823">+33 7 45 26 28 23</a></p></td></tr></table></td></tr></table></body></html>`,
  };
}
