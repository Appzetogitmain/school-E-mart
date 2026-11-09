// The "how to log in" message a school admin sends a parent from the Parent Accounts page.
//
// It opens the admin's own messaging app (an `sms:` link, exactly like the Call button's
// `tel:` link) with the text already filled in, so it needs no SMS gateway or DLT template.
// Parents log in with their mobile number and an OTP, so the message tells them just that.

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

/** Bare 10-digit Indian mobile from whatever is stored (+91…, 91…, 0…, spaces). */
export const normalizeIndianMobile = (phone) => {
  const digits = digitsOnly(phone);
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

export const buildParentLoginMessage = ({ parentName, schoolName, phone, loginUrl } = {}) => {
  const name = String(parentName || '').trim();
  const school = String(schoolName || '').trim() || 'your school';
  const mobile = normalizeIndianMobile(phone);
  const lines = [
    `Hello${name ? ` ${name}` : ''},`,
    `${school} ne School E-Mart par aapka account bana diya hai.`,
    'Login kaise karein:',
    `1. ${loginUrl || 'School E-Mart app'} kholein`,
    `2. Mobile number ${mobile} daalein`,
    '3. SMS me aaya OTP daalkar login karein',
    `- ${school}`,
  ];
  return lines.join('\n');
};

/**
 * `sms:` link that opens the messaging app with the body filled in.
 * iOS separates the body with "&", Android with "?".
 */
export const buildSmsHref = (phone, body, userAgent = '') => {
  const mobile = normalizeIndianMobile(phone);
  const separator = /iPad|iPhone|iPod/i.test(userAgent) ? '&' : '?';
  return `sms:+91${mobile}${separator}body=${encodeURIComponent(body)}`;
};
