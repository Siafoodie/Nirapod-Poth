import React,{useEffect,useRef,useState}from'react';
import{Phone,MessageSquare,Crosshair,Users,CheckCircle2,X}from'lucide-react';
import Layout from'../components/Layout';
import{Row}from'../components/UI';

const mapsLink=(p)=>`https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;

export default function Emergency(){
  const timer=useRef(null);
  const [holding,setHolding]=useState(false);
  const [active,setActive]=useState(false);
  const [locationLink,setLocationLink]=useState('');
  const [status,setStatus]=useState('');

  useEffect(()=>()=>clearTimeout(timer.current),[]);

  const getLocation=(done)=>{
    if(!navigator.geolocation){setStatus('SOS activated. Location is not supported on this device.');done?.('');return;}
    navigator.geolocation.getCurrentPosition(
      p=>{const link=mapsLink(p);setLocationLink(link);setStatus('Location captured successfully.');done?.(link)},
      ()=>{setStatus('SOS activated. Location permission was unavailable.');done?.('')},
      {enableHighAccuracy:true,timeout:8000,maximumAge:30000}
    );
  };

  const activateSOS=()=>{
    setHolding(false);setActive(true);setStatus('SOS ACTIVATED — preparing emergency options...');
    getLocation();
  };
  const start=()=>{if(active)return;setHolding(true);clearTimeout(timer.current);timer.current=setTimeout(activateSOS,3000)};
  const stop=()=>{if(active)return;setHolding(false);clearTimeout(timer.current)};
  const sms=(text)=>{location.href=`sms:?body=${encodeURIComponent(text)}`};
  const sendLocation=()=>getLocation(link=>sms(`EMERGENCY! I need help.${link?` My current location: ${link}`:''}`));
  const shareLocation=()=>getLocation(async link=>{if(!link)return;try{await navigator.clipboard.writeText(link);setStatus('Location link copied. You can now share it.')}catch{setStatus(`Location: ${link}`)}});
  const alertContacts=()=>getLocation(link=>sms(`Emergency alert from Nirapod Poth. I need help.${link?` My location: ${link}`:''}`));

  return <Layout title="Emergency" menu>
    <div className="emergency-banner"><h1>Emergency<br/>support</h1></div>

    <div className={`sos ${holding?'holding':''} ${active?'activated':''}`}
      onMouseDown={start} onMouseUp={stop} onMouseLeave={stop}
      onTouchStart={start} onTouchEnd={stop} onTouchCancel={stop}>
      <b>{active?'✓':'SOS'}</b><span>{active?'ACTIVATED':holding?'KEEP HOLDING...':'HOLD 3 SECONDS'}</span>
      {holding&&!active&&<i className="sos-progress"/>}
    </div>

    {(active||status)&&<div className={`sos-status ${active?'success':''}`}>
      <div>{active?<CheckCircle2/>:<X/>}<strong>{active?'SOS ACTIVATED':'SOS STATUS'}</strong></div>
      <p>{status}</p>{locationLink&&<small>Current location is ready to share.</small>}
    </div>}

    {active&&<div className="sos-actions">
      <button className="sos-call" onClick={()=>location.href='tel:999'}><Phone/> Call 999 Now</button>
      <button onClick={sendLocation}><MessageSquare/> Send Emergency SMS</button>
      <button onClick={alertContacts}><Users/> Alert Trusted Contacts</button>
    </div>}

    <h3>Emergency Actions</h3><div className="stack">
      <Row icon={<Phone/>} onClick={()=>location.href='tel:999'}>Call Emergency Service</Row>
      <Row icon={<MessageSquare/>} onClick={sendLocation}>Send Location via SMS</Row>
      <Row icon={<Crosshair/>} onClick={shareLocation}>Share Live Location</Row>
      <Row icon={<Users/>} onClick={alertContacts}>Alert Trusted Contacts</Row>
    </div>

    <h3>Offline Helplines</h3>
    <Row right={<button className="call-now" onClick={e=>{e.stopPropagation();location.href='tel:999'}}>Call Now</button>} onClick={()=>location.href='tel:999'}><b>999</b>　 National Emergency</Row>
    <Row right={<button className="call-now" onClick={e=>{e.stopPropagation();location.href='tel:109'}}>Call Now</button>} onClick={()=>location.href='tel:109'}><b>109</b>　 Women & Child Helpline</Row>
    <p className="offline-note">Works without internet. On a phone, tapping Call Now opens the dialer with the number ready.</p>
  </Layout>
}