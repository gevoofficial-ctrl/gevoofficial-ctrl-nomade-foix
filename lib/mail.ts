import nodemailer from 'nodemailer';

export function mailConfiguration() {
  const host = process.env.NOMADE_SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.NOMADE_SMTP_PORT || 465);
  const secure = process.env.NOMADE_SMTP_SECURE === 'true' || port === 465;
  const user = process.env.NOMADE_SMTP_USER || 'nomaderestaubar@gmail.com';
  const pass = process.env.NOMADE_SMTP_PASSWORD;
  const from = process.env.NOMADE_SMTP_FROM || user;
  const to = process.env.NOMADE_RESERVATIONS_TO || 'nomaderestaubar@gmail.com';
  if (!host || !user || !pass || !from || !to || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, secure, user, pass, from, to };
}
export function mailTransport(config:NonNullable<ReturnType<typeof mailConfiguration>>) {
  return nodemailer.createTransport({ host:config.host, port:config.port, secure:config.secure, requireTLS:!config.secure,
    auth:{ user:config.user, pass:config.pass }, connectionTimeout:10000, greetingTimeout:10000, socketTimeout:15000 });
}
