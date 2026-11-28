/* ---------- окно «Проекты»: порядок и видимость (скрыть = блок и его задачи в архив) ---------- */
const projList=()=>S.projects.filter((p)=>p.type===UI.sys&&(UI.sys==="работа"||!/^работа$/i.test(p.name)));
function projHide(p,on){p.hidden=!!on;
  S.tasks.forEach((t)=>{if(t.project!==p.id)return;
    if(on){if(!t.archived){t.archived=true;t.pHid=true}}else if(t.pHid){t.archived=false;t.pHid=false}})}
function projReorder(ids){const list=projList(),slots=list.map((p)=>S.projects.indexOf(p));
  ids.forEach((id,i)=>{S.projects[slots[i]]=list.find((p)=>p.id===id)})}
/* цена проекта в шапке колонки; голое число — по разрядам, свой текст («1500 $») как есть */
function priceBadge(id){const p=S.projects.find((x)=>x.id===id),v=p&&String(p.price||"").trim();if(!v)return null;
  const b=el("span","hprice",/^\d+$/.test(v)?(+v).toLocaleString("ru-RU"):v);b.title="Цена проекта: "+v;return b}
function projClose(){const p=document.getElementById("ppop");if(p)p.remove()}
function projOpen(){
  if(document.getElementById("ppop")){projClose();return}
  const pop=el("div","ppop");pop.id="ppop";
  const h=el("div","ph");h.appendChild(el("span",null,"Проекты · "+(UI.sys==="дела"?"Дела":"Работа")));
  const x=el("button","px","×"),hide=el("button",null,"Скрыть все"),show=el("button",null,"Показать все"),pa=el("div","pa");
  [hide,show,x].forEach((b)=>b.type="button");x.setAttribute("aria-label","Закрыть");x.onclick=projClose;
  const addp=el("button",null,"＋ Проект");addp.type="button";addp.id="padd";
  addp.onclick=()=>{const cols=["blue","orange","violet","green","yellow","gray"];pushUndo();S.projects.push({id:"p-"+Math.random().toString(36).slice(2,9),name:"Новый проект",color:cols[S.projects.length%cols.length],type:UI.sys});logA("проект добавлен");save();draw();render();const ins=ul.querySelectorAll(".pnin");const l=ins[ins.length-1];if(l){l.focus();l.select()}};
  h.appendChild(x);pop.appendChild(h);pa.append(addp,hide,show);pop.appendChild(pa);
  const ul=el("div","plist");pop.appendChild(ul);
  const draw=()=>{ul.innerHTML="";projList().forEach((p)=>{
    const r=el("div","prow"+(p.hidden?" off":""));r.dataset.pid=p.id;
    const g=el("span","pg","⋮⋮");g.setAttribute("aria-hidden","true");
    const n=el("input","pn pnin");n.type="text";n.value=p.name;n.maxLength=40;n.setAttribute("aria-label","Название проекта");n.style.background="var(--pc-"+(p.color||"gray")+"-bg)";
    n.onchange=()=>{const x=n.value.trim();if(!x){n.value=p.name;return}pushUndo();p.name=x;logA("проект переименован: "+x);save();render()};
    const pr=el("input","pprice");pr.type="text";pr.value=p.price||"";pr.placeholder="цена";pr.maxLength=20;pr.setAttribute("aria-label","Цена проекта");pr.onchange=()=>{p.price=pr.value.trim();save();render()};
    const dl=el("button","pe pdel","🗑");dl.type="button";dl.title="Удалить проект";dl.setAttribute("aria-label","Удалить проект");
    dl.onclick=()=>{if(dl.dataset.arm!=="1"){dl.dataset.arm="1";dl.textContent="Точно?";setTimeout(()=>{dl.dataset.arm="";dl.textContent="🗑"},2500);return}
      pushUndo();S.tasks.forEach((t)=>{if(t.project===p.id)t.project=""});S.projects=S.projects.filter((x)=>x!==p);logA("проект удалён: "+p.name);save();draw();render()};
    const e=el("button","pe");e.type="button";e.title=p.hidden?"Показать":"Скрыть";e.setAttribute("aria-label",e.title);
    e.innerHTML=p.hidden?'<svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c5 0 8.5 4.5 9.5 6a14 14 0 0 1-3 3.4M6.3 7.6C4.3 9 3 11 2.5 12c1 1.5 4.5 6 9.5 6 1.4 0 2.7-.4 3.8-.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      :'<svg viewBox="0 0 24 24" width="20" height="20"><path d="M2.5 12C3.5 10.5 7 6 12 6s8.5 4.5 9.5 6c-1 1.5-4.5 6-9.5 6S3.5 13.5 2.5 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
    e.onclick=()=>{pushUndo();projHide(p,!p.hidden);logA("проект "+(p.hidden?"скрыт":"показан")+": "+p.name);save();draw();render()};
    r.append(g,n,pr,e,dl);ul.appendChild(r);
    g.addEventListener("pointerdown",(ev)=>{if(ev.button!==0)return;ev.preventDefault();r.classList.add("drag");let moved=false;
      const mv=(m)=>{const rows=[...ul.children].filter((c)=>c!==r);let before=null;
        for(const c of rows){const b=c.getBoundingClientRect();if(m.clientY<b.top+b.height/2){before=c;break}}
        const cur=r.nextSibling;if(before!==cur){ul.insertBefore(r,before);moved=true}};
      const up=()=>{removeEventListener("pointermove",mv);removeEventListener("pointerup",up);removeEventListener("pointercancel",up);r.classList.remove("drag");
        if(moved){pushUndo();projReorder([...ul.children].map((c)=>c.dataset.pid));logA("порядок проектов изменён");save();render()}};
      addEventListener("pointermove",mv);addEventListener("pointerup",up);addEventListener("pointercancel",up)})})};
  const all=(on)=>{pushUndo();projList().forEach((p)=>projHide(p,on));save();draw();render()};
  hide.onclick=()=>all(true);show.onclick=()=>all(false);
  ["keydown","keyup","keypress"].forEach((ev)=>pop.addEventListener(ev,(e)=>{e.stopPropagation();if(ev==="keydown"&&e.key==="Escape")projClose()}));
  draw();document.body.appendChild(pop)}
