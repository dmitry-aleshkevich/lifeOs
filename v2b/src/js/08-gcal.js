/* ---------- «В календарь»: запись события в Google Calendar (OAuth через Google Identity Services, без сервера) ---------- */
const GC={scope:"https://www.googleapis.com/auth/calendar.events",tok:"",exp:0};
const GC_DEFAULT="413636813504-9fsstjtt3eqimbvjjvkh97sev6i0jm93.apps.googleusercontent.com";
const gcId=()=>{try{return localStorage.getItem("lifeos.v2b.gcid")||GC_DEFAULT}catch{return GC_DEFAULT}};
function gcLoad(){return new Promise((res,rej)=>{if(window.google&&google.accounts&&google.accounts.oauth2)return res();
  const sc=document.createElement("script");sc.src="https://accounts.google.com/gsi/client";sc.onload=()=>res();sc.onerror=()=>rej(new Error("Не загрузился Google-скрипт"));document.head.appendChild(sc)})}
async function gcToken(){
  if(GC.tok&&Date.now()<GC.exp-60000)return GC.tok;
  let id=gcId();
  if(!id){id=(prompt("Client ID из Google Cloud (OAuth, тип Web). Один раз:","")||"").trim();if(!id)throw new Error("Нужен Client ID");try{localStorage.setItem("lifeos.v2b.gcid",id)}catch{}}
  await gcLoad();
  return new Promise((res,rej)=>{const tc=google.accounts.oauth2.initTokenClient({client_id:id,scope:GC.scope,
    callback:(r)=>{if(r&&r.access_token){GC.tok=r.access_token;GC.exp=Date.now()+(+r.expires_in||3600)*1000;res(GC.tok)}else rej(new Error((r&&r.error)||"Нет доступа"))},
    error_callback:(e)=>rej(new Error((e&&e.type)||"Окно входа закрыто"))});tc.requestAccessToken({prompt:GC.tok?"":"consent"})})}
function gcBody(t){const day=t.due||dayISO(),[h,m]=(t.at||"09:00").split(":").map(Number),mins=t.min||30;
  const st=new Date(+day.slice(0,4),+day.slice(5,7)-1,+day.slice(8,10),h,m),en=new Date(st.getTime()+mins*60000),pd=(n)=>String(n).padStart(2,"0");
  const f=(d)=>d.getFullYear()+"-"+pd(d.getMonth()+1)+"-"+pd(d.getDate())+"T"+pd(d.getHours())+":"+pd(d.getMinutes())+":00",tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  return {summary:t.name,description:t.desc||"",start:{dateTime:f(st),timeZone:tz},end:{dateTime:f(en),timeZone:tz}}}
