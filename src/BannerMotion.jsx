import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Leaf, Package, FileText, Send, Globe2 } from 'lucide-react';
import { products } from './products';
import './banner-motion.css';

// Decorative banner scenes do not communicate state needed to use the website.
export function BannerMotion({page}) {
  const host=useRef(null);
  useEffect(()=>{const el=host.current;if(!('IntersectionObserver'in window)){el.classList.add('motion-active');return;}const observer=new IntersectionObserver(([entry])=>el.classList.toggle('motion-active',entry.isIntersecting),{threshold:.1});observer.observe(el);return()=>observer.disconnect()},[]);
  const type={'Our Products':'products','Quality & Packaging':'quality','Buyer Resources':'resources','Contact Us':'contact'}[page]||'products';
  return <div className={`banner-motion banner-${type}`} ref={host} aria-hidden="true">
    <span className="motion-coordinate coordinate-left">VELNOX / {type.toUpperCase()}</span>
    {type==='products'&&<>
      <div className="produce-halo"/><div className="produce-orbit"/>
      <div className="produce-card produce-back"><img src="./images/chilli.jpg" alt=""/><span>01 / VEGETABLES</span></div>
      <div className="produce-card produce-main"><img src="./images/mango.jpg" alt=""/><span>02 / FRUITS</span></div>
      <div className="produce-card produce-front"><img src="./images/spices.jpg" alt=""/><span>03 / MORE TO SOURCE</span></div>
      <span className="motion-badge produce-badge"><Leaf size={13}/>A growing collection<ArrowUpRight size={13}/></span>
      <span className="motion-caption">Colour. Character. Possibility.</span>
    </>}
    {type==='quality'&&<>
      <div className="packing-grid"/>
      <svg className="packing-svg" viewBox="0 0 420 310" fill="none">
        <path className="packing-measure" d="M50 240 194 320M370 240 226 320M380 135v85"/>
        <path className="packing-interior" d="m65 130 145-80 145 80-145 80Z"/>
        <path className="box-seam" d="M210 50v160"/>
        <g transform="translate(65 130) rotate(28.9)">
          <path className="packing-flap packing-flap-left" d="M0 0h166l-85-32H-86Z"/>
        </g>
        <g transform="translate(210 210) rotate(-28.9)">
          <path className="packing-flap packing-flap-right" d="M0 0h166l86-32H86Z"/>
        </g>
        {['chilli','onion','banana'].map((product,index)=><g key={product} className="packing-product-card" style={{'--packing-delay':`${index*1.55}s`}}>
          <rect x="-54" y="-53" width="108" height="106" rx="2" fill="#f8f5e9"/>
          <image href={`./images/${product}.jpg`} x="-49" y="-48" width="98" height="82" preserveAspectRatio="xMidYMid slice"/>
          <text x="0" y="46" textAnchor="middle" fill="#607755" fontSize="6.4" letterSpacing=".55">{product.toUpperCase()}</text>
        </g>)}
        <path className="packing-wall packing-wall-left" d="m65 130 145 80v90L65 220Z"/>
        <path className="packing-wall packing-wall-right" d="m210 210 145-80v90l-145 80Z"/>
        <g className="packing-closed-lid">
          <path d="m65 130 145-80 145 80-145 80Z"/>
          <path className="box-seam" d="m138 90 145 80"/>
        </g>
        <path className="packing-check" d="m180 246 18 17 32-38"/>
      </svg>
      <div className="quality-stages"><span>01 / Specify</span><span>02 / Pack</span><span>03 / Confirm</span></div>
      <span className="motion-caption">Consider every detail.</span>
    </>}
    {type==='resources'&&<>
      <svg className="resource-route" viewBox="0 0 420 360" fill="none"><path d="M22 235c-18-100 90-178 213-151S434 240 342 292s-214-10-192-77"/></svg>
      <div className="resource-sheet sheet-shadow"/>
      <div className="resource-sheet sheet-front"><FileText className="sheet-icon" size={24} strokeWidth={1}/><span className="sheet-kicker">THE BUYER’S BRIEF</span><strong>A better brief.<br/>A clearer start.</strong><div className="sheet-checks">{['Product specification','Quantity & destination','Packing requirements'].map((text,i)=><div key={text} style={{'--step':i}}><Check size={14}/><span>{text}</span></div>)}</div><span className="sheet-footer">PREPARE / REVIEW / ENQUIRE</span></div>
      <span className="resource-note"><span>01</span>Know what to include.</span>
      <span className="motion-caption">A little clarity goes a long way.</span>
    </>}
    {type==='contact'&&<>
      <div className="contact-orbit orbit-outer"/><div className="contact-orbit orbit-inner"/>
      <svg className="contact-routes" viewBox="0 0 420 360" fill="none"><path d="M35 250Q95 45 220 125T385 105"/><path d="M65 90Q320 35 335 280"/></svg>
      <span className="contact-node node-a"><Globe2 size={19} strokeWidth={1}/></span><span className="contact-node node-b"><Package size={20} strokeWidth={1}/></span>
      <div className="message-card"><span className="message-icon"><Send size={23} strokeWidth={1.1}/></span><span className="sheet-kicker">START A CONVERSATION</span><strong>Your requirement.<br/><em>Our starting point.</em></strong><div className="message-fields"><span>Product</span><span>Quantity</span><span>Destination</span></div><span className="message-bottom">A clear brief opens the conversation.<ArrowUpRight size={14}/></span></div>
      <span className="motion-caption">From your market to our next conversation.</span>
    </>}
  </div>;
}

function AnimatedNumber({value,start,reduced}){
  const[number,setNumber]=useState(value);
  useEffect(()=>{if(!start||reduced){setNumber(value);return}let raf;const began=performance.now();setNumber(0);const animate=now=>{const progress=Math.min(1,(now-began)/1400),ease=1-Math.pow(1-progress,3);setNumber(Math.round(value*ease));if(progress<1)raf=requestAnimationFrame(animate)};raf=requestAnimationFrame(animate);return()=>cancelAnimationFrame(raf)},[value,start,reduced]);
  return <><span aria-hidden="true">{String(number).padStart(2,'0')}</span><span className="sr-only">{value}</span></>;
}

export function ContactCounters(){
  const ref=useRef(null);const[start,setStart]=useState(false),[reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches);query.addEventListener('change',change);if(!('IntersectionObserver'in window)){setStart(true);return()=>query.removeEventListener('change',change)}const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setStart(true);observer.disconnect()}},{threshold:.3});observer.observe(ref.current);return()=>{observer.disconnect();query.removeEventListener('change',change)}},[]);
  const countGroups=new Set(products.map(item=>item[1])).size;
  const metrics=[{value:products.length,label:'Catalogue enquiry options',note:'Products to start exploring.'},{value:countGroups,label:'Sourcing groups',note:'Vegetables, fruits & other sourcing.'},{value:4,label:'Brief essentials',note:'Product, quantity, destination & packing.'}];
  return <section className="contact-counter-section" ref={ref} aria-labelledby="counter-heading"><div className="container contact-counter-grid"><div className="counter-intro"><span>THE STARTING POINT</span><h2 id="counter-heading">A little detail.<br/><em>A clearer enquiry.</em></h2><p>Explore the collection, then tell us what your market needs.</p></div>{metrics.map(metric=><div key={metric.label} className="counter-metric"><strong><AnimatedNumber value={metric.value} start={start} reduced={reduced}/></strong><h3>{metric.label}</h3><p>{metric.note}</p></div>)}</div></section>;
}
