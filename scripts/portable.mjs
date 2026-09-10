import { build } from 'vite';
import fs from 'node:fs/promises';
await build({configFile:'portable.config.ts'});
const css=(await fs.readdir('out')).filter(f=>f.endsWith('.css'));
const style=(await Promise.all(css.map(f=>fs.readFile('out/'+f,'utf8')))).join('\n');
const js=await fs.readFile('out/larian.js','utf8');
const packages=['three','react','react-dom','scheduler','@base-ui/react','@base-ui/utils','@floating-ui/dom','@floating-ui/core','@floating-ui/utils','lucide-react','clsx','tailwind-merge','class-variance-authority','@shadcn/react'];
let licenses='';for(const pkg of packages){for(const name of ['LICENSE','LICENSE.md','LICENSE.txt','license']){try{licenses+='\n'+pkg+'\n'+await fs.readFile('node_modules/'+pkg+'/'+name,'utf8')+'\n';break;}catch{}}}
const html=`<!doctype html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#103c37"><meta name="description" content="LARIAN: Game 3D endless runner original di Kota Nusantara. Jelajahi Nusantara. Kejar Rekor."><title>LARIAN — Jelajahi Nusantara. Kejar Rekor.</title><link rel="icon" href="data:,"><style>${style.replaceAll('</style','<\\/style')}</style></head><body><div id="root"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
await fs.writeFile('out/index.html',html+'\n<!-- THIRD-PARTY LICENSES\n'+licenses.replaceAll('--','—')+'\n-->');
await fs.copyFile('out/index.html','../outputs/LARIAN.html');
console.log(`LARIAN.html ready: ${(html.length/1024/1024).toFixed(2)} MB, fully offline.`);
