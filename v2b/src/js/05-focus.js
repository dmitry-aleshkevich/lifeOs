/* ---------- фокус: запоминающий фильтр над «Сегодня» (Дела) / ToDo (Работа) ---------- */
const FK="lifeos.v2b.focus";
const PRESETS=[["n3","Первые 3",{n:3}],["n5","Первые 5",{n:5}],["m30","30 мин",{m:30}],["m60","1 час",{m:60}],["m90","1,5 часа",{m:90}],["m120","2 часа",{m:120}]];
const dayISO=()=>{const d=new Date(NOW()-4*36e5);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
let F=Object.assign({on:false,preset:"n3",day:"",ids:{}},read(FK)||{});
const saveF=()=>{try{localStorage.setItem(FK,JSON.stringify(F))}catch{}};
function workQueue(){
  const w=S.tasks.filter((t)=>t.type==="работа"&&!t.link&&!t.done&&!t.archived);
  const cur=w.filter((t)=>t.status==="doing"||(t.status==="wait"&&t.tm)),nxt=w.filter((t)=>t.status==="todo");
  return {cur,nxt,all:cur.concat(nxt)}}
function candidates(sys){
  if(sys==="работа")return workQueue().all;
  return S.tasks.filter((t)=>t.type===sys&&!t.routine&&!t.link&&!t.done&&(t.where||"")==="today")}
function focusCompute(sys){
  const pr=PRESETS.find((p)=>p[0]===F.preset)[2],c=candidates(sys),out=[];
  if(pr.n)c.slice(0,pr.n).forEach((t)=>out.push(t.id));
  else{let sum=0;for(const t of c){if(sum+(t.min||0)>pr.m)break;sum+=t.min||0;out.push(t.id)}}
  F.ids[sys]=out;F.day=dayISO();saveF()}
function focusEnsure(sys){if(F.on&&(F.day!==dayISO()||!F.ids[sys]))focusCompute(sys)}
function closeToast(){const o=document.getElementById("toast");if(o){clearTimeout(o._t);o.remove()}}
function nextInFocus(done){
  const ids=F.ids[done.type]||[];autoNext(ids.map(byId).find((x)=>x&&!x.done&&x.min>0))}
/* утро и вечер: после «Готово» следующий пункт рутины запускается сам */
function nextInRoutine(done){
  if(!done.routine||!S.day||S.day.phase!==done.routine)return;
  autoNext(rItems(done.routine).find((x)=>!x.done&&x.min>0&&x!==done))}
function autoNext(n){
  if(!n)return;
  closeToast();startT(n);render();
  const tz=el("div","toast");tz.id="toast";tz.appendChild(el("span",null,"Пошла следующая: "+n.name));
  const c=el("button",null,"Отмена");c.onclick=()=>{clearTimeout(tz._t);tz.remove();if(n.tm){pauseT(n);n.tm=null;save()}render()};tz.appendChild(c);
  tz._t=setTimeout(()=>tz.remove(),3000);document.body.appendChild(tz)}
/* «Сегодня»: фильтр списка — только задачи группы «Сегодня». Рутины по-прежнему показывает/прячет LifeCore */
const TO={on:read("lifeos.v2b.todayonly")===true};
const saveTO=()=>{try{localStorage.setItem("lifeos.v2b.todayonly",JSON.stringify(TO.on))}catch{}};
function paintFocusBtn(){
  {const tb=document.getElementById("tbtn");if(tb){tb.hidden=!(UI.env==="list"&&UI.sys==="дела");tb.classList.toggle("on",TO.on);tb.setAttribute("aria-pressed",TO.on)}}
  const b=document.getElementById("fbtn");b.hidden=UI.env!=="list";const pb=document.getElementById("pbtn");if(pb)pb.hidden=UI.env!=="kanban";if(UI.env!=="kanban")projClose();
  const pr=PRESETS.find((p)=>p[0]===F.preset);
  b.classList.toggle("on",F.on);b.setAttribute("aria-pressed",F.on);
  b.textContent="🔥 Фокус"+(F.on?" · "+pr[1].toLowerCase():"")}
function initFocusBtn(){const b=document.getElementById("fbtn");let fired=false;
  document.getElementById("tbtn").onclick=()=>{TO.on=!TO.on;saveTO();render()};
  b.onclick=()=>{if(fired){fired=false;return}F.on=!F.on;if(F.on)focusCompute(UI.sys);saveF();render()};
  onMenu(b,(x,y)=>{fired=true;setTimeout(()=>{fired=false},400);
    const items=PRESETS.map(([k,l])=>[(F.preset===k?"✓ ":"    ")+l,()=>{F.preset=k;F.on=true;focusCompute(UI.sys);render()}]);
    items.push("-",["⟳ Обновить набор",()=>{F.on=true;focusCompute(UI.sys);render()}]);
    if(F.on)items.push(["Выключить фокус",()=>{F.on=false;saveF();render()}]);
    popup(x,y,items)})}

