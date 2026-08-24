const { chromium } = require('playwright');
const KAND = {
 'jetzt':'',
 'P0 ohne padding-x': `.tb-brand{padding-left:0;padding-right:0;margin-left:0;margin-right:0}`,
 'W420 wort weg': `@media(max-width:420px){.tb-brand .tb-wort{display:none}}`,
 'S kleiner': `@media(max-width:429px){.tb-brand{font-size:var(--t-sm);gap:4px}}`,
 'S2 noch kleiner': `@media(max-width:429px){.tb-brand{font-size:var(--t-xs);gap:4px;letter-spacing:0}}`,
 'P0+W420': `.tb-brand{padding-left:0;padding-right:0;margin-left:0;margin-right:0}
             @media(max-width:420px){.tb-brand .tb-wort{display:none}}`,
};
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const [name,css] of Object.entries(KAND)){
  const z=[];
  for(const w of [320,390,430,480,520,600]){
   const p=await b.newPage({viewport:{width:w,height:800}});
   await p.route('**://www.gstatic.com/**',r=>r.abort());
   await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
   await p.addInitScript({path:'tests/stub-chef.js'});
   await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await p.waitForTimeout(2300);
   if(css) await p.addStyleTag({content:css});
   await p.waitForTimeout(200);
   const r=await p.evaluate(()=>{
     const el=document.getElementById('tbHome'); const rc=el.getBoundingClientRect();
     const tb=document.querySelector('.topbar');
     return {b:Math.round(rc.width),h:Math.round(rc.height),clip:el.scrollWidth-el.clientWidth,
       wort:!!document.querySelector('.tb-wort')&&getComputedStyle(document.querySelector('.tb-wort')).display!=='none',
       tbU:tb.scrollWidth-tb.clientWidth, kopf:Math.round(tb.getBoundingClientRect().height)};
   });
   z.push(w+':'+r.b+'x'+r.h+(r.clip>0?' CLIP'+r.clip:'')+(r.wort?' wort':' nurLogo')+(r.tbU?' tbU'+r.tbU:''));
   await p.close();
  }
  console.log(name.padEnd(18), z.join(' | '));
 }
 await b.close();
})();
