const ENVS={
  list:{name:"Список",render(host){
    host.appendChild(qaBox("top"));
    if(F.on){focusEnsure(UI.sys);
      const items=(F.ids[UI.sys]||[]).map(byId).filter(Boolean).filter((t)=>!(TO.on&&UI.sys==="дела")||t.where==="today");
      const h=el("div","ghead");h.appendChild(el("span",null,"Фокус"+(TO.on&&UI.sys==="дела"?" · сегодня":"")));
      h.appendChild(el("span",null,items.length+" · "+items.reduce((a,t)=>a+(t.done?0:t.min),0)+" мин"));host.appendChild(h);
      if(!items.length)host.appendChild(el("div","empty","Нет задач под этот фильтр. ПКМ на «Фокус» — выбрать другой."));
      items.forEach((t)=>host.appendChild(card(t)));host.appendChild(qaBox("bottom"));return}
    if(UI.sys==="работа"){
      const q=workQueue();
      [["Сейчас",q.cur],["Дальше",q.nxt]].forEach(([label,items])=>{
        if(!items.length)return;
        const h=el("div","ghead");h.appendChild(el("span",null,label));
        h.appendChild(el("span",null,items.length+" · "+items.reduce((a,t)=>a+(t.done?0:t.min),0)+" мин"));host.appendChild(h);
        items.forEach((t)=>rowWithKids(host,t))});
      if(!q.all.length)host.appendChild(el("div","empty","Закинь задачи из проектов на канбан в «В работу» — они появятся здесь."));
      host.appendChild(qaBox("bottom"));return}
    if(CORE.show)routineGroup(host,"morning");
    const groups=[["today","Сегодня"],["tomorrow","Завтра"],["backlog","Дела"],["wait","Жду"],["","Без места"]];
    let any=false;
    const onlyToday=TO.on&&UI.sys==="дела";
    groups.forEach(([k,label])=>{
      if(onlyToday&&k!=="today")return;
      const items=mine().filter((t)=>!t.link&&(t.where||"")===k);
      if(!items.length&&k==="")return; any=true;   /* четыре основные группы видны всегда — в пустую можно бросать */
      const h=el("div","ghead fold");h.dataset.where=k;const op=onlyToday||gOpen(k);h.dataset.open=op?"1":"0";
      const lb=el("span",null);lb.appendChild(el("span","gt",op?"▾":"▸"));lb.appendChild(document.createTextNode(label));h.appendChild(lb);
      h.appendChild(el("span",null,items.length+" · "+items.reduce((s,t)=>s+(t.done?0:t.min),0)+" мин"));
      h.onclick=()=>{if(!swallow)gToggle(k)};
      if(k==="today"){const gb=el("button","chipb gday","📅 День в календарь");gb.type="button";gb.title="Все задачи сегодня со временем — в Google Calendar";
        gb.onclick=async(e)=>{e.stopPropagation();let n=0;for(const t of mine().filter((x)=>x.at&&!x.done&&(x.where==="today"||x.due===dayISO()))){if(await toCalendar(t))n++;else break}if(n)note("В календаре: "+n);else if(!mine().some((x)=>x.at&&!x.done))note("Нет сегодняшних задач со временем")};h.insertBefore(gb,h.lastChild)}
      host.appendChild(h);
      if(op)items.forEach((t)=>rowWithKids(host,t))
    });
    if(!any)host.appendChild(el("div","empty","В этой системе пока нет задач."));
    host.appendChild(qaBox("bottom"));
  }},
  timeline:{name:"Таймлайн",render(host){
    const H0=8,H1=23,PX=tlPx(),MINH=Math.max(30,Math.round(50*Math.min(1,PX/56)));
    const withAt=mine().filter((t)=>t.at),none=mine().filter((t)=>!t.at&&!t.link);
    const wrap=el("div","tl");
    for(let h=H0;h<=H1;h++){const r=el("div","hr");r.style.height=PX+"px";r.appendChild(el("span",null,String(h).padStart(2,"0")+":00"));wrap.appendChild(r)}
    const now=new Date(),nm=now.getHours()+now.getMinutes()/60;
    if(nm>=H0&&nm<=H1){const n=el("div","now");n.style.top=((nm-H0)*PX)+"px";n.dataset.th=nm-H0;wrap.appendChild(n)}
    /* пересекающиеся задачи встают рядом, колонками (как в календарях), а не друг на друге */
    const its=[];
    withAt.forEach((t)=>{const [hh,mm]=t.at.split(":").map(Number);const top=(hh+mm/60-H0)*PX;if(top<0)return;
      its.push({t,top,h:Math.max(MINH,(t.min||30)/60*PX),c:0,n:1})});
    its.sort((x,y)=>x.top-y.top||y.h-x.h);
    {let grp=[],end=-1;const flush=()=>{const n=Math.max(1,...grp.map((i)=>i.c+1));grp.forEach((i)=>{i.n=n})};
      its.forEach((i)=>{if(grp.length&&i.top>=end){flush();grp=[];end=-1}
        const used=new Set(grp.filter((g)=>g.top+g.h>i.top).map((g)=>g.c));let c=0;while(used.has(c))c++;i.c=c;grp.push(i);end=Math.max(end,i.top+i.h)});
      flush()}
    its.forEach((i)=>{const s=el("div","slot");s.style.top=i.top+"px";s.style.height=i.h+"px";s.dataset.th=i.top/PX;s.dataset.mn=i.t.min||30;
      if(i.n>1){s.style.left=(i.c*100/i.n)+"%";s.style.right="auto";s.style.width="calc("+(100/i.n)+"% - 4px)"}
      s.appendChild(card(i.t,{noAt:true}));const rs=el("div","rs");rs.dataset.rid=i.t.id;s.appendChild(rs);wrap.appendChild(s)});
    wrap.style.height=((H1-H0+1)*PX)+"px";
    wrap.dataset.h0=H0;wrap.dataset.px=PX;wrap.dataset.h1=H1;
    const shut=localStorage.getItem("lifeos.v2b.tls")==="0";
    const tw=el("div","tlw"+(shut?" shut":""));tw.appendChild(wrap);
    const side=el("div","tls");const h=el("div","ghead");const tg=el("button","tgl",(shut?"▸ ":"▾ ")+"Склад");tg.type="button";tg.id="tlstore";
    tg.onclick=()=>{try{localStorage.setItem("lifeos.v2b.tls",shut?"1":"0")}catch{}render()};h.appendChild(tg);h.appendChild(el("span",null,String(none.length)));
    if(shut){h.style.marginBottom="6px";host.appendChild(h)}
    else{side.appendChild(h);if(!none.length)side.appendChild(el("div","empty","Пусто — у всех задач есть время."));none.forEach((t)=>rowWithKids(side,t));tw.appendChild(side)}
    host.appendChild(tw);
  }},
  kanban:{name:"Канбан",render(host){
    const work=UI.sys==="работа";
    const STAT=work?[["todo","В работу","blue"],["doing","В процессе","yellow"],["wait","Жду","violet"],["done","Готово","green"]]
      :[["today","Сегодня","orange"],["tomorrow","Завтра","blue"],["backlog","Нужно делать","gray"],["wait","Жду","violet"],["done","Готово","green"]];
    const base=()=>mine().filter((t)=>!t.link&&!t.archived);
    const inStat=(t,k)=>work?t.status===k:(k==="done"?t.done:(!t.done&&(t.where||"")===k));
    const inProj=(t,k)=>(t.project||"")===k&&(work?!t.status:(!t.done&&!t.where));
    const board=(label,id,cols,pick,addOpts)=>kbBoard(host,{label,id,cols,pick,addOpts,base});
    board(work?"Сейчас в работе":"План","status",STAT,inStat,(k)=>work?{status:k}:{where:k});
    const pcols=S.projects.filter((p)=>p.type===UI.sys&&!p.hidden&&(work||!/^работа$/i.test(p.name))).map((p)=>[p.id,p.name,p.color]);
    pcols.push(["","Без проекта","gray"]);
    board("Проекты","project",pcols,inProj,(k)=>({project:k,where:""}));
  }},
  calendar:{name:"Календарь",render(host){
    const C=UI.cal=UI.cal||Object.assign({mode:"month",a:""},read("lifeos.v2b.cal")||{});
    const pad=(n)=>String(n).padStart(2,"0"),iso=(d)=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
    const today=dayISO(),pd=(k)=>{const [y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
    if(!C.a)C.a=today;
    const A=pd(C.a),week=C.mode==="week",saveC=()=>{try{localStorage.setItem("lifeos.v2b.cal",JSON.stringify({mode:C.mode}))}catch{}};
    let start,count;
    if(week){start=new Date(A);start.setDate(A.getDate()-((A.getDay()+6)%7));count=7}
    else{const first=new Date(A.getFullYear(),A.getMonth(),1),shift=(first.getDay()+6)%7,days=new Date(A.getFullYear(),A.getMonth()+1,0).getDate();
      start=new Date(first);start.setDate(1-shift);count=Math.ceil((shift+days)/7)*7}
    const MN=["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
    const title=week?(()=>{const e=new Date(start);e.setDate(e.getDate()+6);return start.getDate()+" "+(start.getMonth()!==e.getMonth()?MN[start.getMonth()]+" ":"")+"– "+e.getDate()+" "+MN[e.getMonth()]})()
      :["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"][A.getMonth()]+" "+A.getFullYear();
    const bar=el("div","calbar");
    const nav=(d)=>{const n=new Date(A);if(week)n.setDate(n.getDate()+7*d);else n.setMonth(n.getMonth()+d,1);C.a=iso(n);render()};
    const prev=el("button","chipb","‹");prev.type="button";prev.id="calprev";prev.onclick=()=>nav(-1);
    const next=el("button","chipb","›");next.type="button";next.id="calnext";next.onclick=()=>nav(1);
    const tb=el("button","chipb","Сегодня");tb.type="button";tb.id="caltoday";tb.onclick=()=>{C.a=today;render()};
    bar.append(prev,el("b","caltitle",title),next,tb);
    const ms=el("div","seg calmode");[["month","Месяц"],["week","Неделя"]].forEach(([k,l])=>{const b=el("button",null,l);b.type="button";b.dataset.mode=k;b.setAttribute("aria-pressed",C.mode===k);b.onclick=()=>{C.mode=k;saveC();render()};ms.appendChild(b)});
    bar.appendChild(ms);host.appendChild(bar);
    const wrap=el("div","calwrap"+(week?" wk":"")),left=el("div","calmain"),g=el("div","cal"+(week?" week":""));
    if(!week)["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach((d)=>g.appendChild(el("div","dow",d)));
    const DW=["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
    const withDue=mine().filter((t)=>t.due&&!t.link&&!t.archived);
    for(let i=0;i<count;i++){
      const date=new Date(start);date.setDate(start.getDate()+i);const key=iso(date);
      const cell=el("div","day"+(key===today?" today":"")+(!week&&date.getMonth()!==A.getMonth()?" out":""));cell.dataset.date=key;
      const hd=el("div","dh");const dn=el("span","n",(week?DW[date.getDay()]+" ":"")+date.getDate());if(!week){dn.style.cursor="pointer";dn.onclick=()=>{C.mode="week";C.a=key;saveC();render()}}hd.appendChild(dn);
      const ad=el("button","dadd","+");ad.type="button";ad.title="Новая задача на этот день";ad.setAttribute("aria-label","Новая задача на этот день");
      ad.onclick=(e)=>{e.stopPropagation();if(!week){C.mode="week";C.a=key;saveC()}const t=makeTask({name:"Новая задача",min:0,due:key},dueCtx(key));render();const nm=document.querySelector('[data-cid="'+t.id+'"] .nm');if(nm)editName(nm,t,true)};
      hd.appendChild(ad);cell.appendChild(hd);
      const dt=withDue.filter((t)=>t.due===key);
      if(week)dt.forEach((t)=>cell.appendChild(card(t,{noAt:true,noProject:false})));
      else if(dt.length){const ds=el("div","dots");ds.dataset.n=String(dt.length);dt.slice(0,6).forEach((t)=>ds.appendChild(el("i",t.done?"d":"")));if(dt.length>6)ds.appendChild(el("b",null,"+"+(dt.length-6)));
        const show=()=>dayPop(cell,key,dt);ds.onmouseenter=show;ds.onmouseleave=dayPopHide;ds.onclick=(e)=>{e.stopPropagation();show()};cell.appendChild(ds)}
      g.appendChild(cell)}
    left.appendChild(g);if(week){left.classList.add("calx")}wrap.appendChild(left);
    const store=mine().filter((t)=>!t.due&&!t.link&&!t.done&&!t.archived);
    const rank=(t)=>t.where==="today"?0:t.where==="tomorrow"?1:2;
    store.sort((x,y)=>rank(x)-rank(y));
    const side=el("div","store");side.dataset.store="1";
    const h=el("div","ghead");h.appendChild(el("span",null,"Склад"));h.appendChild(el("span",null,String(store.length)));side.appendChild(h);
    if(!store.length)side.appendChild(el("div","empty","Все задачи с датой."));
    store.forEach((t)=>side.appendChild(card(t,{noAt:true})));
    wrap.appendChild(side);host.appendChild(wrap);
  }},
};
