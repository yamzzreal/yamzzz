const {
  CASAKU_API,
  LICENSE_KEY,
  QRIS_ID,
  jsonbin,
  save,
  clean
} = require('./_common');

function positiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function getCasakuData(payload) {
  if (payload && payload.data && typeof payload.data === 'object') return payload.data;
  if (payload && payload.result && typeof payload.result === 'object') return payload.result;
  return {};
}

function getTransactionId(data) {
  return String(
    data.transactionId ||
    data.transaction_id ||
    data.id ||
    ''
  ).trim();
}

function getQrString(data) {
  return String(
    data.qr_string ||
    data.qrString ||
    data.qr ||
    ''
  ).trim();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!LICENSE_KEY || !QRIS_ID) {
      return res.status(500).json({
        error: 'Casaku belum dikonfigurasi di Vercel. Isi CASAKU_LICENSE_KEY dan CASAKU_QRIS_ID.'
      });
    }

    const body = req.body || {};
    const productId = clean(body.productId, 100);

    if (!productId) {
      return res.status(400).json({ error: 'productId wajib dikirim.' });
    }

    const db = await jsonbin();
    const products = Array.isArray(db.products) ? db.products : [];
    const product = products.find(p => String(p.id) === productId);

    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan.' });
    }

    const baseAmount = Number(product.price);
    if (!Number.isFinite(baseAmount) || baseAmount < 1) {
      return res.status(400).json({ error: 'Harga produk tidak valid.' });
    }

    const customer = {
      name: clean(body.name, 80),
      whatsapp: clean(body.whatsapp, 25),
      email: clean(body.email, 120),
      note: clean(body.note, 300)
    };

    if (!customer.name || !customer.whatsapp || !customer.email) {
      return res.status(400).json({
        error: 'Nama, WhatsApp, dan email wajib diisi.'
      });
    }

    const gatewayPayload = {
      qr_id: QRIS_ID,
      amount: baseAmount,
      useUniqueCode: true,
      packageIds: ['id.dana'],
      expiredInMinutes: 15,
      qrType: 'dynamic',
      paymentMethod: 'qris',
      useQris: true,
      prefix: 'YMZZ'
    };

    const gatewayResponse = await fetch(
      `${CASAKU_API}/api/generate/v2/qris`,
      {
        method: 'POST',
        headers: {
          'x-license-key': LICENSE_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(gatewayPayload)
      }
    );

    const rawText = await gatewayResponse.text();
    let casaku = {};

    try {
      casaku = rawText ? JSON.parse(rawText) : {};
    } catch {
      casaku = { raw: rawText };
    }

    console.log('CASAKU GENERATE', {
      httpStatus: gatewayResponse.status,
      ok: gatewayResponse.ok,
      response: casaku
    });

    if (!gatewayResponse.ok) {
      return res.status(gatewayResponse.status || 502).json({
        error: casaku.message || casaku.error || 'Casaku gagal membuat QRIS.',
        casakuStatus: gatewayResponse.status,
        detail: casaku.data?.message || casaku.error || null
      });
    }

    const data = getCasakuData(casaku);
    const transactionId = getTransactionId(data);
    const qrString = getQrString(data);
    const gatewayAmount = positiveNumber(
      data.totalAmount,
      data.total_amount,
      data.amount
    );

    // Casaku mendokumentasikan totalAmount, transactionId dan qr_string pada response v2.
    // Jangan membuat order jika salah satu data transaksi penting tidak tersedia.
    if (!transactionId || !qrString || !gatewayAmount) {
      console.error('CASAKU INCOMPLETE RESPONSE', {
        keys: Object.keys(data || {}),
        transactionId: Boolean(transactionId),
        qrString: Boolean(qrString),
        gatewayAmount,
        response: casaku
      });

      return res.status(502).json({
        error: 'Respons Casaku tidak lengkap. Cek log Vercel pada CASAKU GENERATE.',
        casakuStatus: gatewayResponse.status,
        received: {
          fields: Object.keys(data || {}),
          hasTransactionId: Boolean(transactionId),
          hasQrString: Boolean(qrString),
          hasAmount: Boolean(gatewayAmount)
        }
      });
    }

    const expiredAt = data.expiredAt || data.expired_at ||
      new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const order = {
      id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      productId: product.id,
      product: product.name || product.title || 'Produk',
      category: product.category || 'jasteb',
      ress: Number(product.ress || 0),
      price: gatewayAmount,
      basePrice: baseAmount,
      name: customer.name,
      whatsapp: customer.whatsapp,
      email: customer.email,
      note: customer.note,
      status: 'pending',
      paymentGateway: 'casaku',
      casakuTransactionId: transactionId,
      createdAt: new Date().toISOString(),
      expiredAt,
      paidAt: null,
      telegramNotifiedAt: null
    };

    db.orders = Array.isArray(db.orders) ? db.orders : [];
    db.orders.unshift(order);
    await save(db);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      transactionId,
      amount: gatewayAmount,
      baseAmount,
      qrString,
      expiredAt
    });
  } catch (error) {
    console.error('CASAKU CREATE ERROR', error);
    return res.status(500).json({
      error: error.message || 'Server error saat membuat pembayaran.'
    });
  }
};