document.getElementById("pbtn").onclick=projOpen;
document.getElementById("cbtn").onclick=()=>{CORE.show=!CORE.show;saveCore();render()};
document.addEventListener("pointerdown",(e)=>{if(document.getElementById("ppop")&&!e.target.closest("#ppop,#pbtn"))projClose()});
/* ================= Beta 2.0: шаблоны дня (ядро), привычки, итоги ================= */
const pad2=(n)=>String(n).padStart(2,"0");
const uid=()=>Math.random().toString(36).slice(2,10);
const fromISO=(k)=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const isoOf=(d)=>d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
const addDays=(k,n)=>{const d=fromISO(k);d.setDate(d.getDate()+n);return isoOf(d)};
const mondayOf=(k)=>{const d=fromISO(k);d.setDate(d.getDate()-(d.getDay()+6)%7);return isoOf(d)};
const WD=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"],MONN=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const clock=(ts)=>{const d=new Date(ts);return pad2(d.getHours())+":"+pad2(d.getMinutes())};
const durShort=(ms)=>{const m=Math.round(ms/60000),h=Math.floor(m/60),r=m%60;return h?h+":"+pad2(r):m+" мин"};
const PLAN_DAYS=[1,2,3,4,5,6,0],PLAN_ALL=[0,1,2,3,4,5,6];
const planKid=(name,min)=>({id:uid(),name,min});
const planDefault=()=>[
  {id:"p-gym",name:"Зал 🏋️",at:"15:00",min:60,days:[1,3,5],pre:[],post:[]},
  {id:"p-lunch-a",name:"Обед 🍽️",at:"15:00",min:30,days:[0,2,4,6],pre:[planKid("Готовка 🍳",20)],post:[planKid("Посуда 🧽",10)]},
  {id:"p-lunch-b",name:"Обед 🍽️",at:"16:15",min:30,days:[1,3,5],pre:[planKid("Готовка 🍳",20)],post:[planKid("Посуда 🧽",10)]},
  {id:"p-dinner",name:"Ужин 🍽️",at:"21:30",min:30,days:PLAN_ALL.slice(),pre:[planKid("Готовка 🍳",20)],post:[planKid("Посуда 🧽",10)]}];
