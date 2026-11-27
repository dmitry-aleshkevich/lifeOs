/* ================= Beta 2.0: сценарии (Утро / Вечер / свои) с версиями ================= */
const scenItem=(it)=>({id:uid(),name:String(it.name||""),min:Math.max(0,Math.min(240,Math.round(+it.min||0))),check:Array.isArray(it.check)?it.check.slice():[],pre:Array.isArray(it.pre)?it.pre.map((k)=>({id:uid(),name:k.name,min:+k.min||0})):[],post:Array.isArray(it.post)?it.post.map((k)=>({id:uid(),name:k.name,min:+k.min||0})):[]});
const scenTasks=(sc,ver)=>S.tasks.filter((t)=>t.type==="сценарий"&&t.sc===sc.id&&t.sv===ver.id);
const fmtMin=(m)=>m<60?m+" мин":(Math.round(m/6)/10)+" ч";
const scenSum=(sc,ver)=>scenTasks(sc,ver).reduce((a,t)=>a+(t.min||0),0);
/* пункты сценария — обычные задачи особого типа «сценарий» (sc — сценарий, sv — версия, link/rel — до/после) */
function scenMigrate(){let ch=false;
  (S.scen||[]).forEach((sc)=>sc.versions.forEach((ver)=>{if(!Array.isArray(ver.items))return;ch=true;
    const mkT=(x)=>task({name:x.name,min:x.min,check:(x.check||[]).filter(Boolean).map((c)=>({text:c,done:false}))},{type:"сценарий",sc:sc.id,sv:ver.id,where:"",ord:S.tasks.length});
    ver.items.forEach((it)=>{const par=mkT(it);
      S.tasks.push(...(it.pre||[]).map((q)=>Object.assign(mkT(q),{link:par.id,rel:"pre"})),par,...(it.post||[]).map((q)=>Object.assign(mkT(q),{link:par.id,rel:"post"})))});
    delete ver.items;delete ver.mode}));
  if(ch)save()}
function scenInit(){ensureExtras();if(Array.isArray(S.scen)){scenMigrate();return}
  const v1=read(V1)||{},ms=Array.isArray(v1.mScen)&&v1.mScen.length?v1.mScen:null;
  const cur=(k)=>rItems(k).map((t)=>scenItem({name:t.name,min:t.min,check:(t.check||[]).map((c)=>c.text||c.t||c.name||"")}));
  const strip=(a)=>(a||[]).map((x)=>({name:x.name,min:x.min}));
  const mv=ms?ms.map((sc)=>({id:String(sc.id),name:((sc.icon||"")+" "+(sc.name||"")).trim(),items:strip(sc.items).map(scenItem)})):[{id:"std",name:"Стандарт",items:cur("morning")}];
  const ev=(v1.routines&&v1.routines.evening&&v1.routines.evening.length)?strip(v1.routines.evening).map(scenItem):cur("evening");
  const tp=Array.isArray(v1.tpls)&&v1.tpls.length?v1.tpls:[{id:"t-clean",name:"Уборка 🧹",mode:"sub",items:[{name:"Кухня",min:5},{name:"Комната",min:10},{name:"Одежда",min:5}]}];
  S.scen=[{id:"morning",kind:"morning",name:"Утро",icon:"☀️",versions:mv},{id:"evening",kind:"evening",name:"Вечер",icon:"🌙",versions:[{id:"std",name:"Стандарт",items:ev}]}]
    .concat(tp.map((t)=>({id:String(t.id||"t-"+uid()),kind:"custom",name:String(t.name||"Сценарий"),icon:"",versions:[{id:"std",name:"Стандарт",mode:t.mode==="check"?"check":"sub",items:strip(t.items).map(scenItem)}]})));
  scenMigrate();save()}
