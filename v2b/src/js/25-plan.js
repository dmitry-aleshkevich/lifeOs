/* ---------- шаблоны дня ---------- */
function renderPlan(v){ensureExtras();
  const col=xcol(),c=xcard("Шаблоны дня (LifeCore)","блоки сами появляются в «Сегодня» каждый день; готовка и посуда — «до» и «после»");
  const mins=(x)=>Math.max(0,Math.min(240,Math.round(+x||0)));
  S.plan.forEach((b,bi)=>{b.pre=b.pre||[];b.post=b.post||[];
    const blk=el("div","plb");blk.dataset.pid=b.id;const r=el("div","plr");
    const nm=el("input","hin plnm");nm.type="text";nm.value=b.name;nm.maxLength=40;nm.setAttribute("aria-label","Название блока");nm.onchange=()=>{const x=nm.value.trim();if(x){b.name=x;save()}else nm.value=b.name};
    const at=el("input","hin plat");at.type="time";at.value=b.at||"";at.setAttribute("aria-label","Начало");at.onchange=()=>{if(/^\d\d:\d\d$/.test(at.value)){b.at=at.value;save()}else at.value=b.at||""};
    const mn=el("input","hin plmn");mn.type="number";mn.min=0;mn.max=240;mn.value=b.min;mn.setAttribute("aria-label","Минуты");mn.onchange=()=>{b.min=mins(mn.value);save()};
    const x=el("button","ib danger","🗑");x.type="button";x.setAttribute("aria-label","Удалить блок");x.onclick=()=>{S.plan.splice(bi,1);save();render()};
    r.append(nm,at,mn,el("span","muted","мин"),x);blk.appendChild(r);
    const dr=el("div","hdays");PLAN_DAYS.forEach((d)=>{const bt=el("button","chipb"+(b.days.includes(d)?" on":""),WD[d]);bt.type="button";bt.dataset.day=d;
      bt.onclick=()=>{const i=b.days.indexOf(d);if(i<0)b.days.push(d);else b.days.splice(i,1);save();render()};dr.appendChild(bt)});blk.appendChild(dr);
    [["pre","До"],["post","После"]].forEach(([side,label])=>{const row=el("div","plk");row.appendChild(el("span","muted",label));
      b[side].forEach((k,ki)=>{const e=el("div","plki");const kn=el("input","hin");kn.type="text";kn.value=k.name;kn.maxLength=40;kn.onchange=()=>{const y=kn.value.trim();if(y){k.name=y;save()}else kn.value=k.name};
        const km=el("input","hin plmn");km.type="number";km.min=0;km.max=240;km.value=k.min;km.onchange=()=>{k.min=mins(km.value);save()};
        const kx=el("button","ib","×");kx.type="button";kx.setAttribute("aria-label","Убрать");kx.onclick=()=>{b[side].splice(ki,1);save();render()};e.append(kn,km,el("span","muted","мин"),kx);row.appendChild(e)});
      const f=el("form","plad");f.autocomplete="off";const i=el("input","hin");i.type="text";i.placeholder="+ "+label.toLowerCase()+" (Название 10м)";f.appendChild(i);
      f.onsubmit=(ev)=>{ev.preventDefault();const raw=i.value.trim();if(!raw)return;const q=parseQuick(raw);b[side].push(planKid(q.name,q.min||10));save();render()};row.appendChild(f);blk.appendChild(row)});
    c.appendChild(blk)});
  const ft=el("div","plft");const ad=el("button","chipb on","＋ Блок");ad.type="button";ad.id="pladd";ad.onclick=()=>{S.plan.push({id:"p-"+uid(),name:"Новый блок",at:"12:00",min:30,days:PLAN_ALL.slice(),pre:[],post:[]});save();render()};
  const now=el("button","chipb","Пересоздать на сегодня");now.type="button";now.id="plnow";now.onclick=()=>{S.planGen=null;planSync(true);render()};ft.append(ad,now);c.appendChild(ft);
  col.appendChild(c);v.appendChild(col)}
