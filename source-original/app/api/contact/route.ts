const REQUIRED=['name','email','subject','message'] as const;
const LIMITS={name:100,company:160,email:200,phone:50,category:100,subject:200,reply_method:50,message:5000,website:200} as const;
const ALLOWED_ORIGINS=new Set(['https://1116maehira-ai.github.io','https://kanehide-tekko.co.jp','https://www.kanehide-tekko.co.jp','https://kanehide-steel-review-oct10.neon-stork-9611.chatgpt.site']);
function clean(value:unknown,limit:number){return String(value??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').trim().slice(0,limit);}
function headers(request:Request){const h:Record<string,string>={'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'};const origin=request.headers.get('origin');if(origin&&ALLOWED_ORIGINS.has(origin)){h['access-control-allow-origin']=origin;h['access-control-allow-methods']='POST, GET, OPTIONS';h['access-control-allow-headers']='Content-Type';}return h;}
function reply(request:Request,body:unknown,status=200){return new Response(JSON.stringify(body),{status,headers:headers(request)});}
function allowed(request:Request){const origin=request.headers.get('origin');return !origin||ALLOWED_ORIGINS.has(origin);}
export async function OPTIONS(request:Request){return new Response(null,{status:allowed(request)?204:403,headers:headers(request)});}
export async function GET(request:Request){return reply(request,{ok:!!process.env.CONTACT_FORM_ENDPOINT,configured:!!process.env.CONTACT_FORM_ENDPOINT,method:'POST'});}
export async function POST(request:Request){
 if(!allowed(request))return reply(request,{ok:false,error:'このサイトからの送信は許可されていません。'},403);
 try{
  const raw=await request.json() as Record<string,unknown>;
  const data=Object.fromEntries(Object.entries(LIMITS).map(([key,limit])=>[key,clean(raw[key],limit)]));
  if(data.website)return reply(request,{ok:false,error:'送信内容を確認してください。'},400);
  if(REQUIRED.some(key=>!data[key]))return reply(request,{ok:false,error:'必須項目を入力してください。'},400);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return reply(request,{ok:false,error:'メールアドレスを確認してください。'},400);
  const endpoint=process.env.CONTACT_FORM_ENDPOINT;
  if(!endpoint)return reply(request,{ok:false,error:'送信先が設定されていません。'},503);
  const upstream=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(data),redirect:'follow',signal:AbortSignal.timeout(20000)});
  if(!upstream.ok)return reply(request,{ok:false,error:'送信サービスに接続できませんでした。'},502);
  let result:{ok?:boolean};
  try{result=await upstream.json();}catch{return reply(request,{ok:false,error:'送信サーバーの応答を確認できませんでした。'},502);}
  if(result.ok!==true)return reply(request,{ok:false,error:'送信サーバーが完了を確認できませんでした。'},502);
  return reply(request,{ok:true});
 }catch{return reply(request,{ok:false,error:'送信に失敗しました。時間を置いて再度お試しください。'},500);}
}
