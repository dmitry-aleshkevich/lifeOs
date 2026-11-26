/* ---------- таймер: один бегущий, остальные замораживаются ---------- */
const NOW=()=>Date.now()+(window.__off||0);
const mmss=(ms)=>{ms=Math.max(0,Math.ceil(ms/1000));return Math.floor(ms/60)+":"+String(ms%60).padStart(2,"0")};
const byId=(id)=>S.tasks.find((t)=>t.id===id);
const leftOf=(t)=>!t.tm?null:(t.tm.run?t.tm.end-NOW():t.tm.left);
const spentOf=(t)=>t.done?(t.spent||0):(t.acc||0)+(t.tm&&t.tm.run?NOW()-t.tm.seg:0);
let AC=null;
function audio(){try{if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}if(AC&&AC.state==="suspended")AC.resume()}catch{}}
window.__ac=()=>AC&&AC.state;
["pointerdown","keydown","touchstart"].forEach((ev)=>document.addEventListener(ev,audio,{capture:true,passive:true}));
function ring(){window.__rings=(window.__rings||0)+1;
  document.title="⏰ Время вышло";setTimeout(()=>{document.title="LifeOS v2 — бета"},4000);
  try{audio();if(!AC)return;
    if(AC.state!=="running"){AC.resume().then(beeps).catch(()=>{});return}
    beeps()}catch{}}
function beeps(){
  try{const t0=AC.currentTime;
    for(let i=0;i<6;i++){const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=i%2?660:880;
      g.gain.setValueAtTime(0.0001,t0+i*0.5);g.gain.exponentialRampToValueAtTime(0.35,t0+i*0.5+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+i*0.5+0.4);
      o.connect(g);g.connect(AC.destination);o.start(t0+i*0.5);o.stop(t0+i*0.5+0.45)}}catch{}}
function pauseT(t){const m=t.tm;if(!m||!m.run)return;m.left=m.end-NOW();t.acc=(t.acc||0)+(NOW()-m.seg);logT(t,NOW()-m.seg);m.run=false;if(t.type==="работа"&&t.status==="doing")t.status="wait"}
function startT(t){audio();
  S.tasks.forEach((x)=>{if(x!==t&&x.tm&&x.tm.run)pauseT(x)});
  if(!t.tm){const sw=!t.min;t.tm={run:true,sw,end:NOW()+(sw?0:t.min*60000),left:0,seg:NOW(),rang:false}}
  else if(!t.tm.run){t.tm.run=true;t.tm.end=NOW()+t.tm.left;t.tm.seg=NOW()}
  if(t.type==="работа"&&!t.done)t.status="doing";
  save();tick();if(t.type==="работа")render()}
function toggleT(t){logA((t.tm&&t.tm.run?"пауза ":"старт ")+nmq(t));if(t.tm&&t.tm.run){pauseT(t);save();tick();if(t.type==="работа")render()}else startT(t)}
function addT(t,min){const add=min*60000;
  if(!t.tm){t.min=(t.min||0)+min;save();render();return}
  if(t.tm.sw)return;
  const l=leftOf(t);const nl=l<0?add:l+add;t.tm.left=nl;if(t.tm.run)t.tm.end=NOW()+nl;t.tm.rang=false;save();tick()}
function markDone(t){
  if(t.tm){if(t.tm.run)pauseT(t);t.tm=null}
  delete t.carry;t.spent=t.acc||0;t.acc=0;t.done=true;t.doneAt=NOW();if(t.type==="работа")t.status="done";logDone(t);if(t.routine&&S&&S.day)phaseCheck()}
function complete(t){
  logA("готово "+nmq(t));markDone(t);save();render();
  if(F.on)nextInFocus(t);else nextInRoutine(t)}
function fmtSpent(ms){const s=Math.round(ms/1000);if(s<60)return s+" с";
  const m=Math.floor(s/60),r=s%60;if(m<60)return m+":"+String(r).padStart(2,"0")+" мин";return Math.floor(m/60)+" ч "+String(m%60).padStart(2,"0")+" мин"}
function pillTime(t){const m=t.tm,l=leftOf(t);return m.sw?mmss(-l):(l<0?"+"+mmss(-l):mmss(l))}
function pillText(t){
  const m=t.tm;if(!m)return "▶ "+(t.min?t.min+" мин":"старт");
  return (m.run?"⏸ ":"▶ ")+pillTime(t)}
function paintPill(b,t){
  const m=t.tm,l=leftOf(t),over=!!m&&!m.sw&&l<0;
  b.classList.toggle("run",!!m&&m.run&&!over);b.classList.toggle("over",over);b.classList.toggle("pause",!!m&&!m.run);
  if(b.classList.contains("play")){b.textContent=m&&m.run?"⏸":"▶";return}
  if(!m){if(b.firstElementChild||!b.textContent)b.textContent=pillText(t);else if(b.textContent!==pillText(t))b.textContent=pillText(t);return}
  /* запущенный таймер: две зоны — значок ⏸/▶ ставит на паузу и продолжает, время (остальная кнопка) завершает задачу */
  let pi=b.querySelector(":scope>.pi"),pt=b.querySelector(":scope>.pt");
  if(!pi||!pt){b.textContent="";pi=el("span","pi");pt=el("span","pt");b.append(pi,pt)}
  const a=m.run?"⏸ ":"▶ ",x=pillTime(t);if(pi.textContent!==a)pi.textContent=a;if(pt.textContent!==x)pt.textContent=x}
function tick(){
  S.tasks.forEach((t)=>{const m=t.tm;if(m&&m.run&&!m.sw&&!m.rang&&m.end-NOW()<=0){m.rang=true;save();ring()}});
  document.querySelectorAll("[data-tid]").forEach((b)=>{const t=byId(b.dataset.tid);if(t&&!t.done)paintPill(b,t)})}
setInterval(()=>{if(S){tick();const c=document.querySelector("#evb .cd");if(c)c.textContent=endOfDay();if(S.day&&S.day.iso!==dayISO())render()}},500);
document.addEventListener("visibilitychange",()=>{if(S&&document.visibilityState==="visible")tick()});

