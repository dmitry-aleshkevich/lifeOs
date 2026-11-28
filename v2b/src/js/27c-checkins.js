/* ---------- отметки из Telegram-бота: документ bot-checkins (пишет только бот, приложение читает; формат — INTEGRATION.md п. 5) ---------- */
function checkinsApply(d){
  if(!d||!d.days||!S||!S.day)return;const evs=d.days[S.day.iso]||[];if(!evs.length&&!d.run)return;let ch=false;
  const today=botDocs()["bot-morning"];
  evs.forEach((ev)=>{if(!ev||!ev.item||(ev.kind!=="morning"&&ev.kind!=="evening"))return;
    const list=(ev.kind==="morning"?today.morning:today.evening).today.items;
    const row=list.find((x)=>x.stepId===ev.item)||list.find((x)=>x.id===ev.item);const t=row&&byId(row.id);if(!t)return;
    /* каждое событие бота применяется к пункту один раз: иначе снятая вручную отметка возвращалась бы при каждом перечитывании */
    const seen=S.day.bot||(S.day.bot={}),k=ev.kind+":"+t.id,at=+ev.at||0;if(seen[k]!==undefined&&at<=seen[k])return;seen[k]=at;ch=true;
    if(ev.done&&!t.done){markDone(t);if(ev.spent>0)t.spent=ev.spent;logA("отмечено в боте "+nmq(t));ch=true}
    else if(!ev.done&&t.done&&at>(t.doneAt||0)){t.done=false;t.doneAt=0}});
  if(botRunApply(d.run,today))ch=true;
  if(ch){save();render()}}
/* таймер из бота: применяется один раз и только если он новее своих таймеров этой рутины */
function botRunApply(r,today){
  if(!r||!r.item||r.day!==S.day.iso||(r.kind!=="morning"&&r.kind!=="evening"))return false;
  const list=(r.kind==="morning"?today.morning:today.evening).today.items;
  const row=list.find((x)=>x.stepId===r.item)||list.find((x)=>x.id===r.item);const t=row&&byId(row.id);if(!t||t.done)return false;
  const at=+r.at||0;if(at<=(S.day.botRun||0)||rItems(r.kind).some((x)=>x.tm&&!x.done&&(x.tm.at||0)>=at))return false;
  S.day.botRun=at;
  S.tasks.forEach((x)=>{if(x!==t&&x.tm&&x.tm.run){pauseT(x);x.tm.at=at}});
  const end=+r.endsAt||0,from=+r.startedAt||at,p=+r.pausedAt||0;
  if(p){if(t.tm&&t.tm.run)pauseT(t);t.acc=p-from;t.tm={run:false,sw:!end,end:end||from,left:(end||from)-p,seg:from,rang:!!end&&end<=p}}
  else if(!t.tm){t.acc=0;t.tm={run:true,sw:!end,end:end||from,left:0,seg:from,rang:!!end&&end<=NOW()}}
  else{const m=t.tm;if(!m.run){m.run=true;m.seg=NOW();if(m.sw)m.end=NOW()+m.left}
    if(end&&!m.sw){m.end=end;m.rang=end<=NOW()}}
  t.tm.at=at;logA("таймер из бота "+nmq(t));return true}
async function checkinsInit(){
  try{const db=await window.claude?.use("db");if(!db)return;
    db.collection().doc("bot-checkins").onSnapshot((snap)=>{if(snap&&snap.exists)try{checkinsApply(snap.data())}catch{}})}catch{}}
if(window.claude)setTimeout(checkinsInit,0);
