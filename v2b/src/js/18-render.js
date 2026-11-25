function render(){
  if(S){dayRoll();planSync()}
  try{localStorage.setItem("lifeos.v2b.ui",JSON.stringify({sys:UI.sys,env:UI.env,view:UI.view}))}catch{}
  const onT=!UI.view||UI.view==="tasks";if(UI.view==="plan"){UI.view="scen";UI.scenTab="plan"}
  seg(document.getElementById("viewSeg"),VIEWS_NAV,onT?UI.sys:UI.view,(k)=>{logA("вкладка: "+k);if(k==="дела"||k==="работа"){if(k!==UI.sys){setEnvBy(UI.sys,UI.env);UI.env=ENVBY[k]||"list"}UI.sys=k;UI.view="tasks"}else UI.view=k;render()});
  const es=document.getElementById("envSeg");es.hidden=!onT;es.innerHTML="";
  ["list","kanban","timeline","calendar"].forEach((k)=>{const b=el("button","ico");b.type="button";b.dataset.env=k;b.title=ENVS[k].name;b.setAttribute("aria-label",ENVS[k].name);b.setAttribute("aria-pressed",k===UI.env);
    b.innerHTML=ENV_ICO[k]+'<span class="sr">'+ENVS[k].name+'</span>';b.onclick=()=>{logA("окружение: "+ENVS[k].name);UI.env=k;setEnvBy(UI.sys,k);render()};es.appendChild(b)});
  const hn=document.getElementById("hint");hn.textContent=HINTS[UI.env];hn.hidden=!onT;
  paintFocusBtn();paintCoreBtn();
  const v=document.getElementById("view");const sx=[...v.querySelectorAll(".kb")].map((k)=>k.scrollLeft),sy=scrollY;v.innerHTML="";
  const ph=S&&S.day&&S.day.phase;document.body.classList.toggle("lock",lockedPhase());const xv=!!(S&&UI.view&&UI.view!=="tasks"&&VIEWS[UI.view]);document.body.classList.toggle("xview",xv);
  if(S&&morningOn())morningScreen(v);else if(S&&ph==="evening")eveningScreen(v);else if(S&&ph==="closed")closedScreen(v);else if(xv)VIEWS[UI.view](v);else ENVS[UI.env].render(v);selBar();fitDesc();paintDnb();
  v.querySelectorAll(".kb").forEach((k,i)=>{if(sx[i])k.scrollLeft=sx[i]});if(sy&&Math.abs(scrollY-sy)>1)scrollTo(scrollX,sy);
  if(UI.qaFocus){const q=v.querySelector('.qa[data-pos="'+UI.qaFocus+'"] input');UI.qaFocus=null;if(q)q.focus()}
  if(UI.focusNew){const q=v.querySelector(".cl-new");UI.focusNew=null;if(q)q.focus()}
}