const scenDefaultVer=(sc)=>{if(sc.kind!=="morning")return sc.versions[0].id;const id=[1,3,5].includes(new Date(NOW()).getDay())?"fast":"home";return (sc.versions.find((v)=>v.id===id)||sc.versions[0]).id};
/* применить версию: утро заменяет невыполненные пункты, вечер добавляется вниз, свой сценарий — задачей в «Сегодня» */
function scenApply(sc,ver){scenInit();pushUndo();BATCH=true;
  try{const base=sc.kind==="custom"?{type:"дела",where:"today"}:{type:"дела",where:"today",routine:sc.kind};
    const all=scenTasks(sc,ver),roots=all.filter((t)=>!t.link);
    const clone=(t)=>task({name:t.name,min:t.min,desc:t.desc,at:t.at||"",check:(t.check||[]).map((c)=>({text:c.text||c.t||c.name||"",done:false}))},Object.assign({ord:S.tasks.length,src:t.id},base));
    if(sc.kind==="morning")S.tasks=S.tasks.filter((t)=>!(t.routine==="morning"&&!t.done));
    roots.forEach((r)=>{const par=clone(r),kids=all.filter((k)=>k.link===r.id);
      S.tasks.push(...kids.filter((k)=>k.rel==="pre").map((k)=>Object.assign(clone(k),{link:par.id,rel:"pre"})),par,...kids.filter((k)=>k.rel!=="pre").map((k)=>Object.assign(clone(k),{link:par.id,rel:"post"})))});
    if(sc.kind!=="custom"){S.day.scen=S.day.scen||{};S.day.scen[sc.kind]=ver.id}
  }finally{BATCH=false}
  logA("сценарий «"+sc.name+"» · "+ver.name);save();render()}
function scenChips(host,k){scenInit();const sc=S.scen.find((x)=>x.kind===k);if(!sc||sc.versions.length<2)return;
  const row=el("div","scchips");row.id="scchips";const cur=S.day.scen&&S.day.scen[k],def=scenDefaultVer(sc);
  sc.versions.forEach((v)=>{const b=el("button","chipb"+(cur===v.id?" on":""),v.name+(!cur&&v.id===def?" ★":""));b.type="button";b.dataset.ver=v.id;b.onclick=()=>scenApply(sc,v);row.appendChild(b)});host.appendChild(row)}
const SCH=read("lifeos.v2b.schide")||{};
let scenCur={};const scOpen=new Set();
function scenCopyVer(sc,from,nv){const map={};
  scenTasks(sc,from).forEach((t)=>{const c=task({name:t.name,min:t.min,desc:t.desc,at:t.at||"",check:(t.check||[]).map((x)=>({text:x.text||"",done:false}))},{type:"сценарий",sc:sc.id,sv:nv.id,where:"",ord:S.tasks.length});map[t.id]=c;c.link=t.link;c.rel=t.rel;S.tasks.push(c)});
  const old=scenTasks(sc,from),cur=scenTasks(sc,nv);cur.forEach((c,i)=>{if(c.link){const o=old.find((x)=>x.id===c.link);const idx=old.indexOf(o);c.link=o?cur[idx].id:""}})}
/* реакция на «Отправить»: тост и кнопка на секунду зеленеет с ✓ */
const plRu=(n,f)=>n%10===1&&n%100!==11?f[0]:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20)?f[1]:f[2]);
function scenSent(sc,ver,n){
  const msg=sc.kind==="morning"?"Применено к утру: "+n+" "+plRu(n,["пункт","пункта","пунктов"]):sc.kind==="evening"?"Добавлено в вечер: "+n+" "+plRu(n,["пункт","пункта","пунктов"]):"Отправлено: "+n+" "+plRu(n,["задача","задачи","задач"])+" в «Сегодня»";
  closeToast();const tz=el("div","toast");tz.id="toast";tz.textContent=msg;tz._t=setTimeout(()=>tz.remove(),2600);document.body.appendChild(tz);
  const b=document.querySelector('.scsec[data-sid="'+sc.id+'"] [data-ver="'+ver.id+'"] [data-a=apply]');
  if(b){const old=b.textContent;b.classList.add("sent");b.textContent="✓ Отправлено";setTimeout(()=>{if(b.isConnected){b.classList.remove("sent");b.textContent=old}},1200)}}
