import "dotenv/config";
import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD;
const emailFrom = process.env.EMAIL_FROM;

if(
    !smtpHost ||
    !smtpPort ||
    !smtpUser ||
    !smtpPassword ||
    !emailFrom
) {
    throw new Error("SMTP Environment variables are not configured");
}

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: smtpUser,
        pass: smtpPassword,
    },
});

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
) {
    await transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text,
    });
}