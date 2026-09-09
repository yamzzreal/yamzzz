/* =========================================================
   YAMZZ MARKET — CASAKU AUTO PAYMENT
   Payment + Auto Status + Success Popup
========================================================= */

"use strict";

const CONFIG = {
  HOME: "index.html",
  CREATE_API: "/api/casaku/create",
  STATUS_API: "/api/casaku/status",
  CHECK_TRANSACTION: "cek-transaksi.html"
};

let DB = {
  site: {},
  products: [],
  orders: []
};

let paidPopupShown = false;


/* =========================================================
   HELPER
========================================================= */

const $ = selector => document.querySelector(selector);

const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char])
  );

const rupiah = number =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(Number(number) || 0);


/* =========================================================
   GET SELECTED PRODUCT
========================================================= */

function selected() {
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


/* =========================================================
   SUCCESS POPUP STYLE
========================================================= */

function injectPopupStyle() {
  if (document.getElementById("yamzzPaymentPopupStyle")) {
    return;
  }

  const style = document.createElement("style");

  style.id = "yamzzPaymentPopupStyle";

  style.textContent = `
    .yamzz-payment-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(0, 5, 12, .82);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: yamzzFadeIn .25s ease;
    }

    .yamzz-payment-popup {
      width: min(430px, 100%);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(61,145,255,.25);
      border-radius: 24px;
      padding: 28px 22px 22px;
      text-align: center;
      color: #f2f7ff;
      background:
        radial-gradient(
          circle at 50% 0%,
          rgba(61,145,255,.18),
          transparent 45%
        ),
        linear-gradient(
          145deg,
          #0d253d,
          #06111d
        );
      box-shadow:
        0 30px 100px rgba(0,0,0,.6),
        0 0 50px rgba(61,145,255,.08);
      animation: yamzzPopup .3s cubic-bezier(.2,.8,.2,1);
    }

    .yamzz-popup-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border: 0;
      border-radius: 50%;
      display: grid;
      place-items: center;
      cursor: pointer;
      color: #8ca3b9;
      background: rgba(255,255,255,.06);
      transition: .2s;
    }

    .yamzz-popup-close:hover {
      color: #fff;
      background: rgba(255,255,255,.12);
    }

    .yamzz-paid-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 32px;
      background: linear-gradient(
        135deg,
        #39e58b,
        #159f61
      );
      box-shadow:
        0 12px 35px rgba(43,214,117,.25);
      animation: yamzzIcon .45s ease;
    }

    .yamzz-payment-popup h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 900;
    }

    .yamzz-payment-popup .yamzz-popup-desc {
      margin: 0 auto 18px;
      max-width: 330px;
      color: #91a8bd;
      font-size: 11px;
      line-height: 1.7;
    }

    .yamzz-transaction-info {
      display: grid;
      gap: 9px;
      margin: 18px 0;
      padding: 14px;
      border: 1px solid rgba(100,165,225,.13);
      border-radius: 15px;
      text-align: left;
      background: rgba(61,145,255,.045);
    }

    .yamzz-transaction-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 15px;
    }

    .yamzz-transaction-row span {
      flex: 0 0 auto;
      color: #718aa3;
      font-size: 9px;
      font-weight: 700;
    }

    .yamzz-transaction-row strong {
      min-width: 0;
      color: #eaf3fc;
      font-size: 10px;
      font-weight: 800;
      text-align: right;
      word-break: break-all;
    }

    .yamzz-paid-status {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 2px auto 15px;
      padding: 7px 12px;
      border-radius: 30px;
      color: #7ff0aa;
      background: rgba(43,214,117,.08);
      border: 1px solid rgba(43,214,117,.18);
      font-size: 9px;
      font-weight: 900;
    }

    .yamzz-admin-process {
      margin: 0 0 17px;
      padding: 12px;
      border-radius: 12px;
      color: #a8bad0;
      background: rgba(255,255,255,.035);
      font-size: 10px;
      line-height: 1.7;
    }

    .yamzz-admin-process b {
      color: #fff;
    }

    .yamzz-popup-buttons {
      display: grid;
      gap: 9px;
    }

    .yamzz-popup-btn {
      width: 100%;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      font-size: 10px;
      font-weight: 900;
      transition: .2s;
    }

    .yamzz-popup-btn.primary {
      color: #fff;
      background: linear-gradient(
        135deg,
        #5aabff,
        #287be2
      );
      box-shadow:
        0 10px 25px rgba(61,145,255,.18);
    }

    .yamzz-popup-btn.secondary {
      color: #9eb3c8;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(100,165,225,.1);
    }

    .yamzz-popup-btn:hover {
      transform: translateY(-1px);
      filter: brightness(1.08);
    }

    @keyframes yamzzFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes yamzzPopup {
      from {
        opacity: 0;
        transform: scale(.92) translateY(15px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes yamzzIcon {
      from {
        opacity: 0;
        transform: scale(.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @media(max-width:430px) {
      .yamzz-payment-popup {
        padding: 25px 17px 18px;
        border-radius: 21px;
      }

      .yamzz-payment-popup h2 {
        font-size: 20px;
      }

      .yamzz-paid-icon {
        width: 65px;
        height: 65px;
        font-size: 28px;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   RENDER PAYMENT PAGE
========================================================= */

function render() {
  const p = selected();

  if (!p) {
    $("#paymentApp").innerHTML = `
      <div class="payment-empty">
        <h2>Produk belum dipilih</h2>
        <a href="${CONFIG.HOME}">
          Kembali ke toko
        </a>
      </div>
    `;

    return;
  }

  injectPopupStyle();

  document.title =
    `Pembayaran • ${DB.site?.name || "Yamzz Market"}`;

  $("#paymentApp").innerHTML = `
    <main class="payment-wrap">

      <a class="back-link" href="${CONFIG.HOME}">
        <i class="fa-solid fa-arrow-left"></i>
        Kembali ke toko
      </a>

      <div class="payment-grid">

        <!-- PAYMENT FORM -->
        <section class="payment-card">

          <div class="payment-head">

            <span class="badge">
              CASAKU PAYMENT
            </span>

            <h1>
              Pembayaran Otomatis
            </h1>

            <p>
              Bayar dengan QRIS.
              Status akan berubah otomatis setelah
              pembayaran terverifikasi.
            </p>

          </div>


          <!-- SELECTED PRODUCT -->
          <div class="selected-product">

            <div>
              ${
                p.image
                  ? `
                    <img
                      src="${esc(p.image)}"
                      alt=""
                    >
                  `
                  : `
                    <i class="fa-solid fa-bolt"></i>
                  `
              }
            </div>

            <section>

              <span>
                ${esc(p.category || "Jasteb")}
              </span>

              <strong>
                ${esc(p.name)}
              </strong>

              <small>
                ${Number(p.ress || 0)} Ress
              </small>

            </section>

            <b>
              ${rupiah(p.price)}
            </b>

          </div>


          <!-- FORM -->
          <form id="paymentForm">

            <label>
              Nama Pelanggan

              <input
                id="customerName"
                required
                maxlength="80"
                placeholder="Nama kamu"
              >
            </label>


            <label>
              WhatsApp

              <input
                id="customerWhatsapp"
                required
                maxlength="20"
                placeholder="08xxxxxxxxxx"
              >
            </label>


            <label>
              Email

              <input
                id="customerEmail"
                type="email"
                required
                maxlength="120"
                placeholder="email@contoh.com"
              >
            </label>


            <label>
              Catatan (opsional)

              <textarea
                id="customerNote"
                rows="3"
                maxlength="300"
                placeholder="Catatan tambahan"
              ></textarea>
            </label>


            <button
              class="payment-submit"
              type="submit"
            >

              <i class="fa-solid fa-qrcode"></i>

              Buat Pembayaran QRIS

            </button>

          </form>


          <div id="paymentMessage"></div>

        </section>


        <!-- QRIS -->
        <aside class="payment-card qris-card">

          <div class="payment-head">

            <span class="badge">
              QRIS DINAMIS
            </span>

            <h2>
              Scan & Bayar
            </h2>

            <p>
              QR akan muncul setelah data pembeli
              dikirim.
            </p>

          </div>


          <div id="qrisArea">

            <div class="qris-missing">

              <i class="fa-solid fa-qrcode"></i>

              <span>
                Belum ada transaksi.
              </span>

            </div>

          </div>


          <div id="amountArea"></div>

        </aside>

      </div>

    </main>
  `;

  $("#paymentForm").onsubmit = createPayment;
}


/* =========================================================
   CREATE PAYMENT
========================================================= */

async function createPayment(e) {
  e.preventDefault();

  const btn = e.submitter;
  const msg = $("#paymentMessage");
  const p = selected();

  btn.disabled = true;

  btn.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Membuat QRIS...
  `;

  try {

    const response = await fetch(
      CONFIG.CREATE_API,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          productId: p.id,

          name:
            $("#customerName")
              .value
              .trim(),

          whatsapp:
            $("#customerWhatsapp")
              .value
              .trim(),

          email:
            $("#customerEmail")
              .value
              .trim(),

          note:
            $("#customerNote")
              .value
              .trim()

        })
      }
    );


    const j = await response.json();


    if (!response.ok) {

      throw new Error(
        j.error ||
        "Gagal membuat pembayaran."
      );

    }


    /*
     * VALIDASI RESPONSE
     */

    if (
      !j.transactionId ||
      !j.orderId ||
      !j.qrString ||
      !Number(j.amount) ||
      Number(j.amount) <= 0
    ) {

      throw new Error(
        "Respons pembayaran Casaku tidak valid."
      );

    }


    /*
     * SIMPAN DATA TRANSAKSI
     */

    sessionStorage.setItem(
      "yamzz_casaku_transaction",
      j.transactionId
    );

    sessionStorage.setItem(
      "yamzz_order_id",
      j.orderId
    );


    /*
     * BUAT QR IMAGE
     */

    const qr =
      `https://larabert-qrgen.hf.space/v1/create-qr-code` +
      `?size=360x360` +
      `&style=2` +
      `&color=111111` +
      `&data=${encodeURIComponent(j.qrString)}`;


    /*
     * TAMPILKAN QR
     */

    $("#qrisArea").innerHTML = `

      <div class="qris-box">

        <img
          src="${qr}"
          alt="QRIS pembayaran"
        >

      </div>


      <div class="payment-note">

        <i class="fa-solid fa-clock"></i>

        <span>

          Scan QR dan bayar

          <b>
            ${rupiah(j.amount)}
          </b>

          .

          QR berlaku sampai

          ${
            new Date(j.expiredAt)
              .toLocaleTimeString(
                "id-ID",
                {
                  hour: "2-digit",
                  minute: "2-digit"
                }
              )
          }

          .

        </span>

      </div>

    `;


    /*
     * INFO PEMBAYARAN
     */

    $("#amountArea").innerHTML = `

      <div class="amount-box">

        <span>
          Total Pembayaran
        </span>

        <strong>
          ${rupiah(j.amount)}
        </strong>

      </div>


      <div
        class="amount-box"
        style="margin-top:8px;"
      >

        <span>
          ID Transaksi
        </span>

        <strong
          style="
            font-size:10px;
            word-break:break-all;
            text-align:right;
            max-width:65%;
          "
        >
          ${esc(j.transactionId)}
        </strong>

      </div>


      <div
        class="amount-box"
        style="margin-top:8px;"
      >

        <span>
          ID Pesanan
        </span>

        <strong
          style="
            font-size:10px;
            word-break:break-all;
            text-align:right;
            max-width:65%;
          "
        >
          ${esc(j.orderId)}
        </strong>

      </div>

    `;


    /*
     * HAPUS FORM
     */

    $("#paymentForm").remove();


    /*
     * STATUS MENUNGGU
     */

    msg.innerHTML = `

      <div class="success-box">

        <i class="fa-solid fa-shield-check"></i>

        <h3>
          Menunggu Pembayaran
        </h3>

        <p>
          Silakan selesaikan pembayaran.
          Setelah pembayaran berhasil,
          sistem akan otomatis mendeteksi pembayaran.
        </p>

        <p>
          ID Transaksi:
          <b>
            ${esc(j.transactionId)}
          </b>
        </p>

      </div>

    `;


    /*
     * MULAI CEK STATUS
     */

    poll(
      j.transactionId,
      j.orderId
    );


  } catch (error) {

    msg.innerHTML = `

      <div class="error-box">

        ${esc(
          error.message ||
          "Terjadi kesalahan."
        )}

      </div>

    `;


    btn.disabled = false;

    btn.innerHTML = `
      <i class="fa-solid fa-qrcode"></i>
      Buat Pembayaran QRIS
    `;

  }
}


