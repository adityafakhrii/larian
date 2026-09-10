export const LANES = [-2.65, 0, 2.65];
export const AREA_LENGTH = 400;
export const AREA_NAMES = ['Kampung Kota', 'Stasiun Senja', 'Pasar Rame', 'Pusat Kota', 'Lembah Nusantara'];
export function randomSource(seed = 12345) { let s = seed >>> 0; return () => { s += 0x6D2B79F5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function swipeAction(dx, dy) { if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return null; return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'slide' : 'jump'); }
export function obstacleShape(type) { return type === 'low' ? { width:1.55, depth:.85, bottom:0, top:.83 } : type === 'arch' ? { width:2.02, depth:.7, bottom:1.04, top:2.48 } : type==='motor' ? {width:.8,depth:1.9,bottom:0,top:2.5} : type==='cart' ? {width:1.85,depth:1.7,bottom:0,top:2.2} : { width:type==='train'?2:1.65, depth:type === 'train' || type === 'bus' ? 5 : 2.6, bottom:0, top:type==='car'?1.72:2.6 }; }
export function makeRow(d, previousSafe, rng, index) {
  const speed = Math.min(35, 16 + d / 180);
  const safe = Math.max(0, Math.min(2, previousSafe + Math.floor(rng()*3) - 1));
  const lanes = [0,1,2].filter(l => l !== safe);
  if (d < 190 || rng() > Math.min(.82, .25 + d/1700)) lanes.splice(Math.floor(rng()*2),1);
  const area = Math.floor(d / AREA_LENGTH) % 5;
  const obstacles = lanes.map(lane => {
    const r = rng();
    let type = r < .34 ? 'low' : r < .58 ? 'arch' : 'cart';
    if (d > 300 && r > .75) type = area === 1 ? 'train' : area === 3 ? (r > .88 ? 'bus' : 'car') : 'motor';
    return { lane, type, moving:d > 500 && ['motor','car','bus','train'].includes(type), ...obstacleShape(type) };
  });
  // Every row has a clear lane, and it can move only one lane from the previous
  // clear lane. Even at top speed there is >1.2 s between hazard envelopes.
  return { d, safe, obstacles, index, gap:Math.max(27, speed * 1.65 + 7), area };
}
export class GameModel {
  distance=0; speed=16; score=0; coins=0; elapsed=0; area=0; lane=1; x=0; y=0; vy=0; slide=0; magnet=0; shield=0; multiplier=0; invincible=0; deathTime=0;
  /** @param {{ storage?: {getItem:(key:string)=>string|null,setItem:(key:string,value:string)=>void}|null, seed?:number }} options */
  constructor({ storage = null, seed = 9781 } = {}) {
    this.storage = storage; this.seed = seed; this.runCount = 0; this.state = 'MENU'; this.events = []; this.best = 0; this.tutorialSeen = false;
    try { const s = JSON.parse(storage?.getItem('larian.v1.record') || '{}'); this.best = Math.max(0, Number(s.best) || 0); this.tutorialSeen = !!s.tutorialSeen; } catch {}
    this.reset(); this.state = 'MENU';
  }
  persist() { try { this.storage?.setItem('larian.v1.record', JSON.stringify({ best:this.best, tutorialSeen:this.tutorialSeen })); } catch {} }
  reset() {
    this.rng = randomSource(this.seed + this.runCount * 2017); this.distance = 0; this.speed = 16; this.score = 0; this.coins = 0; this.elapsed = 0; this.area = 0;
    this.lane = 1; this.x = 0; this.y = 0; this.vy = 0; this.slide = 0; this.magnet = 0; this.shield = 0; this.multiplier = 0; this.invincible = 0;
    this.items = []; this.rows = []; this.id = 0; this.nextRow = 80; this.nextPower = 115; this.rowIndex = 0; this.lastSafe = 1; this.powerIndex = 0; this.isNewBest = false; this.deathTime = 0; this.events.length = 0;
    this.showTutorial = !this.tutorialSeen;
    for (let i=0;i<9;i++) this.add({ kind:'coin',lane:1,d:16+i*3,y:1 });
    this.generate();
  }
  add(item) { this.items.push({ id:++this.id,active:true,...item }); }
  start() { this.runCount++; this.reset(); this.state = 'PLAYING'; this.events.push({type:'start'}); }
  action(action) {
    if (['play','restart'].includes(action)) { this.start(); return; }
    if (action === 'menu') { this.state='MENU'; this.reset(); return; }
    if (action === 'pause' && this.state === 'PLAYING') { this.state='PAUSED'; return; }
    if (action === 'resume' && this.state === 'PAUSED') { this.state='PLAYING'; return; }
    if (this.state !== 'PLAYING') return;
    if (action === 'left') { this.lane=Math.max(0,this.lane-1); }
    if (action === 'right') { this.lane=Math.min(2,this.lane+1); }
    if (action === 'jump' && this.y < .02) { this.slide=0; this.vy=10.6; this.y=.025; this.events.push({type:'jump'}); }
    if (action === 'slide') { if (this.y>.05) this.vy=-15; else { this.slide=.87; this.events.push({type:'slide'}); } }
  }
  generate() {
    while (this.nextRow < this.distance + 210) {
      const row = makeRow(this.nextRow,this.lastSafe,this.rng,this.rowIndex++);
      this.rows.push(row); this.lastSafe=row.safe;
      for (const o of row.obstacles) this.add({ kind:'obstacle',d:row.d,y:0,...o,phase:this.rng()*6.28,checked:false });
      const pattern = row.index % 3;
      for (let n=0;n<7;n++) {
        const lane = pattern===1 && n<3 ? Math.max(0,Math.min(2,row.safe + (row.safe===0 ? 1 : -1))) : row.safe;
        this.add({kind:'coin',lane,d:row.d-21+n*2.6,y:pattern===2 ? 1+Math.sin(n/6*Math.PI)*1.6 : 1});
      }
      if (row.d >= this.nextPower) {
        this.add({kind:['magnet','shield','multiplier'][this.powerIndex++%3],lane:row.safe,d:row.d+9,y:1.15}); this.nextPower=row.d+100+this.rng()*50;
      }
      this.nextRow += row.gap;
    }
  }
  itemDistance(item) { return item.d - (item.moving ? Math.min(5, Math.max(0,(this.distance + 100 - item.d)*.055)) : 0); }
  step(dt) {
    if (this.state !== 'PLAYING') return;
    dt = Math.min(dt, .05); const prev=this.distance;
    this.elapsed += dt; this.speed=Math.min(35,16+this.distance/180); this.distance+=this.speed*dt;
    const oldArea=this.area; this.area=Math.floor(this.distance/AREA_LENGTH)%5;
    if (oldArea!==this.area) this.events.push({type:'area',text:AREA_NAMES[this.area]});
    this.x += (LANES[this.lane]-this.x)*(1-Math.exp(-22*dt));
    if (this.y>0 || this.vy>0) { this.y+=this.vy*dt; this.vy-=27*dt; if (this.y<=0) { this.y=0; this.vy=0; this.events.push({type:'land'}); } }
    this.slide=Math.max(0,this.slide-dt); this.magnet=Math.max(0,this.magnet-dt); this.multiplier=Math.max(0,this.multiplier-dt); this.invincible=Math.max(0,this.invincible-dt);
    for (const item of this.items) {
      if (!item.active) continue;
      const d=this.itemDistance(item), z=d-this.distance, dx=Math.abs(LANES[item.lane]-this.x);
      if (item.kind==='obstacle') {
        const envelope=item.depth/2+.32;
        if (d+envelope>=prev && d-envelope<=this.distance && dx<item.width/2+.31 && this.y<item.top-.06 && this.y+(this.slide>0 ? .69 : 1.75)>item.bottom+.06 && this.invincible<=0) {
          item.active=false;
          if (this.shield>0) { this.shield=0; this.invincible=1.8; this.events.push({type:'shieldHit',x:this.x,y:this.y+1}); }
          else { this.die(); break; }
        }
        if (z < -envelope && !item.checked) { item.checked=true; const margin=dx-(item.width/2+.31); if ((margin>0 && margin<.65) || (dx<.9 && (this.y>.65 || this.slide>0))) this.events.push({type:'near'}); }
      } else {
        const magnet=item.kind==='coin' && this.magnet>0 && Math.abs(z)<12;
        const hit=z<.8 && z>-.8 && dx<.95 && Math.abs(item.y-(this.y+.95))<(this.slide>0?.85:1.05);
        if (hit||magnet) {
          item.active=false;
          if (item.kind==='coin') { const amount=this.multiplier>0?2:1; this.coins+=amount; this.events.push({type:'coin',x:LANES[item.lane],y:item.y,z:-z,amount}); }
          else { if(item.kind==='shield')this.shield=1; else this[item.kind]=12; this.events.push({type:'power',kind:item.kind,x:this.x,y:1}); }
        }
      }
    }
    this.score=Math.floor(this.distance*10)+this.coins*25;
    this.items=this.items.filter(i=>i.active && this.itemDistance(i)>this.distance-15);
    this.rows=this.rows.filter(r=>r.d>this.distance-30);
    if(this.state==='PLAYING')this.generate();
    if (this.showTutorial && this.elapsed>12) {this.tutorialSeen=true;this.persist();}
  }
  die() { this.state='DYING'; this.score=Math.floor(this.distance*10)+this.coins*25; this.isNewBest=this.score>this.best; this.best=Math.max(this.best,this.score); this.tutorialSeen=true; this.persist(); this.events.push({type:'hit'}); }
  finishDeath(dt) { if(this.state==='DYING') {this.deathTime+=dt;if(this.deathTime>.8)this.state='GAMEOVER';} }
  snapshot() { return {state:this.state,score:this.score,coins:this.coins,distance:this.distance,best:this.best,speed:this.speed,area:this.area,magnet:this.magnet,shield:this.shield,multiplier:this.multiplier,isNewBest:this.isNewBest,elapsed:this.elapsed,tutorial:this.showTutorial && this.state==='PLAYING' ? (this.elapsed<3?'move':this.elapsed<6?'jump':this.elapsed<9?'slide':'') : ''}; }
  consumeEvents() { const e=this.events;this.events=[];return e; }
}
