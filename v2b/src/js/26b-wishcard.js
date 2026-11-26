/* ---------- карточка «Далат» внизу утреннего экрана: превью зоны с карты желаний (только просмотр) ---------- */
const WM_KEY="lifeos.v2b.wmhide";let WMC=null;
function wmPreview(items,y0){
  const box=el("div","wmp"),w=el("div","wmw");box.appendChild(w);
  items.forEach((it)=>{
    if(it.type==="img"){const im=document.createElement("img");im.draggable=false;im.src=it.src||it.url||"";im.style.cssText="left:"+it.x+"px;top:"+it.y+"px;width:"+it.w+"px;height:"+it.h+"px;z-index:"+(it.z||1);w.appendChild(im)}
    else{const t=el("div","wmtx",it.text||"");t.style.cssText="left:"+it.x+"px;top:"+it.y+"px;font-size:"+(it.fs||32)+"px;color:"+(it.color||"#f2f2f2")+";z-index:"+(it.z||1);w.appendChild(t)}});
  const fit=()=>{const k=box.clientWidth/MP_W;w.style.transform="scale("+k+") translateY(-"+y0+"px)"};
  box.appendChild(el("span","wmt","ДАЛАТ"));
  if(window.ResizeObserver)new ResizeObserver(fit).observe(box);setTimeout(fit,0);return box}
function wmBuild(host,items,y0){
  const wrap=el("div","wmc");wrap.id="wmc";const pv=wmPreview(items,y0);wrap.appendChild(pv);
  const x=el("button","wmx","✕");x.type="button";x.setAttribute("aria-label","Закрыть до завтра");
  x.onclick=(e)=>{e.stopPropagation();try{localStorage.setItem(WM_KEY,JSON.stringify(S.day.iso))}catch{}wrap.remove()};pv.appendChild(x);
  pv.onclick=()=>{const o=el("div","wmo");o.id="wmo";o.appendChild(wmPreview(items,y0));o.onclick=()=>o.remove();document.body.appendChild(o)};
  host.appendChild(wrap)}
function wishCard(host){
  if(read(WM_KEY)===S.day.iso)return;
  const y0=(MP_ZONES.length-1)*(MP_ZH+MP_GAP),pick=(all)=>all.filter((it)=>{const cy=(it.y||0)+(it.type==="img"?(it.h||0)/2:20);return cy>=y0&&cy<y0+MP_ZH});
  if(WMC){if(WMC.length)wmBuild(host,WMC,y0);return}
  try{mpStore("readonly").then((s)=>new Promise((r)=>{const q=s.getAll();q.onsuccess=()=>r(q.result||[]);q.onerror=()=>r([])})).then((all)=>{
    WMC=pick(all);if(WMC.length&&document.body.contains(host)&&!host.querySelector("#wmc"))wmBuild(host,WMC,y0)}).catch(()=>{})}catch{}}
