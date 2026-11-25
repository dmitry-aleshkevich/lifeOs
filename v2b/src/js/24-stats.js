/* ---------- итоги недели ---------- */
let statsOff=0;
function renderStats(v){ensureExtras();
  const col=xcol(),today=dayISO(),mon=addDays(mondayOf(today),statsOff*7),sun=addDays(mon,6),inWeek=(k)=>k>=mon&&k<=sun;
  const h=xcard((statsOff===0?"Эта неделя":statsOff===-1?"Прошлая неделя":"Неделя")+" · "+fromISO(mon).getDate()+"–"+fromISO(sun).getDate()+" "+MONN[fromISO(sun).getMonth()]);
  const nav=el("div","wknav");const pv=el("button","chipb","‹");pv.type="button";pv.id="wprev";pv.onclick=()=>{statsOff--;render()};
  const nx=el("button","chipb","›");nx.type="button";nx.id="wnext";nx.disabled=statsOff>=0;nx.onclick=()=>{if(statsOff<0){statsOff++;render()}};nav.append(pv,nx);h.querySelector(".xh").appendChild(nav);
  const log=S.log.filter((e)=>inWeek(e.d)),total=log.reduce((s,e)=>s+e.ms,0),finished=log.filter((e)=>e.f).length,last=statsOff===0?today:sun;
  let hp=0,hd=0;for(let d=mon;d<=last;d=addDays(d,1))S.habits.forEach((x)=>{if(habitApplies(x,d)){hp++;if(habitDone(x.id,d))hd++}});
  const sl=Object.entries(S.sleep).filter(([d])=>inWeek(d)).map(([d,s])=>Object.assign({d},s,{ms:s.wake-s.bed})).filter((s)=>s.ms>0&&s.ms<20*36e5);
  const avg=sl.length?sl.reduce((s,x)=>s+x.ms,0)/sl.length:0;
  const tiles=el("div","tiles");[[total?durShort(total):"0","по таймерам"],[finished,"задач закрыто"],[hp?Math.round(hd/hp*100)+"%":"—","привычек выполнено"],[avg?durShort(avg):"—","сон в среднем"]]
    .forEach(([b,s])=>{const t=el("div","tile");t.appendChild(el("b",null,b));t.appendChild(el("span",null,s));tiles.appendChild(t)});
  h.appendChild(tiles);col.appendChild(h);
  const byP={};log.forEach((e)=>{byP[e.p||""]=(byP[e.p||""]||0)+e.ms});const rows=Object.entries(byP).sort((a,b)=>b[1]-a[1]);
  const pc=xcard("Куда ушло время");
  if(!rows.length)pc.appendChild(el("div","empty","Запускай задачи с таймером — здесь появится, сколько времени ушло на каждый проект."));
  const max=rows.length?rows[0][1]||1:1;
  rows.forEach(([pid,ms])=>{const p=S.projects.find((x)=>x.id===pid);const name=pid==="_routine"?"Рутины":p?p.name:"Без проекта",color=pid==="_routine"?"violet":p?p.color:"gray";
    const r=el("div","brow");r.appendChild(el("span","bl",name));const bt=el("span","bt"),i=el("i");i.style.width=Math.max(3,ms/max*100)+"%";i.style.background="var(--pc-"+color+")";bt.appendChild(i);r.appendChild(bt);r.appendChild(el("span","bv",durShort(ms)));pc.appendChild(r)});
  col.appendChild(pc);
  const hc=xcard("Привычки");
  S.habits.forEach((x)=>{let pos=0,dn=0;for(let d=mon;d<=last;d=addDays(d,1))if(habitApplies(x,d)){pos++;if(habitDone(x.id,d))dn++}
    const r=el("div","brow");r.appendChild(el("span","bl",x.name));const bt=el("span","bt"),i=el("i");i.style.width=(pos?dn/pos*100:0)+"%";i.style.background="var(--done)";bt.appendChild(i);r.appendChild(bt);r.appendChild(el("span","bv",dn+" из "+pos));hc.appendChild(r)});
  col.appendChild(hc);
  const sc=xcard("Сон","записывается сам: закрыл день → закончил утро");
  if(!sl.length)sc.appendChild(el("div","empty","Пока нет ночей. Закрой день вечером, а утром закончи утреннюю рутину."));
  sl.sort((a,b)=>a.d<b.d?-1:1).forEach((s)=>{const r=el("div","srow");r.appendChild(el("span","sd",WD[fromISO(s.d).getDay()]+" "+fromISO(s.d).getDate()));r.appendChild(el("span",null,clock(s.bed)+" → "+clock(s.wake)));
    const sv=el("span","sv",durShort(s.ms));sv.style.color=s.ms>=7*36e5?"var(--done)":"var(--pc-red)";r.appendChild(sv);sc.appendChild(r)});
  col.appendChild(sc);v.appendChild(col)}
