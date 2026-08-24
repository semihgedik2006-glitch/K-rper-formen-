const { chromium } = require('playwright');
const KAND = { 'jetzt':'', '44px': `@media(max-width:520px){.topbar .icon-btn{width:44px;height:44px}}` };
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const [name,css] of Object.entries(KAND)){
  const z=[];
  for(const w of [320,360,390,430,500]){
   const p=await b.newPage({viewport:{width:w,height:800}});
   await p.route('**://www.gstatic.com/**',r=>r.abort());
   await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
   await p.addInitScript({path:'tests/stub-chef.js'});
   await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await p.waitForTimeout(2400);
   if(css) await p.addStyleTag({content:css});
   await p.waitForTimeout(250);
   const r=await p.evaluate(()=>{
     const tb=document.querySelector('.topbar');
     const knoepfe=[...tb.querySelectorAll('button')].filter(x=>x.offsetParent!==null);
     const kl=knoepfe.map(x=>{const r=x.getBoundingClientRect();return (x.id||x.className.split(' ')[0])+':'+Math.round(r.width)+'x'+Math.round(r.height);});
     return {h:Math.round(tb.getBoundingClientRect().height), ueber:tb.scrollWidth-tb.clientWidth, kl,
       unter44: knoepfe.filter(x=>{const r=x.getBoundingClientRect();return r.width<44||r.height<44;}).map(x=>x.id||x.className.split(' ')[0])};
   });
   z.push(w+': kopf'+r.h+' ueber'+r.ueber+' klein['+r.unter44.join(',')+']');
   if(w===390) console.log('   390 detail:', r.kl.join(' '));
   await p.close();
  }
  console.log(name.padEnd(8), z.join(' | '));
 }
 await b.close();
})();
