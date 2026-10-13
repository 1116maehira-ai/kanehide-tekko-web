const REQUIRED=['name','email','subject','message'] as const;
const LIMITS={name:100,company:160,email:200,phone:50,category:100,subject:200,reply_method:50,message:5000,website:200} as const;

function clean(value:unknown,limit:number){return String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,limit);}
function reply(body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});}

export async function POST(request:Request){
  try{
    const raw=await request.json() as Record<string,unknown>;
    const data=Object.fromEntries(Object.entries(LIMITS).map(([key,limit])=>[key,clean(raw[key],limit)]));
    if(data.website)return reply({ok:true});
    if(REQUIRED.some(key=>!data[key]))return reply({ok:false,error:'必須項目を入力してください。'},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return reply({ok:false,error:'メールアドレスを確認してください。'},400);
    const endpoint=process.env.CONTACT_FORM_ENDPOINT;
    if(!endpoint)return reply({ok:false,error:'送信先が設定されていません。'},503);
    const upstream=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(data),redirect:'follow'});
    if(!upstream.ok)return reply({ok:false,error:'送信サービスに接続できませんでした。'},502);
    const text=await upstream.text();
    let result:{ok?:boolean}={};
    try{result=JSON.parse(text);}catch{result={ok:true};}
    if(result.ok===false)return reply({ok:false,error:'送信に失敗しました。'},502);
    return reply({ok:true});
  }catch(error){console.error('contact form error',error);return reply({ok:false,error:'送信に失敗しました。'},500);}
}
