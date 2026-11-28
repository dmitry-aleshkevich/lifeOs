/* ---------- меню задачи «⋯», перенос, пуши в Telegram и настройки уведомлений ---------- */
const PUSH_OPTS=[0,5,15,30,60];
const pushLabel=(m)=>m?"за "+(m<60?m+" мин":m%60?m+" мин":m/60+" ч"):"в момент начала";
/* задача-чек: есть время начала, но нет длительности — таймер не нужен, только отметка */
const isCheck=(t)=>t.type!=="сценарий"&&!t.routine&&!t.min&&!!t.at&&!t.tm&&!t.done;
const askMin=(def)=>{const v=parseInt(prompt("Минут:",String(def)),10);return v>0?v:null};
function setPush(t,m){pushUndo();if(m===null)delete t.push;else t.push={before:m};
  logA("пуш "+(m===null?"выключен":pushLabel(m))+" "+nmq(t));
  if(m!==null&&!t.at){UI.open=t.id;UI.dt=t.id;UI.dtd=null;save();render();note("Укажи время начала — без него пуш не придёт");return}
  save();render()}
function setWhen(t,ms){const d=new Date(ms),pd=(n)=>String(n).padStart(2,"0");
  dueSync(t,dayOf(ms));t.at=pd(d.getHours())+":"+pd(d.getMinutes());delete t.aa}
/* +1 час от времени задачи; если оно уже прошло (или не задано) — через час от сейчас */
function plusHour(t){pushUndo();let base=NOW();
  if(t.at){const [h,m]=t.at.split(":").map(Number),k=t.due||(t.where==="tomorrow"?dayOf(NOW()+864e5):dayISO()),[y,mo,d]=k.split("-").map(Number);
    base=Math.max(base,new Date(y,mo-1,d+(h<4?1:0),h,m).getTime())}
  setWhen(t,Math.ceil((base+36e5)/6e4)*6e4);logA("перенос на час "+nmq(t));save();render();note("Перенёс на "+dateLabel(t))}
function toTomorrow(t){pushUndo();dueSync(t,dayOf(NOW()+864e5));logA("перенос на завтра "+nmq(t));save();render();note("Перенёс на завтра")}
function taskMenu(t,x,y){
  const plain=t.type!=="сценарий"&&!t.routine,items=[];
  const sub=(list)=>popup(x,y,list);
  if(plain){
    items.push(["🔔 Пуш в Telegram: "+(t.push?pushLabel(t.push.before):"нет")+" ›",()=>{
      const cur=t.push?t.push.before:null,mark=(v)=>cur===v?"✓ ":"    ";
      const list=PUSH_OPTS.map((m)=>[mark(m)+pushLabel(m),()=>setPush(t,m)]);
      list.push(["Своё число…",()=>{const v=askMin(10);if(v)setPush(t,v)}],"-",[mark(null)+"Без пуша",()=>setPush(t,null)]);sub(list)}]);
    items.push(["⏰ Перенести ›",()=>sub([["На 1 час",()=>plusHour(t)],["На завтра",()=>toTomorrow(t)]])]);
  }
  const setMin=(m)=>{pushUndo();t.min=m;save();render()};
  if(!t.done)items.push(["⏱ Длительность: "+(t.min?t.min+" мин":"без времени")+" ›",()=>{
    const list=[5,10,15,25,30,45,60].map((m)=>[(t.min===m?"✓ ":"    ")+m+" мин",()=>setMin(m)]);
    list.push(["Своё число…",()=>{const v=askMin(t.min||20);if(v)setMin(v)}],["Без времени",()=>setMin(0)]);
    if(isCheck(t))list.push("-",["▶ Запустить секундомер",()=>{startT(t);render()}]);sub(list)}]);
  items.push([t.gcal?"📅 Обновить в Google Календаре":"📅 В Google Календарь",()=>toCalendar(t)],"-",["🗑 Удалить",()=>delTask(t)]);
  popup(x,y,items)}
/* тонкая линия прогресса по нижнему краю карточки в списке: синяя идёт, серая пауза, красная — время вышло */
function lineSync(li,t){
  let l=li.querySelector(":scope>.tline");
  if(!(t&&t.tm&&!t.tm.sw&&!t.done&&t.min)){if(l)l.remove();return}
  if(!l){l=el("div","tline");l.appendChild(el("i"));li.appendChild(l)}
  const left=leftOf(t),done=spentOf(t),over=left<0,w=over?100:Math.min(100,Math.max(0,done/(done+left||1)*100));
  l.classList.toggle("over",over);l.classList.toggle("pause",!t.tm.run&&!over);
  l.firstChild.style.width=w.toFixed(1)+"%"}
const lineTick=()=>document.querySelectorAll(".card[data-cid]:not(.v)").forEach((c)=>lineSync(c,byId(c.dataset.cid)));
setInterval(()=>{if(S)lineTick()},500);
document.addEventListener("click",()=>setTimeout(()=>{if(S)lineTick()},0));

/* настройки уведомлений: время по Вьетнаму; пока не трогали — боты берут то же самое по умолчанию */
const NOTIFY=[["morning","☀️ Утро","04:00","12:00","09:00"],["evening","🌙 Вечер","17:00","23:00","21:45"],
  ["finance","💰 Финансовый замер","12:00","23:30","23:00"],["subs","🔔 Подписки","05:00","22:00","10:00"]];
function notifyCfg(){const o={};NOTIFY.forEach(([k,,,,def])=>{const c=(S.notify||{})[k]||{};o[k]={on:c.on!==false,time:c.time||def}});return o}
function notifyClose(){const p=document.getElementById("npop");if(p)p.remove()}
function notifyOpen(){
  if(document.getElementById("npop")){notifyClose();return}
  const pop=el("div","npop");pop.id="npop";
  const h=el("div","nph");h.appendChild(el("b","","Уведомления в Telegram"));
  const x=el("button","fbx","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.onclick=notifyClose;h.appendChild(x);pop.appendChild(h);
  const cfg=notifyCfg();
  NOTIFY.forEach(([k,label,min,max])=>{const r=el("label","npr"),cb=el("input"),ti=el("input");
    cb.type="checkbox";cb.checked=cfg[k].on;cb.dataset.k=k;ti.type="time";ti.value=cfg[k].time;ti.min=min;ti.max=max;ti.dataset.k=k;ti.title="С "+min+" до "+max;
    const put=()=>{let v=ti.value||cfg[k].time;if(v<min)v=min;if(v>max)v=max;ti.value=v;
      S.notify=Object.assign(notifyCfg(),{[k]:{on:cb.checked,time:v}});logA("уведомления: "+k+" "+(cb.checked?v:"выкл"));save()};
    cb.onchange=put;ti.onchange=put;r.append(cb,el("span",null,label),ti);pop.appendChild(r)});
  pop.appendChild(el("div","npn","Пуш о задаче включается в самой задаче: ⋯ → Пуш в Telegram."));
  ["keydown","keyup","keypress"].forEach((ev)=>pop.addEventListener(ev,(e)=>{e.stopPropagation();if(ev==="keydown"&&e.key==="Escape")notifyClose()}));
  pop.addEventListener("click",(e)=>e.stopPropagation());
  document.body.appendChild(pop)}
document.getElementById("nbtn").onclick=(e)=>{e.stopPropagation();notifyOpen()};
document.addEventListener("pointerdown",(e)=>{if(document.getElementById("npop")&&!e.target.closest("#npop,#nbtn"))notifyClose()});
