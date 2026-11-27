/* ---------- витрина для Telegram-бота: документы bot-morning и bot-plan (пишет только приложение, формат — INTEGRATION.md) ---------- */
let BOT_T=null,BOT_LAST={};
const botItems=(sc,ver)=>S.tasks.filter((t)=>t.type==="сценарий"&&t.sc===sc.id&&t.sv===ver.id&&!t.link).sort((a,b)=>(a.ord||0)-(b.ord||0)).map((t)=>({id:t.id,name:t.name,min:t.min||0}));
function botDocs(){
  if(!Array.isArray(S.scen))scenInit();
  const mo=(S.scen||[]).find((s)=>s.kind==="morning"),ev=(S.scen||[]).find((s)=>s.kind==="evening"),now=Date.now(),day=S.day&&S.day.iso||dayISO();
  const morning={versions:mo?mo.versions.map((v)=>({id:v.id,name:v.name,icon:"",items:botItems(mo,v)})):[],
    today:{day:day,versionId:(S.day&&S.day.scen&&S.day.scen.morning)||null,items:rItems("morning").map((t)=>({id:t.id,name:t.name,min:t.min||0,done:!!t.done,spent:Math.round(t.spent||0)}))}};
  const evening={items:ev&&ev.versions[0]?botItems(ev,ev.versions[0]):[],today:{day:day,items:rItems("evening").map((t)=>({id:t.id,name:t.name,min:t.min||0,done:!!t.done,spent:Math.round(t.spent||0)}))}};
  const pl=(w)=>S.tasks.filter((t)=>t.type==="дела"&&!t.routine&&!t.link&&!t.archived&&t.where===w).sort((a,b)=>(a.ord||0)-(b.ord||0)).map((t)=>({id:t.id,name:t.name,min:t.min||0,done:!!t.done}));
  return{"bot-morning":{schema:1,updatedAt:now,tz:"Asia/Ho_Chi_Minh",defaults:{morning:{1:"fast",2:"home",3:"fast",4:"home",5:"fast",6:"home",0:"home"}},morning:morning,evening:evening},
    "bot-plan":{schema:1,updatedAt:now,day:day,today:pl("today"),tomorrow:pl("tomorrow")}}}
async function botPush(){
  try{const db=await window.claude?.use("db");if(!db)return;const col=db.collection();
    const docs=botDocs();for(const id of Object.keys(docs)){const d=docs[id],key=JSON.stringify(Object.assign({},d,{updatedAt:0}));
      if(BOT_LAST[id]===key)continue;BOT_LAST[id]=key;await col.doc(id).set(d)}}catch{}}
function botSync(){if(!window.claude)return;clearTimeout(BOT_T);BOT_T=setTimeout(botPush,1500)}
