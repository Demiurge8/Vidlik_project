import crypto from "crypto";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "http://localhost:3000";

export const generateEmailVerificationToken = () =>
  crypto.randomBytes(32).toString("hex");

export const hashEmailVerificationToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const getEmailVerificationExpiresAt = () =>
  new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

export const sendEmailVerification = async ({
  email,
  token,
}: {
  email: string;
  token: string;
}) => {
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Vidlik <no-reply@vidlik.dk>";

  if (!apiKey) {
    console.info("[auth] verification link (no mailer configured)", {
      email,
      verifyUrl,
    });
    return;
  }

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Підтвердіть акаунт Vidlik",
        html: `
          <p>Дякуємо за реєстрацію у Vidlik.</p>
          <p>Підтвердіть email, натиснувши на посилання нижче:</p>
          <p><a href="${verifyUrl}" target="_blank">${verifyUrl}</a></p>
          <p>Якщо це були не ви — проігноруйте цей лист.</p>
        `,
        text: `Підтвердіть акаунт Vidlik: ${verifyUrl}`,
      }),
    });
  } catch (err) {
    console.error("resend email error", err);
  }
};
