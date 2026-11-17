import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Carrot, Apple, Sprout, Wheat, Package } from 'lucide-react';
import './scroll-hero.css';

const CATEGORIES = [
  { title: <>Fresh<br/>vegetables</>, name: 'Fresh vegetables', Icon: Carrot, text: 'Enquire about onions, okra, chillies, roots and other vegetables. Share your variety, grade and quantity.', href:'./products.html?category=Vegetables' },
  { title: <>Fresh<br/>fruits</>, name: 'Fresh fruits', Icon: Apple, text: 'Discuss seasonal availability, preferred varieties, maturity and pack formats for your destination.', href:'./products.html?category=Fruits' },
  { title: <>Spices &<br/>ingredients</>, name: 'Spices', Icon: Sprout, text: 'Whole or processed product enquiries by specification, grade, intended use and packing requirements.', href:'./products.html?category=Other&search=spices' },
  { title: <>Rice &<br/>pulses</>, name: 'Rice and pulses', Icon: Wheat, text: 'Send your exact product type, grade, quantity and packaging needs for a sourcing feasibility review.', href:'./products.html?category=Other&search=rice' },
  { title: <>Other<br/>products</>, name: 'Other products', Icon: Package, text: 'Coconut products and custom sourcing enquiries. Tell us what your market needs and start the conversation.', href:'./products.html?category=Other' },
];
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));

