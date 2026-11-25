/* ---------- база: одна задача, одна форма (ARCHITECTURE.md §4) ---------- */
function task(src,over){
  return Object.assign({
    id:String(src.id||Math.random().toString(36).slice(2)),
    name:String(src.name||""), desc:String(src.note||src.desc||""),
    check:Array.isArray(src.check)?src.check:[],
    type:"дела", project:src.project||"", routine:"",
    where:src.where||"", ord:0,
    at:src.at||"", due:src.due||"", min:Number(src.min)||0,
    spent:+src.spent||0, sessions:+src.sessions||0, acc:+src.acc||0,
    done:!!src.done, doneAt:+src.doneAt||0, tm:null, archived:false,
    status:src.done?"done":"", stage:"", waitUntil:src.waitUntil||"",
    link:src.link||"", rel:src.rel||"",
  },over);
}
function migrate(v1){
  const out=[], add=(t)=>{t.ord=out.length;out.push(t)};
  (v1.tasks||[]).forEach((t)=>add(task(t,{type:"дела",where:t.where||"today"})));
  ["morning","evening"].forEach((k)=>((v1.routines||{})[k]||[]).forEach((t)=>add(task(t,{type:"дела",routine:k,where:"today"}))));
  ((v1.work||{}).tasks||[]).forEach((t)=>add(task(t,{type:"работа",status:t.status||"",stage:t.stage||"",
    where:"",link:t.parent||"",rel:t.parent?"post":""})));
  const pj=(v1.projects||[]).map((p)=>({id:p.id,name:p.name,color:p.color||"gray",type:p.kind==="work"?"работа":"дела"}))
    .concat(((v1.work||{}).projects||[]).map((p)=>({id:p.id,name:p.name,color:p.color||"gray",type:"работа"})));
  return {v:2,migratedAt:Date.now(),projects:pj,tasks:out};
}

let S=null;
const UI=(()=>{const u={sys:"дела",env:"list",view:"tasks"},r=read("lifeos.v2b.ui")||{};if(["tasks","habits","stats","plan","scen","map"].includes(r.view))u.view=r.view;
  if(r.sys==="дела"||r.sys==="работа")u.sys=r.sys;if(["list","kanban","timeline","calendar"].includes(r.env))u.env=r.env;return u})();
const ENVBY=(()=>{const e=read("lifeos.v2b.envby")||{};if(!e[UI.sys])e[UI.sys]=UI.env;return e})();
const setEnvBy=(sys,env)=>{ENVBY[sys]=env;try{localStorage.setItem("lifeos.v2b.envby",JSON.stringify(ENVBY))}catch{}};
const COLS={
  status:[["","Не начато"],["todo","В работу"],["doing","В работе"],["wait","Жду"],["done","Готово"]],
};
const proj=(id)=>{const p=S.projects.find((x)=>x.id===id)||null;return p&&p.type===UI.sys&&(UI.sys==="работа"||!/^работа$/i.test(p.name))?p:null};
const mine=()=>S.tasks.filter((t)=>t.type===UI.sys&&!t.routine&&(CORE.show||!t.tpl));   /* рутины живут в своих группах «Утро»/«Вечер» */

