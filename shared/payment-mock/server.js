// 決済代行サービスのモック(外部サービス扱い)。仕様は README.md を参照。
const http = require('node:http');

const PORT = Number(process.env.PORT ?? 4010);
const charges = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/charge') {
      const { orderNumber, amount } = await readJson(req);
      if (typeof orderNumber !== 'string' || !Number.isInteger(amount)) {
        return send(res, 400, { status: 'error', code: 'invalid_request' });
      }
      const started = Date.now();
      await sleep(amount > 10000 ? 1500 : 150);
      const elapsed = Date.now() - started;

      const declined = amount > 50000;
      const charge = {
        chargeId: `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        orderNumber,
        amount,
        status: declined ? 'declined' : 'approved',
        processedAt: new Date().toISOString(),
      };
      charges.push(charge);
      console.log(`[payment] ${charge.status} order=${orderNumber} amount=${amount} (${elapsed}ms)`);

      if (declined) return send(res, 402, { status: 'declined', code: 'limit_exceeded' });
      return send(res, 200, { status: 'approved', chargeId: charge.chargeId });
    }

    if (req.method === 'GET' && req.url === '/charges') {
      return send(res, 200, charges.slice(-100).reverse());
    }

    send(res, 404, { status: 'error', code: 'not_found' });
  } catch (e) {
    console.error('[payment] error', e);
    send(res, 500, { status: 'error', code: 'internal_error' });
  }
});

server.listen(PORT, () => console.log(`[payment] listening on ${PORT}`));
