/* плавающее окно «Дальше / Вечер» (как баннер в v1): тикает, сворачивается в пилюлю «–», на телефоне — полоска сверху */
const DNB={min:(()=>{const v=read("lifeos.v2b.dnb");return !!(v&&v.day===dayISO()&&v.min)})()};
const saveDnb=()=>{try{localStorage.setItem("lifeos.v2b.dnb",JSON.stringify({day:dayISO(),min:DNB.min}))}catch{}};
const hms=(ms)=>{const sec=Math.max(0,Math.floor(ms/1000)),h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s2=sec%60,p=(n)=>String(n).padStart(2,"0");return h?h+":"+p(m)+":"+p(s2):p(m)+":"+p(s2)};
function dnbData(){
  if(!S||!S.day)return null;
  if(UI.view&&UI.view!=="tasks")return null;
  const ph=S.day.phase;if(ph==="closed"||morningOn())return null;
  let nx=null;
  mine().forEach((t)=>{if(t.tpl&&!CORE.show)return;const dl=startDelta(t);if(dl===null||dl>3*36e5||dl<-3*36e5)return;if(!nx||Math.abs(dl)<Math.abs(nx.dl))nx={t,dl}});
  let ev=null;
  const items=rItems("evening");
  if(ph==="evening"||(ph==="day"&&isEvening()&&items.length)){
    const n=new Date(NOW()),e=new Date(n);e.setHours(24,0,0,0);let ms=e-n,lbl="🌙 До конца дня",over=false,late=ms<=36e5;
    if(n.getHours()<4){const since=n-new Date(n.getFullYear(),n.getMonth(),n.getDate(),0,0,0,0),G=30*6e4;   /* после полуночи: 30 минут до овертайма, потом секундомер */
      if(since<G){ms=G-since;lbl="🌙 До овертайма";late=true}else{ms=since-G;lbl="🌙 Овертайм";late=true;over=true}}
    const left=S.tasks.filter((t)=>t.type==="дела"&&!t.routine&&!t.done&&!t.link&&t.where==="today"&&(CORE.show||!t.tpl)).length;
    ev={ms,lbl,over,late,go:ph==="day",sub:ph==="evening"?"Вечерняя рутина: ещё "+items.filter((t)=>!t.done).length:(left?"Успей закончить дела: ещё "+left:"Дела закрыты — можно на вечернюю рутину")}}
  return (nx||ev)?{nx,ev}:null}
function paintDnb(){
  let w=document.getElementById("dnb");
  if(!w){w=el("div","dnb");w.id="dnb";w.hidden=true;
    w.innerHTML='<button class="dx" type="button" aria-label="Свернуть">–</button><div class="dm" hidden></div>'
      +'<div class="dr rn" hidden><div class="dl"></div><div class="dt"></div></div>'
      +'<div class="dr re" hidden><div class="dl">🌙 До конца дня</div><div class="dt"></div><div class="ds"></div></div>';
    w.querySelector(".dx").onclick=(e)=>{e.stopPropagation();DNB.min=true;saveDnb();paintDnb()};
    w.onclick=()=>{if(DNB.min){DNB.min=false;saveDnb();paintDnb()}};
    document.body.appendChild(w)}
  const d=dnbData();
  if(!d||!d.ev){const g0=document.getElementById("evb");if(g0)g0.remove()}
  if(!d){w.hidden=true;document.body.style.paddingTop="";return}
  w.hidden=false;w.classList.toggle("min",DNB.min);
  const rn=w.querySelector(".rn"),re=w.querySelector(".re"),dm=w.querySelector(".dm");
  rn.hidden=!d.nx||DNB.min;re.hidden=!d.ev||DNB.min;dm.hidden=!DNB.min;
  if(d.nx){const late=d.nx.dl<0;rn.classList.toggle("late",late);
    rn.querySelector(".dl").textContent=(late?"Опоздание · ":"До · ")+(d.nx.t.name||"задача");
    rn.querySelector(".dt").textContent=(late?"+":"")+hms(Math.abs(d.nx.dl))}
  if(d.ev){re.querySelector(".dl").textContent=d.ev.lbl;re.querySelector(".dt").textContent=(d.ev.over?"+":"")+hms(d.ev.ms);re.querySelector(".ds").textContent=d.ev.sub;
    w.classList.toggle("late",d.ev.late);
    let g=re.querySelector("#evb");
    if(d.ev.go&&!g){g=el("button","evb dgo","🌙 Начать вечер");g.type="button";g.id="evb";
      g.onclick=(e)=>{e.stopPropagation();S.day.evening=true;S.day.phase="evening";save();render()};re.appendChild(g)}
    else if(!d.ev.go&&g)g.remove()}
  else w.classList.remove("late");
  if(DNB.min)dm.textContent=(d.nx&&(d.nx.dl<0?"+":"")+hms(Math.abs(d.nx.dl)))||("🌙 "+(d.ev.over?"+":"")+hms(d.ev.ms));
  /* на телефоне полоска занимает место сверху — сдвигаем содержимое */
  document.body.style.paddingTop=(!DNB.min&&matchMedia("(max-width:480px)").matches)?(w.offsetHeight+14)+"px":""}
setInterval(()=>{try{paintDnb()}catch{}},1000);
