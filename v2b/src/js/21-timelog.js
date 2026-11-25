/* ---------- журнал времени (для «Итогов») и сон ---------- */
function logT(t,ms){if(!S.log)S.log=[];S.log.push({d:dayISO(),ms:Math.max(0,Math.round(ms)),p:t.routine?"_routine":(t.project||""),f:0});if(S.log.length>800)S.log.splice(0,S.log.length-800)}
function logDone(t){if(!S.log)S.log=[];S.log.push({d:dayISO(),ms:0,p:t.routine?"_routine":(t.project||""),f:1})}
const habitApplies=(h,iso)=>!h.days||!h.days.length||h.days.includes(fromISO(iso).getDay());
const habitDone=(hid,iso)=>((S.habitLog||{})[iso]||[]).includes(hid);
function setHabit(hid,iso,on){S.habitLog=S.habitLog||{};const a=new Set(S.habitLog[iso]||[]);on?a.add(hid):a.delete(hid);if(a.size)S.habitLog[iso]=[...a];else delete S.habitLog[iso]}
function autoHabit(kind,iso){const h=(S.habits||[]).find((x)=>x.auto===kind);if(h)setHabit(h.id,iso,true)}
function streakOf(h){let iso=dayISO(),n=0;if(!habitDone(h.id,iso))iso=addDays(iso,-1);
  for(let i=0;i<400;i++){if(habitApplies(h,iso)){if(habitDone(h.id,iso))n++;else break}iso=addDays(iso,-1)}return n}
function bedMark(){const d=new Date(NOW()),m=d.getHours()*60+d.getMinutes();S.bedAt=NOW();if(m>=18*60||m<=75)autoHabit("sleep",dayISO())}
function wakeMark(){const d=new Date(NOW()),m=d.getHours()*60+d.getMinutes();
  if(m>=4*60&&m<=9*60+15)autoHabit("wake",dayISO());
  if(S.bedAt&&NOW()-S.bedAt<20*36e5){S.sleep=S.sleep||{};S.sleep[dayOf(S.bedAt)]={bed:S.bedAt,wake:NOW()}}S.bedAt=0}
