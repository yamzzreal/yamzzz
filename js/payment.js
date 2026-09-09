/* YAMZZ MARKET — CASAKU AUTO PAYMENT */
"use strict";

const CONFIG = {
  HOME: "index.html",
  CREATE_API: "/api/casaku/create",
  STATUS_API: "/api/casaku/status"
};

const $ = selector => document.querySelector(selector);

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[char]));

const rupiah = value => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(Number(value) || 0);

function selectedProduct() {
  try {
    return JSON.parse(
      sessionStorage.getItem("yamzz_selected_product") ||
      sessionStorage.getItem("yamzz_checkout") ||
      "null"
    );
  } catch {
    return null;
  }
}

function render() {
  const product = selectedProduct();

  if (!product) {
    $("#paymentApp").innerHTML = `
      <div class="payment-empty">
        <h2>Produk belum dipilih</h2>
        <a href="${CONFIG.HOME}">Kembali ke toko</a>
      </div>`;
    return;
  }

  document.title = `Pembayaran • Yamzz Market`;

  $("#paymentApp").innerHTML = `
    <main class="payment-wrap">
      <a class="back-link" href="${CONFIG.HOME}">
        <i class="fa-solid fa-arrow-left"></i> Kembali ke toko
      </a>

      <div class="payment-grid">
        <section class="payment-card">
          <div class="payment-head">
            <span class="badge">CASAKU PAYMENT</span>
            <h1>Pembayaran Otomatis</h1>
            <p>Isi data pembeli lalu buat QRIS pembayaran.</p>
          </div>

          <div class="selected-product">
            <div>
              ${product.image
                ? `<img src="${esc(product.image)}" alt="">`
                : `<i class="fa-solid fa-bolt"></i>`}
            </div>
            <section>
              <span>${esc(product.category || "Jasteb")}</span>
              <strong>${esc(product.name || product.title || "Produk")}</strong>
              <small>${Number(product.ress || 0)} Ress</small>
            </section>
            <b>${rupiah(product.price)}</b>
          </div>

          <form id="paymentForm">
            <label>
              Nama Pelanggan
              <input id="customerName" required maxlength="80" placeholder="Nama kamu">
            </label>

            <label>
              WhatsApp
              <input id="customerWhatsapp" required maxlength="25" placeholder="08xxxxxxxxxx">
            </label>

            <label>
              Email
              <input id="customerEmail" type="email" required maxlength="120" placeholder="email@contoh.com">
            </label>

            <label>
              Catatan (opsional)
              <textarea id="customerNote" rows="3" maxlength="300" placeholder="Catatan tambahan"></textarea>
            </label>

            <button class="payment-submit" type="submit">
              <i class="fa-solid fa-qrcode"></i> Buat Pembayaran QRIS
            </button>
          </form>

          <div id="paymentMessage"></div>
        </section>

        <aside class="payment-card qris-card">
          <div class="payment-head">
            <span class="badge">QRIS DINAMIS</span>
            <h2>Scan & Bayar</h2>
            <p>QRIS akan muncul setelah transaksi berhasil dibuat.</p>
          </div>

          <div id="qrisArea">
            <div class="qris-missing">
              <i class="fa-solid fa-qrcode"></i>
              <span>Belum ada transaksi.</span>
            </div>
          </div>

          <div id="amountArea"></div>
        </aside>
      </div>
    </main>`;

  $("#paymentForm").addEventListener("submit", createPayment);
}

