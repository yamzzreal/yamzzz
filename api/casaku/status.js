const { CASAKU_API, LICENSE_KEY, jsonbin, save } = require("./_common");

async function updateOrder(transactionId, gatewayStatus) {
  const db = await jsonbin();
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  const order = db.orders.find(o => o.casakuTransactionId === transactionId);
  if (!order) return null;
  const map = { paid: "paid", expired: "rejected", cancel: "rejected", pending: "pending" };
  const next = map[gatewayStatus] || order.status;
  if (order.status !== "paid" && next === "paid") {
    order.status = "paid";
    order.paidAt = new Date().toISOString();
  } else if (order.status !== "paid" && next !== "pending") {
    order.status = next;
  }
  await save(db);
  return order;
}
module.exports = async (req,res)=>{
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const transactionId=String(req.body?.transactionId||"").trim();
    if(!transactionId) return res.status(400).json({error:"transactionId wajib"});
    const r=await fetch(`${CASAKU_API}/api/generate/check-status`,{
      method:"POST",headers:{"x-license-key":LICENSE_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({transactionId})
    });
    const j=await r.json();
    if(!r.ok) return res.status(r.status).json({error:j.message||"Gagal cek status",detail:j});
    const s=j.data?.status || j.status;
    const order=await updateOrder(transactionId,s);
    return res.status(200).json({success:true,status:s,order:order?{id:order.id,status:order.status,paidAt:order.paidAt}:null});
  }catch(e){ console.error(e); return res.status(500).json({error:e.message}); }
};
