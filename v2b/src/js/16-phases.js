/* ---------- фазы дня (Beta 2.0): Утро → День → Вечер → Ночь; новый день с 04:00, по часам фаза не меняется ---------- */
const APP_URL="https://dmitry-aleshkevich.github.io/qr/?n=1";
const rItems=(k)=>S.tasks.filter((t)=>t.routine===k&&!t.link&&t.type==="дела");
const rMin=(a)=>a.reduce((m,t)=>m+(t.done?0:t.min||0),0);
const hourNow=()=>new Date(NOW()).getHours();
const isEvening=()=>hourNow()>=21||hourNow()<4;
function dayRoll(){
  S.day=S.day||{iso:"",evening:false};const iso=dayISO();
  if(S.day.iso===iso){if(!S.day.phase){S.day.phase=S.day.evening?"evening":(S.morningOnly&&rItems("morning").length&&!rItems("morning").every((t)=>t.done)&&hourNow()<14&&S.day.skipMorning!==iso?"morning":"day");save()}return false}
  if(S.day.iso){   /* новый день: «Завтра» и задачи с сегодняшней датой — в «Сегодня»; невыполненные со вчера остаются в «Сегодня» с красной пометкой */
    const cand=(t)=>t.type==="дела"&&!t.routine&&!t.tpl&&!t.link&&!t.done&&!t.archived;
    S.tasks.forEach((t)=>{if(cand(t)&&t.where==="today")t.carry=1});
    S.tasks.forEach((t)=>{if(cand(t)&&t.where!=="today"&&(t.where==="tomorrow"||t.due===iso)){t.where="today";if(t.due&&t.due<iso)t.due=iso}})}
  if(S.day.iso)S.tasks.filter((t)=>t.routine).forEach((t)=>Object.assign(t,{done:false,doneAt:0,spent:0,acc:0,sessions:0,tm:null,archived:false}));
  S.day.iso=iso;S.day.evening=false;S.day.skipMorning="";
  S.day.phase=S.morningOnly&&rItems("morning").length?"morning":"day";save();return true}
function phaseCheck(){const p=S.day.phase;
  if(p==="morning"&&rItems("morning").every((t)=>t.done)){S.day.phase="day";wakeMark();save();confetti()}
  else if(p==="evening"&&rItems("evening").every((t)=>t.done)){S.day.phase="closed";bedMark();save();confetti()}}
const lockedPhase=()=>!!(S&&S.day&&(S.day.phase==="evening"||S.day.phase==="closed"||(S.day.phase==="morning"&&S.morningOnly&&rItems("morning").length)));
function confetti(){window.__confetti=(window.__confetti||0)+1;
  if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const c=document.createElement("canvas");c.id="confetti";c.width=innerWidth;c.height=innerHeight;
  c.style.cssText="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99";document.body.appendChild(c);
  const g=c.getContext("2d"),cols=["#FF5A1F","#23A06A","#1F5BB8","#F2C14E","#B9A3FF","#FF8F86"];
  const ps=Array.from({length:140},()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*.4,vx:(Math.random()-.5)*3,vy:2+Math.random()*4,r:Math.random()*6.28,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:4+Math.random()*5,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function f(now){const k=now-t0;g.clearRect(0,0,c.width,c.height);
    ps.forEach((q)=>{q.x+=q.vx;q.y+=q.vy;q.vy+=.06;q.r+=q.vr;g.save();g.globalAlpha=Math.max(0,Math.min(1,(2000-k)/500));g.translate(q.x,q.y);g.rotate(q.r);g.fillStyle=q.c;g.fillRect(-q.w/2,-q.h/2,q.w,q.h);g.restore()});
    if(k<2000)requestAnimationFrame(f);else c.remove()})(t0)}
