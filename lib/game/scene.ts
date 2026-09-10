import * as T from 'three';
import { GameModel, LANES, AREA_NAMES, swipeAction } from './model.mjs';
import { GameAudio } from './audio';
import { box, ball, cyl, bake, C, chunkTemplate, makeObstacle, makePower, makeCoin, makeRaka, disposeArt } from './art';

export function createGame(mount:HTMLDivElement,onSnapshot:(s:any)=>void,onNotice:(s:string)=>void){
  let storage:Storage|null=null;try{storage=window.localStorage;}catch{}
  const model=new GameModel({storage,seed:37621});
  let settings={music:true,sfx:true,quality:window.innerWidth<700?'medium':'high'};
  try{const s=JSON.parse(storage?.getItem('larian.v1.settings')||'{}');settings={music:typeof s.music==='boolean'?s.music:true,sfx:typeof s.sfx==='boolean'?s.sfx:true,quality:['low','medium','high'].includes(s.quality)?s.quality:settings.quality};}catch{}
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setClearColor(0xa8d4d0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;mount.appendChild(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0xa8d4d0);scene.fog=new T.Fog(0xa8d4d0,72,215);
  const camera=new T.PerspectiveCamera(52,1,.1,350);const target=new T.Vector3(),cameraPos=new T.Vector3();
  const hemi=new T.HemisphereLight(0xe4f9f4,0x788e58,2.6);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffedbf,3.1);sun.position.set(-20,35,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-27;sun.shadow.camera.right=27;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-30;sun.shadow.camera.far=100;sun.shadow.normalBias=.055;sun.shadow.bias=-.00015;sun.target.position.set(0,0,-19);scene.add(sun,sun.target);
  const ground=box(scene,500,.5,600,0x82ac7e,0,-.48,-150);ground.castShadow=false;
  const backdrop=new T.Group();scene.add(backdrop);
  for(let n=0;n<13;n++){const peak=cyl(backdrop,18+(n%3)*12,18+(n%4)*9,n%2?0x7cafa3:0x8ebcb0,(n-6)*25,6,-165-Math.sin(n)*20,0,6);peak.castShadow=false;}
  for(let n=0;n<14;n++){const x=Math.sin(n*9)*85,y=27+n%4*6,z=-70-(n%5)*28;for(let j=0;j<3;j++){const cloud=ball(backdrop,4+j%2*2,0xe5eed9,x+j*4,y,z);cloud.scale.y=2.3;cloud.castShadow=false;}}
  ball(backdrop,5.5,0xfff1b0,-47,47,-115).castShadow=false;
  scene.remove(backdrop);const mergedBackdrop=bake(backdrop);mergedBackdrop.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=false;});scene.add(mergedBackdrop);
  const templates=new Map<string,T.Group>();
  const segments:{group:T.Group,index:number,theme:string}[]=[];
  const template=(area:number,variant:number)=>{const k=`${area}-${variant}`;if(!templates.has(k))templates.set(k,chunkTemplate(area,variant));return templates.get(k)!;};
  for(let i=-1;i<8;i++){const a=0;const group=template(a,Math.abs(i)%2).clone();scene.add(group);segments.push({group,index:i,theme:`${a}-${Math.abs(i)%2}`});group.position.z=-i*32;}
  const raka=makeRaka();scene.add(raka.root);
  // A soft contact shadow is retained on low graphics, with no shadow map cost.
  const sc=document.createElement('canvas');sc.width=sc.height=64;const sx=sc.getContext('2d')!;const gradient=sx.createRadialGradient(32,32,1,32,32,31);gradient.addColorStop(0,'rgba(15,47,36,.42)');gradient.addColorStop(1,'rgba(15,47,36,0)');sx.fillStyle=gradient;sx.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(sc),shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});const shadow=new T.Mesh(new T.PlaneGeometry(2.4,2.1),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;scene.add(shadow);
  const aura=new T.Mesh(new T.SphereGeometry(1.3,16,12),new T.MeshBasicMaterial({color:0x7cf5ef,transparent:true,opacity:.13,wireframe:true,depthWrite:false}));aura.position.y=1.2;scene.add(aura);aura.visible=false;
  const pools=new Map<string,T.Group[]>(),active=new Map<number,{node:T.Group,key:string}>();const prototypes=new Map<string,T.Group>();
  const coinSource=makeCoin();coinSource.updateMatrixWorld(true);const coinParts=coinSource.children.map(o=>{const source=o as T.Mesh;const mesh=new T.InstancedMesh(source.geometry,source.material,100);mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;scene.add(mesh);return {mesh,local:source.matrix.clone()};});const coinTransform=new T.Object3D(),coinMatrix=new T.Matrix4();
  function acquire(key:string){let p=pools.get(key)?.pop();if(!p){if(!prototypes.has(key))prototypes.set(key,key==='coin'?makeCoin():['shield','magnet','multiplier'].includes(key)?makePower(key):makeObstacle(key));p=prototypes.get(key)!.clone();}scene.add(p);p.visible=true;return p;}
  function release(id:number){const e=active.get(id);if(!e)return;scene.remove(e.node);if(!pools.has(e.key))pools.set(e.key,[]);pools.get(e.key)!.push(e.node);active.delete(id);}
  const maxParticles=160,positions=new Float32Array(maxParticles*3),velocities=new Float32Array(maxParticles*3),life=new Float32Array(maxParticles);
  const particleGeo=new T.IcosahedronGeometry(.08,0),particleMat=new T.MeshBasicMaterial({color:0xffffff});const particles=new T.InstancedMesh(particleGeo,particleMat,maxParticles);particles.instanceMatrix.setUsage(T.DynamicDrawUsage);particles.frustumCulled=false;scene.add(particles);const dummy=new T.Object3D();let particleCursor=0;for(let i=0;i<maxParticles;i++){dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);particles.setColorAt(i,new T.Color(C.gold));}
  function burst(x:number,y:number,z:number,color:number,count=12){for(let n=0;n<count;n++){const i=particleCursor++%maxParticles;positions[i*3]=x;positions[i*3+1]=y;positions[i*3+2]=z;velocities[i*3]=(Math.random()-.5)*5;velocities[i*3+1]=2+Math.random()*3;velocities[i*3+2]=(Math.random()-.5)*4;life[i]=.4+Math.random()*.4;particles.setColorAt(i,new T.Color(color));}if(particles.instanceColor)particles.instanceColor.needsUpdate=true;}
  const audio=new GameAudio();let time=0,last=performance.now(),raf=0,uiElapsed=0,shake=0,lastState='',lastArea=0,disposed=false,nearCooldown=0;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function applySettings(){audio.music=settings.music;audio.sfx=settings.sfx;renderer.setPixelRatio(Math.min(window.devicePixelRatio,settings.quality==='high'?1.7:settings.quality==='medium'?1.2:.8));renderer.shadowMap.enabled=settings.quality!=='low';sun.castShadow=settings.quality!=='low';(scene.fog as T.Fog).far=settings.quality==='low'?162:215;sun.shadow.mapSize.set(settings.quality==='high'?2048:1024,settings.quality==='high'?2048:1024);sun.shadow.map?.dispose();sun.shadow.map=null;resize();}
  function resize(){const w=mount.clientWidth,h=mount.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
  function action(a:string){if(a==='click'){audio.unlock();audio.effect('click');return;}if(['play','restart','resume'].includes(a))audio.unlock();model.action(a);if(a==='menu')onNotice('');if(['play','restart'].includes(a)){for(const id of [...active.keys()])release(id);life.fill(0);shake=0;onNotice('');}onSnapshot(model.snapshot());}
  function key(e:KeyboardEvent){if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;const map:Record<string,string>={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',ArrowUp:'jump',w:'jump',W:'jump',' ':'jump',ArrowDown:'slide',s:'slide',S:'slide'};if(map[e.key]&&model.state==='PLAYING'){e.preventDefault();e.stopImmediatePropagation();action(map[e.key]);}if((e.key==='Escape'||e.key==='p'||e.key==='P')&&model.state==='PLAYING'){e.preventDefault();e.stopImmediatePropagation();action('pause');}else if((e.key==='p'||e.key==='P')&&model.state==='PAUSED'){e.preventDefault();e.stopImmediatePropagation();action('resume');}}
  let touch:{x:number,y:number,id:number}|null=null;
  function pointerDown(e:PointerEvent){touch={x:e.clientX,y:e.clientY,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);audio.unlock();}
  function pointerMove(e:PointerEvent){if(!touch||touch.id!==e.pointerId)return;const a=swipeAction(e.clientX-touch.x,e.clientY-touch.y);if(a){action(a);touch=null;}}
  function pointerEnd(e:PointerEvent){if(touch&&touch.id===e.pointerId){const a=swipeAction(e.clientX-touch.x,e.clientY-touch.y);if(a)action(a);}touch=null;}
  function visibility(){if(document.hidden&&model.state==='PLAYING')action('pause');}
  window.addEventListener('keydown',key,true);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerEnd);renderer.domElement.addEventListener('pointercancel',pointerEnd);
  const observer=new ResizeObserver(resize);observer.observe(mount);applySettings();
  function frame(now:number){if(disposed)return;raf=requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;const frozen=model.state==='PAUSED'||model.state==='GAMEOVER';if(!frozen)time+=dt;
    model.step(dt);model.finishDeath(dt);audio.running=model.state==='PLAYING';audio.update();nearCooldown=Math.max(0,nearCooldown-dt);
    for(const ev of model.consumeEvents()){audio.effect(ev.type);if(ev.type==='coin')burst(ev.x,ev.y,ev.z,C.gold,settings.quality==='low'?3:6);if(ev.type==='power'){shake=reduced?0:.08;burst(model.x,1,0,ev.kind==='magnet'?0xba91ff:ev.kind==='shield'?0x70e7e1:C.gold,26);onNotice(ev.kind==='magnet'?'MAGNET AKTIF · 12 DETIK':ev.kind==='shield'?'SHIELD SIAP · 1 BENTURAN':'KOIN 2× · 12 DETIK');}if(ev.type==='shieldHit'){shake=.22;burst(model.x,1,0,0x79f1e3,30);onNotice('SHIELD MENAHAN BENTURAN');}if(ev.type==='hit'){shake=.42;burst(model.x,1,0,0xe88860,30);}if(ev.type==='near'&&nearCooldown===0){onNotice('NYARIS! TERUS LARI.');nearCooldown=3;}if(ev.type==='area'){onNotice('SELAMAT DATANG · '+ev.text.toUpperCase());}}
    const menu=model.state==='MENU',d=menu?0:model.distance;
    const first=Math.floor(d/32)-1;
    for(let i=0;i<segments.length;i++){const seg=segments[i],idx=first+i,area=Math.max(0,Math.floor((idx*32+16)/400))%5,variant=Math.abs(idx)%2,k=`${area}-${variant}`;if(seg.theme!==k){scene.remove(seg.group);seg.group=template(area,variant).clone();scene.add(seg.group);seg.theme=k;}seg.index=idx;seg.group.position.z=d-idx*32;seg.group.visible=i<(settings.quality==='low'?6:8);for(const child of seg.group.children)(child as T.Mesh).castShadow=i<4;}
    const itemIds=new Set<number>();
    let coinCount=0;
    for(const item of model.items){if(item.kind!=='coin'||!item.active||(menu&&d-item.d>-9))continue;coinTransform.position.set(LANES[item.lane],item.y+Math.sin(time*3+item.id*.6)*.12,d-item.d);coinTransform.rotation.y=time*2.3+item.id;coinTransform.updateMatrix();for(const part of coinParts){coinMatrix.multiplyMatrices(coinTransform.matrix,part.local);part.mesh.setMatrixAt(coinCount,coinMatrix);}coinCount++;if(coinCount===100)break;}for(const part of coinParts){part.mesh.count=coinCount;part.mesh.instanceMatrix.needsUpdate=true;}
    for(const item of model.items){if(!item.active||item.kind==='coin')continue;itemIds.add(item.id);const key=item.kind==='obstacle'?item.type:item.kind;let entity=active.get(item.id);if(!entity){entity={node:acquire(key),key};active.set(item.id,entity);}const node=entity.node;node.position.set(LANES[item.lane],item.y,d-model.itemDistance(item));if(item.kind!=='obstacle'){node.rotation.y=time*(item.kind==='coin'?2.3:1.4)+item.id;node.position.y+=Math.sin(time*3+item.id*.6)*.12;if(item.kind==='coin'&&model.magnet>0&&Math.abs(node.position.z)<16)node.position.x=T.MathUtils.lerp(node.position.x,model.x,.35);}node.visible=!menu||node.position.z<-9;}
    for(const id of active.keys())if(!itemIds.has(id))release(id);
    const sliding=model.slide>0,jumping=model.y>.02,dying=model.state==='DYING'||model.state==='GAMEOVER';
    if(!frozen){const gait=time*(8+model.speed*.22),amplitude=menu?.06:sliding?.1:jumping?.2:.78;raka.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(gait+i*Math.PI)*amplitude+(jumping?-.32:0);});raka.arms.forEach((arm,i)=>{arm.rotation.x=-Math.sin(gait+i*Math.PI)*amplitude+(jumping?-1.1:0);arm.rotation.z=(i===0?1:-1)*(menu?.16:.07);});raka.body.position.y=menu?Math.sin(time*2)*.025:sliding?-.46:Math.abs(Math.sin(gait))*.035;raka.body.rotation.x=sliding?-1.04:dying?Math.min(1.35,model.deathTime*2):.06;raka.body.rotation.z=dying?-Math.min(.75,model.deathTime*1.1):-(LANES[model.lane]-model.x)*.13;raka.head.rotation.y=menu?Math.sin(time*.6)*.12:0;}
    raka.root.scale.setScalar(menu?1.47:1);raka.root.position.set(menu?1.7:model.x,model.y,menu?2.2:0);raka.root.rotation.y=menu?Math.PI-.5:0;if(dying)raka.root.position.y=Math.max(0,model.y-model.deathTime*2);
    shadow.position.x=raka.root.position.x;shadow.position.z=raka.root.position.z;shadow.scale.setScalar((menu?1.5:1)*(1-model.y*.13));shadowMaterial.opacity=1-model.y*.2;
    aura.visible=model.shield>0||model.invincible>0;aura.position.set(model.x,model.y+1.1,0);if(!frozen)aura.rotation.y=time*.5;
    if(!frozen){for(let i=0;i<maxParticles;i++){const ix=i*3;if(life[i]>0){life[i]-=dt;positions[ix]+=velocities[ix]*dt;positions[ix+1]+=velocities[ix+1]*dt;positions[ix+2]+=(velocities[ix+2]+(menu?0:model.speed*.4))*dt;velocities[ix+1]-=8*dt;dummy.position.set(positions[ix],positions[ix+1],positions[ix+2]);dummy.scale.setScalar(Math.max(0,life[i]*1.5));dummy.rotation.set(time*3,i,time);}else dummy.scale.setScalar(0);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}particles.instanceMatrix.needsUpdate=true;}
    const portrait=camera.aspect<.85;
    if(menu){cameraPos.set(portrait?1.5:2.8,portrait?4.7:4.3,portrait?12:11);target.set(portrait?0:-5.7,portrait?-1.8:1,-17);camera.fov=portrait?57:52;}else{cameraPos.set(model.x*.12,5.4,10.7);target.set(model.x*.2,1.05,-13);camera.fov=55+(model.speed-16)*.25+(portrait?6:0);}
    const blend=lastState===model.state?1-Math.exp(-dt*5):1;
    if(!frozen){camera.position.lerp(cameraPos,blend);shake*=Math.exp(-dt*8);if(!reduced&&shake>.002){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake;}}
    camera.lookAt(target);camera.updateProjectionMatrix();
    if(lastArea!==model.area){lastArea=model.area;const colors=[0xa8d4d0,0xb2d6d0,0xd3d8b1,0xabced5,0xbad8c3];(scene.background as T.Color).setHex(colors[lastArea]);(scene.fog as T.Fog).color.setHex(colors[lastArea]);}
    renderer.render(scene,camera);uiElapsed+=dt;if(uiElapsed>.1||lastState!==model.state){onSnapshot(model.snapshot());uiElapsed=0;}lastState=model.state;
  }
  onSnapshot(model.snapshot());raf=requestAnimationFrame(frame);
  // Read-only diagnostics for QA; no gameplay cheats or external services.
  const diagnostics=()=>({...model.snapshot(),lane:model.lane,x:model.x,y:model.y,slide:model.slide,items:model.items.length,rows:model.rows.length,segments:segments.length,pooled:[...pools.values()].reduce((n,p)=>n+p.length,0),meshes:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures});
  Object.defineProperty(mount,'larianDiagnostics',{value:diagnostics,configurable:true});
  return {settings,action,setSettings(next:typeof settings){settings=next;applySettings();audio.unlock();try{storage?.setItem('larian.v1.settings',JSON.stringify(settings));}catch{}},diagnostics,dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',key,true);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerEnd);renderer.domElement.removeEventListener('pointercancel',pointerEnd);audio.dispose();shadow.geometry.dispose();shadowMaterial.dispose();shadowTexture.dispose();aura.geometry.dispose();(aura.material as T.Material).dispose();particleGeo.dispose();particleMat.dispose();particles.dispose();coinParts.forEach(p=>p.mesh.dispose());disposeArt();renderer.dispose();renderer.domElement.remove();delete (mount as any).larianDiagnostics;}};
}





