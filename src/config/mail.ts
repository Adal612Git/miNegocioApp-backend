import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("✅ Gmail Service listo para enviar correos");
  })
  .catch((error) => {
    console.error("❌ Error crítico de conexión Mail:", error);
  });
