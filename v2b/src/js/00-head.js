"use strict";
const V1="lifeos.v1", V2="lifeos.v2b";
const read=(k)=>{try{const s=localStorage.getItem(k);return s?JSON.parse(s):null}catch{return null}};
const el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
const esc=(s)=>String(s==null?"":s);

