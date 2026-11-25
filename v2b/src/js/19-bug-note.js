/* ---------- «Баг» и «Заметка»: справа две кнопки, окошко, экспорт сообщения в буфер ---------- */
const FB={bug:{k:"lifeos.v2b.bugs",title:"Баг",ph:"Что не так? (Enter — добавить, Shift+Enter — новая строка)"},note:{k:"lifeos.v2b.notes",title:"Заметка",ph:"Мысль, идея, вопрос… (Enter — добавить, Shift+Enter — новая строка)"}};
const FBL={bug:read(FB.bug.k)||[],note:read(FB.note.k)||[]};
const fbSave=(kind)=>{try{localStorage.setItem(FB[kind].k,JSON.stringify(FBL[kind]))}catch{}};
const ctxTag=()=>(UI.sys==="дела"?"Дела":"Работа")+" · "+ENVS[UI.env].name+(LASTT?" · «"+LASTT.slice(0,40)+"»":"");
function fbMessage(kind){
  const L=FBL[kind];if(!L.length)return "";
  let out=kind==="bug"?"Баги LifeOS v2 ("+L.length+"). Каждый пункт: сначала тест в Playwright, потом публикация.\n":"Заметки по LifeOS v2 ("+L.length+"). Это не баги: обсудить, без реализации.\n";
  L.forEach((b,i)=>{out+="\n"+(i+1)+". ("+b.tag+") "+b.text+"\n";if(kind==="bug"&&b.log&&b.log.length)out+="   Действия: "+b.log.join(" → ")+"\n"});
  if(kind==="bug"){if(ERRS.length)out+="\nОшибки JS: "+ERRS.join("; ")+"\n";out+="\nЭкран: "+innerWidth+"×"+innerHeight+", "+(navigator.userAgent.match(/(Chrome|Safari|Firefox)\/[\d.]+/)||[""])[0]+"\n"}
  return out}
const fbPop=(k)=>document.querySelector('.fbpop[data-kind="'+k+'"]');
function fbClose(k){(k?[k]:["bug","note"]).forEach((x)=>{const p=fbPop(x);if(p)p.remove()})}
function fbOpen(kind){
  const same=!!fbPop(kind);fbClose(kind);if(same)return;
  const p=el("div","fbpop");p.dataset.kind=kind;
  const h=el("div","fbh");h.appendChild(el("b",null,FB[kind].title));const x=el("button","fbx","×");x.type="button";x.setAttribute("aria-label","Закрыть");x.onclick=()=>fbClose(kind);h.appendChild(x);p.appendChild(h);
  const ta=el("textarea","fbta");ta.rows=3;ta.placeholder=FB[kind].ph;p.appendChild(ta);
  const ctx=el("div","fbctx","Страница: "+ctxTag());p.appendChild(ctx);
  const add=el("button","chipb","Добавить");add.type="button";p.appendChild(add);
  const ul=el("ul","fbls");const past=el("button","chipb fbpast");past.type="button";p.appendChild(past);p.appendChild(ul);
  let showPast=localStorage.getItem("lifeos.v2b.fbpast")==="1";
  if(kind==="bug"){const dt=document.createElement("details");dt.className="fblog";const sm=document.createElement("summary");sm.textContent="Последние действия ("+Math.min(ALOG.length,8)+")";dt.appendChild(sm);dt.appendChild(el("pre",null,ALOG.slice(-8).join("\n")||"пока пусто"));p.appendChild(dt)}
  const ft=el("div","fbf");const ex=el("button","chipb fbex","Экспорт");ex.type="button";const cl=el("button","chipb","Очистить");cl.type="button";const st=el("span","fbst","");ft.append(ex,cl,st);p.appendChild(ft);
  const list=()=>{ul.innerHTML="";past.textContent=(showPast?"▾ ":"▸ ")+"Прошлые записи ("+FBL[kind].length+")";past.hidden=!FBL[kind].length;ul.hidden=!showPast||!FBL[kind].length;
    FBL[kind].forEach((b,i)=>{const li=el("li");li.append(el("i",null,b.tag),el("span",null,b.text));const d=el("button",null,"×");d.type="button";d.onclick=()=>{FBL[kind].splice(i,1);fbSave(kind);list()};li.appendChild(d);ul.appendChild(li)})};
  const doAdd=()=>{const v=ta.value.trim();if(!v)return false;FBL[kind].push({tag:ctxTag(),text:v,at:Date.now(),log:kind==="bug"?ALOG.slice(-6):[]});fbSave(kind);ta.value="";list();return true};
  past.onclick=()=>{showPast=!showPast;try{localStorage.setItem("lifeos.v2b.fbpast",showPast?"1":"0")}catch{}list()};
  add.onclick=()=>{doAdd();ta.focus()};
  ta.addEventListener("keydown",(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();doAdd()}});
  ex.onclick=()=>{doAdd();const m=fbMessage(kind);if(!m){st.textContent="Пока пусто";return}
    const done=()=>{st.textContent="Скопировано ✓"};
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(m).then(done,()=>{ta.value=m;ta.select();st.textContent="Выдели и скопируй"});else{ta.value=m;ta.select();st.textContent="Выдели и скопируй"}};
  cl.onclick=()=>{if(!FBL[kind].length)return;if(!cl.dataset.arm){cl.dataset.arm=1;cl.textContent="Точно очистить?";setTimeout(()=>{cl.textContent="Очистить";delete cl.dataset.arm},2500);return}FBL[kind]=[];fbSave(kind);list();cl.textContent="Очистить";delete cl.dataset.arm};
  ["keydown","keyup","keypress"].forEach((ev)=>p.addEventListener(ev,(e)=>{e.stopPropagation();if(ev==="keydown"&&e.key==="Escape")fbClose(kind)}));
  list();let dk=document.getElementById("fbdock");if(!dk){dk=el("div");dk.id="fbdock";document.body.appendChild(dk)}
  p.style.order=kind==="bug"?0:1;dk.appendChild(p);setTimeout(()=>ta.focus(),0)}
