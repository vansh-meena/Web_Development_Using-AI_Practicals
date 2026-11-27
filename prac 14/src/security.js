const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function applySecurityHeaders(res, isApi) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(key, value);
  }
  if (isApi) {
    res.setHeader('Cache-Control', 'no-store');
  }
}

module.exports = { SECURITY_HEADERS, applySecurityHeaders };
