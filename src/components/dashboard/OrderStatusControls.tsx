"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {changeOrderStatus} from '@/app/[locale]/(dashboard)/dashboard/orders/actions';
export function OrderStatusControls({id,status,locale,blocked}:{id:string;status:string;locale:string;blocked:boolean}) {
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const router=useRouter(); const ar=locale==='ar';
 const next:Record<string,string[]>={pending:['confirmed','cancelled'],confirmed:['shipped','cancelled'],shipped:['delivered']};
 const labels:Record<string,string>={confirmed:ar?'تأكيد الطلب':'Confirm order',shipped:ar?'تم الشحن':'Mark shipped',delivered:ar?'تم التوصيل':'Mark delivered',cancelled:ar?'إلغاء الطلب':'Cancel order'};
 async function update(value:string) {if(!window.confirm(value==='cancelled'?(ar?'إلغاء هذا الطلب؟ لا يتم رد المبلغ تلقائيًا.':'Cancel this order? Any refund must be handled separately.'):(ar?'تأكيد تغيير حالة الطلب؟':'Confirm this order status change?')))return;setBusy(true);setError('');try{const result=await changeOrderStatus(id,status,value,locale);if(result.error)setError(result.error);else router.refresh();}catch{setError(ar?'تعذّر الحفظ. حاول مرة أخرى.':'Unable to save. Please retry.');}finally{setBusy(false);}}
 return <section className="my-5 rounded-2xl border bg-white p-5"><h2 className="font-semibold mb-3">{ar?'إدارة حالة الطلب':'Manage order status'}</h2><div className="flex flex-wrap gap-3">{(next[status]??[]).map(value=><button key={value} disabled={busy||(blocked&&value!=='cancelled')} onClick={()=>update(value)} className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40">{labels[value]}</button>)}</div>{blocked&&<p className="text-sm text-amber-700 mt-3">{ar?'الطلب تجريبي أو في انتظار تأكيد الدفع.':'This is a test order or is awaiting verified online payment.'}</p>}<p className="text-xs text-muted-foreground mt-3">{ar?'تغيير حالة التوصيل لا يغيّر الدفع أو المخزون ولا يصدر استردادًا.':'Fulfillment updates do not change payment or inventory and do not issue refunds.'}</p>{error&&<p role="alert" className="text-red-700 mt-3">{error}</p>}</section>;
}
