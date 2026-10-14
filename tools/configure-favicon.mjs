import fs from 'node:fs';
import path from 'node:path';
export function configureFavicon(root) {
  const pub=path.join(root,'publish');
  function visit(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) { visit(file); continue; }
      if(!entry.name.endsWith('.html')) continue;
      const prefix=path.relative(path.dirname(file),pub).split(path.sep).join('/');
      const base=prefix ? prefix+'/' : '';
      const tags='<link rel="icon" href="'+base+'favicon.ico?v=20261014" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="'+base+'assets/favicon-32.png?v=20261014"><link rel="apple-touch-icon" sizes="180x180" href="'+base+'assets/favicon-180.png?v=20261014">';
      let html=fs.readFileSync(file,'utf8').replace(/<link\b[^>]*\brel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*>/gi,'');
      html=html.includes('</head>') ? html.replace('</head>',tags+'</head>') : html.replace(/<meta charset=["']utf-8["']\s*\/?>/i,match=>match+tags);
      fs.writeFileSync(file,html);
    }
  }
  visit(pub);
}
