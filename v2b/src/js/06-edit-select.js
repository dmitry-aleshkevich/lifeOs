/* ---------- правка задачи: раскрытие, поля, чек-лист, подзадачи, удаление, отмена ---------- */
/* ---------- выделение нескольких задач: Cmd/Ctrl+клик, Shift+клик (диапазон), Delete, перетаскивание группой ---------- */
let LASTT="";
const SEL=new Set();let lastSel="";
function toggleSel(t){logA((SEL.has(t.id)?"снято выделение ":"выделена ")+nmq(t));if(SEL.has(t.id))SEL.delete(t.id);else SEL.add(t.id);lastSel=t.id;render()}
function rangeSel(t){
  const ids=[...document.querySelectorAll("#view .card[data-cid]")].map((c)=>c.dataset.cid),a=ids.indexOf(lastSel),b=ids.indexOf(t.id);
  if(a<0||b<0){toggleSel(t);return}
  ids.slice(Math.min(a,b),Math.max(a,b)+1).forEach((i)=>SEL.add(i));render()}
function delSel(){
  const ids=new Set(SEL);if(!ids.size)return;
  logA("удалено выбранных: "+ids.size);pushUndo();
  S.tasks=S.tasks.filter((x)=>!ids.has(x.id)&&!(x.link&&ids.has(x.link)));SEL.clear();UI.open=null;save();render()}
function selBar(){
  let b=document.getElementById("selbar");
  [...SEL].forEach((i)=>{if(!S.tasks.some((x)=>x.id===i))SEL.delete(i)});
  if(!SEL.size){if(b)b.remove();return}
  if(!b){b=el("div","selbar");b.id="selbar";document.body.appendChild(b)}
  b.innerHTML="";b.appendChild(el("span",null,"Выбрано "+SEL.size));
  const d=el("button","chipb danger","Удалить");d.type="button";d.onclick=delSel;
  const c=el("button","chipb","Снять");c.type="button";c.onclick=()=>{SEL.clear();render()};
  b.append(d,c)}
