import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: "resend",
    pass: process.env.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("✅ RESEND conectado - Sistema de correos Blindado");
  })
  .catch((error) => {
    console.error("❌ Error en Resend:", error.message);
  });
