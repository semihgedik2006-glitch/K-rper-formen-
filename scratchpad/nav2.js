const { chromium } = require('playwright');
const KAND = {
  'jetzt': '',
  'A flex1-0 pad2': `@media(max-width:820px){.mobnav button{flex:1 1 0;min-width:0;padding-left:2px;padding-right:2px}}`,
  'B flex1-auto pad2': `@media(max-width:820px){.mobnav button{flex:1 1 auto;min-width:0;padding-left:2px;padding-right:2px}}`,
  'C 10px': `@media(max-width:820px){.mobnav button{flex:1 1 0;min-width:0;padding-left:2px;padding-right:2px;font-size:10px;letter-spacing:-.2px}}`,
  'H flex-auto min44': `@media(max-width:820px){.mobnav button{flex:1 1 auto;min-width:44px;padding-left:2px;padding-right:2px}}`,
  'I flex-auto min44 pad4': `@media(max-width:820px){.mobnav button{flex:1 1 auto;min-width:44px;padding-left:4px;padding-right:4px}}`,
  'F wort-span umbruch': `@media(max-width:820px){.mobnav button{flex:1 1 0;min-width:0;padding-left:2px;padding-right:2px}
     .mobnav button>span:not(.badge):not(.ndot){min-width:0;max-width:100%;overflow-wrap:break-word;hyphens:auto;line-height:1.15;text-align:center}}`,
  'G F+10px': `@media(max-width:820px){.mobnav button{flex:1 1 0;min-width:0;padding-left:2px;padding-right:2px;font-size:10px}
     .mobnav button>span:not(.badge):not(.ndot){min-width:0;max-width:100%;overflow-wrap:break-word;hyphens:auto;line-height:1.15;text-align:center}}`,
};
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 for(const [name,css] of Object.entries(KAND)){
  const zeile=[];
  for(const w of [320,360,390,430]){
   const p=await b.newPage({viewport:{width:w,height:800}});
   await p.route('**://www.gstatic.com/**',r=>r.abort());
   await p.route('**script.google.com/**',r=>r.fulfill({status:200,body:'ok'}));
   await p.addInitScript({path:'tests/stub-chef.js'});
   await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   await p.waitForTimeout(2400);
   if(css) await p.addStyleTag({content:css});
   await p.waitForTimeout(200);
   const r=await p.evaluate(()=>{
     const bar=document.querySelector('.mobnav');
     const bs=[...bar.querySelectorAll('button')];
     const eng=bs.map(x=>Math.round(x.getBoundingClientRect().width));
     // Wird ein Text abgeschnitten? scrollWidth des Buttons vs clientWidth
     const clip=bs.filter(x=>x.scrollWidth>x.clientWidth+1).map(x=>x.textContent.trim().slice(0,12)+'+'+(x.scrollWidth-x.clientWidth));
     const zeilen=bs.map(x=>Math.round(x.getBoundingClientRect().height));
     return {ueber:bar.scrollWidth-bar.clientWidth, min:Math.min(...eng), max:Math.max(...eng), clip, h:Math.max(...zeilen)};
   });
   zeile.push(w+': ueber'+r.ueber+' min'+r.min+' max'+r.max+' h'+r.h+(r.clip.length?' CLIP '+r.clip.join(','):''));
   await p.close();
  }
  console.log(name.padEnd(22), zeile.join(' | '));
 }
 await b.close();
})();
