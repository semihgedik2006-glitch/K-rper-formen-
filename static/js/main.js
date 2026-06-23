(function(){
"use strict";
var reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var isTouch=window.matchMedia("(hover: none)").matches;

/* 1) Mobile Nav */
var toggle=document.getElementById("navToggle"),links=document.getElementById("navLinks");
if(toggle&&links){
  toggle.addEventListener("click",function(){
    var o=links.classList.toggle("open");toggle.classList.toggle("active",o);
    toggle.setAttribute("aria-expanded",o?"true":"false");
  });
  links.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){
    links.classList.remove("open");toggle.classList.remove("active");
    toggle.setAttribute("aria-expanded","false");
  });});
}

/* 2) Navbar auto-hide + scroll progress + mobile CTA */
var nav=document.querySelector(".nav"),bar=document.getElementById("progress"),
    mcta=document.getElementById("mcta"),lastY=0,ticking=false;
function onScroll(){
  var y=window.scrollY,h=document.documentElement.scrollHeight-window.innerHeight;
  if(bar)bar.style.width=(h>0?(y/h*100):0)+"%";
  if(nav)nav.style.top=(y>lastY&&y>240)?"-90px":"14px";
  if(mcta)mcta.classList.toggle("show",y>700);
  lastY=y;ticking=false;
}
window.addEventListener("scroll",function(){
  if(!ticking){requestAnimationFrame(onScroll);ticking=true;}
},{passive:true});

/* 3) Hero headline word-by-word reveal (Apple-Stil)
   Syntax in data-words: "Wort Wort.|%Akzent Teil%"  (| = Zeilenumbruch, %..% = Gradient) */
var title=document.getElementById("heroTitle");
if(title){
  (function buildTitle(){
    var raw=title.getAttribute("data-words");
    var lines=raw.split("|");var di=0;
    lines.forEach(function(line,li){
      var accent=false,text=line;
      if(/^%.*%$/.test(line)){accent=true;text=line.slice(1,-1);}
      text.split(" ").forEach(function(w){
        var wrap=document.createElement("span");wrap.className="word";
        var inner=document.createElement("span");
        inner.textContent=w+" ";
        if(accent)inner.classList.add("hl");
        inner.style.transitionDelay=(di*0.08)+"s";di++;
        wrap.appendChild(inner);title.appendChild(wrap);
      });
      if(li<lines.length-1)title.appendChild(document.createElement("br"));
    });
  })();
  requestAnimationFrame(function(){requestAnimationFrame(function(){title.classList.add("in");});});
}

/* 4) Typewriter hero subtitle */
var sub=document.getElementById("heroSub");
if(sub){
  var txt=sub.getAttribute("data-text")||
    "Effektives Ganzkörper-Training mit persönlicher Betreuung. Abnehmen, Muskeln aufbauen und fitter werden – ganz ohne stundenlange Workouts.";
  if(reduce){sub.textContent=txt;}
  else{
    var cur=document.createElement("span");cur.className="cur";cur.setAttribute("aria-hidden","true");
    sub.appendChild(cur);var ti=0;
    (function type(){
      if(ti<txt.length){sub.insertBefore(document.createTextNode(txt[ti++]),cur);
        setTimeout(type,ti<4?60:Math.random()*32+18);}
      else setTimeout(function(){cur.remove();},1400);
    });
    setTimeout(type,1100);
  }
}

/* 5) Scroll reveal with stagger (IntersectionObserver) */
var revEls=document.querySelectorAll(".reveal");
if("IntersectionObserver"in window&&!reduce){
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(!e.isIntersecting)return;
      var sib=Array.from(e.target.parentElement.querySelectorAll(":scope > .reveal"));
      var idx=sib.indexOf(e.target);
      e.target.style.transitionDelay=(Math.max(idx,0)*0.09)+"s";
      e.target.classList.add("in");io.unobserve(e.target);
    });
  },{threshold:0.12,rootMargin:"0px 0px -8% 0px"});
  revEls.forEach(function(el){io.observe(el);});
}else{revEls.forEach(function(el){el.classList.add("in");});}

/* 6) Stat counters */
function countUp(el){
  var target=parseFloat(el.getAttribute("data-count")),suf=el.getAttribute("data-suffix")||"";
  var dur=2000,start=performance.now();
  function step(now){
    var p=Math.min((now-start)/dur,1),e2=1-Math.pow(1-p,4);
    var v=Math.round(target*e2);
    el.textContent=(v>=1000?v.toLocaleString("de-DE"):v)+suf;
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
var ctrs=document.querySelectorAll("[data-count]");
if("IntersectionObserver"in window&&!reduce){
  var co=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){countUp(e.target);co.unobserve(e.target);}});},{threshold:0.5});
  ctrs.forEach(function(c){co.observe(c);});
}else{ctrs.forEach(function(c){var v=c.getAttribute("data-count");
  c.textContent=(v>=1000?Number(v).toLocaleString("de-DE"):v)+(c.getAttribute("data-suffix")||"");});}