async function createPayment(event) {
  event.preventDefault();

  const button = event.submitter;
  const message = $("#paymentMessage");
  const product = selectedProduct();

  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Membuat QRIS...`;
  message.innerHTML = "";

  try {
    const response = await fetch(CONFIG.CREATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        name: $("#customerName").value.trim(),
        whatsapp: $("#customerWhatsapp").value.trim(),
        email: $("#customerEmail").value.trim(),
        note: $("#customerNote").value.trim()
      })
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      let error = json.error || "Gagal membuat pembayaran.";

      if (json.received) {
        error += ` Field diterima: ${(json.received.fields || []).join(", ") || "tidak ada"}.`;
      }

      throw new Error(error);
    }

    const transactionId = String(json.transactionId || "").trim();
    const orderId = String(json.orderId || "").trim();
    const amount = Number(json.amount);
    const qrString = String(json.qrString || "").trim();

    if (!transactionId || !orderId || !Number.isFinite(amount) || amount <= 0 || !qrString) {
      throw new Error("Respons pembayaran Casaku tidak valid. Pastikan create.js versi terbaru sudah di-upload.");
    }

    sessionStorage.setItem("yamzz_casaku_transaction", transactionId);
    sessionStorage.setItem("yamzz_order_id", orderId);

    const qrUrl =
      `https://larabert-qrgen.hf.space/v1/create-qr-code` +
      `?size=360x360&style=2&color=111111&data=${encodeURIComponent(qrString)}`;

    $("#qrisArea").innerHTML = `
      <div class="qris-box">
        <img src="${qrUrl}" alt="QRIS pembayaran">
      </div>
      <div class="payment-note">
        <i class="fa-solid fa-clock"></i>
        <span>
          Scan QR dan bayar <b>${rupiah(amount)}</b>.
          QR berlaku sampai ${formatExpired(json.expiredAt)}.
        </span>
      </div>`;

    $("#amountArea").innerHTML = `
      <div class="amount-box">
        <span>Total Pembayaran</span>
        <strong>${rupiah(amount)}</strong>
        <small>ID: ${esc(orderId)}</small>
      </div>`;

    $("#paymentForm").remove();

    message.innerHTML = `
      <div class="success-box">
        <i class="fa-solid fa-clock"></i>
        <h3>Menunggu Pembayaran</h3>
        <p>Scan QRIS dan selesaikan pembayaran. Status akan dicek otomatis.</p>
      </div>`;

    pollPayment(transactionId, orderId);
  } catch (error) {
    console.error(error);
    message.innerHTML = `<div class="error-box">${esc(error.message)}</div>`;
    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-qrcode"></i> Buat Pembayaran QRIS`;
  }
}

function formatExpired(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "15 menit";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function pollPayment(transactionId, orderId) {
  let attempts = 0;
  const maxAttempts = 300;

  const timer = setInterval(async () => {
    attempts++;

    try {
      const response = await fetch(CONFIG.STATUS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId })
      });

      const json = await response.json().catch(() => ({}));
      const status = String(json.status || "").toLowerCase();
      const orderStatus = String(json.order?.status || "").toLowerCase();

      if (status === "paid" || orderStatus === "paid") {
        clearInterval(timer);
        showPaid(orderId);
        return;
      }

      if (status === "expired" || status === "cancel") {
        clearInterval(timer);
        showExpired();
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    } catch (error) {
      console.warn("Status check gagal:", error.message);
    }
  }, 3000);
}

function showPaid(orderId) {
  $("#paymentMessage").innerHTML = `
    <div class="success-box">
      <i class="fa-solid fa-circle-check"></i>
      <h3>Pembayaran Berhasil!</h3>
      <p>Transaksi <strong>${esc(orderId)}</strong> sudah terverifikasi otomatis.</p>
      <p>Pesanan kamu sedang diproses.</p>
      <a href="cek-transaksi.html">Cek Transaksi</a>
    </div>`;

  $("#qrisArea").innerHTML = `
    <div class="qris-missing">
      <i class="fa-solid fa-circle-check"></i>
      <span>PEMBAYARAN LUNAS</span>
    </div>`;
}

function showExpired() {
  $("#paymentMessage").innerHTML = `
    <div class="error-box">
      QRIS sudah kedaluwarsa atau dibatalkan. Silakan kembali ke toko dan buat transaksi baru.
    </div>`;
}

function init() {
  render();
}

document.readyState === "loading"
  ? document.addEventListener("DOMContentLoaded", init)
  : init();
