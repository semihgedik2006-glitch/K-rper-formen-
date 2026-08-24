const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:390,height:844}});
 await p.route('**://www.gstatic.com/**',r=>r.abort());
 await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
 await p.addInitScript({path:'tests/stub-chef.js'});
 await p.addInitScript(`var e=[{id:'x',text:'Ruf 0221 1234567 an',uid:'u2',name:'P',ts:Date.now()}];window.__handovers={};for(var i=0;i<14;i++)window.__handovers['studio-'+i]=e;`);
 await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
 await p.waitForTimeout(3000);
 await p.evaluate(()=>document.querySelector('.mobnav [data-group="g-team"]').click());
 await p.waitForTimeout(1200);
 console.log(await p.evaluate(()=>({
   sel: (document.getElementById('teamStudio')||{}).value,
   opts: [...document.querySelectorAll('#teamStudio option')].map(o=>o.value),
   tabs: [...document.querySelectorAll('[data-teamtab]')].map(t=>t.getAttribute('data-teamtab')+':'+t.style.display+':'+t.className),
   pane: (document.getElementById('teamPaneUebergabe')||{}).style?.display,
   ho: (document.getElementById('hoList')||{}).innerHTML?.slice(0,300)
 })));
 await b.close();
})();