/* 7) Hero parallax (sanft, nur Desktop) */
var hv=document.getElementById("heroVisual");
if(hv&&!reduce&&!isTouch){
  window.addEventListener("scroll",function(){
    requestAnimationFrame(function(){
      var off=Math.min(window.scrollY,700);
      hv.style.transform="translateY("+(off*-0.06)+"px)";
    });
  },{passive:true});
  var vw=hv.parentElement;
  vw.addEventListener("pointermove",function(ev){
    var r=vw.getBoundingClientRect();
    var rx=((ev.clientY-r.top)/r.height-.5)*-6;
    var ry=((ev.clientX-r.left)/r.width-.5)*6;
    hv.style.transition="transform .15s var(--ease-out)";
    hv.style.transform="rotateX("+rx+"deg) rotateY("+ry+"deg)";
  });
  vw.addEventListener("pointerleave",function(){
    hv.style.transition="transform .6s var(--ease-out)";hv.style.transform="";
  });
}

/* 8) Card spotlight + magnetische Buttons */
if(!isTouch&&!reduce){
  document.querySelectorAll(".card").forEach(function(card){
    card.addEventListener("pointermove",function(e){
      var r=card.getBoundingClientRect();
      card.style.setProperty("--mx",(e.clientX-r.left)+"px");
      card.style.setProperty("--my",(e.clientY-r.top)+"px");
    });
  });
  document.querySelectorAll(".btn-primary").forEach(function(b){
    b.addEventListener("pointermove",function(e){
      var r=b.getBoundingClientRect();
      var x=(e.clientX-r.left-r.width/2)*0.25, y=(e.clientY-r.top-r.height/2)*0.35;
      b.style.transform="translate("+x+"px,"+y+"px)";
    });
    b.addEventListener("pointerleave",function(){b.style.transform="";});
  });
}

/* 9) FAQ accordion */
document.querySelectorAll(".faq-q").forEach(function(btn){
  btn.addEventListener("click",function(){
    var item=btn.parentElement,ans=btn.nextElementSibling;
    var open=item.classList.toggle("open");
    btn.setAttribute("aria-expanded",open?"true":"false");
    ans.style.maxHeight=open?ans.scrollHeight+"px":null;
  });
});

/* 10) Formulare → echtes Backend (Flask) */
function handleForm(formId,noteId,endpoint,successText){
  var form=document.getElementById(formId),note=document.getElementById(noteId);
  if(!form)return;
  form.addEventListener("submit",function(e){
    e.preventDefault();
    if(!form.checkValidity()){
      note.style.color="#EF4444";
      note.textContent="Bitte fülle alle Pflichtfelder korrekt aus.";
      form.reportValidity();return;
    }
    var btn=form.querySelector("button[type=submit]");
    var oldLabel=btn?btn.textContent:"";
    if(btn){btn.disabled=true;btn.textContent="Senden …";}
    note.style.color="var(--text-2)";note.textContent="";

    var payload={};
    new FormData(form).forEach(function(v,k){payload[k]=v;});

    fetch(endpoint,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload)
    }).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
    .then(function(res){
      if(res.ok&&res.d.ok){
        note.style.color="var(--accent-d)";
        note.textContent=res.d.message||successText;
        form.reset();
      }else{
        note.style.color="#EF4444";
        note.textContent=(res.d&&res.d.error)||"Etwas ist schiefgelaufen. Bitte ruf uns kurz an.";
      }
    }).catch(function(){
      note.style.color="#EF4444";
      note.textContent="Verbindung fehlgeschlagen. Bitte versuche es erneut.";
    }).finally(function(){
      if(btn){btn.disabled=false;btn.textContent=oldLabel;}
    });
  });
}
handleForm("contactForm","formNote","/api/contact","Danke! Wir melden uns innerhalb von 24 Stunden. 💪");
handleForm("bookingForm","bookingNote","/api/booking","Top! Wir bestätigen deinen Termin telefonisch. 📅");

/* Mindestdatum der Buchung = heute */
var dateInput=document.getElementById("bookingDate");
if(dateInput){
  var t=new Date();var iso=t.toISOString().split("T")[0];
  dateInput.min=iso;
}

/* 11) Footer year */
var yearEl=document.getElementById("year");
if(yearEl)yearEl.textContent=new Date().getFullYear();

/* 12) Exit-intent popup (einmal pro Session) */
(function(){
  if(sessionStorage.getItem("exitShown"))return;
  var popup=document.getElementById("exitPopup");
  if(!popup)return;
  var closeBtn=document.getElementById("epClose");
  var skip=document.getElementById("epSkip");
  var cta=document.getElementById("epCta");
  var shown=false;
  function show(){
    if(shown||sessionStorage.getItem("exitShown"))return;
    shown=true;sessionStorage.setItem("exitShown","1");
    popup.classList.add("show");document.body.style.overflow="hidden";
  }
  function hide(){popup.classList.remove("show");document.body.style.overflow="";}
  if(closeBtn)closeBtn.addEventListener("click",hide);
  if(skip)skip.addEventListener("click",hide);
  if(cta)cta.addEventListener("click",hide);
  popup.addEventListener("click",function(e){if(e.target===popup)hide();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape")hide();});

  var triggered=false;
  document.addEventListener("mouseleave",function(e){
    if(!triggered&&e.clientY<=0){triggered=true;setTimeout(show,80);}
  });

  var formTouched=false;
  var contactForm=document.getElementById("contactForm");
  if(contactForm)contactForm.addEventListener("focusin",function(){formTouched=true;},{once:true});
  var mobileTimer=setTimeout(function(){
    if(!formTouched&&!sessionStorage.getItem("exitShown"))show();
  },45000);
  if(contactForm)contactForm.addEventListener("submit",function(){clearTimeout(mobileTimer);},{once:true});
})();

})();