function renderScen(v){scenInit();
  v.appendChild(el("div","ghead")).appendChild(el("span",null,"Сценарии — набор задач, колонки — его версии. Задачи те же, что в Делах"));
  const fl=el("div","scflt");fl.id="scflt";
  [["morning","Утро"],["evening","Вечер"]].forEach(([k,l])=>{const hid=!!SCH[k],b=el("button","chipb"+(hid?"":" on"),l+(hid?" ▾":" ▴"));b.type="button";b.dataset.hide=k;b.setAttribute("aria-pressed",!hid);
    b.title=hid?"Показать настройку сценария":"Скрыть настройку сценария";b.onclick=()=>{SCH[k]=!SCH[k];try{localStorage.setItem("lifeos.v2b.schide",JSON.stringify(SCH))}catch{}render()};fl.appendChild(b)});
  v.appendChild(fl);
  S.scen.forEach((sc,si)=>{
    if(SCH[sc.kind])return;
    if(!sc.versions.length)sc.versions.push({id:"std",name:"Стандарт"});
    const sec=el("div","scsec");sec.dataset.sid=sc.id;v.appendChild(sec);
    const hd=el("div","ghead sch");
    const nm=el("input","hin scnm");nm.type="text";nm.value=(sc.icon?sc.icon+" ":"")+sc.name;nm.maxLength=30;nm.setAttribute("aria-label","Название сценария");
    nm.onchange=()=>{const x=nm.value.trim();if(x){sc.name=x;sc.icon="";save();render()}else nm.value=sc.name};hd.appendChild(nm);
    const av=el("button","chipb","+ Версия");av.type="button";av.dataset.a="addver";av.onclick=()=>{const base=sc.versions[sc.versions.length-1];const nv={id:"v-"+uid(),name:"Версия "+(sc.versions.length+1)};sc.versions.push(nv);scenCopyVer(sc,base,nv);save();render()};hd.appendChild(av);
    if(sc.kind==="custom"){const d=el("button","ib danger","🗑");d.type="button";d.setAttribute("aria-label","Удалить сценарий");d.onclick=()=>{S.tasks=S.tasks.filter((t)=>!(t.type==="сценарий"&&t.sc===sc.id));S.scen.splice(si,1);save();render()};hd.appendChild(d)}
    const verOf=(k)=>sc.versions.find((x)=>x.id===k);
    kbBoard(sec,{headEl:hd,id:"scen",kbCls:"scb",colCls:"scol",
      cols:sc.versions.map((x)=>[x.id,x.name,"gray"]),
      base:()=>S.tasks.filter((t)=>t.type==="сценарий"&&t.sc===sc.id&&!t.link&&!t.archived),
      pick:(t,k)=>t.sv===k,
      addOpts:(k)=>({type:"сценарий",sc:sc.id,sv:k,where:""}),
      colData:(c,k)=>{c.dataset.sid=sc.id;c.dataset.ver=k},
      colHead:(h,k)=>{const ver=verOf(k);
        const vn=el("input","hin vn");vn.type="text";vn.value=ver.name;vn.maxLength=30;vn.setAttribute("aria-label","Название версии");vn.onchange=()=>{const x=vn.value.trim();if(x){ver.name=x;save()}else vn.value=ver.name};h.appendChild(vn);
        h.appendChild(el("span","cnt",fmtMin(scenSum(sc,ver))));
        if(sc.versions.length>1){const dv=el("button","ib danger","🗑");dv.type="button";dv.dataset.a="delver";dv.setAttribute("aria-label","Удалить версию");dv.onclick=()=>{S.tasks=S.tasks.filter((t)=>!(t.type==="сценарий"&&t.sc===sc.id&&t.sv===ver.id));sc.versions=sc.versions.filter((x)=>x!==ver);save();render()};h.appendChild(dv)}},
      colFoot:(c,k)=>{const ver=verOf(k);
        const ap=el("button","chipb on",sc.kind==="morning"?"Применить к утру":sc.kind==="evening"?"Добавить в вечер":"Добавить в «Сегодня»");ap.type="button";ap.dataset.a="apply";ap.style.marginTop="10px";ap.onclick=()=>{const n=scenTasks(sc,ver).length;scenApply(sc,ver);scenSent(sc,ver,n)};c.appendChild(ap)}})});
  const add=el("button","chipb on","＋ Сценарий");add.type="button";add.id="scadd";add.onclick=()=>{S.scen.push({id:"t-"+uid(),kind:"custom",name:"Новый сценарий",icon:"",versions:[{id:"std",name:"Стандарт"}]});save();render()};v.appendChild(add)}
function renderScenTabs(v){const t=el("div","seg");t.id="scenTabs";[["scen","Сценарии"],["plan","Шаблоны"]].forEach(([k,l])=>{const b=el("button",null,l);b.type="button";b.dataset.tab=k;b.setAttribute("aria-pressed",(UI.scenTab||"scen")===k);b.onclick=()=>{UI.scenTab=k;render()};t.appendChild(b)});v.appendChild(t);
  if((UI.scenTab||"scen")==="plan")renderPlan(v);else renderScen(v)}