function qrBox(){const box=el("div","qr");
  try{const q=qrcode(0,"M");q.addData(APP_URL);q.make();const n=q.getModuleCount(),m=2,sz=n+m*2;let d="";
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+="M"+(c+m)+" "+(r+m)+"h1v1h-1z";
    box.innerHTML='<svg viewBox="0 0 '+sz+' '+sz+'" shape-rendering="crispEdges" role="img" aria-label="QR-код"><rect width="'+sz+'" height="'+sz+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>'}
  catch{box.textContent="QR не получился"}return box}
function morningOn(){return !!(S.morningOnly&&S.day&&S.day.phase==="morning"&&rItems("morning").length)}
function morningScreen(v){
  const w=el("div","mscr");const h=el("div","mh");h.appendChild(el("h2",null,"Доброе утро ☀️"));
  const sk=el("button","chipb","Пропустить");sk.type="button";sk.id="mskip";sk.onclick=()=>{S.day.skipMorning=S.day.iso;S.day.phase="day";wakeMark();save();render()};h.appendChild(sk);w.appendChild(h);
  w.appendChild(qrBox());scenChips(w,"morning");routineGroup(w,"morning",true);wishCard(w);v.appendChild(w)}
function eveningScreen(v){
  const w=el("div","mscr");const h=el("div","mh");h.appendChild(el("h2",null,"Вечер 🌙"));
  const bk=el("button","chipb","Назад");bk.type="button";bk.id="ebk";bk.onclick=()=>{S.day.phase="day";S.day.evening=false;save();render()};h.appendChild(bk);w.appendChild(h);
  scenChips(w,"evening");routineGroup(w,"evening",true);v.appendChild(w)}
function closedScreen(v){
  const w=el("div","mscr closed");w.appendChild(el("h2",null,"День закрыт 🌙"));
  const t=S.tasks.filter((x)=>!x.routine&&!x.link&&x.done&&x.doneAt&&dayOf(x.doneAt)===S.day.iso);
  const sp=Math.round(t.reduce((m,x)=>m+(x.spent||0),0)/60000);
  w.appendChild(el("p","dsum","Сделано задач: "+t.length+(sp?" · "+sp+" мин по таймеру":"")+". Утро и вечер: "+[...rItems("morning"),...rItems("evening")].filter((x)=>x.done).length+" из "+[...rItems("morning"),...rItems("evening")].length+"."));
  const b=el("button","chipb","Открыть день снова");b.type="button";b.id="reopen";b.onclick=()=>{S.day.phase="evening";save();render()};w.appendChild(b);
  w.appendChild(el("p","muted","Новый день начнётся в 04:00."));v.appendChild(w)}
const dayOf=(ts)=>{const d=new Date(ts-4*36e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
function endOfDay(){const n=new Date(NOW()),e=new Date(n);e.setHours(24,0,0,0);const ms=e-n,m=Math.floor(ms/60000);return Math.floor(m/60)+":"+String(m%60).padStart(2,"0")+":"+String(Math.floor(ms/1000)%60).padStart(2,"0")}
function routineGroup(host,k,force){
  const items=rItems(k);if(!items.length)return;
  const done=items.filter((t)=>t.done).length,all=done===items.length,label=k==="morning"?"Утро":"Вечер";
  const open=force?true:UI.rOpen&&UI.rOpen[k]!==undefined?UI.rOpen[k]:!all;
  const h=el("div","ghead rhead");h.dataset.routine=k;h.style.cursor="pointer";
  h.appendChild(el("span",null,(open?"▾ ":"▸ ")+label+(all?" · всё сделано ✓":"")));
  h.appendChild(el("span",null,done+" из "+items.length+(rMin(items)?" · "+rMin(items)+" мин":"")));
  h.onclick=()=>{UI.rOpen=UI.rOpen||{};UI.rOpen[k]=!open;render()};host.appendChild(h);
  if(!open)return;
  items.forEach((t)=>rowWithKids(host,t));
  const add=el("button","radd","+ Пункт");add.type="button";
  add.onclick=()=>{const t=makeTask({name:"Новая задача",min:0},{routine:k,where:"today"});render();
    const nm=document.querySelector('[data-cid="'+t.id+'"] .nm');if(nm)editName(nm,t,true)};
  host.appendChild(add)}
