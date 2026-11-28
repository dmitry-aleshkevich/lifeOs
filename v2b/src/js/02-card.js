/* ---------- одна карточка на все окружения ---------- */
/* общие кусочки карточки: считаются один раз, окружение только выбирает, где их поставить */
const CKS=new Set(read("lifeos.v2b.ckshow")||[]);
const saveCks=()=>{try{localStorage.setItem("lifeos.v2b.ckshow",JSON.stringify([...CKS]))}catch{}};
function ckTag(t){const b=el("button","cktag"+(CKS.has(t.id)?" on":""),checkTxt(t));b.type="button";b.title=CKS.has(t.id)?"Скрыть чек-лист":"Показать чек-лист";
  b.onclick=(e)=>{e.stopPropagation();if(CKS.has(t.id))CKS.delete(t.id);else CKS.add(t.id);saveCks();render()};return b}
function ckList(t){const w=el("div","cklist");
  t.check.forEach((c)=>{const r=el("div","ckrow"+(c.done?" done":""));const cb=el("input");cb.type="checkbox";cb.checked=!!c.done;
    cb.onclick=(e)=>e.stopPropagation();cb.onchange=()=>{pushUndo();c.done=cb.checked;save();render()};
    r.append(cb,el("span",null,c.text||c.t||c.name||""));w.appendChild(r)});return w}
const DESCX=new Set(read("lifeos.v2b.descx")||[]);
const saveDescx=()=>{try{localStorage.setItem("lifeos.v2b.descx",JSON.stringify([...DESCX]))}catch{}};
/* тег «ещё» нужен только когда описание не влезает в 2 строки (или уже раскрыто — чтобы свернуть) */
function fitDesc(){document.querySelectorAll(".desc[data-did]").forEach((d)=>{
  const g=d.parentNode&&d.parentNode.querySelector('.dtag[data-did="'+d.dataset.did+'"]');if(!g)return;
  g.hidden=!(d.classList.contains("open")||d.scrollHeight>d.clientHeight+1)})}
const checkTxt=(t)=>t.check&&t.check.length?t.check.filter((c)=>c.done).length+"/"+t.check.length+" ✓":"";
/* сколько осталось до времени начала: серенький текст слева от кнопки времени («через 39 мин»; прошло — «опоздание 10 мин»).
   Только задачи на сегодня со временем, не выполненные и не запущенные. На таймлайне время видно по позиции, в календаре места нет. */
function startDelta(t){   /* мс до времени начала сегодняшней задачи (меньше нуля — опоздание); null — не подходит */
  if(!t||!t.at||t.done||t.tm||t.archived)return null;
  const [y,m,d]=dayOf(NOW()).split("-").map(Number);
  const key=y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0");
  if(!(t.due===key||(!t.due&&t.where==="today")))return null;
  const [hh,mm]=t.at.split(":").map(Number);if(!(hh>=0&&mm>=0))return null;
  return new Date(y,m-1,d+(hh<4?1:0),hh,mm,0,0).getTime()-NOW()}
function untilInfo(t){
  const dl=startDelta(t);if(dl===null)return null;
  const mins=Math.ceil(dl/60000);
  const fm=(n)=>n<60?n+" мин":Math.floor(n/60)+" ч"+(n%60?" "+(n%60)+" мин":"");
  if(mins>180||mins<-720)return null;
  if(mins>0)return {txt:"через "+fm(mins),late:false};
  if(mins===0)return {txt:"сейчас",late:false};
  return {txt:"опоздание "+fm(-mins),late:true}}
function atSpan(t,opt){
  if(opt&&opt.noAt)return null;
  const u=untilInfo(t);if(!u)return null;
  const sp=el("span","at cdn"+(u.late?" late":""),u.txt);sp.dataset.cd=t.id;sp.title="До времени начала ("+t.at+")";return sp}
function refreshCdn(){document.querySelectorAll(".cdn[data-cd]").forEach((n)=>{
  const u=untilInfo(byId(n.dataset.cd));if(!u){n.remove();return}
  if(n.textContent!==u.txt)n.textContent=u.txt;n.classList.toggle("late",u.late)})}
