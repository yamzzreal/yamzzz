const crypto = require("crypto");
const { jsonbin, save } = require("./_common");

function validSignature(raw, sig, secret) {
  if (!sig || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a=Buffer.from(String(sig),"hex"), b=Buffer.from(expected,"hex");
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}
async function telegram(text){
  const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat)return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({chat_id:chat,text,parse_mode:"HTML"})
  }).catch(()=>{});
}
module.exports = async (req,res)=>{
  if(req.method!=="POST")return res.status(405).end();
  try{
    const raw=typeof req.body==="string"?req.body:JSON.stringify(req.body||{});
    const sig=req.headers["x-casaku-signature"];
    if(!validSignature(raw,sig,process.env.CASAKU_WEBHOOK_SECRET))
      return res.status(401).json({error:"Invalid signature"});
    const p=JSON.parse(raw);
    if(p.status!=="paid")return res.status(200).json({ok:true});
    const db=await jsonbin();
    db.orders=Array.isArray(db.orders)?db.orders:[];
    const o=db.orders.find(x=>x.casakuTransactionId===p.transactionId);
    if(!o)return res.status(200).json({ok:true,unmatched:true});
    const wasPaid=o.status==="paid";
    o.status="paid"; o.paidAt=p.paidAt||new Date().toISOString(); o.gatewayAmount=p.amount;
    await save(db);
    if(!wasPaid){
      await telegram(`💰 <b>PEMBAYARAN MASUK</b>\n\n🧾 ${o.id}\n📦 ${o.product}\n💵 Rp${Number(o.price).toLocaleString("id-ID")}\n👤 ${o.name}\n📱 ${o.whatsapp}\n\n✅ <b>PAID</b> via Casaku`);
    }
    return res.status(200).json({ok:true});
  }catch(e){console.error(e);return res.status(500).json({error:e.message});}
};
