// Generate ECDH key pair
function generateKeyPair() {
    const algorithm = {
      name: 'ECDH',
      namedCurve: 'P-256', // Curve name (adjust as needed)
    };
    return crypto.subtle.generateKey(algorithm, true, ['deriveKey']);
  }


module.exports = {
    generateKeyPair,
};