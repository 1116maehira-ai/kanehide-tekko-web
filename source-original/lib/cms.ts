import { env } from 'cloudflare:workers';
import seeds from './seed-posts.json';
const E=()=>env as any;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers});
export function editor(request:Request){
 const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();
 const id=request.headers.get('oai-authenticated-user-id');
 const allowed=String(E().CMS_EDITOR_EMAILS||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
 return id&&email&&allowed.includes(email)?{id,email}:null;
}
const db=()=>{if(!E().DB)throw new Error('DB unavailable');return E().DB;};
const decode=(row:any)=>({...row,content:JSON.parse(row.content),project:JSON.parse(row.project)});
export async function allPosts(){
 const {results}=await db().prepare('SELECT * FROM posts ORDER BY published_at DESC LIMIT 3000').all();
 const map=new Map((seeds as any[]).map(p=>[p.id,p]));
 for(const row of results)map.set(row.id,decode(row));
 return [...map.values()].sort((a:any,b:any)=>b.published_at.localeCompare(a.published_at));
}
export const publicPosts=async()=> (await allPosts()).filter((p:any)=>p.status==='published');
function text(v:any,max:number){return String(v??'').trim().slice(0,max);}
function safeURL(value:any){const s=text(value,2048);if(!s)return '';if(/^\/assets\/[a-zA-Z0-9_./-]+$/.test(s)||/^\/api\/media\/[a-zA-Z0-9.-]+$/.test(s))return s;try{const u=new URL(s);return u.protocol==='https:'?u.href:'';}catch{return '';}}
function validate(p:any){
 const title=text(p.title,180),kind=p.kind==='project'?'project':'news';
 const division=['steel','bridge','frp','pile'].includes(p.division)?p.division:null;
 const status=['draft','published','archived'].includes(p.status)?p.status:'draft';
 const date=text(p.published_at,10);
 if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date)))throw new Error('タイトルと掲載日を入力してください。');
 if(kind==='project'&&!division)throw new Error('施工実績の分野を選んでください。');
 const content=(Array.isArray(p.content)?p.content:[]).slice(0,150).map((b:any)=> b.type==='image'?{type:'image',url:safeURL(b.url),text:text(b.text,500)}:b.type==='heading'?{type:'heading',text:text(b.text,200)}:b.type==='link'?{type:'link',url:safeURL(b.url),text:text(b.text,200)}:{type:'paragraph',text:text(b.text,12000)}).filter((b:any)=>b.type==='image'?b.url:b.text);
 if(status==='published'&&!content.length)throw new Error('公開する記事の本文または写真を追加してください。');
 const q=p.project||{};
 return {title,kind,division:kind==='project'?division:null,status,published_at:date,category:kind==='project'?'施工実績':text(p.category||'お知らせ',40),excerpt:text(p.excerpt,600),content,cover:safeURL(p.cover),project:{location:text(q.location,160),year:text(q.year,40),scope:text(q.scope,800),client:text(q.client,160)},source_url:safeURL(p.source_url),migration_status:['summary','imported','reviewed'].includes(p.migration_status)?p.migration_status:'original',legacy_index:Number.isInteger(p.legacy_index)?p.legacy_index:null};
}
async function save(p:any,user:any){
 const clean=validate(p);const id=/^[a-zA-Z0-9-]{1,80}$/.test(p.id||'')?p.id:crypto.randomUUID();
 const row=await db().prepare('SELECT * FROM posts WHERE id=?').bind(id).first();
 const now=new Date().toISOString(), revision=row?row.revision+1:1;
 if(row&&Number(p.revision)!==row.revision)return json({error:'別の更新が保存されています。一覧から開き直して内容を確認してください。'},409);
 if(!row&&Number(p.revision||0)!==0)return json({error:'記事の版が一致しません。開き直してください。'},409);
 const values=[clean.title,clean.kind,clean.category,clean.division,clean.status,clean.published_at,clean.excerpt,JSON.stringify(clean.content),clean.cover,JSON.stringify(clean.project),clean.source_url,clean.migration_status,clean.legacy_index,revision,now,user.email];
 const change=row?db().prepare('UPDATE posts SET title=?,kind=?,category=?,division=?,status=?,published_at=?,excerpt=?,content=?,cover=?,project=?,source_url=?,migration_status=?,legacy_index=?,revision=?,updated_at=?,updated_by=? WHERE id=? AND revision=?').bind(...values,id,row.revision):db().prepare('INSERT INTO posts(title,kind,category,division,status,published_at,excerpt,content,cover,project,source_url,migration_status,legacy_index,revision,updated_at,updated_by,id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...values,id,now);
 // Historical copies are retained for recovery; archive is reversible, no deletion API.
 const results=await db().batch([change,db().prepare('INSERT INTO revisions(id,post_id,snapshot,created_at,actor) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),id,JSON.stringify(row?decode(row):{...clean,id,revision}),now,user.email)]);
 if(!results[0].meta.changes)return json({error:'保存が競合しました。開き直してください。'},409);
 return json({post:{...clean,id,revision,updated_at:now,created_at:row?.created_at||now,updated_by:user.email}});
}
async function upload(request:Request,user:any){
 if(Number(request.headers.get('content-length')||0)>11*1024*1024)return json({error:'画像は10MB以内で選択してください。'},413);
 const form=await request.formData(),file=form.get('file');
 if(!(file instanceof File)||file.size>10*1024*1024||!file.size)return json({error:'画像は10MB以内で選択してください。'},400);
 const bytes=new Uint8Array(await file.arrayBuffer());let mime='',ext='';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';ext='jpg';}
 else if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){mime='image/png';ext='png';}
 else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP'){mime='image/webp';ext='webp';}
 if(!mime)return json({error:'JPEG・PNG・WebPの画像を選択してください。'},400);
 const id=crypto.randomUUID()+'.'+ext;
 if(!E().BUCKET)throw new Error('Image storage unavailable');
 await E().BUCKET.put(id,bytes,{httpMetadata:{contentType:mime}});
 await db().prepare('INSERT INTO media(id,mime,name,created_at,owner) VALUES(?,?,?,?,?)').bind(id,mime,text(file.name,180),new Date().toISOString(),user.email).run();
 return json({url:'/api/media/'+id,name:file.name});
}
export async function serveMedia(request:Request,id:string){
 if(!/^[a-zA-Z0-9.-]+$/.test(id))return new Response('Not found',{status:404});
 if(!editor(request)){
  const used=await db().prepare("SELECT id FROM posts WHERE status='published' AND (instr(cover,?)>0 OR instr(content,?)>0) LIMIT 1").bind('/api/media/'+id,'/api/media/'+id).first();
  if(!used)return new Response('Not found',{status:404});
 }
 const obj=await E().BUCKET.get(id);if(!obj)return new Response('Not found',{status:404});
 return new Response(obj.body,{headers:{'Content-Type':obj.httpMetadata?.contentType||'application/octet-stream','Cache-Control':'private, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff'}});
}
export async function cmsAPI(request:Request,path:string){
 try{
  const user=editor(request);if(!user)return json({error:'管理者としてログインしてください。'},403);
  if(request.method!=='GET'&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'送信元を確認できません。ページを開き直してください。'},403);
  if(request.method==='GET'&&path==='posts')return json({posts:await allPosts(),user:user.email,archiveComplete:false});
  if(request.method==='GET'&&path==='export')return json({format:'kanehide-blog-v1',posts:await allPosts()});
  if(request.method==='POST'&&path==='upload')return await upload(request,user);
  if(request.method==='POST'&&path==='posts'){
   if(Number(request.headers.get('content-length')||0)>2*1024*1024)return json({error:'記事の容量が大きすぎます。'},413);
   return await save(await request.json(),user);
  }
  if(request.method==='POST'&&path==='import'){
   const body=await request.json() as any;const list=body.posts;if(!Array.isArray(list)||list.length>100)return json({error:'一度に100記事まで取り込めます。'},400);
   const existing=await allPosts();let added=0,skipped=0;
   for(const p of list){if(p.source_url&&existing.some((x:any)=>x.source_url===p.source_url&&x.migration_status!=='summary')){skipped++;continue;}
    const old=existing.find((x:any)=>x.id===p.id||(x.source_url&&x.source_url===p.source_url));
    const r=await save({...p,id:old?.id,revision:old?.revision||0,legacy_index:old?.legacy_index??null,status:'draft',migration_status:'imported'},user);if(!r.ok)return r;added++;
   }
   return json({added,skipped});
  }
  return json({error:'見つかりません。'},404);
 }catch(e:any){console.error('CMS request failed',e?.message);return json({error:e?.message?.match(/入力|選んで|追加して/)?e.message:'保存・読み込みに失敗しました。入力内容を残したまま、もう一度お試しください。'},500);}
}
