import shell from '../../lib/site-shell.json';
export async function GET(request:Request){const name=new URL(request.url).pathname.replace(/^\//,'').replace(/\.html$/,'')||'index';if(!(shell as any)[name])return new Response('Not found',{status:404});return new Response((shell as any)[name],{headers:{'Content-Type':'text/html; charset=utf-8'}});}
