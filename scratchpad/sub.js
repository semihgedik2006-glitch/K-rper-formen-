const { chromium } = require('playwright');
const KAND = {
  'jetzt': '',
  'W umbruch': `.subnav{flex-wrap:wrap;overflow-x:visible;row-gap:var(--s6)}`,
  'W2 umbruch+eng': `@media(max-width:520px){.subnav{flex-wrap:wrap;overflow-x:visible;row-gap:6px}
     .subtab{padding-left:12px;padding-right:12px;font-size:var(--t-xs)}}`,
  'W3 umbruch+sehr eng': `@media(max-width:520px){.subnav{flex-wrap:wrap;overflow-x:visible;row-gap:6px;gap:4px}
     .subtab{padding-left:10px;padding-right:10px;font-size:var(--t-xs)}
     .subtab svg{display:none}}`,
};
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const [name,css] of Object.entries(KAND)){
  const zeile=[];
  for(const w of [320,390,430]){
   const p=await b.newPage({viewport:{width:w,height:800}});
   await p.route('**://www.gstatic.com/**',r=>r.abort());
   await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
   await p.addInitScript({path:'tests/stub-chef.js'});
   await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await p.waitForTimeout(2400);
   await p.evaluate(()=>document.querySelector('.mobnav [data-group="g-arbeit"]').click());
   await p.waitForTimeout(600);
   if(css) await p.addStyleTag({content:css});
   await p.waitForTimeout(300);
   const r=await p.evaluate(()=>{
     const s=document.querySelector('.subnav');
     const tabs=[...s.querySelectorAll('.subtab')].filter(t=>t.offsetParent!==null);
     const tops=[...new Set(tabs.map(t=>Math.round(t.offsetTop)))];
     const hoehen=tabs.map(t=>Math.round(t.getBoundingClientRect().height));
     const breiten=tabs.map(t=>Math.round(t.getBoundingClientRect().width));
     return {ueber:s.scrollWidth-s.clientWidth, h:Math.round(s.getBoundingClientRect().height),
       reihen:tops.length, minH:Math.min(...hoehen), minB:Math.min(...breiten), n:tabs.length};
   });
   zeile.push(w+': ueber'+r.ueber+' hoehe'+r.h+' reihen'+r.reihen+' tabH'+r.minH+' tabB'+r.minB);
   await p.close();
  }
  console.log(name.padEnd(20), zeile.join(' | '));
 }
 await b.close();
})();
