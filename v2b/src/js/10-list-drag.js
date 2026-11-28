/* ---------- перетаскивание порядка в «Списке» ---------- */
let DR=null,swallow=false;
document.addEventListener("click",(e)=>{if(swallow){e.stopPropagation();e.preventDefault();swallow=false}},true);
function dragStart(){const d=DR;d.active=true;d.li.classList.add("dragging");if(d.group.length>1)document.querySelectorAll(".card.sel").forEach((c)=>c.classList.add("dragging"));document.body.classList.add("drag");
  const r=d.li.getBoundingClientRect();d.dx=d.x-r.left;d.dy=d.y-r.top;
  const g=d.li.cloneNode(true);g.classList.add("ghost");g.style.width=r.width+"px";g.querySelectorAll(".panel,.plus,.x,.more,.tline").forEach((n)=>n.remove());if(d.group.length>1){const bd=el("span","gcount",String(d.group.length));g.appendChild(bd)}document.body.appendChild(g);d.ghost=g;
  const ln=el("div","dropline");ln.hidden=true;document.body.appendChild(ln);d.line=ln;
  const loop=()=>{if(!DR||!DR.active)return;if(DR.y<70)scrollBy(0,-14);else if(DR.y>innerHeight-70)scrollBy(0,14);dragMove();requestAnimationFrame(loop)};requestAnimationFrame(loop)}
function plusAt(d){
  document.querySelectorAll(".plus.dropplus").forEach((b)=>b.classList.remove("dropplus"));
  for(const b of document.querySelectorAll("#view .card .plus")){
    const c=b.closest(".card");if(c.classList.contains("dragging")||!c.dataset.cid)continue;
    const r=b.getBoundingClientRect();if(!r.width)continue;
    if(d.x>=r.left-8&&d.x<=r.right+8&&d.y>=r.top-8&&d.y<=r.bottom+8){b.classList.add("dropplus");return {b,c,rel:b.classList.contains("pl-top")?"pre":"post"}}}
  return null}
/* бросили задачу на чужой «+» — она становится его подзадачей (до/после) */
function adopt(t,card,rel,batch){
  const o=byId(card.dataset.cid);if(!o||o===t)return false;
  const par=o.link?byId(o.link)||o:o;if(par===t)return false;
  const krel=o.link?o.rel:rel;
  logA(nmq(t)+" → "+(rel==="pre"?"предзадача ":"подзадача ")+nmq(par));if(!batch)pushUndo();S.tasks=S.tasks.filter((x)=>x!==t);
  S.tasks.filter((x)=>x.link===t.id).forEach((k2)=>{k2.link=par.id});
  Object.assign(t,{link:par.id,rel:krel,type:par.type,sc:par.sc,sv:par.sv,where:par.where,project:par.project,status:par.type==="работа"?(par.status||"todo"):""});
  if(t.done)t.done=false;
  if(o.link)S.tasks.splice(S.tasks.indexOf(o)+(rel==="post"?1:0),0,t);else S.tasks.push(t);
  FOLD.delete(rel+":"+par.id);saveFold();if(!batch){save();render()}return true}
