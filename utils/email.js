const nodemailer = require('nodemailer');
const { htmlToText } = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.from = process.env.EMAIL_FROM;
    this.to = user.email;
    this.name = user.name;
    this.url = url;
  }

  // Create Brevo Transport
  newTransport() {
    // USING BREVO IN PRODUCTION
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        auth: {
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_SMTP_KEY,
        },
      });
    }

    // USING MAILTRAP IN DEVELOPPMENT
    return nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '8e177991d98d2f',
        pass: '8930d8d9dd6613',
      },
    });
  }

  // Sending the email
  async sendEmail(template, subject) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { name: this.name, url: this.url, subject }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcomeEmail() {
    await this.sendEmail('welcome', 'مرحبا بك في مجتمع أنثروبولوجيكا');
  }
};
