const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Send email function (production-ready)
 */
const sendEmail = async (options, retries = 2) => {
  try {
    // Create transporter (optimized for cloud servers like Render)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // MUST be false for port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // MUST be Gmail App Password
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    // Email options
    const mailOptions = {
      from: `PropVal System <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);
    return true;

  } catch (err) {
    console.error('❌ Email sending failed:', err.message);

    // 🔁 Retry logic (important for cloud servers)
    if (retries > 0) {
      console.log(`🔁 Retrying email... (${retries} left)`);
      return sendEmail(options, retries - 1);
    }

    throw err;
  }
};

module.exports = sendEmail;