/* ---------- привычки ---------- */
let habEdit=false,habArm=null;
function renderHabits(v){ensureExtras();
  const col=xcol(),today=dayISO(),mon=mondayOf(today),days=[0,1,2,3,4,5,6].map((i)=>addDays(mon,i));
  const c=xcard("Эта неделя",fromISO(mon).getDate()+" "+MONN[fromISO(mon).getMonth()]+" – "+fromISO(days[6]).getDate()+" "+MONN[fromISO(days[6]).getMonth()]);
  const ed=el("button","chipb"+(habEdit?" on":""),habEdit?"Готово":"Редактор");ed.type="button";ed.id="habedit";ed.onclick=()=>{habEdit=!habEdit;habArm=null;render()};c.querySelector(".xh").appendChild(ed);
  const hd=el("div","hrow hhead");hd.appendChild(el("span","hname"));
  days.forEach((d)=>{const s=el("span","hd"+(d===today?" today":""));s.appendChild(document.createTextNode(WD[fromISO(d).getDay()]));s.appendChild(el("br"));s.appendChild(document.createTextNode(String(fromISO(d).getDate())));hd.appendChild(s)});
  hd.appendChild(el("span","hd",habEdit?"":"серия"));c.appendChild(hd);
  S.habits.forEach((h,hi)=>{
    const wrap=el("div","hwrap");wrap.dataset.hid=h.id;
    const r=el("div","hrow");const nm=el("div","hname");
    if(habEdit){const inp=el("input","hin");inp.type="text";inp.value=h.name;inp.maxLength=40;inp.setAttribute("aria-label","Название привычки");
      inp.onchange=()=>{const x=inp.value.trim();if(x){h.name=x;save()}else inp.value=h.name};nm.appendChild(inp)}
    else{nm.appendChild(el("span",null,h.name));if(h.auto)nm.appendChild(el("span","auto","отмечается само"));else if(h.days&&h.days.length)nm.appendChild(el("span","auto",PLAN_DAYS.filter((d)=>h.days.includes(d)).map((d)=>WD[d]).join(" / ")))}
    r.appendChild(nm);
    days.forEach((d)=>{const b=el("button","dot","✓");b.type="button";const on=habitDone(h.id,d),ap=habitApplies(h,d);
      b.classList.toggle("on",on);b.classList.toggle("off",!ap&&!on);b.disabled=d>today;b.dataset.d=d;b.setAttribute("aria-label",h.name+", "+WD[fromISO(d).getDay()]);
      b.onclick=()=>{setHabit(h.id,d,!on);save();render()};r.appendChild(b)});
    const st=el("div","hend");
    if(habEdit){
      const up=el("button","ib","↑");up.type="button";up.disabled=hi===0;up.setAttribute("aria-label","Выше");up.onclick=()=>{[S.habits[hi-1],S.habits[hi]]=[S.habits[hi],S.habits[hi-1]];save();render()};
      const dn=el("button","ib","↓");dn.type="button";dn.disabled=hi===S.habits.length-1;dn.setAttribute("aria-label","Ниже");dn.onclick=()=>{[S.habits[hi+1],S.habits[hi]]=[S.habits[hi],S.habits[hi+1]];save();render()};
      const x=el("button","ib danger",habArm===h.id?"Удалить?":"🗑");x.type="button";x.setAttribute("aria-label","Удалить привычку");
      x.onclick=()=>{if(habArm!==h.id){habArm=h.id;render();return}S.habits=S.habits.filter((q)=>q!==h);habArm=null;save();render()};
      st.append(up,dn,x)}
    else{const n=streakOf(h);st.className="hend streak"+(n>=3?" hot":"");st.textContent=n?n+" дн":"—"}
    r.appendChild(st);wrap.appendChild(r);
    if(habEdit){const dr=el("div","hdays");dr.appendChild(el("span","muted","Дни:"));
      PLAN_DAYS.forEach((d)=>{const b=el("button","chipb"+((!h.days||!h.days.length||h.days.includes(d))?" on":""),WD[d]);b.type="button";b.dataset.day=d;
        b.onclick=()=>{const cur=new Set(h.days&&h.days.length?h.days:PLAN_ALL);cur.has(d)?cur.delete(d):cur.add(d);
          if(cur.size===0||cur.size===7)delete h.days;else h.days=PLAN_DAYS.filter((x)=>cur.has(x));save();render()};dr.appendChild(b)});
      wrap.appendChild(dr)}
    c.appendChild(wrap)});
  if(habEdit){const f=el("form","hadd");f.autocomplete="off";const i=el("input","hin");i.type="text";i.id="newhab";i.maxLength=40;i.placeholder="Новая привычка";f.appendChild(i);
    const b=el("button","chipb on","Добавить");b.type="submit";f.appendChild(b);
    f.onsubmit=(e)=>{e.preventDefault();const x=i.value.trim();if(!x)return;S.habits.push({id:uid(),name:x});save();render()};c.appendChild(f)}
  col.appendChild(c);v.appendChild(col)}
