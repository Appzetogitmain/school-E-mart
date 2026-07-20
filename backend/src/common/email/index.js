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
      // Bulk sends hand us every message at once. Without a pool each one opens
      // its own TCP+TLS+AUTH handshake, and Gmail refuses that many concurrent
      // connections (421/454) — so most of a bulk run fails. Reuse a few
      // connections and stay under Gmail's ~20 messages/sec ceiling instead.
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 10,
    });
  }
  return transporter;
};

const addressOf = (value = '') => {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim().toLowerCase();
};

const displayNameOf = (value = '') => {
  const match = String(value).match(/^\s*"?([^"<]*?)"?\s*</);
  return match ? match[1].trim() : '';
};

/**
 * Providers like Gmail only relay mail whose From is the authenticated account.
 * A From on a domain the provider does not own fails SPF/DKIM, so the message is
 * rejected or silently binned as spam. Realign it and keep the configured address
 * as Reply-To so replies still reach the right inbox.
 */
const resolveFrom = () => {
  const configured = env.SMTP_FROM;
  const user = env.SMTP_USER;
  if (!user || addressOf(configured) === addressOf(user)) {
    return { from: configured, replyTo: undefined };
  }

  const name = displayNameOf(configured) || 'School E-Mart';
  logger.warn(
    'SMTP_FROM does not match SMTP_USER; sending as the authenticated account so the mail is not rejected.',
    { configuredFrom: addressOf(configured), sendingAs: addressOf(user) }
  );
  return { from: `${name} <${user}>`, replyTo: configured };
};

const emailService = {
  /** Release the pooled SMTP connections on shutdown. */
  closeTransport() {
    if (transporter) {
      transporter.close();
      transporter = null;
    }
  },

  async sendMail(options) {
    try {
      const { from, replyTo } = resolveFrom();
      const mailOptions = {
        from,
        replyTo,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      // Without credentials nothing can be delivered. Never report that as a
      // success: callers (and the school-facing UI) treat a resolved promise as
      // "the parent has been emailed", so a silent stub turns a misconfigured
      // environment into mail that is dropped without a trace.
      if (!env.SMTP_USER || !env.SMTP_PASS) {
        if (env.NODE_ENV === 'production') {
          throw new Error(
            'Email not sent: SMTP_USER/SMTP_PASS are not configured on this environment.'
          );
        }
        logger.warn('SMTP credentials not configured — mail NOT sent, logging it instead:', mailOptions);
        return { success: false, delivered: false, provider: 'stub-logged' };
      }

      const info = await getTransporter().sendMail(mailOptions);
      logger.info('Email sent successfully via Nodemailer:', { messageId: info.messageId, to: options.to });
      return { success: true, delivered: true, messageId: info.messageId };
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
  },

  /**
   * Sent when a school registers itself. Their account exists but cannot sign in
   * until an admin approves the school, so say so plainly — otherwise the first
   * login attempt looks like a broken password.
   */
  async sendSchoolRegistrationPendingEmail({ to, name, schoolName, schoolRefNo }) {
    return this.sendMail({
      to,
      subject: 'Registration Received - School E-Mart',
      text: `Hello ${name},\n\nThank you for registering ${schoolName} with School E-Mart.\n\nYour reference number is ${schoolRefNo}. Please keep it for your records.\n\nOur team is reviewing your registration. You will receive another email as soon as your school is approved, and you will be able to sign in from that point.`,
      html: `<p>Hello <strong>${name}</strong>,</p>
             <p>Thank you for registering <strong>${schoolName}</strong> with School E-Mart.</p>
             <p>Your reference number is <strong>${schoolRefNo}</strong>. Please keep it for your records.</p>
             <p>Our team is reviewing your registration. You will receive another email as soon as your school is approved, and you will be able to sign in from that point.</p>`,
    });
  },

  /** Sent when an admin creates the school directly, so it is already approved. */
  async sendSchoolWelcomeEmail({ to, name, schoolName, schoolRefNo, password }) {
    const loginUrl = `${env.FRONTEND_URL}/school/login`;
    const credentials = password
      ? {
        text: `\nLogin Credentials:\n- Email Address: ${to}\n- Password: ${password}\n\nPlease change your password after your first login.\n`,
        html: `<p><strong>Login Credentials:</strong></p>
               <ul>
                 <li><strong>Email Address:</strong> ${to}</li>
                 <li><strong>Password:</strong> ${password}</li>
               </ul>
               <p>Please change your password after your first login.</p>`,
      }
      : { text: `\nSign in with the email address ${to}.\n`, html: `<p>Sign in with the email address <strong>${to}</strong>.</p>` };

    return this.sendMail({
      to,
      subject: 'Your School Account is Ready - School E-Mart',
      text: `Hello ${name},\n\nAn account for ${schoolName} has been created for you on School E-Mart and is ready to use.\n\nYour school reference number is ${schoolRefNo}.\n${credentials.text}\nSign in at ${loginUrl}`,
      html: `<p>Hello <strong>${name}</strong>,</p>
             <p>An account for <strong>${schoolName}</strong> has been created for you on School E-Mart and is ready to use.</p>
             <p>Your school reference number is <strong>${schoolRefNo}</strong>.</p>
             ${credentials.html}
             <p>Sign in at <a href="${loginUrl}">${loginUrl}</a></p>`,
    });
  },

  /**
   * Sent when an admin approves a pending school. This is the only signal the
   * school gets that login has been unblocked, so it is not optional polish.
   */
  async sendSchoolApprovedEmail({ to, name, schoolName }) {
    const loginUrl = `${env.FRONTEND_URL}/school/login`;
    return this.sendMail({
      to,
      subject: 'School Approved - School E-Mart',
      text: `Hello ${name},\n\nGood news — ${schoolName} has been approved on School E-Mart.\n\nYou can now sign in at ${loginUrl} using the email address ${to} and the password you chose during registration.`,
      html: `<p>Hello <strong>${name}</strong>,</p>
             <p>Good news — <strong>${schoolName}</strong> has been approved on School E-Mart.</p>
             <p>You can now sign in at <a href="${loginUrl}">${loginUrl}</a> using the email address <strong>${to}</strong> and the password you chose during registration.</p>`,
    });
  },
};

module.exports = emailService;
