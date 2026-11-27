/* ---------- отметки из Telegram-бота: документ bot-checkins (пишет только бот, приложение читает; формат — INTEGRATION.md п. 5) ---------- */
function checkinsApply(d){
  if(!d||!d.days||!S||!S.day)return;const evs=d.days[S.day.iso]||[];if(!evs.length)return;let ch=false;
  const today=botDocs()["bot-morning"];
  evs.forEach((ev)=>{if(!ev||!ev.item||(ev.kind!=="morning"&&ev.kind!=="evening"))return;
    const list=(ev.kind==="morning"?today.morning:today.evening).today.items;
    const row=list.find((x)=>x.stepId===ev.item)||list.find((x)=>x.id===ev.item);const t=row&&byId(row.id);if(!t)return;
    if(ev.done&&!t.done){markDone(t);logA("отмечено в боте "+nmq(t));ch=true}
    else if(!ev.done&&t.done&&(+ev.at||0)>(t.doneAt||0)){t.done=false;t.doneAt=0;ch=true}});
  if(ch){save();render()}}
async function checkinsInit(){
  try{const db=await window.claude?.use("db");if(!db)return;
    db.collection().doc("bot-checkins").onSnapshot((snap)=>{if(snap&&snap.exists)try{checkinsApply(snap.data())}catch{}})}catch{}}
if(window.claude)setTimeout(checkinsInit,0);
