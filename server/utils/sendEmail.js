const nodemailer = require('nodemailer');

require('dotenv').config();

const sendEmail = async (options) => {
  try {
    // IMPORTANT: SMTP config usually comes from .env variables.
    // For this prototype, if EMAIL_USER and EMAIL_PASS aren't set, 
    // it will throw an error or fail to send unless you use ethereal email.
    
    // We create a reusable transporter object using the explicit SMTP transport
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 587,
    //   secure: false, // Use SSL for port 465
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    //   // Helps bypass strict timeout/TLS issues on cloud providers like Render
    //   tls: {
    //     rejectUnauthorized: false
    //   },
    //   connectionTimeout: 20000, // 20 seconds timeout
    //   // Force IPv4. Render/Google frequently timeout or block IPv6 SMTP connections.
    //   family: 4
    // });
    const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

    // Define the email options
    const mailOptions = {
      from: `PropVal System <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html, // Optional HTML message
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};

module.exports = sendEmail;
