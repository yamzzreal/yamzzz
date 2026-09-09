/* YAMZZ MARKET — CASAKU AUTO PAYMENT */
"use strict";
const CONFIG={HOME:"index.html", CREATE_API:"/api/casaku/create", STATUS_API:"/api/casaku/status"};
let DB={site:{},products:[],orders:[]};
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const rupiah=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
function selected(){try{return JSON.parse(sessionStorage.getItem("yamzz_selected_product")||sessionStorage.getItem("yamzz_checkout")||"null")}catch{return null}}
function render(){
 const p=selected();
 if(!p){$("#paymentApp").innerHTML=`<div class="payment-empty"><h2>Produk belum dipilih</h2><a href="${CONFIG.HOME}">Kembali ke toko</a></div>`;return}
 document.title=`Pembayaran • ${DB.site?.name||"Yamzz Market"}`;
 $("#paymentApp").innerHTML=`<main class="payment-wrap">
 <a class="back-link" href="${CONFIG.HOME}"><i class="fa-solid fa-arrow-left"></i> Kembali ke toko</a>
 <div class="payment-grid">
 <section class="payment-card"><div class="payment-head"><span class="badge">CASAKU PAYMENT</span><h1>Pembayaran Otomatis</h1><p>Bayar dengan QRIS. Status akan berubah otomatis setelah pembayaran terverifikasi.</p></div>
 <div class="selected-product"><div>${p.image?`<img src="${esc(p.image)}" alt="">`:`<i class="fa-solid fa-bolt"></i>`}</div><section><span>${esc(p.category||"Jasteb")}</span><strong>${esc(p.name)}</strong><small>${Number(p.ress||0)} Ress</small></section><b>${rupiah(p.price)}</b></div>
 <form id="paymentForm">
 <label>Nama Pelanggan<input id="customerName" required maxlength="80" placeholder="Nama kamu"></label>
 <label>WhatsApp<input id="customerWhatsapp" required maxlength="20" placeholder="08xxxxxxxxxx"></label>
 <label>Email<input id="customerEmail" type="email" required maxlength="120" placeholder="email@contoh.com"></label>
 <label>Catatan (opsional)<textarea id="customerNote" rows="3" maxlength="300" placeholder="Catatan tambahan"></textarea></label>
 <button class="payment-submit" type="submit"><i class="fa-solid fa-qrcode"></i> Buat Pembayaran QRIS</button></form><div id="paymentMessage"></div></section>
 <aside class="payment-card qris-card"><div class="payment-head"><span class="badge">QRIS DINAMIS</span><h2>Scan & Bayar</h2><p>QR akan muncul setelah data pembeli dikirim.</p></div><div id="qrisArea"><div class="qris-missing"><i class="fa-solid fa-qrcode"></i><span>Belum ada transaksi.</span></div></div><div id="amountArea"></div></aside>
 </div></main>`;
 $("#paymentForm").onsubmit=createPayment;
}
async function createPayment(e){
 e.preventDefault();
 const btn=e.submitter,msg=$("#paymentMessage"),p=selected();
 btn.disabled=true;btn.innerHTML=`<i class="fa-solid fa-spinner fa-spin"></i> Membuat QRIS...`;
 try{
  const r=await fetch(CONFIG.CREATE_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   productId:p.id,name:$("#customerName").value.trim(),whatsapp:$("#customerWhatsapp").value.trim(),email:$("#customerEmail").value.trim(),note:$("#customerNote").value.trim()
  })});
  const j=await r.json(); if(!r.ok)throw new Error(j.error||"Gagal membuat pembayaran.");
  sessionStorage.setItem("yamzz_casaku_transaction",j.transactionId);
  sessionStorage.setItem("yamzz_order_id",j.orderId);
  const qr=`https://larabert-qrgen.hf.space/v1/create-qr-code?size=360x360&style=2&color=111111&data=${encodeURIComponent(j.qrString)}`;
  $("#qrisArea").innerHTML=`<div class="qris-box"><img src="${qr}" alt="QRIS pembayaran"></div><div class="payment-note"><i class="fa-solid fa-clock"></i><span>Scan QR dan bayar <b>${rupiah(j.amount)}</b>. QR berlaku sampai ${new Date(j.expiredAt).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}.</span></div>`;
  $("#amountArea").innerHTML=`<div class="amount-box"><span>Total Pembayaran</span><strong>${rupiah(j.amount)}</strong><small>ID: ${esc(j.orderId)}</small></div>`;
  $("#paymentForm").remove();
  msg.innerHTML=`<div class="success-box"><i class="fa-solid fa-shield-check"></i><h3>Menunggu pembayaran</h3><p>Setelah pembayaran berhasil, halaman ini akan otomatis berubah menjadi <b>PAID</b>.</p></div>`;
  poll(j.transactionId,j.orderId);
 }catch(err){msg.innerHTML=`<div class="error-box">${esc(err.message)}</div>`;btn.disabled=false;btn.innerHTML=`<i class="fa-solid fa-qrcode"></i> Buat Pembayaran QRIS`;}
}
async function poll(transactionId,orderId){
 let tries=0;
 const timer=setInterval(async()=>{
  tries++;
  try{
   const r=await fetch(CONFIG.STATUS_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({transactionId})});
   const j=await r.json();
   if(j.status==="paid"||j.order?.status==="paid"){clearInterval(timer);showPaid(orderId);return}
   if(["expired","cancel"].includes(j.status)){clearInterval(timer);showExpired();return}
   if(tries>=300){clearInterval(timer);}
  }catch(e){}
 },3000);
}
function showPaid(id){$("#paymentMessage").innerHTML=`<div class="success-box"><i class="fa-solid fa-circle-check"></i><h3>Pembayaran Berhasil!</h3><p>Transaksi <strong>${esc(id)}</strong> sudah terverifikasi otomatis.</p><p>Pesanan kamu sedang diproses.</p><a href="cek-transaksi.html">Cek Transaksi</a></div>`;$("#qrisArea").innerHTML=`<div class="qris-missing"><i class="fa-solid fa-circle-check"></i><span>PEMBAYARAN LUNAS</span></div>`}
function showExpired(){ $("#paymentMessage").innerHTML=`<div class="error-box">QRIS sudah kedaluwarsa. Silakan kembali ke toko dan buat transaksi baru.</div>`; }
async function init(){render()}
document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
