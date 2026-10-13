import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const recipients = ['shuya.sakihama@kanehide.co.jp', 'haruka.kiyuna@kanehide.co.jp', 'ya-miyagi@kanehide.co.jp', 'i-isiki@kanehide.co.jp'];
const endpoint = 'https://formsubmit.co/' + recipients[0];
const intro = '下記フォームへ必要事項をご入力ください。送信時に迷惑メール対策の確認画面へ移動します。担当者が内容を確認し、折り返しご連絡いたします。';
const consent = '入力内容をお問い合わせへの回答に利用すること、および外部フォームサービス（FormSubmit）を通じて送信することに同意します。';
const fields = `<input type="hidden" name="_cc" value="${recipients.slice(1).join(',')}"><input type="hidden" name="_template" value="table"><input type="hidden" name="_subject" value="【金秀鉄工Web】お問い合わせ">`;

export const handler = `function setupContactForm(){
 const form=$('#contact-form');if(!form)return;
 const status=$('#contact-status');const button=form.querySelector('button[type="submit"]');
 const cfg=window.KANEHIDE_CONFIG||{};
 form.action=cfg.contactEndpoint||'${endpoint}';form.method='POST';
 const hidden=(name,value)=>{let input=form.elements.namedItem(name);if(!input){input=document.createElement('input');input.type='hidden';input.name=name;form.append(input);}input.value=value;};
 hidden('_cc',(cfg.recipients||${JSON.stringify(recipients)}).slice(1).join(','));
 hidden('_template','table');
 hidden('_next',new URL('contact-thanks.html',location.href).href);
 window.addEventListener('pageshow',()=>{button.disabled=false;button.querySelector('span').textContent='入力内容を送信する';});
 form.addEventListener('submit',e=>{
  e.preventDefault();status.textContent='';status.className='contact-status';
  for(const key of ['name','email','subject','message']){const input=form.elements.namedItem(key);input.value=input.value.trim();}
  const phone=form.elements.namedItem('phone');phone.setCustomValidity('');
  if(form.elements.namedItem('reply_method').value==='電話'&&!phone.value.trim())phone.setCustomValidity('電話での回答をご希望の場合は電話番号をご入力ください。');
  if(!form.reportValidity())return;
  if(form.elements.namedItem('_honey').value)return;
  if(button.disabled)return;
  hidden('_subject','【金秀鉄工Web】'+form.elements.namedItem('subject').value);
  button.disabled=true;button.querySelector('span').textContent='送信画面へ移動中…';
  status.textContent='送信サービスへ接続しています。次の画面で確認を完了してください。';
  try{HTMLFormElement.prototype.submit.call(form);}catch{button.disabled=false;button.querySelector('span').textContent='入力内容を送信する';status.className='contact-status error';status.textContent='送信画面へ移動できませんでした。入力内容は残っています。再度お試しいただくか、お電話でお問い合わせください。';}
 });
}
`;

function updateMarkup(text){
 text=text.replaceAll('下記フォームへご入力ください。内容をメールアプリで開きますので、メールアプリから送信してください。',intro);
 text=text.replaceAll('メールアプリで送信する','入力内容を送信する');
 text=text.replaceAll('入力内容を確認し、個人情報をお問い合わせへの回答に利用することに同意します。',consent);
 text=text.replace('<form id="contact-form" class="contact-form" novalidate>',`<form id="contact-form" class="contact-form" method="POST" action="${endpoint}">${fields}`);
 text=text.replaceAll('name="website"','name="_honey"');
 return text;
}

export function configureContact(root){
 const pub=path.join(root,'publish');
 let app=fs.readFileSync(path.join(pub,'app.js'),'utf8');
 const start=app.indexOf('function setupContactForm(){');const end=app.indexOf('let newsCategory=',start);
 if(start<0||end<0)throw new Error('Contact handler boundaries missing');
 app=updateMarkup(app.slice(0,start)+handler+app.slice(end));
 fs.writeFileSync(path.join(pub,'app.js'),app);
 fs.writeFileSync(path.join(pub,'site-config.js'),'window.KANEHIDE_CONFIG='+JSON.stringify({contactProvider:'formsubmit',contactEndpoint:endpoint,recipients})+';\n');
 const contact=updateMarkup(fs.readFileSync(path.join(pub,'contact.html'),'utf8'));
 fs.writeFileSync(path.join(pub,'contact.html'),contact);
 let thanks=contact.replace(/<title>[\s\S]*?<\/title>/,'<title>お問い合わせ受付｜金秀鉄工株式会社</title>')
  .replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex,follow">')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,'')
  .replaceAll('https://kanehide-tekko.co.jp/contact.html','https://kanehide-tekko.co.jp/contact-thanks.html')
  .replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main"><section class="page-heading"><div class="breadcrumb"><a href="index.html">TOP</a><span>/</span><a href="contact.html">お問い合わせ</a><span>/</span><span>受付</span></div><div class="section-kicker">お問い合わせ受付</div><h1>THANK YOU</h1></section><div class="page-body"><section class="soft-panel"><span class="english-label">CONTACT</span><h2>お問い合わせを受け付けました。</h2><p class="reading-copy">担当者が内容を確認し、折り返しご連絡いたします。<br>お急ぎの場合や返答が届かない場合は、お電話でお問い合わせください。</p><p><a href="tel:0989453351">TEL 098-945-3351</a></p><a class="button-link" href="index.html"><span>トップページへ戻る</span><span class="arrow-circle" aria-hidden="true">›</span></a></section></div></main>`);
 thanks=thanks.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,'$1お問い合わせ受付のご案内。')
  .replace(/(<meta property="og:title" content=")[^"]*/,'$1お問い合わせ受付｜金秀鉄工株式会社');
 fs.writeFileSync(path.join(pub,'contact-thanks.html'),thanks);
 const readme=path.join(root,'README.html');
 if(fs.existsSync(readme))fs.writeFileSync(readme,fs.readFileSync(readme,'utf8').replace(/<h2>3\. お問い合わせ<\/h2>[\s\S]*?<h2>4\./,'<h2>3. お問い合わせ</h2><p>FormSubmitを通じてWebフォームから送信します。主宛先1名＋CC3名の計4名です。認証画面の後、受付ページへ移動します。主宛先で初回認証メールの承認が必要です。認証と4名の受信確認が完了するまでは運用開始しないでください。実際の送信・受信テストは未実施です。ドメイン変更時も再認証・受信確認を行ってください。秘密鍵は不要です。詳細は tools/contact-setup.md を参照してください。</p><h2>4.'));
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)configureContact(path.resolve(process.argv[2]||path.join(path.dirname(process.argv[1]),'..')));
