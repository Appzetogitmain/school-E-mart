const https = require('https');
const http = require('http');
const { URL } = require('url');
const env = require('../../config/env');

/**
 * SMSINDIAHUB transactional SMS.
 *
 * Only the legacy /vendorsms/pushsms.aspx endpoint authenticates with an APIKey;
 * the newer /api/mt/SendSMS rejects it with "login details cannot be blank" and
 * demands user/password, so it is deliberately not used here.
 *
 * The gateway answers 200 for both success and failure — the body carries the
 * verdict, either "Failed#<reason>" or a JSON envelope with ErrorCode. Never
 * infer success from the status code.
 */
const FAILURE_PREFIX = 'Failed#';

const buildUrl = ({ phone, message }) => {
  const url = new URL('/vendorsms/pushsms.aspx', env.SMSINDIAHUB_BASE_URL);
  url.searchParams.set('APIKey', env.SMSINDIAHUB_API_KEY);
  // The gateway expects the country code; normalizePhone gives us bare 10 digits.
  url.searchParams.set('msisdn', `${env.SMSINDIAHUB_COUNTRY_CODE}${phone}`);
  url.searchParams.set('sid', env.SMSINDIAHUB_SENDER_ID);
  url.searchParams.set('msg', message);
  url.searchParams.set('fl', '0');
  url.searchParams.set('gwid', String(env.SMSINDIAHUB_GATEWAY_ID));
  if (env.SMSINDIAHUB_PE_ID) url.searchParams.set('PEId', env.SMSINDIAHUB_PE_ID);
  if (env.SMSINDIAHUB_TEMPLATE_ID) url.searchParams.set('TemplateId', env.SMSINDIAHUB_TEMPLATE_ID);
  return url;
};

const request = (url) =>
  new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(url, { timeout: env.SMS_TIMEOUT_MS }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`SMSINDIAHUB request timed out after ${env.SMS_TIMEOUT_MS}ms`));
    });
  });

/**
 * Turn the gateway's mixed text/JSON reply into a verdict. Its trailing
 * "Thread was being aborted." noise is an artefact of their server, not part of
 * the result, so it is stripped before matching.
 */
const parseResponse = (body) => {
  const text = String(body).replace(/Thread was being aborted\.?/gi, '').trim();

  if (text.startsWith(FAILURE_PREFIX)) {
    return { ok: false, reason: text.slice(FAILURE_PREFIX.length).trim() || 'unknown gateway error' };
  }

  try {
    const json = JSON.parse(text);
    // "000" is their success code; anything else is a failure.
    if (json.ErrorCode !== undefined && String(json.ErrorCode) !== '000') {
      return { ok: false, reason: json.ErrorMessage || `ErrorCode ${json.ErrorCode}` };
    }
    return { ok: true, jobId: json.JobId || null };
  } catch {
    // Plain-text success carries the job id, e.g. "Success#<guid>"
    if (!text) return { ok: false, reason: 'empty response from gateway' };
    return { ok: true, jobId: text.split('#').pop() || null };
  }
};

module.exports = {
  name: 'smsindiahub',
  parseResponse,
  async send({ phone, message }) {
    const { statusCode, body } = await request(buildUrl({ phone, message }));
    const result = parseResponse(body);
    if (!result.ok) {
      throw new Error(`SMSINDIAHUB rejected the message: ${result.reason} (HTTP ${statusCode})`);
    }
    return { provider: 'smsindiahub', jobId: result.jobId };
  },
};