setInterval(refreshCdn,20000);
function pillBtn(t,cls,title){const pl=el("button","mins"+cls,"");pl.type="button";if(title)pl.title=title;pl.dataset.tid=t.id;wirePill(pl,t);return pl}
function cardBase(t,opt={}){
  const li=el("div","card"+(t.done?" done":"")+(t.carry&&!t.done&&t.where==="today"?" carry":""));
  const ck=el("button","ck",t.done?"✓":"");ck.setAttribute("aria-label","Отметить");
  ck.onclick=(e)=>{e.stopPropagation();pushUndo();if(t.done){t.done=false;if(t.type==="работа")t.status="todo";save();render()}else complete(t)};
  li.appendChild(ck);
  const txt=el("div","txt"); txt.appendChild(el("span","nm",t.name||"Без названия"));
  const meta=el("div","meta"); const p=proj(t.project);
  if(t.carry&&!t.done&&t.where==="today")meta.appendChild(el("span","carrytag","со вчера"));
  if(t.type==="дела"&&t.where==="backlog"&&t.col&&!t.done){const cc=(S.cols||[]).find((x)=>x.id===t.col);if(cc)meta.appendChild(el("span","chip pc-gray",cc.name))}
  if(p&&!opt.noProject){const c=el("span","chip pc-"+p.color,p.name);meta.appendChild(c)}
  if(checkTxt(t)&&!opt.v)meta.appendChild(ckTag(t));
  if(t.tpl&&!t.link)meta.appendChild(el("span","chip pc-gray","⚙ ядро"));
  if(t.push&&!t.done){const b=el("span","bellm","🔔");b.title="Пуш в Telegram: "+pushLabel(t.push.before);meta.appendChild(b)}
  const kids=S.tasks.filter((x)=>x.link===t.id).length;
  if(kids)meta.appendChild(el("span","subn",kids+" подзадач"+(kids===1?"а":"и")));
  if(t.desc){const d=el("span","desc"+(DESCX.has(t.id)?" open":""),t.desc);d.dataset.did=t.id;meta.appendChild(d);
    const g=el("button","cktag dtag"+(DESCX.has(t.id)?" on":""),DESCX.has(t.id)?"свернуть ▴":"ещё ▾");g.type="button";g.hidden=true;g.dataset.did=t.id;g.title="Описание целиком / свернуть";
    g.onclick=(e)=>{e.stopPropagation();if(DESCX.has(t.id))DESCX.delete(t.id);else DESCX.add(t.id);saveDescx();render()};meta.appendChild(g)}
  if(meta.children.length)txt.appendChild(meta);
  if(opt.v){
    li.classList.add("v");
    const top=el("div","top");top.appendChild(li.firstChild);top.appendChild(txt);
    if(!t.done&&!isCheck(t))top.appendChild(pillBtn(t," kp","Старт/пауза. ПКМ — время"));
    li.appendChild(top);
    if(t.min){const pr=el("div","prog"),i=el("i");
      i.style.width=Math.min(100,Math.round((spentOf(t)/60000)/t.min*100))+"%";pr.appendChild(i);li.appendChild(pr)}
    if(!(t.min||checkTxt(t)||atSpan(t,opt)))return li;
    const r2=el("div","row2");
    r2.appendChild(el("span","pmeta",t.min?Math.round(spentOf(t)/60000)+" из "+t.min+" мин":""));
    if(checkTxt(t))r2.appendChild(ckTag(t));
    const right=el("div","r2r");
    {const a=atSpan(t,opt);if(a)right.appendChild(a)}
    r2.appendChild(right);
    li.appendChild(r2);
    return li;
  }
  li.appendChild(txt);
  {const a=atSpan(t,opt);if(a)li.appendChild(a)}
  if(t.done){const sp=t.spent||0;
    if(sp>0||t.min){const c=el("span","mins done-t"+(t.min&&sp>t.min*60000?" late":" early"),fmtSpent(sp));li.appendChild(c)}}
  else if(!isCheck(t))li.appendChild(pillBtn(t,opt.hot?" hot":""));
  return li;
}

