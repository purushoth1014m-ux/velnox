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
const heroImage='./media/handling-velnox-green.png';
const heroAlt='A forest-green reach stacker lifting a cargo container above a stack of containers';
const loadingClip='./media/handling-velnox-loading.mp4';
const LAST_FRAME=96;
const cargoTrack=[
  // Frame, container left, top, right, bottom, and ground height in the 960×540 video.
  [0,516,145,633,254,447],[26,470,109,668,230,447],
  [30,364,112,741,230,447],[33,258,114,773,230,447],
  [36,154,114,739,226,447],[39,120,114,705,226,447],
  [48,118,114,701,228,447],[51,118,119,701,233,447],
  [54,118,149,701,259,447],[57,118,184,701,294,447],
  [60,118,255,701,364,447],[63,118,280,701,390,447],
  [66,118,293,701,403,447],[72,118,293,701,403,447],
  [75,120,284,691,392,434],[78,127,264,670,367,405],
  [81,137,236,634,330,365],[82,140,226,618,317,351],
  [83,143,216,602,303,337],[84,146,192,586,276,303],
  [87,156,159,552,234,259],[90,158,146,539,218,241],
  [LAST_FRAME,158,146,539,218,241],
];
const driverTrack=[[42,995],[45,837],[48,808]];

function interpolateTrack(frame, track){
  const next=track.findIndex(([index])=>index>=frame);
  if(next<=0)return track[next===0?0:track.length-1].slice(1);
  const [start,...from]=track[next-1], [end,...to]=track[next];
  return from.map((value,i)=>value+(to[i]-value)*(frame-start)/(end-start));
}

