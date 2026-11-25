/* масштаб таймлайна: пикселей на час, запоминается на устройстве. Щипок (телефон) и Shift+колесо (компьютер) */
const tlPx=()=>{const v=+read("lifeos.v2b.tlpx");return v>=24&&v<=160?v:56};
(function(){
  const view=document.getElementById("view");let raf=0,pend=null,p0=null;
  const apply=(px,ay)=>{px=Math.max(24,Math.min(160,Math.round(px)));if(px===tlPx())return;
    const wr=view.querySelector(".tl");if(!wr)return;const hOff=(ay-wr.getBoundingClientRect().top)/tlPx();
    try{localStorage.setItem("lifeos.v2b.tlpx",String(px))}catch{}
    render();const w2=view.querySelector(".tl");if(w2)window.scrollBy(0,w2.getBoundingClientRect().top-(ay-hOff*px))};
  view.addEventListener("wheel",(e)=>{if(!e.shiftKey||!e.target.closest||!e.target.closest(".tl"))return;
    e.preventDefault();const d=e.deltaY||e.deltaX;if(d)apply(tlPx()*(d<0?1.12:1/1.12),e.clientY)},{passive:false});
  const dist=(t)=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  const live=(px,ay)=>{const wr=view.querySelector(".tl");if(!wr||!p0)return;px=Math.max(24,Math.min(160,px));p0.cur=px;
    const H=(+wr.dataset.h1)-(+wr.dataset.h0)+1,minh=Math.max(30,Math.round(50*Math.min(1,px/56)));
    wr.style.height=(H*px)+"px";wr.dataset.px=px;
    wr.querySelectorAll(".hr").forEach((h)=>{h.style.height=px+"px"});
    wr.querySelectorAll(".slot").forEach((s)=>{s.style.top=(+s.dataset.th*px)+"px";s.style.height=Math.max(minh,(+s.dataset.mn)/60*px)+"px"});
    wr.querySelectorAll(".now").forEach((n)=>{n.style.top=(+n.dataset.th*px)+"px"});
    window.scrollBy(0,wr.getBoundingClientRect().top-(ay-p0.hOff*px))};
  view.addEventListener("touchstart",(e)=>{
    const wr=e.target.closest&&e.target.closest(".tl");
    if(e.touches.length===2&&wr){if(DR){clearTimeout(DR.timer);DR=null}
      const ay=(e.touches[0].clientY+e.touches[1].clientY)/2;p0={d:dist(e.touches),px:tlPx(),cur:tlPx(),hOff:(ay-wr.getBoundingClientRect().top)/tlPx()}}
    else if(e.touches.length!==2)p0=null},{passive:true});
  view.addEventListener("touchmove",(e)=>{if(!p0||e.touches.length!==2)return;e.preventDefault();
    pend=[p0.px*dist(e.touches)/p0.d,(e.touches[0].clientY+e.touches[1].clientY)/2];
    if(!raf)raf=requestAnimationFrame(()=>{raf=0;const q=pend;pend=null;if(q)live(q[0],q[1])})},{passive:false});
  const done=()=>{if(!p0)return;const px=Math.round(p0.cur);p0=null;
    if(px!==tlPx()){try{localStorage.setItem("lifeos.v2b.tlpx",String(px))}catch{}render()}};
  view.addEventListener("touchend",(e)=>{if(e.touches.length<2)done()});
  view.addEventListener("touchcancel",done);
})();
