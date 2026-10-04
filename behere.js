import * as THREE from './three.module.js';
import {RoundedBoxGeometry} from './RoundedBoxGeometry.js';

export function createBeHere(product, scene, invalidate, canvas, camera, controls) {
  const oldScreen=product.getObjectByName('Screen_360_axis');
  if(oldScreen)oldScreen.visible=false;
  const black=new THREE.MeshPhysicalMaterial({color:0x090a0b,roughness:.38,metalness:.25,clearcoat:.24,clearcoatRoughness:.3,envMapIntensity:.55,specularIntensity:.35});
  const gold=new THREE.MeshPhysicalMaterial({color:0xb99a64,metalness:.88,roughness:.3});
  const roof=product.getObjectByName('Device_walnut_roof');
  if(roof)roof.material=black;
  const root=new THREE.Group();root.name='BeHere_black_gold_device';product.add(root);
  function box(w,h,d,r,material,position,parent=root){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,4,r),material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
  box(.14,.014,.079,.005,gold,[0,.842,0]);
  box(.137,.018,.076,.005,black,[0,.845,0]);
  box(.068,.036,.036,.005,black,[0,.86,-.018]);
  const tablet=new THREE.Group();tablet.position.set(0,.933,-.012);tablet.rotation.x=-THREE.MathUtils.degToRad(25);root.add(tablet);
  box(.236,.174,.01,.009,gold,[0,0,0],tablet);
  box(.232,.17,.011,.008,black,[0,0,.001],tablet);
  const ui=document.createElement('canvas');ui.width=ui.height=2096;
  const ctx=ui.getContext('2d'),texture=new THREE.CanvasTexture(ui);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=8;
  // An unlit emissive display preserves deep blacks under strong studio lights.
  // The matching area light supplies its physical illumination to nearby objects.
  const screenMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.222,.16),screenMaterial);screen.position.z=.0071;tablet.add(screen);
  const light=new THREE.RectAreaLight(0xffe4ad,5,.21,.15);light.position.set(0,0,.01);light.rotation.y=Math.PI;tablet.add(light);
  // A faint bounce onto the pedestal accompanies the emissive panel.
  const bounce=new THREE.PointLight(0xffd59a,.012,.38,2);bounce.position.set(0,.88,.065);root.add(bounce);
  let page=0,language='RU',mode='Friends';
  const goldInk='#d4b681',paper='#f4ead4';
  const labels={RU:['Добро пожаловать','Хорошая еда. Больше живого общения.','Начать','Друзья','Пара','Семья','Случайно','Выберите настроение вечера'],KZ:['Қош келдіңіз','Дәмді ас. Шынайы әңгіме.','Бастау','Достар','Жұп','Отбасы','Кездейсоқ','Кештің көңіл күйін таңдаңыз'],EN:['Welcome','Good food. Deeper connections.','Start','Friends','Couple','Family','Random','Pick your vibe for today']};
  function text(value,x,y,size,color=paper,font='Georgia',align='center'){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillText(value,x,y)}
  function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=4;ctx.stroke()}}
  function render(){const l=labels[language];ctx.fillStyle='#080a0a';ctx.fillRect(0,0,2096,2096);
    const glow=ctx.createRadialGradient(1000,1000,100,1000,1000,1600);glow.addColorStop(0,'#1a1813');glow.addColorStop(1,'#070909');ctx.fillStyle=glow;ctx.fillRect(0,0,2096,2096);
    ctx.strokeStyle='#8b744119';ctx.lineWidth=3;for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(850,1500,1300+i*130,620+i*90,-.23,0,Math.PI*2);ctx.stroke()}
    if(page===0){text('BeHere',1048,740,235,goldInk);text('GOOD FOOD · DEEPER CONNECTIONS',1048,855,38,goldInk,'Arial');text(l[1],1048,1100,50,paper,'Arial');
      ['KZ','RU','EN'].forEach((v,i)=>{rounded(440+i*425,1260,365,175,45,v===language?'#3b3020':null,'#a88c5c');text(v,622+i*425,1370,62,goldInk,'Arial')});
      const g=ctx.createLinearGradient(0,1510,0,1720);g.addColorStop(0,'#ead5ad');g.addColorStop(1,'#ab834c');rounded(415,1550,1266,210,100,g);text(l[2]+'  →',1048,1687,66,'#161710','Arial');
    }else if(page===1){text('BeHere',1048,300,105,goldInk);text(l[7],1048,435,53,paper,'Arial');
      [['♧',l[3]],['♡',l[4]],['♧',l[5]],['◇',l[6]]].forEach(([icon,label],i)=>{const x=165+(i%2)*900,y=630+Math.floor(i/2)*620;rounded(x,y,866,570,55,'#161713','#786745');text(icon,x+433,y+220,175,goldInk);text(label,x+433,y+390,79)});
    }else{ text('←',170,220,70,goldInk);text('BeHere',1048,240,88,goldInk);text('4 / 4',1840,240,55,goldInk,'Arial');text(mode.toUpperCase(),1048,700,50,goldInk,'Arial');
      const lines=language==='RU'?['Какой момент в жизни','изменил вас больше всего?']:language==='KZ'?['Өміріңіздегі қай сәт','сізді қатты өзгертті?']:['What is a moment in your life','that completely changed you?'];lines.forEach((v,i)=>text(v,1048,995+i*165,86));rounded(195,1710,1706,18,9,'#38352c');rounded(195,1710,680,18,9,goldInk);text(language==='RU'?'Дальше  →':language==='KZ'?'Келесі  →':'Next  →',1048,1900,58,goldInk,'Arial');}
    texture.needsUpdate=true;invalidate(6);
  }
  function next(){page=(page+1)%3;render()}
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let down;
  canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);
  canvas.addEventListener('pointerup',e=>{if(!down||!controls.enabled||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(screen)[0];if(!hit)return;const x=hit.uv.x*2096,y=(1-hit.uv.y)*2096;
    if(page===0&&y>1260&&y<1435){const index=Math.floor((x-440)/425);if(index>=0&&index<3)language=['KZ','RU','EN'][index];}
    else if(page===1){const i=(y>1250?2:0)+(x>1048?1:0);mode=['Friends','Couple','Family','Random'][i];page=2;}
    else if(page===2&&y<400){page=1}else{page=(page+1)%3}render();
  });
  render();return{next,setPage(i){if(page===i)return;page=i;render()}};
}