export default function ScrollHero(){
  const hostRef=useRef(null);
  const [reduced,setReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),sync=()=>setReduced(q.matches);q.addEventListener('change',sync);return()=>q.removeEventListener('change',sync)},[]);
  useEffect(()=>{
    if(reduced)return;
    const host=hostRef.current,strip=host.querySelector('.vx-strip'),letters=host.querySelector('.vx-letters'),cards=[...host.querySelectorAll('.vx-category')];
    const art=host.querySelector('.vx-hero-art');
    const video=art.querySelector('video');
    let vw=innerWidth,vh=innerHeight,A=2.4,B=3,width=0,lettersWidth=0,disposed=false,phone=false;
    let requestedFrame=0;
    function seek(){
      const desired=(requestedFrame+.15)/24;
      if(video.readyState<1||video.seeking||Math.abs(video.currentTime-desired)<.02)return;
      video.currentTime=Math.min(desired,video.duration-.02);
    }
    function syncArtwork(){
      const frame=clamp(Math.floor(video.currentTime*24+.01),0,LAST_FRAME);
      const [left,top,right,bottom,ground]=interpolateTrack(frame,cargoTrack);
      const cargoWidth=right-left;
      const driverX=frame<=48?interpolateTrack(frame,driverTrack)[0]:right+cargoWidth*.19;
      const attributes={
        '--ground':ground,
        '--cargo-x':(left+right)/2/960*100+'%',
        '--cargo-y':(top+bottom)/2/ground*100+'%',
        '--cargo-width':cargoWidth,
        '--brand-opacity':clamp((frame-28)/6),
        '--driver-x':driverX/960*100+'%',
        '--driver-y':(ground-cargoWidth*.17)/ground*100+'%',
        '--driver-visible':Number(frame>=42),
        '--worker-visibility':clamp((73-frame)/5),
        '--signal-x':(52-43*clamp((frame-23)/19))+'%',
        '--inspect-x':(87+6*clamp((frame-24)/22))+'%',
      };
      Object.entries(attributes).forEach(([key,value])=>art.style.setProperty(key,value));
    }
    function onSeeked(){syncArtwork();seek()}
    const trackTop=()=>host.getBoundingClientRect().top+scrollY;
    const position=()=>clamp(scrollY-trackTop(),0,(A+B)*vh);
    function render(){
      const y=position(),q=clamp(y/(A*vh)),r=clamp((y-A*vh)/(B*vh));
      requestedFrame=Math.round(q*LAST_FRAME);
      seek();
      const settled=q>=1;host.classList.toggle('settled',settled);host.style.setProperty('--ph',settled?'1':'0');
      strip.style.transform=`translate3d(${vw-r*(width+.45*vw)}px,0,0)`;
      letters.style.transform=`translate3d(${vw-r*(lettersWidth+vw)}px,0,0)`;
      const transition=clamp((q-.75)/.25);
      host.style.setProperty('--scene-edge',`${phone?58-13*transition:93-48*transition}lvh`);
      cards.forEach(card=>{const x=card.getBoundingClientRect().left;card.style.setProperty('--s',(clamp((.98-x/vw)/.3,-.4,1.6)*100)+'%')});
    }
    function layout(){
      if(disposed)return;vw=document.documentElement.clientWidth;vh=innerHeight;phone=vw<768||vw<=vh;A=phone?1.55:2.4;host.classList.toggle('phone',phone);const u=phone?Math.min(vw/430,vh/760,1.4):Math.min(vw/1440,vh/960);host.style.setProperty('--u',u+'px');
      width=strip.scrollWidth;lettersWidth=letters.offsetWidth;B=(width+.45*vw)/vw*1.1;host.style.height=((1+A+B)*vh)+'px';
      render();host.classList.add('is-ready');
    }
    video.addEventListener('loadedmetadata',seek);
    video.addEventListener('seeked',onSeeked);
    syncArtwork();
    window.addEventListener('scroll',render,{passive:true});window.addEventListener('resize',layout,{passive:true});window.addEventListener('orientationchange',layout);
    layout();document.fonts.ready.then(()=>{if(!disposed)layout()});
    const nextButton=host.querySelector('.vx-next');const nextCategory=()=>{const item=cards.find(c=>c.getBoundingClientRect().left>.35*vw)||cards[0];const r=clamp((vw+item.offsetLeft-.12*vw)/(width+.45*vw));scrollTo({top:trackTop()+A*vh+r*B*vh,behavior:'instant'})};nextButton.addEventListener('click',nextCategory);
    return()=>{disposed=true;video.removeEventListener('loadedmetadata',seek);video.removeEventListener('seeked',onSeeked);window.removeEventListener('scroll',render);window.removeEventListener('resize',layout);window.removeEventListener('orientationchange',layout);nextButton.removeEventListener('click',nextCategory)};
  },[reduced]);
  if(reduced)return <section className="vx-static"><div className="container"><p className="eyebrow">Velnox Exports / Global possibilities</p><h1>Fresh produce.<br/><em>Global possibilities.</em></h1><p>Vegetables, fruits and broader product sourcing, shaped around your buyer requirements.</p><a className="pill" href="./products.html">Explore our products<ArrowUpRight size={16}/></a><img src={heroImage} alt={heroAlt} fetchPriority="high"/><div className="vx-static-links">{CATEGORIES.map(c=><a key={c.name} href={c.href}>{c.name}<ArrowUpRight size={15}/></a>)}</div></div></section>;
  return <section className="vx-scroll" ref={hostRef} aria-label="Velnox export handling and product categories">
    <div className="vx-scene">
      <div className="vx-hero-art">
        <div className="vx-loading-stage" role="img" aria-label="Workers guide a green VELNOX EXPORT container onto a black truck with a driver in the cab">
        <video className="vx-loading-video" src={loadingClip} poster={heroImage} muted playsInline preload="auto" aria-hidden="true"/>
        <span className="vx-cargo-brand" aria-hidden="true">VELNOX EXPORT</span>
        <span className="vx-truck-driver" aria-hidden="true">
          <span className="vx-driver-seat"/>
          <span className="vx-driver-shirt"/>
          <span className="vx-driver-face"/>
          <span className="vx-driver-wheel"/>
          <span className="vx-driver-arm"/>
        </span>
        {['signal','inspect'].map(role=><div key={role} className={`vx-worker vx-worker--${role}`} aria-hidden="true">
          <span className="vx-worker-leg vx-worker-leg--back"/>
          <span className="vx-worker-leg"/>
          <span className="vx-worker-body"/>
          <span className="vx-worker-head"/>
          <span className="vx-worker-helmet"/>
          <span className="vx-worker-arm"/>
        </div>)}
        </div>
      </div>
      <div className="vx-letters" aria-hidden="true">OUR PRODUCTS</div>
      <div className="vx-intro"><p>Velnox Exports</p><span>Fresh produce.<br/>Global possibilities.</span></div>
      <div className="vx-band"><div className="vx-strip"><div className="vx-lead"><h1>FRESH PRODUCE.<br/>GLOBAL<br/><span>POSSIBILITIES.</span></h1><div className="vx-lead-copy"><p>Vegetables, fruits and a broader range of products for your sourcing needs. Start with what your market needs.</p><p>Share your specification, quantity, packing preferences and destination. Availability and commercial terms are confirmed for each enquiry.</p><a href="./contact.html">Request a quote <ArrowUpRight size={14}/></a></div></div>{CATEGORIES.map((item,i)=><article key={item.name} className={`vx-category ${i===0?'first':''}`}><item.Icon aria-hidden="true"/><h2 className="vx-sweep">{item.title}</h2><p className="vx-sweep">{item.text}</p><a href={item.href} aria-label={`Explore ${item.name}`} className="vx-card-link">Explore products<ArrowUpRight size={13}/></a></article>)}</div><a className="vx-products-pill" href="./products.html">Explore all products <ArrowUpRight size={13}/></a></div>
      <div className="vx-scroll-hint"><span/>Scroll to discover</div><button type="button" className="vx-next">Next product category →</button>
    </div>
  </section>;
}