async function toCalendar(t){
  if(!t.at){note("Укажи время начала у задачи");return false}
  try{const tok=await gcToken(),url="https://www.googleapis.com/calendar/v3/calendars/primary/events"+(t.gcal?"/"+t.gcal:"");
    const r=await fetch(url,{method:t.gcal?"PATCH":"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify(gcBody(t))});
    if(r.status===404&&t.gcal){t.gcal="";return toCalendar(t)}
    if(!r.ok){let m="";try{const e=await r.json();m=e&&e.error&&(e.error.message||e.error.status)||""}catch{}if(r.status===401)GC.tok="";throw new Error("ответил "+r.status+(m?": "+String(m).slice(0,160):""))}
    const j=await r.json();t.gcal=j.id||t.gcal;save();logA("в календарь: "+nmq(t));note("В календаре: "+t.name);render();return true}
  catch(e){note("Календарь: "+(e&&e.message||e));return false}}
function panel(t){
  const p=el("div","panel");p.onclick=(e)=>e.stopPropagation();
  const fld=(cls,node)=>{node.addEventListener("focus",pushUndo);return node};
  const ta=el("textarea","pdesc");ta.placeholder="Описание";ta.value=t.desc||"";
  ta.addEventListener("focus",pushUndo);ta.oninput=()=>{t.desc=ta.value;save()};ta.onchange=()=>render();p.appendChild(ta);
  // чек-лист
  t.check=t.check||[];
  const cl=el("div","cl");
  t.check.forEach((c,i)=>{const row=el("div","cli"+(c.done?" done":""));
    const cb=el("input");cb.type="checkbox";cb.checked=!!c.done;cb.onchange=()=>{pushUndo();c.done=cb.checked;save();render()};
    const tx=el("input","clt");tx.type="text";tx.value=c.text||c.t||c.name||"";tx.addEventListener("focus",pushUndo);
    tx.onchange=()=>{c.text=tx.value.trim();save();render()};
    const x=el("button","clx","✕");x.type="button";x.setAttribute("aria-label","Удалить пункт");x.onclick=()=>{pushUndo();t.check.splice(i,1);save();render()};
    row.append(cb,tx,x);cl.appendChild(row)});
  const nw=el("input","cl-new");nw.type="text";nw.placeholder="Новый пункт чек-листа";
  nw.onkeydown=(e)=>{if(e.key==="Enter"&&nw.value.trim()){pushUndo();t.check.push({text:nw.value.trim(),done:false});save();UI.focusNew=t.id;render()}};
  cl.appendChild(nw);p.appendChild(cl);
  // подвал: слева дата и время (серым), справа «Удалить»
  const r3=el("div","row pfoot");
  const dtb=el("button","dtbtn"+((t.at||t.due)?" set":""),(t.at||t.due)?dateLabel(t):"📅");dtb.type="button";
  dtb.title="Дата и время";const opn=()=>{if(UI.dt===t.id)return;UI.dt=t.id;UI.dtd=null;render()};dtb.onclick=opn;let hv=0;dtb.onmouseenter=()=>{clearTimeout(hv);hv=setTimeout(opn,180)};dtb.onmouseleave=()=>clearTimeout(hv);r3.appendChild(dtb);
  const gcb=el("button","chipb gcb",t.gcal?"✓ В календаре":"📅 В календарь");gcb.type="button";gcb.title="Записать в Google Calendar (нужно время начала)";gcb.onclick=()=>toCalendar(t);r3.appendChild(gcb);
  const del=el("button","chipb danger","Удалить");del.type="button";del.onclick=()=>delTask(t);r3.appendChild(del);
  p.appendChild(r3);
  if(UI.dt===t.id){
    const bx=el("div","dtbox dtp");
    const okT=(v)=>{const d=String(v).replace(/\D/g,"");let h,m;if(d.length===4){h=+d.slice(0,2);m=+d.slice(2)}else if(d.length===3){h=+d[0];m=+d.slice(1)}else if(d.length>=1&&d.length<=2){h=+d;m=0}else return "";return h<24&&m<60?String(h).padStart(2,"0")+":"+String(m).padStart(2,"0"):""};
    const pd2=(n)=>String(n).padStart(2,"0"),kOf=(d)=>d.getFullYear()+"-"+pd2(d.getMonth()+1)+"-"+pd2(d.getDate());
    const DT=UI.dtd&&UI.dtd.id===t.id?UI.dtd:(UI.dtd={id:t.id,due:t.due||dayISO(),at:t.at||"",vm:(t.due||dayISO()).slice(0,7)});
    const close=()=>{UI.dt=null;UI.dtd=null;render()};
    const top=el("div","dtp-top");
    const calw=el("div","dtp-cal"),sl=el("div","dtp-slots");
    const vy=+DT.vm.slice(0,4),vmn=+DT.vm.slice(5,7)-1;
    const nav=el("div","dtp-nav");
    const pv=el("button","chipb","‹");pv.type="button";pv.onclick=()=>{const d=new Date(vy,vmn-1,1);DT.vm=kOf(d).slice(0,7);render()};
    const nx=el("button","chipb","›");nx.type="button";nx.onclick=()=>{const d=new Date(vy,vmn+1,1);DT.vm=kOf(d).slice(0,7);render()};
    nav.appendChild(pv);nav.appendChild(el("b","",new Date(vy,vmn,1).toLocaleDateString("ru-RU",{month:"long",year:"numeric"})));nav.appendChild(nx);calw.appendChild(nav);
    const gr=el("div","dtp-grid");["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(x=>gr.appendChild(el("span","dh",x)));
    const f1=new Date(vy,vmn,1),off=(f1.getDay()+6)%7,tk=dayISO();
    for(let i=0;i<42;i++){const d=new Date(vy,vmn,1-off+i),k=kOf(d);
      const c=el("button","dd"+(d.getMonth()!==vmn?" o":"")+(k===DT.due?" s":"")+(k===tk?" tdy":""),String(d.getDate()));c.type="button";c.dataset.k=k;
      c.onclick=()=>{DT.due=k;DT.vm=k.slice(0,7);DT.busy=null;render()};gr.appendChild(c)}
    calw.appendChild(gr);
    // занятые слоты из Google Calendar (только если уже есть токен, окно входа не открываем)
    const busy=DT.busy&&DT.busy.k===DT.due?DT.busy.a:[];
    if(GC.tok&&Date.now()<GC.exp-60000&&(!DT.busy||DT.busy.k!==DT.due)){const k=DT.due;DT.busy={k,a:[]};
      const t0=new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));
      fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin="+encodeURIComponent(t0.toISOString())+"&timeMax="+encodeURIComponent(new Date(t0.getTime()+864e5).toISOString()),{headers:{Authorization:"Bearer "+GC.tok}})
        .then(r=>r.ok?r.json():null).then(j=>{if(!j||!UI.dtd||UI.dtd.busy.k!==k)return;
          UI.dtd.busy.a=(j.items||[]).filter(e=>e.start&&e.start.dateTime&&e.id!==t.gcal).map(e=>[new Date(e.start.dateTime),new Date(e.end.dateTime)]);render()}).catch(()=>{})}
    const t0=new Date(+DT.due.slice(0,4),+DT.due.slice(5,7)-1,+DT.due.slice(8,10));
    for(let m=360;m<=1410;m+=30){const h=Math.floor(m/60),mm=m%60,lab=pd2(h)+":"+pd2(mm);
      const a=new Date(t0.getTime()+m*60000),z=new Date(a.getTime()+30*60000);
      const isb=busy.some(x=>x[0]<z&&x[1]>a);
      const b=el("button","dts"+(DT.at===lab?" s":"")+(isb?" busy":""),lab);b.type="button";b.dataset.t=lab;if(isb)b.title="В календаре занято";
      b.onclick=()=>{DT.at=lab;render()};sl.appendChild(b)}
    top.appendChild(calw);top.appendChild(sl);bx.appendChild(top);
    requestAnimationFrame(()=>{const now=new Date(),isT=DT.due===dayISO();let want=DT.at||(isT?pd2(now.getHours())+":"+(now.getMinutes()<30?"00":"30"):"09:00");
      const el0=[...sl.children].find(x=>x.dataset.t>=want)||sl.lastChild;if(el0)sl.scrollTop=Math.max(0,el0.offsetTop-sl.offsetTop)});
    const prow=el("div","dtp-parts");
    PARTS.forEach(([k,lab])=>{const b=el("button","chipb"+(DT.at===partT(k)?" on":""),lab+" "+partT(k));b.type="button";b.dataset.part=k;b.title="Нажми — поставить время; ПКМ или долгое нажатие — изменить";
      b.onclick=()=>{DT.at=partT(k);render()};
      onMenu(b,()=>{const v=prompt("Время для «"+lab+"» (ЧЧ:ММ):",partT(k));const n=v&&okT(v);if(n){S.parts=Object.assign({},S.parts||{});S.parts[k]=n;save();render()}});prow.appendChild(b)});
    bx.appendChild(prow);
    const bot=el("div","dtp-bot");
    const di=el("input","pdate");di.type="date";di.value=DT.due;di.onchange=()=>{if(di.value){DT.due=di.value;DT.vm=di.value.slice(0,7);DT.busy=null;render()}};bot.appendChild(di);
    const readWhen=(v)=>{const w=parseWhen(v);if(w.at||w.due)return {at:w.at,due:w.due};return {at:okT(v),due:""}};
    const ti=el("input","ptime");ti.type="text";ti.placeholder="16:20 · завтра в 9";ti.maxLength=30;ti.value=DT.at;
    const putW=(r)=>{if(r.due){DT.due=r.due;DT.vm=r.due.slice(0,7);DT.busy=null}if(r.at)DT.at=r.at};
    ti.onkeydown=(e)=>{e.stopPropagation();if(e.key==="Enter"){const r=readWhen(ti.value);if(r.at||r.due){putW(r);ap.click()}}};
    ti.onchange=()=>{const r=readWhen(ti.value);if(r.at||r.due){putW(r);render()}else ti.value=DT.at};bot.appendChild(ti);
    const td=el("button","chipb","Сегодня");td.type="button";td.onclick=()=>{DT.due=dayISO();DT.vm=DT.due.slice(0,7);DT.busy=null;render()};bot.appendChild(td);
    if(t.at||t.due){const c=el("button","chipb","Убрать");c.type="button";c.onclick=()=>{pushUndo();t.at="";t.due="";delete t.aa;save();close()};bot.appendChild(c)}
    const cn=el("button","chipb","Отмена");cn.type="button";cn.onclick=close;bot.appendChild(cn);
    const ap=el("button","chipb dtp-ap","Применить");ap.type="button";ap.onclick=()=>{const r=readWhen(ti.value);if(r.due)DT.due=r.due;const n=r.at||DT.at;pushUndo();dueSync(t,DT.due);t.at=n||"";delete t.aa;save();close()};bot.appendChild(ap);
    bx.appendChild(bot);
    p.appendChild(bx)}
  return p}

