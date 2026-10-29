"use client";
import {useEffect,useState} from 'react';
import Link from 'next/link';
export function OrderNotifications({locale}:{locale:string}) {
 const [latest,setLatest]=useState<{id:string;order_number:string;user_id:string}|null>(null);const [alert,setAlert]=useState(false);const [available,setAvailable]=useState(false);const ar=locale==='ar';
 useEffect(()=>{let stopped=false;let busy=false;async function poll(){if(busy||document.visibilityState==='hidden')return;busy=true;try{const response=await fetch('/api/dashboard/order-alerts',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(stopped)return;setAvailable(true);if(!data.latest)return;setLatest({...data.latest,user_id:data.user_id});const key=`paws-last-order:${data.user_id}`;const seen=localStorage.getItem(key);if(seen!==data.latest.id)setAlert(true);}catch{}finally{busy=false;}}poll();const timer=setInterval(poll,30000);return()=>{stopped=true;clearInterval(timer);};},[]);
 function dismiss(){setAlert(false);if(latest)try{localStorage.setItem(`paws-last-order:${latest.user_id}`,latest.id);}catch{}}
 if(!available)return null;
 return <div className="mb-4 flex flex-wrap items-center gap-3 text-sm" aria-live="polite">{alert&&latest?<><Link className="rounded-lg bg-orange-100 px-4 py-2 font-semibold text-orange-900" href={`/${locale}/dashboard/orders/${latest.id}`}>{ar?'طلب موقع جديد':'New website order'}: {latest.order_number}</Link><button onClick={dismiss} className="underline">{ar?'تمت المشاهدة':'Mark seen'}</button></>:<Link className="text-paws-orange" href={`/${locale}/dashboard/orders`}>{ar?'تنبيهات الطلبات مفعّلة أثناء فتح لوحة الإدارة':'Order alerts active while dashboard is open'}</Link>}</div>;
}
