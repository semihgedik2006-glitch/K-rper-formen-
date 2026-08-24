const { chromium } = require('playwright');
const KAND = {
 'jetzt': '',
 'K1': `@media(max-width:520px){.topbar .icon-btn{width:44px;height:44px}.tb-brand{min-width:44px}}
        @media(max-width:400px){.subtab{padding-left:var(--s10);padding-right:var(--s10)}
          .pm-tabs{gap:2px;padding:2px}.pm-tab{padding-left:2px;padding-right:2px;font-size:var(--t-xs)}}`,
 'K2': `@media(max-width:520px){.topbar .icon-btn{width:44px;height:44px}.tb-brand{min-width:44px}}
        @media(max-width:400px){.subtab{padding-left:var(--s8);padding-right:var(--s8);gap:var(--s4)}
          .pm-tabs{gap:2px;padding:2px}.pm-tab{padding-left:2px;padding-right:2px;font-size:var(--t-xs)}}`,
};
const VIEWS=[['g-komm','chat'],['g-ich','ich'],['g-team','team'],['g-arbeit','todos']];
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const [name,css] of Object.entries(KAND)){
  for(const w of [320,360,390]){
   const p=await b.newPage({viewport:{width:w,height:820}});
   await p.route('**://www.gstatic.com/**',r=>r.abort());
   await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
   await p.addInitScript({path:'tests/stub-chef.js'});
   await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await p.waitForTimeout(2400);
   if(css) await p.addStyleTag({content:css});
   const out=[];
   for(const [g,v] of VIEWS){
     await p.evaluate(x=>document.querySelector('.mobnav [data-group="'+x+'"]').click(),g);
     await p.waitForTimeout(450);
     const r=await p.evaluate(()=>{
       const res=[];
       document.querySelectorAll('.subnav,.pm-tabs').forEach(el=>{
         if(!el.getClientRects().length) return;
         const u=el.scrollWidth-el.clientWidth;
         if(u>1) res.push((el.id||el.className.split(' ')[0])+'+'+u);
       });
       const tb=document.querySelector('.topbar');
       const klein=[...tb.querySelectorAll('button')].filter(x=>x.offsetParent!==null)
         .filter(x=>{const r=x.getBoundingClientRect();return r.width<44||r.height<44;})
         .map(x=>(x.id||x.className.split(' ')[0])+':'+Math.round(x.getBoundingClientRect().width)+'x'+Math.round(x.getBoundingClientRect().height));
       return {res, klein, kopf:Math.round(tb.getBoundingClientRect().height), tbUeber:tb.scrollWidth-tb.clientWidth};
     });
     out.push(v+'['+(r.res.join(',')||'ok')+']');
     if(v==='chat') out.push('kopf'+r.kopf+' tbUeber'+r.tbUeber+' klein['+r.klein.join(',')+']');
   }
   console.log(name.padEnd(6), w+'px', out.join(' '));
   await p.close();
  }
 }
 await b.close();
})();
