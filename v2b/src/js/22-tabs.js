/* ---------- вкладки Beta 2.0 ---------- */
const VIEWS_NAV=[["дела","Дела"],["работа","Работа"],["scen","Сценарии"],["habits","Привычки"],["stats","Итоги"],["map","Карта"]];
const _I=(d)=>'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const ENV_ICO={list:_I('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),kanban:_I('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>'),
 timeline:_I('<path d="M12 3v18M12 7h7M12 14h-7M12 19h5"/>'),calendar:_I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>')};
const xcol=()=>{const c=el("div","xcol");return c};
const xcard=(title,sum)=>{const c=el("div","xc");const h=el("div","xh");h.appendChild(el("h2",null,title));if(sum!=null)h.appendChild(el("span","sum",sum));c.appendChild(h);return c};
