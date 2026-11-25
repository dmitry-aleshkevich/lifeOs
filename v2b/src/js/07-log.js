/* ---------- журнал последних действий и ошибок (для «Баг») ---------- */
const ALOG=(read("lifeos.v2b.alog")||[]).slice(-40),ERRS=[];
function logA(x){const d=new Date(),z=(n)=>String(n).padStart(2,"0");ALOG.push(z(d.getHours())+":"+z(d.getMinutes())+":"+z(d.getSeconds())+" "+x);if(ALOG.length>40)ALOG.shift();try{localStorage.setItem("lifeos.v2b.alog",JSON.stringify(ALOG))}catch{}}
addEventListener("error",(e)=>{ERRS.push((e.message||"ошибка")+(e.lineno?" (строка "+e.lineno+")":""));if(ERRS.length>5)ERRS.shift()});
addEventListener("unhandledrejection",(e)=>{ERRS.push("promise: "+((e.reason&&e.reason.message)||e.reason));if(ERRS.length>5)ERRS.shift()});
const nmq=(t)=>"«"+String(t&&t.name||"").slice(0,40)+"»";
let BATCH=false;
const undo=[];
const snap=()=>JSON.stringify(S.tasks);
function pushUndo(){if(BATCH)return;const j=snap();if(undo[undo.length-1]!==j){undo.push(j);if(undo.length>20)undo.shift()}}
function undoNow(){const j=undo.pop();if(!j)return;logA("отмена");S.tasks=JSON.parse(j);save();render()}
document.addEventListener("keydown",(e)=>{
  const tg=e.target,typing=tg&&(tg.tagName==="INPUT"||tg.tagName==="TEXTAREA"||tg.isContentEditable);
  if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.key.toLowerCase()==="z"&&!typing){e.preventDefault();undoNow()}
  else if(!typing&&SEL.size&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault();delSel()}
  else if(e.key==="Escape"&&SEL.size&&!typing){SEL.clear();render()}
  else if(e.key==="Escape"&&UI.open&&!document.querySelector(".pop")){UI.open=null;UI.sub=null;render()}});
function note(text){const o=document.getElementById("note2");if(o)o.remove();
  const n=el("div","toast",text);n.id="note2";document.body.appendChild(n);setTimeout(()=>n.remove(),3500)}
function delTask(t){logA("удалена "+nmq(t));pushUndo();S.tasks=S.tasks.filter((x)=>x!==t&&x.link!==t.id);if(UI.open===t.id)UI.open=null;save();render()}
function editName(span,t,isNew){
  const inp=el("input","nmi");inp.type="text";inp.value=t.name;span.replaceWith(inp);inp.focus();inp.select();
  let done=false;const fin=(ok)=>{if(done)return;done=true;const v=inp.value.trim();
    if(isNew&&(!ok||!v||v===t.name)){S.tasks=S.tasks.filter((x)=>x!==t);undo.pop();save();render();return}
    if(ok&&v&&v!==t.name){logA("переименована "+nmq(t)+" → «"+v.slice(0,40)+"»");pushUndo();t.name=v;save()}render()};
  inp.onkeydown=(e)=>{if(e.key==="Enter")fin(true);else if(e.key==="Escape"){e.stopPropagation();fin(false)}};
  inp.onblur=()=>fin(true);inp.onclick=(e)=>e.stopPropagation()}
function subBox(t){
  const sb=UI.sub,w=el("div","qa subqa "+sb.rel);w.dataset.rel=sb.rel;
  const si=el("input","sub-new");si.type="text";si.placeholder=(sb.rel==="pre"?"Перед этой: ":"После этой: ")+"новая задача";si.value=sb.txt||"";
  si.oninput=()=>{sb.txt=si.value};
  si.onkeydown=(e)=>{if(e.key==="Enter"&&si.value.trim())addSub(t,sb.rel,si.value.trim(),sb.dur,false);else if(e.key==="Escape"){e.stopPropagation();UI.sub=null;render()}};
  const pl=el("button","mins qp","");pl.type="button";pl.title="Создать и запустить. ПКМ — длительность";
  const paint=()=>{pl.textContent="▶"+(sb.dur?" "+sb.dur+" мин":"")};paint();
  pl.onclick=()=>{if(!si.value.trim()){si.focus();return}addSub(t,sb.rel,si.value.trim(),sb.dur,true)};
  const pick=(m)=>{sb.dur=m;paint();if(si.value.trim())addSub(t,sb.rel,si.value.trim(),m,false)};
  onMenu(pl,(x,y)=>{
    const it=[5,10,15,25,30,45,60].map((m)=>[(sb.dur===m?"✓ ":"    ")+m+" мин",()=>pick(m)]);
    it.push("-",["Своё число…",()=>{const v=parseInt(prompt("Минут:","20"),10);if(v>0)pick(v)}],["Без времени (секундомер)",()=>pick(0)]);
    popup(x,y,it)});
  w.append(si,pl);setTimeout(()=>si.focus(),0);return w}
function addSub(t,rel,txt,dur,start){
  const q=parseQuick(txt);if(!q.name)return;
  const par=t.link?byId(t.link)||t:t,krel=t.link?t.rel:rel;
  const ix=t.link?S.tasks.indexOf(t)+(rel==="post"?1:0):undefined;
  const s2=makeTask({name:q.name,at:q.at,min:q.min||dur||0},{type:par.type,where:par.where,status:par.type==="работа"?(par.status||"todo"):"",project:par.project,link:par.id,rel:krel,sc:par.sc,sv:par.sv},ix);
  UI.sub={id:t.id,rel,dur:0,txt:""};save();if(start)startT(s2);render()}
function dateLabel(t){
  const pad=(n)=>String(n).padStart(2,"0"),day=(d)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  let d="";
  if(t.due){const now=new Date(),tm=new Date(Date.now()+864e5);
    if(t.due===day(now))d="сегодня";else if(t.due===day(tm))d="завтра";
    else{const [y,m,dd]=t.due.split("-").map(Number);d=dd+" "+["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"][m-1]}}
  return [d,t.at?(t.aa?"~":"")+t.at:""].filter(Boolean).join(" · ")}
