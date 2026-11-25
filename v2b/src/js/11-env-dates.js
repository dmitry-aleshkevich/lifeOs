/* ---------- окружения: фильтр, раскладка, чего не хватает ---------- */
/* дата сегодня/завтра кладёт «Дела»-задачу в группу «Сегодня»/«Завтра»; дальше — в «Дела» (backlog) */
function dueCtx(key){const today=dayISO(),tm=dayOf(NOW()+864e5);
  if(UI.sys!=="дела")return {};return key===today?{where:"today"}:key===tm?{where:"tomorrow"}:{where:"backlog"}}
function dueSync(t,key){t.due=key;if(t.type!=="дела"||t.routine)return;
  if(!key){return}
  const w=key===dayISO()?"today":key===dayOf(NOW()+864e5)?"tomorrow":(t.where==="today"||t.where==="tomorrow"||!t.where?"backlog":t.where);t.where=w}
function dayPopHide(){const p=document.getElementById("dpop");if(p)p.remove()}
function dayPop(cell,key,items){dayPopHide();const p=el("div");p.id="dpop";p.appendChild(el("div","t",key.slice(8)+"."+key.slice(5,7)+" · "+items.length));
  items.forEach((t)=>p.appendChild(el("div",t.done?"d":"",(t.at?t.at+" ":"")+t.name)));document.body.appendChild(p);
  const r=cell.getBoundingClientRect();p.style.left=Math.max(6,Math.min(innerWidth-p.offsetWidth-6,r.left))+"px";p.style.top=Math.min(innerHeight-p.offsetHeight-6,r.bottom+4)+"px"}
document.addEventListener("click",(e)=>{if(!e.target.closest(".dots"))dayPopHide()});
