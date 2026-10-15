const PAYMENT_URL = process.env.PAYMENT_URL ?? 'http://localhost:4010';
const TIMEOUT_MS = Number(process.env.PAYMENT_TIMEOUT_MS ?? 1000);

export type PaymentResult = { ok: true; chargeId: string } | { ok: false; message: string };

export async function charge(orderNumber: string, amount: number): Promise<PaymentResult> {
  try {
    const res = await fetch(`${PAYMENT_URL}/charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber, amount }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as { chargeId?: string; code?: string };

    if (res.ok && body.chargeId) {
      console.log(`[payment] approved order=${orderNumber} amount=${amount}`);
      return { ok: true, chargeId: body.chargeId };
    }
    if (res.status === 402) {
      console.log(`[payment] declined order=${orderNumber} amount=${amount} code=${body.code}`);
      return { ok: false, message: '与信上限を超えているため決済できませんでした' };
    }
    console.error(`[payment] unexpected response status=${res.status} order=${orderNumber}`);
  } catch (e) {
    const err = e as Error;
    console.error(`[payment] error order=${orderNumber} amount=${amount} ${err.name}: ${err.message}`);
  }
  return { ok: false, message: '決済処理に失敗しました。時間をおいて再度お試しください' };
}
