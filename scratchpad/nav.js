const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const w of [320,360,390,430]){
  const p=await b.newPage({viewport:{width:w,height:800}});
  await p.route('**://www.gstatic.com/**',r=>r.abort());
  await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
  await p.addInitScript({path:'tests/stub-chef.js'});
  await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(2600);
  const r=await p.evaluate(()=>{
    const bar=document.querySelector('.mobnav');
    const cs=getComputedStyle(bar);
    const bs=[...bar.querySelectorAll('button')].map(x=>{
      const sp=x.querySelector('span:not(.badge):not(.ndot)')||x;
      const t=[...x.childNodes].filter(n=>n.nodeType===3||n.tagName==='SPAN').map(n=>n.textContent.trim()).join('');
      // Textbreite messen
      const rng=document.createRange();
      let breite=0;
      x.childNodes.forEach(n=>{ if(n.nodeType===3&&n.textContent.trim()){ rng.selectNodeContents(n); breite=Math.max(breite,rng.getBoundingClientRect().width);} 
        if(n.nodeType===1&&n.tagName==='SPAN'&&n.textContent.trim()){ rng.selectNodeContents(n); breite=Math.max(breite,rng.getBoundingClientRect().width);} });
      return {t:t.slice(0,20), w:Math.round(x.getBoundingClientRect().width), text:Math.round(breite)};
    });
    const sub=document.querySelector('.subnav');
    return {fs:cs.fontSize, bar:Math.round(bar.getBoundingClientRect().width), scroll:bar.scrollWidth, bs,
      subFs: sub?getComputedStyle(sub.querySelector('.subtab')||sub).fontSize:null};
  });
  console.log(w+'px:', JSON.stringify(r));
  await p.close();
 }
 await b.close();
})();