function dragMove(){const d=DR;if(!d||!d.active)return;
  d.ghost.style.left=(d.x-d.dx)+"px";d.ghost.style.top=(d.y-d.dy)+"px";
  const view=document.getElementById("view");
  {const pl=plusAt(d);if(pl){d.tgt={plus:pl};d.line.hidden=true;document.querySelectorAll(".dropcol").forEach((c)=>c.classList.remove("dropcol"));return}}
  if(UI.view!=="scen"&&UI.env==="timeline"){
    const wr=view.querySelector(".tl"),side=view.querySelector(".tls"),tw=view.querySelector(".tlw");
    if(tw)tw.classList.remove("tldrop");
    if(side){const r=side.getBoundingClientRect();if(d.x>=r.left&&d.x<=r.right&&d.y>=r.top&&d.y<=r.bottom){tw.classList.add("tldrop");d.line.hidden=true;d.tgt={tlOff:true};return}}
    if(wr){const r=wr.getBoundingClientRect();
      if(d.x>=r.left&&d.x<=r.right&&d.y>=r.top&&d.y<=r.bottom){
        const H0=+wr.dataset.h0,PX=+wr.dataset.px,H1=+wr.dataset.h1;
        let m=H0*60+(d.y-d.dy-r.top)/PX*60;m=Math.round(m/15)*15;m=Math.max(H0*60,Math.min(H1*60+45,m));
        d.tgt={tl:m};d.line.hidden=false;d.line.style.left=(r.left+52)+"px";d.line.style.width=(r.width-52)+"px";d.line.style.top=(r.top+(m-H0*60)/60*PX-1)+"px";return}}
    d.tgt=null;d.line.hidden=true;return}
  if(UI.view!=="scen"&&UI.env==="calendar"){
    const zones=[...view.querySelectorAll(".day[data-date],.store")];let z=null;
    for(const c of zones){const r=c.getBoundingClientRect();if(d.x>=r.left&&d.x<=r.right&&d.y>=r.top&&d.y<=r.bottom){z=c;break}}
    zones.forEach((c)=>c.classList.toggle("dropcol",c===z));d.line.hidden=true;d.tgt=z?{cal:z}:null;return}
  if(UI.view==="scen"||UI.env==="kanban"){
    const cols=[...view.querySelectorAll(".col[data-board]")];let col=null;
    for(const c of cols){const r=c.getBoundingClientRect();if(d.x>=r.left&&d.x<=r.right&&d.y>=r.top&&d.y<=r.bottom){col=c;break}}
    cols.forEach((c)=>c.classList.toggle("dropcol",c===col));
    if(!col){d.tgt=null;d.line.hidden=true;return}
    let best=null,after=false;
    for(const n of [...col.querySelectorAll(".card[data-cid]")].filter((n)=>!n.classList.contains("dragging"))){
      const r=n.getBoundingClientRect();if(d.y<r.top+r.height/2){best=n;after=false;break}best=n;after=true}
    d.tgt={col,n:best,after,kanban:true};
    const cr=col.getBoundingClientRect();d.line.hidden=false;
    if(best){const r=best.getBoundingClientRect();d.line.style.left=r.left+"px";d.line.style.width=r.width+"px";d.line.style.top=(after?r.bottom+1:r.top-3)+"px"}
    else{const h=col.querySelector("h3").getBoundingClientRect();d.line.style.left=(cr.left+10)+"px";d.line.style.width=(cr.width-20)+"px";d.line.style.top=(h.bottom+4)+"px"}
    return}
  const els=[...view.querySelectorAll(".card[data-cid]:not([data-sub]),.ghead[data-where]")].filter((n)=>!n.classList.contains("dragging"));
  let best=null,bd=1e9;
  for(const n of els){const r=n.getBoundingClientRect();
    if(d.y>=r.top&&d.y<=r.bottom){best=n;bd=0;break}
    const dd=Math.min(Math.abs(d.y-r.top),Math.abs(d.y-r.bottom));if(dd<bd){bd=dd;best=n}}
  if(!best){d.tgt=null;d.line.hidden=true;return}
  const r=best.getBoundingClientRect(),isHead=best.classList.contains("ghead");
  const after=isHead?true:d.y>r.top+r.height/2;
  d.tgt={n:best,after,head:isHead};
  d.line.hidden=false;d.line.style.left=r.left+"px";d.line.style.width=r.width+"px";d.line.style.top=(after?r.bottom+1:r.top-3)+"px"}