const HABITS_DEF=[{id:"sleep",name:"Отбой до 01:00",auto:"sleep"},{id:"wake",name:"Подъём в 9",auto:"wake"},{id:"smoke",name:"Без сигарет 🚭"},{id:"alco",name:"Без алкоголя"},{id:"gym",name:"Зал",days:[1,3,5]},{id:"posture",name:"Осанка 10 минут"},{id:"blog",name:"Контент для блога"},{id:"speech",name:"10 минут говорю вслух"}];
/* данные для привычек/итогов/шаблонов берутся из v1 один раз, дальше живут в Beta 2.0 */
function ensureExtras(){const v1=read(V1)||{};let ch=false;
  if(!Array.isArray(S.plan)){S.plan=Array.isArray(v1.plan)&&v1.plan.length?v1.plan:planDefault();ch=true}
  if(!Array.isArray(S.habits)){S.habits=Array.isArray(v1.habits)&&v1.habits.length?v1.habits:HABITS_DEF.map((h)=>Object.assign({},h));ch=true}
  if(!S.habitLog||typeof S.habitLog!=="object"){S.habitLog=v1.habitLog&&typeof v1.habitLog==="object"?v1.habitLog:{};ch=true}
  if(!Array.isArray(S.log)){S.log=Array.isArray(v1.log)?v1.log.slice(-800):[];ch=true}
  if(!S.sleep||typeof S.sleep!=="object"){S.sleep=v1.sleep&&typeof v1.sleep==="object"?v1.sleep:{};ch=true}
  if(ch)save()}
const CORE={show:read("lifeos.v2b.core")!==false};
const saveCore=()=>{try{localStorage.setItem("lifeos.v2b.core",JSON.stringify(CORE.show))}catch{}};
/* блоки шаблона сами появляются в «Сегодня» каждый день: Зал, Обед, Ужин + Готовка «до» и Посуда «после». Это «ядро» (LifeCore) */
function planSync(force){ensureExtras();const today=dayISO();if(S.planGen===today&&!force)return false;
  const dow=fromISO(today).getDay();
  S.tasks=S.tasks.filter((t)=>!(t.tpl&&!t.done&&(force||(t.tplDay||"")<today)&&!(t.tm&&t.tm.run)));
  S.plan.forEach((b)=>{if(!b.days.includes(dow))return;
    if(S.tasks.some((t)=>t.tpl===b.id&&t.tplDay===today&&!t.link))return;
    const mk=(name,min,at)=>task({name,min,at:at||"",due:today},{type:"дела",where:"today",tpl:b.id,tplDay:today,ord:S.tasks.length});
    const par=mk(b.name,b.min,b.at);
    S.tasks.push(...(b.pre||[]).map((k)=>Object.assign(mk(k.name,k.min),{link:par.id,rel:"pre"})),par,...(b.post||[]).map((k)=>Object.assign(mk(k.name,k.min),{link:par.id,rel:"post"})))});
  S.planGen=today;save();return true}
function paintCoreBtn(){const b=document.getElementById("cbtn");if(!b)return;
  b.hidden=!(UI.sys==="дела"&&(UI.view||"tasks")==="tasks"&&UI.env!=="calendar");b.classList.toggle("on",CORE.show);b.setAttribute("aria-pressed",CORE.show)}