/** Scroll-native hero; all handling movement is in the supplied clip. */
export default function ScrollHero(){
  const hostRef=useRef(null);
  const [reduced,setReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduced(q.matches);q.addEventListener('change',sync);return()=>q.removeEventListener('change',sync)},[]);
  useEffect(()=>{
    if(reduced)return;
    const host=hostRef.current,scene=host.querySelector('.vx-scene'),video=host.querySelector('video'),strip=host.querySelector('.vx-strip'),letters=host.querySelector('.vx-letters'),cards=[...host.querySelectorAll('.vx-category')];
    const A=2.4;
    let vw=innerWidth,vh=innerHeight,B=3,width=0,lettersWidth=0,videoTop=0,videoHeight=0,cur=0,target=0,ready=false,source='',raf=0,disposed=false;
    const trackTop=()=>host.getBoundingClientRect().top+scrollY;
    const position=()=>clamp(scrollY-trackTop(),0,(A+B)*vh);
    function render(){
      const y=position(),q=clamp(y/(A*vh)),r=clamp((y-A*vh)/(B*vh));
      target=q*((Number.isFinite(video.duration)?video.duration:4.041667)-1/48);
      const settled=q>=.94;host.classList.toggle('settled',settled);host.style.setProperty('--ph',settled?'1':'0');
      strip.style.transform=`translate3d(${vw-r*(width+.45*vw)}px,0,0)`;
      letters.style.transform=`translate3d(${vw-r*(lettersWidth+vw)}px,0,0)`;
      const edgeRatio=.829-(.829-.448)*clamp((video.currentTime-3.1)/.65);
      host.style.setProperty('--scene-edge',(videoTop+edgeRatio*videoHeight)+'px');
      cards.forEach(card=>{const x=card.getBoundingClientRect().left;card.style.setProperty('--s',(clamp((.98-x/vw)/.3,-.4,1.6)*100)+'%')});
    }
    function seek(){if(disposed||!ready||video.seeking)return;const time=clamp(cur,0,Math.max(0,video.duration-1/48));if(Math.abs(video.currentTime-time)>1/60){try{video.currentTime=time}catch{}}}
    function layout(){
      if(disposed)return;vw=document.documentElement.clientWidth;vh=innerHeight;const phone=vw<768||vw<=vh;host.classList.toggle('phone',phone);const u=phone?Math.min(vw/430,1.4):Math.min(vw/1440,vh/960);host.style.setProperty('--u',u+'px');
      let w,h,x;if(phone){w=1.55*vw;h=w*1080/1920;x=.5*vw-.4*w;videoTop=.36*vh-.448*h}else{const scale=Math.max(vw/1920,vh/1080);w=1920*scale;h=1080*scale;x=(vw-w)/2;videoTop=(vh-h)/2}
      videoHeight=h;Object.assign(video.style,{width:w+'px',height:h+'px',left:x+'px',top:videoTop+'px'});host.style.setProperty('--edge',(videoTop+.448*h)+'px');
      width=strip.scrollWidth;lettersWidth=letters.offsetWidth;B=(width+.45*vw)/vw*1.1;host.style.height=((1+A+B)*vh)+'px';
      const next=vw<=900?'./media/handling-720.mp4':'./media/handling-1080.mp4';if(source!==next){ready=false;source=next;video.src=next;video.load();setFailed(false)}render();host.classList.add('is-ready');
    }
    function frame(){if(disposed)return;render();cur+=(target-cur)*.2;seek();raf=requestAnimationFrame(frame)}
    const metadata=()=>{ready=true;render();seek()},error=()=>setFailed(true);
    video.addEventListener('loadedmetadata',metadata);video.addEventListener('seeked',seek);video.addEventListener('error',error);window.addEventListener('resize',layout,{passive:true});window.addEventListener('orientationchange',layout);
    layout();document.fonts.ready.then(()=>{if(!disposed)layout()});raf=requestAnimationFrame(frame);
    const nextButton=host.querySelector('.vx-next');const nextCategory=()=>{const item=cards.find(c=>c.getBoundingClientRect().left>.35*vw)||cards[0];const r=clamp((vw+item.offsetLeft-.12*vw)/(width+.45*vw));scrollTo({top:trackTop()+A*vh+r*B*vh,behavior:'instant'})};nextButton.addEventListener('click',nextCategory);
    return()=>{disposed=true;cancelAnimationFrame(raf);window.removeEventListener('resize',layout);window.removeEventListener('orientationchange',layout);video.removeEventListener('loadedmetadata',metadata);video.removeEventListener('seeked',seek);video.removeEventListener('error',error);nextButton.removeEventListener('click',nextCategory);video.removeAttribute('src');video.load()};
  },[reduced]);
  if(reduced)return <section className="vx-static"><div className="container"><p className="eyebrow">Velnox Exports / Global possibilities</p><h1>Fresh produce.<br/><em>Global possibilities.</em></h1><p>Vegetables, fruits and broader product sourcing, shaped around your buyer requirements.</p><a className="pill" href="./products.html">Explore our products<ArrowUpRight size={16}/></a><img src="./media/handling-poster.jpg" alt="Illustrative container-handling scene"/><div className="vx-static-links">{CATEGORIES.map(c=><a key={c.name} href={c.href}>{c.name}<ArrowUpRight size={15}/></a>)}</div><p className="vx-static-note">Reduced-motion view. Logistics imagery is illustrative; it does not represent Velnox-owned equipment.</p></div></section>;
  return <section className="vx-scroll" ref={hostRef} aria-label="Velnox export handling and product story">
    <div className="vx-scene">
      <video className="vx-video" muted playsInline preload="auto" disablePictureInPicture poster="./media/handling-poster.jpg" aria-label="Illustrative reach-stacker loading a container onto a truck"/>
      <div className="vx-letters" aria-hidden="true">OUR PRODUCTS</div>
      <div className="vx-intro"><p>Velnox Exports</p><span>Fresh produce.<br/>Global possibilities.</span></div>
      <div className="vx-band"><div className="vx-strip"><div className="vx-lead"><h1>FRESH PRODUCE.<br/>GLOBAL<br/><span>POSSIBILITIES.</span></h1><div className="vx-lead-copy"><p>Vegetables, fruits and a broader range of products for your sourcing needs. Start with what your market needs.</p><p>Share your specification, quantity, packing preferences and destination. Availability and commercial terms are confirmed for each enquiry.</p><a href="./contact.html">Request a quote <ArrowUpRight size={14}/></a></div></div>{CATEGORIES.map((item,i)=><article key={item.name} className={`vx-category ${i===0?'first':''}`}><item.Icon aria-hidden="true"/><h2 className="vx-sweep">{item.title}</h2><p className="vx-sweep">{item.text}</p><a href={item.href} aria-label={`Explore ${item.name}`} className="vx-card-link">Explore products<ArrowUpRight size={13}/></a></article>)}</div><a className="vx-products-pill" href="./products.html">Explore all products <ArrowUpRight size={13}/></a><p className="vx-logistics-note">Illustrative logistics footage</p></div>
      <div className="vx-scroll-hint"><span/>Scroll to discover</div><button type="button" className="vx-next">Next product category →</button>{failed&&<p className="vx-media-error" role="status">The handling clip could not load. Continue scrolling to explore our products.</p>}
    </div>
  </section>;
}
