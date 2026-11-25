const VIEWS={habits:renderHabits,stats:renderStats,plan:renderPlan,scen:renderScenTabs,map:renderMap};
function boot(){
  const v1=read(V1);
  if(!v1){document.getElementById("view").innerHTML=
    '<div class="empty">Данные v1 не найдены в этом браузере. Открой сначала рабочую версию и дождись загрузки задач.</div>';return}
  S=migrate(v1);S.seedMorning=true;S.morningOnly=false;save();render();
}
function fromBeta(){const b=read("lifeos.v2");if(!(b&&b.v===2&&Array.isArray(b.tasks)))return false;
  S=JSON.parse(JSON.stringify(b));S.tasks.forEach((t)=>{if(t.tm===undefined)t.tm=null});save();
  ["ui","fold","ckshow","focus"].forEach((k)=>{const x=localStorage.getItem("lifeos.v2."+k);if(x!=null){try{localStorage.setItem("lifeos.v2b."+k,x)}catch{}}});return true}
function seedMorning(){
  if(S.seedMorning)return;S.seedMorning=true;
  if(S.tasks.some((t)=>t.routine==="morning")){save();return}
  [["Душ 🚿",10],["Почистить зубы 🪥",0],["Выпить воды 💧",0],["Одеться 👕",0],["Заварить чай 🫖",5],["Лёд на лицо 🥶",2],["Зарядка 🏋️",15],["Приготовить завтрак 🍳",15],["Позавтракать 🍳",20],["Выход из дома 💼",0]]
    .forEach(([n,m],i)=>{const t=task({name:n,min:m},{routine:"morning",where:"today"});t.ord=i+1;S.tasks.push(t)});save()}
function start(){
  initFocusBtn();
  const v2=read(V2);
  if(v2&&v2.v===2&&Array.isArray(v2.tasks)){S=v2;S.tasks.forEach((t)=>{if(t.tm===undefined)t.tm=null});ensureExtras();seedMorning();if(S.morningOnly===undefined){S.morningOnly=true;save()}render();return}
  if(fromBeta()){ensureExtras();seedMorning();if(S.morningOnly===undefined)S.morningOnly=true;save();render();return}
  boot();
}
document.getElementById("again").onclick=()=>{if(confirm("Скопировать данные из беты заново? Данные Beta 2.0 будут заменены."))(fromBeta()?(seedMorning(),render()):boot())};
start();