/* =========================================================
   POLLING PAYMENT STATUS
========================================================= */

async function poll(
  transactionId,
  orderId
) {

  let tries = 0;

  const timer =
    setInterval(
      async () => {

        tries++;

        try {

          const response =
            await fetch(
              CONFIG.STATUS_API,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json"
                },

                body: JSON.stringify({
                  transactionId
                })
              }
            );


          const j =
            await response.json();


          /*
           * PAID
           */

          if (
            j.status === "paid" ||
            j.order?.status === "paid"
          ) {

            clearInterval(timer);

            showPaid(
              orderId,
              transactionId
            );

            return;
          }


          /*
           * EXPIRED / CANCEL
           */

          if (
            [
              "expired",
              "cancel"
            ].includes(j.status)
          ) {

            clearInterval(timer);

            showExpired();

            return;
          }


          /*
           * STOP SETELAH 15 MENIT
           *
           * 300 x 3 detik
           * = 900 detik
           * = 15 menit
           */

          if (tries >= 300) {

            clearInterval(timer);

          }

        } catch (error) {

          console.error(
            "Payment status error:",
            error
          );

        }

      },
      3000
    );
}


/* =========================================================
   SHOW PAYMENT SUCCESS POPUP
========================================================= */

function showPaid(
  orderId,
  transactionId
) {

  /*
   * Jangan tampilkan popup dua kali.
   */

  if (paidPopupShown) {
    return;
  }

  paidPopupShown = true;


  /*
   * Update area utama
   */

  const message =
    $("#paymentMessage");

  if (message) {

    message.innerHTML = `

      <div class="success-box">

        <i class="fa-solid fa-circle-check"></i>

        <h3>
          Pembayaran Berhasil!
        </h3>

        <p>
          Pembayaran telah diterima
          dan diverifikasi otomatis.
        </p>

      </div>

    `;

  }


  /*
   * QR DIGANTI STATUS LUNAS
   */

  const qris =
    $("#qrisArea");

  if (qris) {

    qris.innerHTML = `

      <div class="qris-missing">

        <i
          class="fa-solid fa-circle-check"
          style="color:#35df82;"
        ></i>

        <span
          style="
            color:#6eeaa2;
            font-weight:900;
          "
        >
          PEMBAYARAN LUNAS
        </span>

      </div>

    `;

  }


  /*
   * TAMPILKAN POPUP
   */

  const overlay =
    document.createElement("div");

  overlay.className =
    "yamzz-payment-overlay";


  overlay.innerHTML = `

    <div
      class="yamzz-payment-popup"
      role="dialog"
      aria-modal="true"
      aria-label="Pembayaran berhasil"
    >

      <!-- CLOSE -->

      <button
        class="yamzz-popup-close"
        type="button"
        aria-label="Tutup"
      >

        <i class="fa-solid fa-xmark"></i>

      </button>


      <!-- ICON -->

      <div class="yamzz-paid-icon">

        <i class="fa-solid fa-check"></i>

      </div>


      <!-- TITLE -->

      <h2>
        Pembayaran Berhasil!
      </h2>


      <p class="yamzz-popup-desc">

        Pembayaran kamu sudah diterima
        dan berhasil terverifikasi secara otomatis.

      </p>


      <!-- STATUS -->

      <div class="yamzz-paid-status">

        <i class="fa-solid fa-circle-check"></i>

        PEMBAYARAN PAID

      </div>


      <!-- TRANSACTION INFORMATION -->

      <div class="yamzz-transaction-info">


        <!-- ID PESANAN -->

        <div class="yamzz-transaction-row">

          <span>
            ID Pesanan
          </span>

          <strong>
            ${esc(orderId)}
          </strong>

        </div>


        <!-- ID TRANSAKSI -->

        <div class="yamzz-transaction-row">

          <span>
            ID Transaksi
          </span>

          <strong>
          ${esc(transactionId)}
          </strong>

        </div>


        <!-- PAYMENT -->

        <div class="yamzz-transaction-row">

          <span>
            Status
          </span>

          <strong
            style="color:#69e99a;"
          >
            PAID
          </strong>

        </div>

      </div>


      <!-- ADMIN PROCESS -->

      <div class="yamzz-admin-process">

        <i class="fa-solid fa-clock"></i>

        <br>

        <b>
          Admin akan memproses pesanan Anda.
        </b>

        <br>

        Harap tunggu sampai proses pesanan
        selesai. Terima kasih telah bertransaksi
        di Yamzz Market.

      </div>


      <!-- BUTTON -->

      <div class="yamzz-popup-buttons">


        <a
          class="yamzz-popup-btn primary"
          href="${CONFIG.CHECK_TRANSACTION}?id=${encodeURIComponent(orderId)}"
        >

          <i class="fa-solid fa-receipt"></i>

          Cek Status Pesanan

        </a>


        <button
          class="yamzz-popup-btn secondary"
          type="button"
          id="yamzzClosePopup"
        >

          Tutup

        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  /*
   * CLOSE BUTTON
   */

  const close =
    () => {

      overlay.style.opacity = "0";

      setTimeout(
        () => overlay.remove(),
        200
      );

    };


  overlay
    .querySelector(
      ".yamzz-popup-close"
    )
    .addEventListener(
      "click",
      close
    );


  overlay
    .querySelector(
      "#yamzzClosePopup"
    )
    .addEventListener(
      "click",
      close
    );


  /*
   * Klik area luar popup
   */

  overlay.addEventListener(
    "click",
    event => {

      if (
        event.target === overlay
      ) {

        close();

      }

    }
  );


  /*
   * ESC untuk menutup
   */

  const escapeHandler =
    event => {

      if (
        event.key === "Escape"
      ) {

        close();

        document.removeEventListener(
          "keydown",
          escapeHandler
        );

      }

    };


  document.addEventListener(
    "keydown",
    escapeHandler
  );

}


/* =========================================================
   SHOW EXPIRED
========================================================= */

function showExpired() {

  const message =
    $("#paymentMessage");

  if (!message) {
    return;
  }


  message.innerHTML = `

    <div class="error-box">

      <i class="fa-solid fa-clock"></i>

      QRIS sudah kedaluwarsa.

      <br>

      Silakan kembali ke toko
      dan buat transaksi baru.

    </div>

  `;

}


/* =========================================================
   INIT
========================================================= */

async function init() {

  injectPopupStyle();

  render();

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    init
  );

} else {

  init();

}
