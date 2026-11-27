# v2: случайные операции (создать, подзадача, перенос на «+», удалить, отмена, готово, смена окружения) — данные остаются целыми
import json,random
from playwright.sync_api import sync_playwright
V1={"tasks":[{"id":"a","name":"A","where":"today"},{"id":"b","name":"B","where":"tomorrow"}],"routines":{},"projects":[],
 "work":{"projects":[{"id":"p1","name":"P","color":"violet"}],"tasks":[{"id":"w","name":"W","project":"p1","status":"todo"}]}}
INV="""()=>{const T=S.tasks,ids=new Set(T.map(t=>t.id)),bad=[];
 if(ids.size!==T.length)bad.push('dup id');
 T.forEach(t=>{if(t.link){const p=T.find(x=>x.id===t.link);if(!p)bad.push('orphan '+t.id);else if(p.link)bad.push('depth '+t.id);
   if(t.rel!=='pre'&&t.rel!=='post')bad.push('rel '+t.id)}else if(t.rel)bad.push('rel without link '+t.id)});
 return bad}"""
OP="""(r)=>{const T=S.tasks,pick=()=>T[Math.floor(r[1]*T.length)];const t=pick();
 const sysT=T.filter(x=>x.type===UI.sys);
 switch(r[0]){
  case 0:makeTask({name:'n'+T.length},{where:UI.sys==='дела'?'today':'',status:UI.sys==='работа'?'todo':''});break;
  case 1:if(t)addSub(t,r[2]?'pre':'post','s'+T.length,0,false);break;
  case 2:{const c=document.querySelector('.card[data-cid="'+(t&&t.id)+'"]');const o=sysT[Math.floor(r[2]*sysT.length)];
     if(c&&o&&t.type===UI.sys&&o.type===UI.sys&&o.id!==t.id){const card=document.querySelector('.card[data-cid="'+o.id+'"]');if(card)adopt(t,card,r[3]?'pre':'post')}break}
  case 3:if(t&&Math.floor(r[2]*4)===0)delTask(t);break;
  case 4:undoNow();break;
  case 5:if(t&&!t.done)complete(t);break;
  case 6:UI.env=['list','kanban','timeline'][Math.floor(r[2]*3)];UI.sys=r[3]?'дела':'работа';render();break;
 }}"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport=dict(width=1300,height=900)).new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto("file:///home/claude/work/lo/v2/index.html"); pg.wait_for_timeout(300)
    pg.evaluate("v=>{localStorage.clear();localStorage.setItem('lifeos.v1',v)}",json.dumps(V1)); pg.reload(); pg.wait_for_selector('#sysSeg button'); pg.wait_for_timeout(600)
    import os; random.seed(int(os.environ.get("SEED","83")))
    for i in range(150):
        r=[random.randrange(7),random.random(),random.random(),random.random()<0.5]
        pg.evaluate(OP,r)
        bad=pg.evaluate(INV)
        assert not bad,(i,r,bad)
    pg.evaluate("()=>{UI.env='list';render()}")
    assert not errs,errs
print("ERRORS: []")
