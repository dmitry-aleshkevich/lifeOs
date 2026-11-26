/* ---------- единственное место, где рождается задача ---------- */
function makeTask(f,ctx,at){
  const name=String(f.name||"").trim();if(!name)return null;
  pushUndo();
  const t=task(Object.assign({},f,{name}),Object.assign({type:UI.sys,ord:S.tasks.length},ctx));
  if(at==="top")S.tasks.unshift(t);else if(typeof at==="number")S.tasks.splice(at,0,t);else S.tasks.push(t);
  logA("создана "+nmq(t));save();return t}
/* ---------- быстрый ввод новой задачи ---------- */
UI.qa={top:{txt:"",dur:0},bottom:{txt:"",dur:0}};
const PARTS=[["m","Утро","08:00"],["d","День","13:00"],["e","Вечер","19:00"]];
const partT=(k)=>{const d=PARTS.find((x)=>x[0]===k)[2];return (typeof S!=="undefined"&&S&&S.parts&&/^\d\d:\d\d$/.test(S.parts[k]||""))?S.parts[k]:d};
/* время текстом: «завтра в 9», «в пт 18:00», «через 2 часа» → {rest,at,due}; ничего не нашли — at/due пустые */
const WDAY={"пн":1,"вт":2,"ср":3,"чт":4,"пт":5,"сб":6,"вс":0,"понедельник":1,"вторник":2,"среда":3,"среду":3,"четверг":4,"пятница":5,"пятницу":5,"суббота":6,"субботу":6,"воскресенье":0};
function parseWhen(txt){
  let s=" "+String(txt||"")+" ",at="",due="";const pad=(n)=>String(n).padStart(2,"0");
  const base=()=>{const [y,m,d]=dayOf(NOW()).split("-").map(Number);return [y,m,d]};
  const addDays=(n)=>{const [y,m,d]=base(),x=new Date(y,m-1,d+n);return x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate())};
  s=s.replace(/\s(?:через)\s+(\d+)\s*(минуты|минуту|минут|мин|м|часов|часа|час|ч)(?=\s)/i,(m,n,u)=>{
    const d=new Date(NOW()+(+n)*(/^ч/i.test(u)?60:1)*6e4);at=pad(d.getHours())+":"+pad(d.getMinutes());due=dayOf(d.getTime());return " "});
  s=s.replace(/\s(послезавтра|завтра|сегодня)(?=\s)/i,(m,w)=>{due=addDays({"сегодня":0,"завтра":1,"послезавтра":2}[w.toLowerCase()]);return " "});
  s=s.replace(/\sв\s+(понедельник|вторник|среду|среда|четверг|пятницу|пятница|субботу|суббота|воскресенье|пн|вт|ср|чт|пт|сб|вс)(?=\s)/i,(m,w)=>{
    const [y,mo,d]=base(),cur=new Date(y,mo-1,d).getDay();due=addDays(((WDAY[w.toLowerCase()]-cur+7)%7)||7);return " "});
  s=s.replace(/\s(утром|днем|днём|вечером)(?=\s)/i,(m,w)=>{if(!at)at=partT({"утром":"m","днем":"d","днём":"d","вечером":"e"}[w.toLowerCase()]);return " "});
  s=s.replace(/\sв\s+(\d{1,2})(?:[:.](\d{2}))?(?:\s*(утра|вечера|дня|ночи))?(?=\s*$|\s+[#\d])/i,(m,h,mi,ap)=>{
    let H=+h;const M=mi?+mi:0;if(H>23||M>59)return m;
    if(ap){ap=ap.toLowerCase();if((ap==="вечера"||ap==="дня")&&H<12)H+=12;else if(ap==="ночи"&&H===12)H=0}
    at=pad(H)+":"+pad(M);return " "});
  return {rest:s.replace(/\s+/g," ").trim(),at,due}}
 function parseQuick(txt){
  const w=parseWhen(txt);let name=w.rest,at=w.at,min=0,pid="";
  name=name.replace(/(^|\s)(\d{1,2}):(\d{2})(?=\s|$)/,(m,a,h,mi)=>{at=String(h).padStart(2,"0")+":"+mi;return a});
  name=name.replace(/(^|\s)(\d+)\s*(мин|м|m|ч|h)(?=\s|$)/i,(m,a,n,u)=>{min=(+n)*(/^(ч|h)$/i.test(u)?60:1);return a});
  name=name.replace(/(^|\s)#(\S+)/,(m,a,w)=>{const pj=S.projects.find((x)=>x.type===UI.sys&&x.name.toLowerCase().startsWith(w.toLowerCase()));if(pj)pid=pj.id;return pj?a:m});
  return {name:name.replace(/\s+/g," ").trim(),at,min,pid,due:w.due}}
function addQuick(pos,start){
  const st=UI.qa[pos],q=parseQuick(st.txt);if(!q.name)return null;
  const t=makeTask({name:q.name,at:q.at,min:q.min||st.dur||0,project:q.pid},
    {where:UI.sys==="дела"?"today":"",status:UI.sys==="работа"?"todo":""},pos==="top"?"top":undefined);
  if(q.due)dueSync(t,q.due);
  st.txt="";st.dur=0;UI.qaFocus=pos;save();
  if(start)startT(t);
  render();
  if(F.on)note("Добавлено вне фокуса. ПКМ на «Фокус» → «Обновить набор».");
  return t}
function scenMatch(txt){const q=String(txt||"").trim().toLowerCase();if(q.length<2||!S)return [];scenInit();const out=[];
  S.scen.filter((sc)=>sc.kind==="custom").forEach((sc)=>{const nm=sc.name.replace(/[^\p{L}\p{N} ]/gu,"").trim().toLowerCase();if(!nm.startsWith(q))return;
    sc.versions.forEach((ver)=>{const n=scenTasks(sc,ver).length;if(n)out.push({sc,ver,n,min:scenSum(sc,ver)})})});return out}
function qaBox(pos){
  const st=UI.qa[pos],w=el("div","qa");w.dataset.pos=pos;
  const inp=el("input");inp.type="text";inp.placeholder="Новая задача";inp.value=st.txt;inp.setAttribute("enterkeyhint","done");
  const sug=el("div","qsug");sug.hidden=true;let ms=[],mi=0,off=false;
  const drawSug=()=>{sug.innerHTML="";ms=off?[]:scenMatch(inp.value);if(mi>=ms.length)mi=0;sug.hidden=!ms.length;
    ms.forEach((m,i)=>{const r=el("div","qs"+(i===mi?" on":""));r.dataset.sid=m.sc.id;r.dataset.ver=m.ver.id;
      r.appendChild(el("span",null,"Сценарий «"+m.sc.name+"»"+(m.sc.versions.length>1?" · "+m.ver.name:"")));r.appendChild(el("small",null,m.n+" · "+fmtMin(m.min)));
      r.onpointerdown=(e)=>{e.preventDefault();useSug(m)};sug.appendChild(r)})};
  const useSug=(m)=>{st.txt="";inp.value="";UI.qaFocus=pos;scenApply(m.sc,m.ver)};
  inp.oninput=()=>{st.txt=inp.value;off=false;drawSug()};
  inp.onkeydown=(e)=>{
    if(ms.length&&(e.key==="ArrowDown"||e.key==="ArrowUp")){e.preventDefault();mi=(mi+(e.key==="ArrowDown"?1:ms.length-1))%ms.length;drawSug();return}
    if(ms.length&&e.key==="Escape"){e.stopPropagation();off=true;drawSug();return}
    if(e.key==="Enter"){if(ms.length&&!(e.ctrlKey||e.metaKey))useSug(ms[mi]);else addQuick(pos,false)}};
  inp.onblur=()=>setTimeout(()=>{sug.hidden=true},150);inp.onfocus=()=>drawSug();
  const pl=el("button","mins qp","");pl.type="button";pl.title="Создать и запустить. ПКМ — длительность";
  const paint=()=>{pl.textContent="▶"+(st.dur?" "+st.dur+" мин":"")};paint();
  pl.onclick=()=>{if(!st.txt.trim()){inp.focus();return}addQuick(pos,true)};
  onMenu(pl,(x,y)=>{
    const pick=(m)=>{st.dur=m;paint();if(inp.value.trim()){st.txt=inp.value;addQuick(pos,false)}};
    const it=[5,10,15,25,30,45,60].map((m)=>[(st.dur===m?"✓ ":"    ")+m+" мин",()=>pick(m)]);
    it.push("-",["Своё число…",()=>{const v=parseInt(prompt("Минут:","20"),10);if(v>0)pick(v)}],["Без времени (секундомер)",()=>pick(0)]);
    popup(x,y,it)});
  w.append(inp,pl,sug);return w}

function card(t,opt={}){
  const li=cardBase(t,opt);
  const nm=li.querySelector(".nm");if(nm)nm.onclick=(e)=>{if(e.metaKey||e.ctrlKey||e.shiftKey||SEL.size)return;e.stopPropagation();editName(nm,t)};
  if(SEL.has(t.id))li.classList.add("sel");
  li.addEventListener("click",(e)=>{if(e.target.closest("button,input,textarea,.panel"))return;
    LASTT=t.name;if(e.shiftKey&&SEL.size){rangeSel(t);return}if(e.metaKey||e.ctrlKey||e.shiftKey||SEL.size){toggleSel(t);return}UI.open=UI.open===t.id?null:t.id;UI.sub=null;UI.dt=null;render()});
  li.dataset.cid=t.id;if(t.link)li.dataset.sub="1";
  if(!opt.noAt){
    const kidsOf=t.link?[]:S.tasks.filter((x)=>x.link===t.id);
    [["pre","pl-top","Добавить задачу перед этой"],["post","pl-bot","Добавить задачу после этой"]].forEach(([rel,cls,tt])=>{
      const has=kidsOf.some((k2)=>(k2.rel==="pre")===(rel==="pre")),key=rel+":"+t.id;if(t.done&&!has)return;
      const b=el("button","plus "+cls+(has?" arr":""),has?((rel==="pre")===FOLD.has(key)?"⌃":"⌄"):"+");b.type="button";
      b.title=has?(FOLD.has(key)?"Показать":"Скрыть")+(rel==="pre"?" предзадачи":" подзадачи"):tt;b.setAttribute("aria-label",b.title);
      b.onclick=(e)=>{e.stopPropagation();
        if(has){if(FOLD.has(key))FOLD.delete(key);else FOLD.add(key);saveFold();render()}
        else{UI.sub={id:t.id,rel,dur:0,txt:""};render()}};li.appendChild(b)})}
  if(UI.sub&&UI.sub.id===t.id)li.appendChild(subBox(t));
  const x=el("button","x","✕");x.type="button";x.title="Удалить";x.setAttribute("aria-label","Удалить");x.onclick=(e)=>{e.stopPropagation();delTask(t)};li.appendChild(x);
  if(CKS.has(t.id)&&t.check&&t.check.length&&UI.open!==t.id)li.appendChild(ckList(t));
  if(UI.open===t.id){li.classList.add("open");li.appendChild(panel(t))}
  return li}

/* общий канбан: используют «Дела/Работа» и редактор сценариев; различаются только фильтром, колонками и записью при броске */
function kbBoard(host,o){
  const {id,cols,pick,addOpts,base}=o,work=UI.sys==="работа";
  if(o.headEl)host.appendChild(o.headEl);else host.appendChild(el("div","ghead")).appendChild(el("span",null,o.label));
  const kb=el("div","kb"+(o.kbCls?" "+o.kbCls:""));
  cols.forEach(([k,title,color])=>{
    const items=base().filter((t)=>pick(t,k));
    const c=el("div","col"+(o.colCls?" "+o.colCls:"")),col=color||"gray";c.dataset.board=id;c.dataset.key=k;if(o.colData)o.colData(c,k);
    c.style.setProperty("--cbg","color-mix(in srgb, var(--pc-"+col+"-bg) 55%, var(--surface-2))");
    c.style.setProperty("--cln","color-mix(in srgb, var(--pc-"+col+") 22%, var(--line))");
    c.style.setProperty("--ctag","var(--pc-"+col+"-bg)");
    c.style.setProperty("--cink","var(--pc-"+col+")");
    const h=el("h3");
    if(o.colHead)o.colHead(h,k,items,c);
    else{h.appendChild(el("span","tag",title));h.appendChild(el("span","cnt",String(items.length)));{const sm=items.reduce((a,t)=>a+(t.min||0),0);h.appendChild(el("span","hsum",Math.floor(sm/60)+":"+String(sm%60).padStart(2,"0")))}
      if(id==="status"&&((work&&k==="todo")||(!work&&k==="today")||k==="done")){
        const b=el("button","clr","Очистить");b.type="button";b.title=k==="done"?"Убрать выполненные с доски":"Вернуть задачи в проекты";
        b.onclick=()=>clearColumn(k);h.appendChild(b)}}
    c.appendChild(h);
    items.forEach((t)=>rowWithKids(c,t,{v:true,noProject:id==="project"||id==="scen"}));
    if(!(id==="status"&&k==="done")){
      const add=el("button","add","+ Задача");add.type="button";add.dataset.a="addtask";
      add.onclick=()=>{const t=makeTask({name:"Новая задача",min:0},addOpts(k));render();
        const nm=document.querySelector('[data-cid="'+t.id+'"] .nm');if(nm)editName(nm,t,true)};
      c.appendChild(add)}
    if(o.colFoot)o.colFoot(c,k);
    kb.appendChild(c)});
  host.appendChild(kb);
  if(id==="project")kb.querySelectorAll(".col[data-board=project]").forEach((c)=>{if(!c.dataset.key)return;
    const h=c.querySelector("h3");h.classList.add("pdrag");h.dataset.pid=c.dataset.key;{const g=el("span","grip","⋮⋮");g.setAttribute("aria-hidden","true");h.prepend(g)}wireColDrag(h,c,kb)});
  return kb}
function wireColDrag(h,col,kb){
  let st=null;
  h.addEventListener("pointerdown",(e)=>{if(e.target.closest("button")||(e.pointerType==="mouse"&&e.button!==0))return;
    if(e.pointerType==="mouse")e.preventDefault();
    st={x:e.clientX,y:e.clientY,on:false,touch:e.pointerType!=="mouse",tm:null,ok:e.pointerType==="mouse"};
    if(st.touch)st.tm=setTimeout(()=>{if(st){st.ok=true;col.classList.add("pdrop")}},350)});
  const cols=()=>[...kb.querySelectorAll(".col[data-board=project]")].filter((c)=>c.dataset.key);
  const over=(x)=>{let t=null;cols().forEach((c)=>{const r=c.getBoundingClientRect();if(x>=r.left&&x<=r.right)t=c});return t};
  window.addEventListener("pointermove",(e)=>{if(!st)return;
    if(!st.on){if(Math.hypot(e.clientX-st.x,e.clientY-st.y)<6)return;if(!st.ok){clearTimeout(st.tm);st=null;return}st.on=true;col.classList.add("pdrop","pmove");document.body.classList.add("drag");try{getSelection().removeAllRanges()}catch{}}
    e.preventDefault();cols().forEach((c)=>c.classList.toggle("pdrop",c===over(e.clientX)||c===col));
    const t=over(e.clientX);cols().forEach((c)=>c.style.outline=c===t&&c!==col?"2px dashed var(--accent)":"")});
  const end=(e)=>{if(!st)return;clearTimeout(st.tm);const on=st.on;st=null;document.body.classList.remove("drag");cols().forEach((c)=>{c.classList.remove("pdrop","pmove");c.style.outline=""});
    if(!on)return;swallow=true;setTimeout(()=>{swallow=false},50);
    const t=over(e.clientX);if(!t||t===col)return;
    const a=S.projects.findIndex((p)=>p.id===col.dataset.key),b=S.projects.findIndex((p)=>p.id===t.dataset.key);
    if(a<0||b<0)return;pushUndo();const [m]=S.projects.splice(a,1);S.projects.splice(b,0,m);save();render()};
  window.addEventListener("pointerup",end);window.addEventListener("pointercancel",()=>{if(st){clearTimeout(st.tm);st=null;document.body.classList.remove("drag");cols().forEach((c)=>c.classList.remove("pdrop","pmove"))}})}
function clearColumn(k){pushUndo();
  const work=UI.sys==="работа";
  S.tasks.forEach((t)=>{if(t.type!==UI.sys||t.link||t.archived)return;
    if(k==="done"){if(t.done)t.archived=true}
    else if(work&&k==="todo"&&t.status==="todo"&&t.project)t.status="";
    else if(!work&&k==="today"&&t.where==="today"&&!t.done&&t.project)t.where=""});
  save();render()}
function dropKanban(d,t,o,after){
  const col=d.tgt.col,board=col.dataset.board,key=col.dataset.key,work=t.type==="работа";
  logA("перенос "+nmq(t)+" → колонка "+key);
  S.tasks=S.tasks.filter((x)=>x!==t);t.link="";t.rel="";
  if(board==="scen"){const sid=col.dataset.sid;t.sc=sid;t.sv=key;S.tasks.forEach((x)=>{if(x.link===t.id){x.sc=sid;x.sv=key}});
    if(o)S.tasks.splice(S.tasks.indexOf(o)+(after?1:0),0,t);else S.tasks.push(t);return}
  if(board==="status"){
    if(key==="done"){if(!t.done)markDone(t)}
    else{if(t.done)t.done=false;
      if(work){if(key==="wait"&&t.tm&&t.tm.run)pauseT(t);t.status=key}else t.where=key}}
  else{t.project=key;if(t.tm&&t.tm.run)pauseT(t);t.done=false;if(work)t.status="";else t.where=""}
  if(o)S.tasks.splice(S.tasks.indexOf(o)+(after?1:0),0,t);else S.tasks.push(t)}
/* Alt + бросок в другую версию сценария: копия задачи (с до/после-подзадачами), оригинал остаётся */
function scenCopyTask(t,col,o,after){
  const sid=col.dataset.sid,sv=col.dataset.key;
  const mk=(x)=>task({name:x.name,min:x.min,desc:x.desc,at:x.at||"",check:(x.check||[]).map((c)=>({text:c.text||"",done:false}))},{type:"сценарий",sc:sid,sv,where:"",ord:S.tasks.length});
  const par=mk(t),kids=S.tasks.filter((k)=>k.link===t.id).map((k)=>Object.assign(mk(k),{link:par.id,rel:k.rel}));
  const all=[...kids.filter((k)=>k.rel==="pre"),par,...kids.filter((k)=>k.rel!=="pre")];
  logA("копия "+nmq(t)+" → версия "+sv);
  const at=o&&S.tasks.indexOf(o)>=0?S.tasks.indexOf(o)+(after?1:0):S.tasks.length;S.tasks.splice(at,0,...all);return par}
function dropList(d,t,o,after,head,w){
  logA("перенос "+nmq(t)+(head?" → группа "+w:""));
  t.link="";t.rel="";S.tasks=S.tasks.filter((x)=>x!==t);let idx;
  if(head){t.where=w;const first=S.tasks.findIndex((x)=>x.type===t.type&&!x.link&&(x.where||"")===w);idx=first>=0?first:S.tasks.length}
  else if(!o){S.tasks.push(t);return}
  else{t.where=o.where;idx=S.tasks.indexOf(o)+(after?1:0)}
  S.tasks.splice(idx,0,t)}