/* общий экспорт: баги + заметки одним сообщением; через минуту выгруженное очищается */
const fbSweep=(ts)=>{["bug","note"].forEach((k)=>{FBL[k]=FBL[k].filter((b)=>b.at>ts);fbSave(k)});try{localStorage.removeItem("lifeos.v2b.fbexp")}catch{};
  ["bug","note"].forEach((k)=>{if(fbPop(k)){fbClose(k);fbOpen(k)}})};
function fbArm(ts){const left=Math.max(0,ts+60000-Date.now());setTimeout(()=>fbSweep(ts),left)}
function fbExportAll(btn){
  const m=["bug","note"].map(fbMessage).filter(Boolean).join("\n\n");
  const flash=(t)=>{btn.title=t;btn.classList.add("ok");setTimeout(()=>{btn.classList.remove("ok");btn.title="Экспорт: баги и заметки в буфер"},1500)};
  if(!m){flash("Пока пусто");return}
  const ts=Date.now();
  const done=()=>{try{localStorage.setItem("lifeos.v2b.fbexp",String(ts))}catch{};fbArm(ts);flash("Скопировано; список очистится через минуту")};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(m).then(done,()=>flash("Не удалось скопировать"));else flash("Буфер недоступен")}
(function(){const f=el("div","fab");f.id="fab";
  const IC={bug:'<path d="M8 8a4 4 0 0 1 8 0v1H8zM6 10h12v4a6 6 0 0 1-12 0zM3 12h3M18 12h3M4 18l3-2M20 18l-3-2M5 6l3 2M19 6l-3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    note:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    exp:'<path d="M9 4h9v12H9zM6 8H5v12h10v-1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'};
  [["bug","Баг"],["note","Заметка"],["exp","Экспорт: баги и заметки в буфер"]].forEach(([k,l])=>{const b=el("button",null);b.type="button";b.dataset.kind=k;b.title=l;b.setAttribute("aria-label",l);
    b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">'+IC[k]+'</svg>';
    b.onclick=()=>k==="exp"?fbExportAll(b):fbOpen(k);f.appendChild(b)});
  document.body.appendChild(f);
  const ts=Number(localStorage.getItem("lifeos.v2b.fbexp"))||0;if(ts)fbArm(ts)})();
