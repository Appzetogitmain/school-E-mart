const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

let scriptPromise = null;

const loadRazorpayScript = () => {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Opens Razorpay checkout and resolves with payment response on success.
 */
export const openRazorpayCheckout = async ({
  keyId,
  razorpayOrderId,
  amountPaise,
  currency = 'INR',
  name = 'School E-Mart',
  description,
  prefill = {},
  notes = {},
}) => {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: amountPaise,
      currency,
      name,
      description: description || 'Order payment',
      order_id: razorpayOrderId,
      prefill,
      notes,
      theme: { color: '#6C4EFF' },
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled')),
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'));
    });
    razorpay.open();
  });
};
