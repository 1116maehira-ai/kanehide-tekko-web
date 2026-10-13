import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const endpoint='https://kanehide-steel-review-oct10.neon-stork-9611.chatgpt.site/api/contact';
export const handler=`function setupContactForm(){
 const form=$('#contact-form');if(!form)return;
 const status=$('#contact-status'),button=form.querySelector('button[type="submit"]');
 button.disabled=false;
 window.addEventListener('pageshow',()=>{button.disabled=false;button.querySelector('span').textContent='入力内容を送信する';});
 form.addEventListener('submit',async e=>{
  e.preventDefault();status.textContent='';status.className='contact-status';
  for(const key of ['name','email','subject','message'])form.elements.namedItem(key).value=form.elements.namedItem(key).value.trim();
  const phone=form.elements.namedItem('phone');phone.setCustomValidity('');
  if(form.elements.namedItem('reply_method').value==='電話'&&!phone.value.trim())phone.setCustomValidity('電話での回答をご希望の場合は電話番号をご入力ください。');
  if(!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));if(data.website||button.disabled)return;
  const cfg=window.KANEHIDE_CONFIG||{},controller=new AbortController();
  button.disabled=true;button.querySelector('span').textContent='送信中…';status.textContent='送信しています。画面を閉じずにお待ちください。';
  const timer=setTimeout(()=>controller.abort(),30000);
  try{
   const response=await fetch(cfg.contactEndpoint||'${endpoint}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
   let result;try{result=await response.json();}catch{throw new Error('送信結果を確認できませんでした。');}
   if(!response.ok||result.ok!==true)throw new Error(result.error||'送信に失敗しました。');
   location.assign(new URL('contact-thanks.html',location.href).href);
  }catch(error){status.className='contact-status error';status.textContent=(error.name==='AbortError'?'送信結果を確認できませんでした。重複送信を避けるため、お電話で状況をご確認ください。':error.message+' 入力内容は残っています。お電話でもお問い合わせいただけます。');button.disabled=false;button.querySelector('span').textContent='入力内容を送信する';}
  finally{clearTimeout(timer);}
 });
}
`;
function markup(s){
 s=s.replace('下記フォームへご入力ください。内容をメールアプリで開きますので、メールアプリから送信してください。','下記フォームへ必要事項をご入力ください。担当者が内容を確認し、折り返しご連絡いたします。')
 .replace('下記フォームへ必要事項をご入力ください。送信時に迷惑メール対策の確認画面へ移動します。担当者が内容を確認し、折り返しご連絡いたします。','下記フォームへ必要事項をご入力ください。担当者が内容を確認し、折り返しご連絡いたします。')
 .replaceAll('メールアプリで送信する','入力内容を送信する')
 .replaceAll('入力内容をお問い合わせへの回答に利用すること、および外部フォームサービス（FormSubmit）を通じて送信することに同意します。','入力内容を確認し、個人情報をお問い合わせへの回答に利用することに同意します。')
 .replace(/<input type="hidden" name="_(?:cc|template|subject|next)"[^>]*>/g,'')
 .replace(/<form id="contact-form" class="contact-form"[^>]*>/,'<form id="contact-form" class="contact-form" novalidate>')
 .replaceAll('name="_honey"','name="website"')
 .replace(/<button class="contact-submit"[^>]*>/,'<button class="contact-submit" type="submit" disabled>');
 return s;
}
export function configureContact(root){
 const pub=path.join(root,'publish');let app=fs.readFileSync(path.join(pub,'app.js'),'utf8');const start=app.indexOf('function setupContactForm(){'),end=app.indexOf('let newsCategory=',start);if(start<0||end<0)throw Error('Contact handler missing');
 fs.writeFileSync(path.join(pub,'app.js'),markup(app.slice(0,start)+handler+app.slice(end)));
 fs.writeFileSync(path.join(pub,'site-config.js'),'window.KANEHIDE_CONFIG='+JSON.stringify({contactProvider:'original-google-apps-script',contactEndpoint:endpoint})+';\n');
 let contact=markup(fs.readFileSync(path.join(pub,'contact.html'),'utf8')).replace(/src="(app|site-config)\.js(?:\?[^"]*)?"/g,'src="$1.js?contact=20261013-original"');
 contact=contact.replace(/<noscript><p class="contact-status error">[\s\S]*?<\/p><\/noscript>/g,'');
 contact=contact.replace('</form>','<noscript><p class="contact-status error">フォームの送信にはJavaScriptを有効にしてください。お電話（098-945-3351）でもお問い合わせいただけます。</p></noscript></form>');
 fs.writeFileSync(path.join(pub,'contact.html'),contact);
 let thanks=contact.replace(/<title>[\s\S]*?<\/title>/,'<title>お問い合わせ受付｜金秀鉄工株式会社</title>').replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex,follow">').replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'').replaceAll('https://kanehide-tekko.co.jp/contact.html','https://kanehide-tekko.co.jp/contact-thanks.html').replace(/<main id="main">[\s\S]*?<\/main>/,'<main id="main"><section class="page-heading"><div class="breadcrumb"><a href="index.html">TOP</a><span>/</span><a href="contact.html">お問い合わせ</a><span>/</span><span>受付</span></div><div class="section-kicker">お問い合わせ受付</div><h1>THANK YOU</h1></section><div class="page-body"><section class="soft-panel"><h2>お問い合わせを受け付けました。</h2><p class="reading-copy">担当者が内容を確認し、折り返しご連絡いたします。<br>お急ぎの場合や返答が届かない場合は、お電話でお問い合わせください。</p><p><a href="tel:0989453351">TEL 098-945-3351</a></p><a class="button-link" href="index.html"><span>トップページへ戻る</span><span class="arrow-circle">›</span></a></section></div></main>');
 thanks=thanks.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,'$1お問い合わせ受付のご案内。').replace(/(<meta property="og:title" content=")[^"]*/,'$1お問い合わせ受付｜金秀鉄工株式会社');fs.writeFileSync(path.join(pub,'contact-thanks.html'),thanks);
 const readme=path.join(root,'README.html');if(fs.existsSync(readme))fs.writeFileSync(readme,fs.readFileSync(readme,'utf8').replace(/<h2>3\. お問い合わせ<\/h2>[\s\S]*?<h2>4\./,'<h2>3. お問い合わせ</h2><p>元サイトの送信APIとGoogle Apps Scriptを再利用します。新しいフォームサービスは使用しません。元のサーバーに設定された送信先を引き継ぎます。前平さんのGmailの追加可否はGoogle Apps Script側の設定確認が必要です。実際のメール受信は未確認です。詳細は tools/contact-setup.md を参照してください。</p><h2>4.'));
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)configureContact(path.resolve(process.argv[2]||path.join(path.dirname(process.argv[1]),'..')));
