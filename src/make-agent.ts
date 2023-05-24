import https from 'https';
import fs from 'fs';

export function makeAgentPkcs(p12File: string, passphrase?: string) {
  const pfx = fs.readFileSync(p12File);
  return new https.Agent({
    pfx,
    passphrase,
    rejectUnauthorized: true,
  })
}

export function makeAgentPem(
  keyFile: string,
  certFile: string,
  passphrase?: string
) {
  const key = fs.readFileSync(keyFile);
  const cert = fs.readFileSync(certFile);

  return new https.Agent({
    cert,
    key,
    passphrase,
    rejectUnauthorized: true,
  })
}

export function makeAgentPemStrings(
  key: string,
  cert: string,
  passphrase?: string
) {
  return new https.Agent({
    cert,
    key,
    passphrase,
    rejectUnauthorized: true,
  })
}
