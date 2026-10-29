import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export async function GET(){
 const c=await createClient();const {data:{user}}=await c.auth.getUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const {data:p}=await c.from('profiles').select('role,is_active').eq('id',user.id).single();const profile=p as {role:string;is_active:boolean}|null;
 if(!profile?.is_active||!['admin','manager','cashier'].includes(profile.role))return NextResponse.json({error:'Forbidden'},{status:403});
 const {data,error}=await c.from('website_orders').select('id,order_number,created_at').not('order_number','like','TEST-%').order('created_at',{ascending:false}).order('id').limit(1);
 if(error)return NextResponse.json({error:'Unavailable'},{status:503});
 return NextResponse.json({user_id:user.id,latest:data?.[0]??null},{headers:{'Cache-Control':'no-store'}});
}
