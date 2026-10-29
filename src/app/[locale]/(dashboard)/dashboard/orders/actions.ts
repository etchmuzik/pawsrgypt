"use server";
import {createClient} from "@/lib/supabase/server";
import {revalidatePath} from "next/cache";
export async function changeOrderStatus(id:string,expected:string,status:string,locale:string) {
 if (!['en','ar'].includes(locale) || !/^[0-9a-f-]{36}$/i.test(id)) return {error:'Invalid order'};
 const client=await createClient();
 const {error}=await client.rpc('change_website_order_status' as never,{p_order_id:id,p_expected:expected,p_status:status} as never);
 if(error) return {error:error.message};
 revalidatePath(`/${locale}/dashboard/orders`); revalidatePath(`/${locale}/dashboard/orders/${id}`);
 revalidatePath(`/${locale}/dashboard`); return {ok:true};
}
