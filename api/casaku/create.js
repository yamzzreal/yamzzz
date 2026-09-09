const { CASAKU_API, LICENSE_KEY, QRIS_ID, jsonbin, save, clean } = require('./_common');

function pickPositiveNumber(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!LICENSE_KEY || !QRIS_ID) {
      return res.status(500).json({ error: 'Casaku belum dikonfigurasi di Vercel.' });
    }

    const b = req.body || {};
    const productId = clean(b.productId, 100);
    const db = await jsonbin();
    const product = (Array.isArray(db.products) ? db.products : [])
      .find(p => String(p.id) === productId);

    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

    const amount = Number(product.price);
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ error: 'Harga produk tidak valid.' });
    }

    const customer = {
      name: clean(b.name, 80),
      whatsapp: clean(b.whatsapp, 25),
      email: clean(b.email, 120),
      note: clean(b.note, 300)
    };

    if (!customer.name || !customer.whatsapp || !customer.email) {
      return res.status(400).json({ error: 'Data pelanggan belum lengkap.' });
    }

    const gatewayResponse = await fetch(`${CASAKU_API}/api/generate/v2/qris`, {
      method: 'POST',
      headers: {
        'x-license-key': LICENSE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        qr_id: QRIS_ID,
        amount,
        useUniqueCode: true,
        packageIds: ['id.dana', 'com.shopee.id', 'com.gojek.app', 'com.bca'],
        expiredInMinutes: 15,
        qrType: 'dynamic',
        paymentMethod: 'qris',
        useQris: true,
        prefix: 'YMZZ'
      })
    });

    const casaku = await gatewayResponse.json().catch(() => ({}));
    if (!gatewayResponse.ok || !casaku.data) {
      return res.status(gatewayResponse.status || 502).json({
        error: casaku.message || 'Gagal membuat QRIS Casaku.',
        detail: casaku
      });
    }

    const d = casaku.data;
    const totalAmount = pickPositiveNumber(d.totalAmount, d.amount, amount);
    const qrString = String(d.qr_string || d.qrString || '').trim();
    const transactionId = String(d.transactionId || '').trim();

    // Jangan pernah mengirim QR dengan nominal 0 atau transaction ID kosong.
    if (!totalAmount || !qrString || !transactionId) {
      console.error('Invalid Casaku response:', casaku);
      return res.status(502).json({
        error: 'Respons Casaku tidak lengkap. QRIS tidak dibuat.',
        detail: {
          hasTransactionId: Boolean(transactionId),
          hasQrString: Boolean(qrString),
          totalAmount
        }
      });
    }

    const order = {
      id: `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      productId: product.id,
      product: product.name,
      category: product.category || 'jasteb',
      ress: Number(product.ress || 0),
      price: totalAmount,
      basePrice: amount,
      name: customer.name,
      whatsapp: customer.whatsapp,
      email: customer.email,
      note: customer.note,
      status: 'pending',
      paymentGateway: 'casaku',
      casakuTransactionId: transactionId,
      createdAt: new Date().toISOString(),
      expiredAt: d.expiredAt || new Date(Date.now() + 15 * 60000).toISOString()
    };

    db.orders = Array.isArray(db.orders) ? db.orders : [];
    db.orders.unshift(order);
    await save(db);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      transactionId,
      amount: totalAmount,
      baseAmount: amount,
      qrString,
      expiredAt: order.expiredAt
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
};
