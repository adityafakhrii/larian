import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='../work/qa';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[],report=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await context.route(/^https?:/,route=>route.abort());
await page.goto('file:///C:/Users/adity/Documents/Codex/2026-09-10/sad-2/outputs/LARIAN.html');
await page.waitForFunction(()=>document.querySelector('.world')?.larianDiagnostics);
const diag=()=>page.locator('.world').evaluate(e=>e.larianDiagnostics());
const wait=fn=>page.waitForFunction(fn,{},{timeout:30000});
await page.screenshot({path:out+'/desktop-final.png'});console.log('checkpoint',await diag());report.push({check:'offline menu',...await diag()});
await page.getByRole('button',{name:'HOW TO PLAY'}).click();await page.getByRole('heading',{name:'CARA MAIN'}).waitFor();await page.getByRole('button',{name:'Tutup',exact:true}).click();
await page.getByRole('button',{name:'SETTINGS',exact:true}).click();await page.getByRole('switch',{name:'Musik'}).click();await page.getByRole('switch',{name:'Efek suara'}).click();await page.getByText('LOW',{exact:true}).click();await page.getByRole('button',{name:'SIMPAN & KEMBALI'}).click();
await page.getByRole('button',{name:'BEST SCORE'}).click();await page.getByRole('heading',{name:'BEST SCORE',exact:true}).waitFor();await page.getByRole('button',{name:'Tutup',exact:true}).click();
await page.setViewportSize({width:1000,height:720});await page.getByRole('button',{name:'PLAY',exact:true}).click();
await page.keyboard.press('a');await wait(()=>document.querySelector('.world').larianDiagnostics().x<-2.5);console.log('checkpoint',await diag());report.push({check:'left',...await diag()});
await page.keyboard.press('d');await page.keyboard.press('ArrowRight');await wait(()=>document.querySelector('.world').larianDiagnostics().x>2.5);console.log('checkpoint',await diag());report.push({check:'right',...await diag()});
await page.keyboard.press('Space');await wait(()=>document.querySelector('.world').larianDiagnostics().y>1.4);console.log('checkpoint',await diag());report.push({check:'jump',...await diag()});
await page.keyboard.press('s');await wait(()=>document.querySelector('.world').larianDiagnostics().y===0);await page.keyboard.press('ArrowDown');await wait(()=>document.querySelector('.world').larianDiagnostics().slide>0);console.log('checkpoint',await diag());report.push({check:'slide',...await diag()});
await page.keyboard.press('Escape');await page.getByRole('heading',{name:'PAUSED'}).waitFor();const before=await diag();await page.waitForTimeout(500);assert.equal((await diag()).distance,before.distance);assert.equal((await diag()).slide,before.slide);console.log('checkpoint',await diag());report.push({check:'pause frozen'});
await page.getByRole('button',{name:'RESUME'}).click();await wait(()=>document.querySelector('.world').larianDiagnostics().state==='PLAYING');
await page.keyboard.press('ArrowLeft');await wait(()=>Math.abs(document.querySelector('.world').larianDiagnostics().x)<.1);await wait(()=>document.querySelector('.world').larianDiagnostics().coins>0);console.log('checkpoint',await diag());report.push({check:'coins',...await diag()});await page.screenshot({path:out+'/game-final.png'});
await page.keyboard.press('p');await page.getByRole('button',{name:'RESTART',exact:true}).click();assert((await diag()).distance<5);console.log('checkpoint',await diag());report.push({check:'restart'});
await page.keyboard.press('p');await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile-menu.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await page.getByRole('button',{name:'PLAY',exact:true}).click();const canvas=page.locator('canvas');const cdp=await context.newCDPSession(page);
async function swipe(x1,y1,x2,y2){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x2,y:y2,id:0}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
await swipe(200,400,100,400);await wait(()=>document.querySelector('.world').larianDiagnostics().lane===0);await swipe(100,400,200,400);await wait(()=>document.querySelector('.world').larianDiagnostics().lane===1);await swipe(200,400,200,300);await wait(()=>document.querySelector('.world').larianDiagnostics().y>1);await swipe(200,300,200,400);await wait(()=>document.querySelector('.world').larianDiagnostics().y===0);await swipe(200,300,200,400);await wait(()=>document.querySelector('.world').larianDiagnostics().slide>0);console.log('checkpoint',await diag());report.push({check:'four mobile swipes'});
await page.screenshot({path:out+'/mobile-game.png'});await page.getByRole('button',{name:'Pindah kanan',exact:true}).dispatchEvent('pointerdown');await wait(()=>document.querySelector('.world').larianDiagnostics().lane===2);console.log('checkpoint',await diag());report.push({check:'mobile controls'});
// Let an ordinary run reach a physical obstacle, without manipulating game state.
await page.waitForFunction(()=>document.querySelector('.world').larianDiagnostics().state==='GAMEOVER',{},{timeout:180000});const final=await diag();console.log('checkpoint',await diag());report.push({check:'game over',...final});assert(final.best>0);await page.screenshot({path:out+'/game-over.png'});
await page.getByRole('button',{name:'RETRY',exact:true}).click();await wait(()=>document.querySelector('.world').larianDiagnostics().state==='PLAYING');assert((await diag()).distance<10);await page.keyboard.press('p');await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.reload();await wait(()=>document.querySelector('.world')?.larianDiagnostics);assert.equal((await diag()).best,final.best);console.log('checkpoint',await diag());report.push({check:'best persists across reload'});
assert.equal(errors.length,0,errors.join('\n'));await fs.writeFile(out+'/portable-report.json',JSON.stringify({passed:true,errors,report},null,2));console.log(JSON.stringify({passed:true,errors,report},null,2));await browser.close();