function dragEnd(e,cancel){const d=DR;if(!d)return;d.alt=!!(e&&e.altKey);clearTimeout(d.timer);DR=null;if(!d.active)return;
  document.querySelectorAll(".card.dragging").forEach((c)=>c.classList.remove("dragging"));document.body.classList.remove("drag");d.ghost.remove();d.line.remove();
  swallow=true;setTimeout(()=>{swallow=false},60);
  document.querySelectorAll(".dropcol").forEach((c)=>c.classList.remove("dropcol"));document.querySelectorAll(".tldrop").forEach((c)=>c.classList.remove("tldrop"));
  document.querySelectorAll(".plus.dropplus").forEach((b)=>b.classList.remove("dropplus"));
  if(cancel||!d.tgt)return;
  const G=d.group;BATCH=false;pushUndo();BATCH=true;
  try{
    if(d.tgt.plus)G.forEach((t)=>adopt(t,d.tgt.plus.c,d.tgt.plus.rel,true));
    else if(d.tgt.tl!==undefined){const m=d.tgt.tl,hm=String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");G.forEach((t)=>{logA("время "+nmq(t)+" → "+hm);t.at=hm;delete t.aa})}
    else if(d.tgt.tlOff){G.forEach((t)=>{logA("снято время "+nmq(t));t.at="";delete t.aa})}
    else if(d.tgt.cal){const z=d.tgt.cal;G.forEach((t)=>{logA("перенос "+nmq(t)+" → "+(z.dataset.date||"склад"));t.link="";t.rel="";dueSync(t,z.dataset.date||"")})}
    else{
      const n=d.tgt.n;let head=!!d.tgt.head,o=n&&!head?byId(n.dataset.cid):null,after=!!d.tgt.after;const w=n&&n.dataset?n.dataset.where:"";
      if(o&&o.link){const par=byId(o.link);if(par){after=o.rel==="pre"?false:true;o=par}}   /* бросили на до/после-задачу: порядок считается от родителя */
      G.forEach((t)=>{let nx=t;
        if(d.tgt.kanban&&d.alt&&d.tgt.col.dataset.board==="scen")nx=scenCopyTask(t,d.tgt.col,o,after);
        else if(d.tgt.kanban)dropKanban(d,t,o,after);else dropList(d,t,o,after,head,w);
        if(after||head){o=nx;after=true;head=false}})}
  }finally{BATCH=false}
  if(F.on&&F.ids[UI.sys]){F.ids[UI.sys].sort((a,b)=>S.tasks.indexOf(byId(a))-S.tasks.indexOf(byId(b)));saveF()}
  save();render()}
(function(){
  const view=document.getElementById("view");let RS=null;
  view.addEventListener("pointerdown",(e)=>{const h=e.target.closest&&e.target.closest(".rs");if(!h)return;
    const t=byId(h.dataset.rid),slot=h.closest(".slot"),wr=h.closest(".tl");if(!t||!slot||!wr)return;
    e.preventDefault();e.stopPropagation();try{h.setPointerCapture(e.pointerId)}catch{}
    RS={t,slot,h,y:e.clientY,px:+wr.dataset.px,min:t.min||30,cur:t.min||30};h.classList.add("on")},true);
  window.addEventListener("pointermove",(e)=>{if(!RS)return;
    const m=Math.max(15,Math.round((RS.min+(e.clientY-RS.y)/RS.px*60)/15)*15);RS.cur=m;RS.slot.style.height=Math.max(50,m/60*RS.px)+"px"});
  const rsEnd=(ok)=>{if(!RS)return;const r=RS;RS=null;r.h.classList.remove("on");
    swallow=true;setTimeout(()=>{swallow=false},60);
    if(ok&&r.cur!==r.min){pushUndo();logA("длительность "+nmq(r.t)+" → "+r.cur+" мин");r.t.min=r.cur;save()}render()};
  window.addEventListener("pointerup",()=>rsEnd(true));window.addEventListener("pointercancel",()=>rsEnd(false));
  view.addEventListener("pointerdown",(e)=>{
    if((UI.view!=="scen"&&UI.env!=="list"&&UI.env!=="kanban"&&UI.env!=="calendar"&&UI.env!=="timeline")||(e.pointerType==="mouse"&&e.button!==0))return;
    const li=e.target.closest(".card[data-cid]");if(!li)return;
    if(e.target.closest("button,input,textarea,select,.panel,.rs"))return;
    const t=byId(li.dataset.cid);if(!t)return;
    const group=SEL.has(t.id)?S.tasks.filter((x)=>SEL.has(x.id)&&!(x.link&&SEL.has(x.link))):[t];
    DR={t,li,group,sx:e.clientX,sy:e.clientY,x:e.clientX,y:e.clientY,active:false,touch:e.pointerType!=="mouse",timer:null,tgt:null};
    if(DR.touch)DR.timer=setTimeout(()=>{if(DR&&!DR.active)dragStart()},350)});
  document.addEventListener("pointermove",(e)=>{
    if(!DR)return;DR.x=e.clientX;DR.y=e.clientY;
    if(!DR.active){const dd=Math.hypot(DR.x-DR.sx,DR.y-DR.sy);
      if(DR.touch){if(dd>8){clearTimeout(DR.timer);DR=null}return}
      if(dd>6)dragStart();else return}
    dragMove()});
  document.addEventListener("pointerup",(e)=>dragEnd(e,false));
  document.addEventListener("pointercancel",(e)=>dragEnd(e,true));
  document.addEventListener("touchmove",(e)=>{if(DR&&DR.active)e.preventDefault()},{passive:false});
})();

(function(){
  const view=document.getElementById("view");
  view.addEventListener("contextmenu",(e)=>{const li=e.target.closest(".card[data-cid]");if(!li||!e.ctrlKey||e.target.closest(".mins"))return;
    const t=byId(li.dataset.cid);if(t){e.preventDefault();toggleSel(t)}});
  let L=null;
  document.addEventListener("pointerdown",(e)=>{
    if(e.pointerType!=="mouse"||e.button!==0||(UI.view!=="scen"&&UI.env!=="list"&&UI.env!=="kanban"))return;
    if(e.target.closest(".card,button,input,textarea,select,.ghead,h3,.qa,.rhead,.evb,.panel,.radd,#fbdock,#ppop,#fab,#selbar,.seg,.pop,details,label"))return;
    L={x:e.clientX,y:e.clientY,on:false,base:(e.shiftKey||e.metaKey||e.ctrlKey)?new Set(SEL):new Set(),box:null}});
  document.addEventListener("pointermove",(e)=>{
    if(!L)return;
    if(!L.on){if(Math.hypot(e.clientX-L.x,e.clientY-L.y)<6)return;L.on=true;document.body.classList.add("lassoing");L.box=el("div","lasso");document.body.appendChild(L.box)}
    const x1=Math.min(L.x,e.clientX),y1=Math.min(L.y,e.clientY),x2=Math.max(L.x,e.clientX),y2=Math.max(L.y,e.clientY);
    Object.assign(L.box.style,{left:x1+"px",top:y1+"px",width:(x2-x1)+"px",height:(y2-y1)+"px"});
    SEL.clear();L.base.forEach((i)=>SEL.add(i));
    view.querySelectorAll(".card[data-cid]").forEach((c)=>{const r=c.getBoundingClientRect(),hit=r.right>x1&&r.left<x2&&r.bottom>y1&&r.top<y2;
      if(hit)SEL.add(c.dataset.cid);c.classList.toggle("sel",SEL.has(c.dataset.cid))})});
  document.addEventListener("pointerup",()=>{
    if(!L)return;const on=L.on;if(L.box)L.box.remove();document.body.classList.remove("lassoing");L=null;
    if(on){swallow=true;setTimeout(()=>{swallow=false},60);logA("выделено рамкой: "+SEL.size);render()}else if(SEL.size){SEL.clear();render()}})})();
const FOLD=new Set(read("lifeos.v2b.fold")||[]);
const GF=read("lifeos.v2b.gopen")||{};const gOpen=(k)=>k in GF?GF[k]:k==="today";
const gToggle=(k)=>{GF[k]=!gOpen(k);try{localStorage.setItem("lifeos.v2b.gopen",JSON.stringify(GF))}catch{}render()};
const saveFold=()=>{try{localStorage.setItem("lifeos.v2b.fold",JSON.stringify([...FOLD]))}catch{}};
function rowWithKids(host,t,o={}){
  const kids=S.tasks.filter((x)=>x.link===t.id);
  const mark=(c,txt)=>{const b=c.querySelector(":scope>.ck,:scope>.top>.ck");if(b&&!c.classList.contains("done")){b.classList.add("lnk");b.textContent=txt}};
  const sub=(k2)=>{const c=card(k2,o);c.classList.add("kid2");if(k2.rel==="pre"){c.classList.add("kpre");mark(c,"↓")}else mark(c,"↳");host.appendChild(c)};
  if(!FOLD.has("pre:"+t.id))kids.filter((k2)=>k2.rel==="pre").forEach(sub);
  const c=card(t,o);if(kids.some((k2)=>k2.rel==="pre"?!FOLD.has("pre:"+t.id):!FOLD.has("post:"+t.id)))c.classList.add("fam");if(FOLD.has("post:"+t.id)&&kids.some((k2)=>k2.rel!=="pre"))c.classList.add("stack");
  if(FOLD.has("pre:"+t.id)&&kids.some((k2)=>k2.rel==="pre"))c.classList.add("stackt");host.appendChild(c);
  if(!FOLD.has("post:"+t.id))kids.filter((k2)=>k2.rel!=="pre").forEach(sub)}
