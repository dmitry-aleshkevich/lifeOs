function chainSync(){
  const kids={},pd=(n)=>String(n).padStart(2,"0"),mn=(t,d)=>t.min>0?t.min:d,pm=(a)=>{if(!/^\d{1,2}:\d\d$/.test(String(a||"")))return null;const [h,m]=String(a).split(":").map(Number);return h*60+m};
  S.tasks.forEach((t)=>{if(t.link&&(t.rel==="pre"||t.rel==="post"))(kids[t.link]=kids[t.link]||[]).push(t)});
  const walk=(a,seen)=>{if(seen.has(a.id))return;seen.add(a.id);const ks=kids[a.id];if(!ks)return;
    const st=pm(a.at),has=st!==null,end=has?st+mn(a,30):0;
    const put=(k,v)=>{if(k.aa||!k.at){if(has&&v>=0&&v<1440){k.at=pd(Math.floor(v/60))+":"+pd(v%60);k.aa=1;if(a.due)k.due=a.due;return true}if(k.aa){k.at="";delete k.aa}}return false};
    let cur=st;const pre=ks.filter((k)=>k.rel==="pre"),post=ks.filter((k)=>k.rel==="post");
    for(let i=pre.length-1;i>=0;i--){const k=pre[i];if(has&&!(k.aa||!k.at)&&pm(k.at)!==null)cur=pm(k.at);else{cur-=mn(k,15);put(k,cur)}walk(k,seen)}
    cur=end;
    for(const k of post){if(has&&!(k.aa||!k.at)&&pm(k.at)!==null)cur=pm(k.at)+mn(k,15);else{put(k,cur);cur+=mn(k,15)}walk(k,seen)}};
  S.tasks.forEach((t)=>{if(!(t.link&&(t.rel==="pre"||t.rel==="post")))walk(t,new Set())})}
function save(){try{chainSync()}catch{}try{localStorage.setItem(V2,JSON.stringify(S))}catch{}}
