const jwt = require('jsonwebtoken');
const secret = 'ton_secret_jwt_40_caract_min_ex:openssl_rand_-base64_32';  # Change pour sécurité
const iat = Math.floor(Date.now() / 1000);
const payloadAnon = { role: 'anon', iss: 'supabase', iat };
const payloadService = { role: 'service_role', iss: 'supabase', iat };
console.log('JWT_SECRET=' + secret);
console.log('ANON_KEY=' + jwt.sign(payloadAnon, secret));
console.log('SERVICE_ROLE_KEY=' + jwt.sign(payloadService, secret));