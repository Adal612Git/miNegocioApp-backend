import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 587;
const isSecure = port === 465;

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log(
      `Mail server connected on port ${port} (Secure: ${isSecure})`
    );
  })
  .catch((error) => {
    console.error("Mail server connection error:", error);
  });
