const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // IMPORTANT: SMTP config usually comes from .env variables.
    // For this prototype, if EMAIL_USER and EMAIL_PASS aren't set, 
    // it will throw an error or fail to send unless you use ethereal email.
    
    // We create a reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // e.g., 'your_email@gmail.com'
        pass: process.env.EMAIL_PASS, // e.g., 'your_app_password'
      },
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
