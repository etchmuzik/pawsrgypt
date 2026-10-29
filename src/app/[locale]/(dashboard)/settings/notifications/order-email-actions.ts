"use server";
import {createClient} from '@/lib/supabase/server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
export async function saveOrderEmail(recipient:string,enabled:boolean,locale:string){
 const parsed=z.object({recipient:z.union([z.email().max(254),z.literal('')]),enabled:z.boolean()}).safeParse({recipient:recipient.trim(),enabled});
 if(!parsed.success||(enabled&&!parsed.data.recipient))return {error:'Enter a valid notification email.'};
 const c=await createClient();const {data:{user}}=await c.auth.getUser();if(!user)return {error:'Not authorized'};
 const {data:p}=await c.from('profiles').select('role,is_active').eq('id',user.id).single();const profile=p as {role:string;is_active:boolean}|null;
 if(!profile?.is_active||!['admin','manager'].includes(profile.role))return {error:'Not authorized'};
 const {data,error}=await c.from('website_order_notification_settings' as never).update({...parsed.data,updated_at:new Date().toISOString()} as never).eq('id',true).select('id');
 if(error||!data?.length)return {error:'Unable to save order email settings'};
 revalidatePath(`/${locale==='ar'?'ar':'en'}/settings/notifications`);return {ok:true};
}
