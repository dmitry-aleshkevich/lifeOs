/* ---------- всплывающее меню: ПКМ или долгое нажатие ---------- */
function closePop(){document.querySelectorAll(".pop").forEach((n)=>n.remove())}
function popup(x,y,items){closePop();
  const p=el("div","pop");
  items.forEach((it)=>{if(it==="-"){p.appendChild(el("hr"));return}
    const b=el("button",null,it[0]);b.type="button";b.onclick=(e)=>{e.stopPropagation();closePop();it[1]()};p.appendChild(b)});
  document.body.appendChild(p);
  const w=p.offsetWidth,h=p.offsetHeight;
  p.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+"px";p.style.top=Math.max(8,Math.min(y,innerHeight-h-8))+"px"}
document.addEventListener("click",(e)=>{
  closePop();
  if(UI.dt&&document.contains(e.target)&&!e.target.closest(".card")){UI.dt=null;render();return}
  if(UI.sub&&document.contains(e.target)&&!e.target.closest(".subqa,.plus,.pop,.toast")){UI.sub=null;render();return}
  if(!UI.open||!document.contains(e.target))return;
  if(e.target.closest(".card,.pop,.toast,.qa,.bar,.head,.foot"))return;
  UI.open=null;UI.sub=null;UI.dt=null;render()});
function onMenu(node,open){
  let tm=null,fired=false,sx=0,sy=0;
  node.addEventListener("contextmenu",(e)=>{e.preventDefault();open(e.clientX,e.clientY)});
  node.addEventListener("touchstart",(e)=>{fired=false;const p=e.touches[0];sx=p.clientX;sy=p.clientY;
    tm=setTimeout(()=>{fired=true;open(sx,sy)},500)},{passive:true});
  const stop=()=>clearTimeout(tm);
  node.addEventListener("touchmove",stop,{passive:true});node.addEventListener("touchcancel",stop);
  node.addEventListener("touchend",(e)=>{stop();if(fired)e.preventDefault()});
  node.addEventListener("click",(e)=>{if(fired){e.stopImmediatePropagation();e.preventDefault();fired=false}},true)}
function wirePill(b,t){
  b.onclick=(e)=>{e.stopPropagation();if(t.tm&&!b.classList.contains("play")&&!e.target.closest(".pi")){complete(t);return}toggleT(t)};
  onMenu(b,(x,y)=>{
    const items=[];
    if(t.tm){
      items.push([t.tm.run?"⏸ Пауза":"▶ Продолжить",()=>toggleT(t)],"-");
      if(!t.tm.sw)[1,5,10,15].forEach((m)=>items.push(["+ "+m+" мин",()=>addT(t,m)]));
    }else{
      [5,10,15,25,30,45,60].forEach((m)=>items.push([(t.min===m?"✓ ":"    ")+m+" мин",()=>{pushUndo();t.min=m;save();render()}]));
      items.push(["Своё число…",()=>{const v=parseInt(prompt("Минут:",String(t.min||20)),10);if(v>0){pushUndo();t.min=v;save();render()}}],
        ["Без времени (секундомер)",()=>{pushUndo();t.min=0;save();render()}]);
    }
    items.push("-",["✓ Готово",()=>complete(t)]);
    popup(x,y,items)});
  paintPill(b,t)}

