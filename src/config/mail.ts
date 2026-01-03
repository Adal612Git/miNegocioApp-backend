import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

transporter
  .verify()
  .then(() => {
    console.log("✅ Conexión SMTP (Puerto 587) exitosa");
  })
  .catch((error) => {
    console.error("❌ Error en 587:", error.message);
  });
