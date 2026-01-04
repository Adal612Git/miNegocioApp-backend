import { Resend } from "resend";

const resend = new Resend(process.env.SMTP_PASS);

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  const { data, error } = await resend.emails.send({
    from: "Loto App <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("❌ Error de Resend API:", error);
    throw error;
  }

  console.log("✅ Correo enviado via API:", data?.id);
  return data;
};