export function createTour(camera,controls,stage,setDrawers,setPage,invalidate,status){
  let active=false,start=0,wasFullscreen=false,saved;
  const ease=t=>t*t*(3-2*t),angle=Math.atan2(2.9,3.9),wide=new THREE.Vector3(2.9,2.6,3.9),near=new THREE.Vector3(.57,1.19,.76),targetWide=new THREE.Vector3(0,.4,0),targetNear=new THREE.Vector3(0,.88,0);
  function finish(){if(!active)return;active=false;document.body.classList.remove('cinema');controls.enabled=true;setDrawers(false);camera.position.copy(saved.camera);controls.target.copy(saved.target);controls.update();invalidate(35);if(wasFullscreen&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});status.textContent='Показ завершён. Можно запустить ещё раз.';document.querySelector('#tour').focus()}
  async function begin(){if(active)return;saved={camera:camera.position.clone(),target:controls.target.clone()};setDrawers(false);setPage(0);controls.enabled=false;document.body.classList.add('cinema');
    wasFullscreen=false;if(!document.fullscreenElement){try{await stage.requestFullscreen();wasFullscreen=true}catch{}}
    active=true;start=performance.now();invalidate(40);
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape')finish()});document.addEventListener('fullscreenchange',()=>{if(active&&wasFullscreen&&!document.fullscreenElement)finish()});
  function update(time){if(!active)return false;const s=(time-start)/1000;if(s>=30){finish();return false}
    if(s<4){const f=ease(s/4);camera.position.copy(wide).multiplyScalar(1.04-.04*f);controls.target.copy(targetWide)}
    else if(s<18){const a=angle+Math.PI*2*ease((s-4)/14);camera.position.set(Math.sin(a)*4.86,2.6,Math.cos(a)*4.86);controls.target.copy(targetWide)}
    else if(s<21){const f=ease((s-18)/3);camera.position.lerpVectors(wide,near,f);controls.target.lerpVectors(targetWide,targetNear,f);setPage(1)}
    else if(s<26){const f=ease((s-21)/5),a=Math.atan2(near.x,near.z)+Math.PI*2*f;camera.position.set(Math.sin(a)*.95,1.19,Math.cos(a)*.95);controls.target.copy(targetNear);setDrawers(true);setPage(s<23?1:2)}
    else{const f=ease((s-26)/4);camera.position.lerpVectors(near,wide,f);controls.target.lerpVectors(targetNear,targetWide,f);setDrawers(false);setPage(2)}
    camera.lookAt(controls.target);invalidate();return true;
  }
  return{begin,update,get active(){return active}};
}
