const nodemailer = require('nodemailer');
const logger = require('../logger');
const env = require('../../config/env');

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for 587 or other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const emailService = {
  async sendMail(options) {
    try {
      const mailOptions = {
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      // If credentials aren't set in development, just log it.
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        logger.info('SMTP Credentials not configured. Logging mail content instead:', mailOptions);
        return { success: true, provider: 'stub-logged' };
      }

      const info = await getTransporter().sendMail(mailOptions);
      logger.info('Email sent successfully via Nodemailer:', { messageId: info.messageId, to: options.to });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Nodemailer failed to send email:', error);
      throw error;
    }
  },

  async sendPasswordResetEmail({ to, name, resetUrl, token }) {
    return this.sendMail({
      to,
      subject: 'Password Reset Request - School E-Mart',
      text: `Hello ${name || 'User'},\n\nYou requested to reset your password. Please click on the link below to reset it:\n${resetUrl}\n\nThis link is valid for 24 hours.`,
      html: `<p>Hello ${name || 'User'},</p><p>You requested to reset your password. Please click on the link below to reset it:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 24 hours.</p>`,
    });
  },

  async sendEmailVerification({ to, name, verifyUrl, token }) {
    return this.sendMail({
      to,
      subject: 'Verify Email - School E-Mart',
      text: `Hello ${name || 'User'},\n\nPlease click on the link below to verify your email address:\n${verifyUrl}`,
      html: `<p>Hello ${name || 'User'},</p><p>Please click on the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  },

  async sendWelcomeEmail({ to, name, role, mobile, password, schoolName }) {
    const loginUrl = `${env.FRONTEND_URL}/school/login`;
    const parentLoginUrl = `${env.FRONTEND_URL}/user/login`;
    const isTeacher = role === 'teacher';

    let text = '';
    let html = '';

    if (isTeacher) {
      text = `Hello ${name},\n\nYour teacher account has been successfully created for ${schoolName} by your school administrator.\n\nLogin Credentials:\n- Email Address: ${to}\n- Temporary Password: ${password}\n\nPlease login at ${loginUrl} and change your password immediately.`;
      html = `<p>Hello <strong>${name}</strong>,</p>
              <p>Your teacher account has been successfully created for <strong>${schoolName}</strong> by your school administrator.</p>
              <p><strong>Login Credentials:</strong></p>
              <ul>
                <li><strong>Email Address:</strong> ${to}</li>
                <li><strong>Temporary Password:</strong> ${password}</li>
              </ul>
              <p>Please login at <a href="${loginUrl}">${loginUrl}</a> and change your password immediately.</p>`;
    } else {
      text = `Hello ${name},\n\nYour parent account has been successfully created for ${schoolName} by the school administrator.\n\nYour login phone number is ${mobile}.\n\nYou can log in using OTP sent to your phone number at ${parentLoginUrl}.`;
      html = `<p>Hello <strong>${name}</strong>,</p>
              <p>Your parent account has been successfully created for <strong>${schoolName}</strong> by the school administrator.</p>
              <p>Your login phone number is <strong>${mobile}</strong>.</p>
              <p>You can log in using OTP sent to your phone number at <a href="${parentLoginUrl}">${parentLoginUrl}</a>.</p>`;
    }

    return this.sendMail({
      to,
      subject: `Account Created - School E-Mart`,
      text,
      html,
    });
  }
};

module.exports = emailService;
