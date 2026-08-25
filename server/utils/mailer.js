// mailer.js
/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
// IMPORT REQUIRED MODULES AND PACKAGES
const nodemailer = require('nodemailer');

// Extract environmental variables (with safe fallbacks for local dev)
const smtpHost = process.env.SMTP_HOST;// Mail server hostname
const smtpPort = Number(process.env.SMTP_PORT) || 587;// Mail server port (587 = STARTTLS)
const smtpUser = process.env.SMTP_USER;// Mail account username
const smtpPassword = process.env.SMTP_PASSWORD;// Mail account password/app password
/* Port 465 is implicit TLS; every other port starts plain and upgrades with
STARTTLS. SMTP_SECURE overrides that default when a provider needs it. */
const smtpSecure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : smtpPort === 465;
const mailFrom = process.env.MAIL_FROM || 'no-reply@taxcurrencycalculator.local';// Sender address

/*=====CHECK IF ALL THE ENVIRONMENTAL VARIABLES ARE PRESENT=========
A transport can only be built when a host is configured. Without one the
application still runs: emails are written to the console instead, so the
password reset flow stays usable in development without SMTP credentials.*/
const smtpConfigured = Boolean(smtpHost);

// Conditional rendering to check if the environmental variables are missing
if (!smtpConfigured) {
    console.warn('[WARNING: mailer.js] SMTP_HOST not set. Emails will be logged to the console instead of sent.');// Log a warning message in the console for debugging purposes
}
// Conditional rendering to check if the environmental variables are missing
else if (!smtpUser || !smtpPassword) {
    console.warn('[WARNING: mailer.js] SMTP_USER or SMTP_PASSWORD not set. Connecting to the mail server without authentication.');// Log a warning message in the console for debugging purposes
}

/*──────────────────────────── TRANSPORT ────────────────────────────────
The transport is created once and reused: nodemailer pools the connection,
so a new one per email would open a new SMTP session every time.
 ─────────────────────────────────────────────────────────────────────────*/
let transporter = null;

// Function to lazily build (and then reuse) the nodemailer transport
const getTransporter = () => {
    // Conditional rendering to check if there is no mail server to connect to
    if (!smtpConfigured) return null;
    // Reuse the transport once it has been built
    if (transporter) return transporter;

    transporter = nodemailer.createTransport({
        host: smtpHost,//Mail server hostname
        port: smtpPort,//Mail server port
        secure: smtpSecure,// true for implicit TLS (port 465), false for STARTTLS
        // Only send credentials when both were supplied
        auth: smtpUser && smtpPassword
            ? { user: smtpUser, pass: smtpPassword }
            : undefined,
    });

    console.log('[SUCCESS: mailer.js] SMTP transport created for', smtpHost);// Log a message in the console for debugging purposes
    return transporter;
}

/*──────────────────────────── HELPERS ──────────────────────────────*/
// Build the plain text body of the password reset email
const buildResetText = (firstName, resetUrl, expiryMinutes) => {
    return [
        `Hi ${firstName || 'there'},`,
        '',
        'A password reset was requested for your Tax, Currency & Interest Calculator account.',
        '',
        'Open the link below to choose a new password:',
        resetUrl,
        '',
        `This link expires in ${expiryMinutes} minutes and can only be used once.`,
        'If you did not request a reset you can safely ignore this email; your password will not change.',
    ].join('\n');
}

// Build the HTML body of the password reset email
const buildResetHtml = (firstName, resetUrl, expiryMinutes) => {
    return `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #1c1c1c; line-height: 1.5;">
            <h2 style="margin-bottom: 16px;">RESET YOUR PASSWORD</h2>
            <p>Hi ${firstName || 'there'},</p>
            <p>A password reset was requested for your Tax, Currency &amp; Interest Calculator account.</p>
            <p>
                <a
                    href="${resetUrl}"
                    style="display:inline-block;padding:12px 20px;background:#ffc107;color:#1c1c1c;text-decoration:none;font-weight:bold;border-radius:4px;"
                >RESET PASSWORD</a>
            </p>
            <p>Or paste this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link expires in ${expiryMinutes} minutes and can only be used once.</p>
            <p style="color:#5c5c5c;font-size:13px;">
                If you did not request a reset you can safely ignore this email; your password will not change.
            </p>
        </div>
    `;
}

/*──────────────────────────── EXPORTED FUNCTIONS ──────────────────────────────*/
/**
 * Sends the password reset email.
 * - Uses the configured SMTP transport when one is available
 * - Falls back to logging the reset link in the console during development
 * @returns {Promise<{delivered: boolean}>} delivered is false when the email was only logged
 */
const sendPasswordResetEmail = async ({ to, resetUrl, firstName, expiryMinutes = 60 }) => {
    const text = buildResetText(firstName, resetUrl, expiryMinutes);// Plain text fallback body
    const html = buildResetHtml(firstName, resetUrl, expiryMinutes);// Rich HTML body
    const mailTransport = getTransporter();

    /* Without SMTP credentials the link is written to the console so the reset
    can still be completed locally. Never do this in production: the reset link
    is a one-time credential and server logs are not a private channel. */
    if (!mailTransport) {
        console.log('[INFO: mailer.js] SMTP is not configured. Password reset link for', to, ':', resetUrl);// Log a message in the console for debugging purposes
        return { delivered: false };
    }

    await mailTransport.sendMail({
        from: mailFrom,//Sender address
        to,//Recipient address
        subject: 'Reset your password',//Email subject line
        text,//Plain text body for clients that do not render HTML
        html,//HTML body
    });

    console.log('[SUCCESS: mailer.js] Password reset email sent to', to);// Log a message in the console for debugging purposes
    return { delivered: true };
}

//Export the functions
module.exports = { sendPasswordResetEmail, smtpConfigured };
