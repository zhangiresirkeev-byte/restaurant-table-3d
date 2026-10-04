import * as THREE from './three.module.js';
import {OrbitControls} from './OrbitControls.js';
import {GLTFLoader} from './GLTFLoader.js';
import {HDRLoader} from './HDRLoader.js';
import {Reflector} from './Reflector.js';
import {RectAreaLightUniformsLib} from './RectAreaLightUniformsLib.js';
import {EffectComposer} from './EffectComposer.js';
import {SSAOPass} from './SSAOPass.js';
import {OutputPass} from './OutputPass.js';
import {RenderPass} from './RenderPass.js';
import {createBeHere,createTour} from './behere.js?v=a8c21f5aa498';

const stage=document.querySelector('#stage'),canvas=document.querySelector('#view'),status=document.querySelector('#status'),progress=document.querySelector('#progress');
let frames=10,product,room,poses=[],opened=false,detail=false,transition=null,device,tour,lastTourAmount=null;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=.88;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;renderer.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#635847');scene.fog=new THREE.FogExp2('#b8a27a',.014);
const camera=new THREE.PerspectiveCamera(22,1,.05,60);const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.55;controls.maxDistance=6;controls.maxPolarAngle=Math.PI*.48;controls.minPolarAngle=.18;controls.enablePan=false;
function invalidate(n=3){frames=Math.max(frames,n)}
function resetCamera(){detail=false;document.querySelector('#detail').setAttribute('aria-pressed','false');document.querySelector('#detail').textContent='Устройство крупно';camera.position.set(2.9,2.6,3.9);controls.target.set(0,.4,0);controls.update();invalidate(30)}
resetCamera();controls.addEventListener('change',()=>invalidate());
RectAreaLightUniformsLib.init();
function area(name,position,target,intensity,width,height,color){const l=new THREE.RectAreaLight(color,intensity,width,height);l.name=name;l.position.set(...position);l.lookAt(...target);scene.add(l);return l}
area('Тёплый свет окна',[-2.6,3,1.2],[0,.7,0],34,2,3.2,0xffdbac);
area('Мягкое заполнение',[3.5,2.6,3],[0,.65,0],7,3,4.2,0xe8efff);
area('Свет на кромках',[2.7,3.8,-2.8],[0,.8,0],9,2.2,3,0xffe8cd);
area('Отражение окна в орехе',[-2,3.2,-2.8],[0,.75,0],4,.3,1.8,0xffe1ba);
const sun=new THREE.DirectionalLight(0xffd299,1.6);sun.position.set(-4,4.3,5);sun.target.position.set(.5,.3,-1);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.radius=5;sun.shadow.blurSamples=12;Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.3,far:15});sun.shadow.bias=-.00008;sun.shadow.normalBias=.004;scene.add(sun,sun.target);
scene.add(new THREE.HemisphereLight(0xe7e5df,0x604020,.22));

// A new procedural stone texture; no photograph is used as the scene background.
function stoneTexture(){const c=document.createElement('canvas');c.width=c.height=2096;const ctx=c.getContext('2d'),data=ctx.createImageData(c.width,c.height);let seed=907;
const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;const cloud=Math.sin(x*.008+Math.sin(y*.012)*1.8)+Math.sin(y*.017+x*.004);const v=33+cloud*4+rand()*6;data.data[i]=v+8;data.data[i+1]=v;data.data[i+2]=v-8;data.data[i+3]=255}ctx.putImageData(data,0,0);
for(let j=0;j<19;j++){ctx.beginPath();let x=rand()*c.width,y=rand()*c.height;ctx.moveTo(x,y);for(let k=0;k<14;k++){x+=(rand()-.35)*95;y+=(rand()-.2)*90;ctx.lineTo(x,y)}ctx.strokeStyle=j%3?'rgba(143,124,99,.34)':'rgba(180,156,121,.36)';ctx.lineWidth=j%3?4:7;ctx.stroke()}
ctx.strokeStyle='rgba(12,12,10,.75)';ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,c.width-3,c.height-3);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(7,7);t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t}
const stone=stoneTexture();const floorMaterial=new THREE.MeshPhysicalMaterial({map:stone,color:0x89827b,roughness:.3,metalness:.03,clearcoat:.26,clearcoatRoughness:.3});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);
const mirror=new Reflector(new THREE.PlaneGeometry(8,8),{textureWidth:1024,textureHeight:768,color:0x8c8275,clipBias:.002,multisample:2});
mirror.rotation.x=-Math.PI/2;mirror.position.y=-.002;mirror.material.transparent=true;mirror.material.depthWrite=false;mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4( blendOverlay( base.rgb, color ), 0.26 )');scene.add(mirror);
mirror.material.fragmentShader=mirror.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',`vec2 uv=vUv.xy/vUv.w;vec2 blur=vec2(0.0028,0.0037);vec4 base=texture2D(tDiffuse,uv)*0.24;
for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){if(x!=0||y!=0)base+=texture2D(tDiffuse,uv+vec2(float(x),float(y))*blur)*0.095;}}`);
const reflectionRender=mirror.onBeforeRender;mirror.onBeforeRender=function(r,s,c,...args){if(s.overrideMaterial)return;reflectionRender.call(this,r,s,c,...args)};
const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4})),ao=new SSAOPass(scene,camera,1,1,24);ao.kernelRadius=.11;ao.minDistance=.00005;ao.maxDistance=.004;composer.addPass(new RenderPass(scene,camera));composer.addPass(ao);composer.addPass(new OutputPass());
function walnutTexture(){const c=document.createElement('canvas');c.width=c.height=2096;const ctx=c.getContext('2d'),d=ctx.createImageData(c.width,c.height);
for(let y=0;y<2096;y++)for(let x=0;x<2096;x++){const i=(y*2096+x)*4,warp=x+24*Math.sin(y*.003)+13*Math.sin(y*.01+x*.002),grain=Math.sin(warp*.22+2*Math.sin(y*.0018))+Math.sin(warp*.058+y*.0006)*1.5,wide=Math.sin(x*.011+y*.0008),v=grain*5+wide*9;d.data[i]=120+v;d.data[i+1]=69+v*.65;d.data[i+2]=36+v*.4;d.data[i+3]=255}ctx.putImageData(d,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t}const walnut=walnutTexture();

// Outdoor leaves cast real silhouettes through the window.
const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(.04,8,5),new THREE.MeshStandardMaterial({color:0x596b36,roughness:.74}),1100);const dummy=new THREE.Object3D();let leafSeed=1337;
const leafRand=()=>{leafSeed=(1664525*leafSeed+1013904223)>>>0;return leafSeed/4294967296};
for(let i=0;i<1100;i++){const tree=i%3,angle=leafRand()*Math.PI*2,radius=Math.sqrt(leafRand());dummy.position.set(-3.25+Math.cos(angle)*radius*.55,1.25+leafRand()*2.3,-.2+tree*1.7+Math.sin(angle)*radius*.85);dummy.scale.set(1,.22,1.5+leafRand()*.9);dummy.rotation.set(leafRand()*3,leafRand()*6,leafRand()*3);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix)}leaves.castShadow=true;scene.add(leaves);
const trunkMaterial=new THREE.MeshStandardMaterial({color:0x4f4030,roughness:.84});for(const z of [-.2,1.5,3.2]){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,3.4,10),trunkMaterial);trunk.position.set(-3.3,1.7,z);trunk.castShadow=true;scene.add(trunk);for(let k=0;k<6;k++){const points=[new THREE.Vector3(-3.3,.8+k*.35,z),new THREE.Vector3(-3.2,1.05+k*.35,z+(k%2?.3:-.3)),new THREE.Vector3(-3.15,1.15+k*.35,z+(k%2?.65:-.65))];const branch=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),8,.012,5,false),trunkMaterial);branch.castShadow=true;scene.add(branch)}}
const haze=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUV; void main(){vUV=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec2 vUV; void main(){float edge=pow(sin(vUV.x*3.14159265),4.0);float fade=sin(vUV.y*3.14159265); gl_FragColor=vec4(0.82,0.66,0.4,edge*fade*0.022);}'});
for(const z of [.1,1.05,2]){const a=new THREE.Vector3(-2.72,2.5,z),b=new THREE.Vector3(-.65,.25,z-2.1),direction=b.clone().sub(a);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.05,.38,direction.length(),24,1,true),haze);shaft.position.copy(a).add(b).multiplyScalar(.5);shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize());scene.add(shaft)}

const manager=new THREE.LoadingManager();manager.onProgress=(url,loaded,total)=>{progress.textContent=`Материалы и детали: ${loaded} из ${total}`};const loader=new GLTFLoader(manager);
function configureMesh(root){root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(m.map)m.map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(['Stone','Oak'].includes(m.name)){m.map=walnut;m.roughness=.78;m.clearcoat=.38;m.clearcoatRoughness=.24;m.envMapIntensity=.75;if(m.normalScale)m.normalScale.set(.25,.25)}if(m.name==='Linen'){m.roughness=.87;m.metalness=0;m.specularIntensity=.25;m.sheen=.16;m.sheenColor=new THREE.Color(.08,.075,.07);m.envMapIntensity=.32}if(m.name==='Milk'){m.roughnessMap=null;m.roughness=.55;m.metalness=0;m.specularIntensity=.3;m.envMapIntensity=.4}if(m.name==='Porcelain'){m.roughness=.36;m.clearcoat=.18;m.envMapIntensity=.45}if(m.name==='Glassware'){m.roughness=.035;m.thickness=.003;m.transmission=1;m.ior=1.5;m.attenuationColor=new THREE.Color(0xf5eee5);m.attenuationDistance=.35}m.needsUpdate=true}})}
function transformOf(node){if(node.matrix){const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();new THREE.Matrix4().fromArray(node.matrix).decompose(p,q,s);return{p,q,s}}return{p:new THREE.Vector3(...(node.translation||[0,0,0])),q:new THREE.Quaternion(...(node.rotation||[0,0,0,1])),s:new THREE.Vector3(...(node.scale||[1,1,1]))}}
async function loadScene(){const [table,architecture,hdr,poseDoc]=await Promise.all([loader.loadAsync('./table-closed.gltf'),loader.loadAsync('./restaurant-room.gltf'),new HDRLoader(manager).loadAsync('./restaurant-light.hdr'),fetch('./drawer-poses.json').then(r=>r.json())]);
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdr).texture;scene.environmentIntensity=.65;hdr.dispose();pmrem.dispose();
product=table.scene;configureMesh(product);
// Open trays have a floor and four walls, leaving the phone and lining visible.
const trays=[];product.traverse(o=>{if(/^Drawer_\d_tray$/.test(o.name))trays.push(o)});
for(const tray of trays){tray.geometry=new THREE.BoxGeometry(.19,.003,.096).translate(0,-.0105,0);
for(const [w,h,d,x,z] of [[.19,.024,.003,0,-.0465],[.19,.024,.003,0,.0465],[.003,.024,.09,-.0935,0],[.003,.024,.09,.0935,0]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),tray.material);wall.position.set(x,0,z);wall.castShadow=true;wall.receiveShadow=true;tray.add(wall)}}
scene.add(product);device=createBeHere(product,scene,invalidate,canvas,camera,controls);room=architecture.scene;
room.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;if(o.name==='Studio_floor')o.visible=false;if(o.name.startsWith('Outdoor_foliage_silhouette'))o.visible=false;if(o.material?.name==='Polished_Emperador_style_stone'){o.material=o.material.clone();o.material.map=stone.clone();o.material.map.repeat.set(3,2);o.material.map.needsUpdate=true;o.material.color.set(0xffffff);o.material.roughness=.3;o.material.clearcoat=.24;o.material.needsUpdate=true}});scene.add(room);
for(const node of poseDoc){if(node.name==='Screen_360_axis')continue;const a=transformOf(node.a),b=transformOf(node.b);const obj=product.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(node.name));if(obj)poses.push({obj,a,b})}
if(!poses.length)throw new Error('Не найдены положения открывания ящиков');
tour=createTour(camera,controls,stage,setDrawers,i=>device.setPage(i),invalidate,status);
document.querySelectorAll('nav button').forEach(b=>b.disabled=false);document.querySelector('#loading').classList.add('done');status.textContent='Вращайте стол. Нажмите на экран BeHere, чтобы пройти три шага.';document.documentElement.dataset.ready='true';renderer.shadowMap.needsUpdate=true;invalidate(50)}
loadScene().catch(error=>{console.error(error);progress.textContent='Не удалось загрузить сцену. Обновите страницу.';status.textContent='Ошибка загрузки 3D-сцены.';document.documentElement.dataset.ready='error'});
function setDrawers(value,progress=null){if(progress!==null){transition=null;const amount=value?progress:1-progress;if(lastTourAmount===amount)return;lastTourAmount=amount;for(const p of poses){p.obj.position.lerpVectors(p.a.p,p.b.p,amount);p.obj.quaternion.slerpQuaternions(p.a.q,p.b.q,amount);p.obj.scale.lerpVectors(p.a.s,p.b.s,amount)}if(opened!==value){opened=value;const b=document.querySelector('#drawers');b.setAttribute('aria-pressed',String(opened));b.textContent=opened?'Закрыть ящики':'Открыть ящики'}renderer.shadowMap.needsUpdate=true;invalidate();return}lastTourAmount=null;if(opened===value)return;opened=value;const b=document.querySelector('#drawers');b.setAttribute('aria-pressed',String(opened));b.textContent=opened?'Закрыть ящики':'Открыть ящики';transition={start:performance.now(),from:poses.map(p=>({p:p.obj.position.clone(),q:p.obj.quaternion.clone(),s:p.obj.scale.clone()})),to:opened?'b':'a'};status.textContent=opened?'Четыре боковых ящика для телефонов.':'Ящики закрыты.';invalidate(50)}
document.querySelector('#drawers').addEventListener('click',()=>setDrawers(!opened));
document.querySelector('#screen').addEventListener('click',()=>device?.next());
document.querySelector('#tour').addEventListener('click',()=>{device?.prepareShowcase();tour?.begin()});
document.querySelector('#detail').addEventListener('click',()=>{if(detail){resetCamera();return}detail=true;const b=document.querySelector('#detail');b.setAttribute('aria-pressed','true');b.textContent='Вернуться к столу';controls.target.set(0,.89,0);camera.position.set(.7,1.3,.94);controls.update();invalidate(30)});
document.querySelector('#reset').addEventListener('click',resetCamera);
document.querySelector('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await stage.requestFullscreen()}catch{status.textContent='Для полного экрана используйте кнопку браузера.'}});
function resize(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(10))*Math.max(1,1.7778/camera.aspect)));camera.updateProjectionMatrix();composer.setSize(width,height);invalidate(30)}new ResizeObserver(resize).observe(stage);resize();
renderer.setAnimationLoop(time=>{const touring=tour?.update(time);if(!touring)controls.update();if(transition){const t=Math.min(1,(time-transition.start)/750),v=t*t*(3-2*t);poses.forEach((p,i)=>{const a=transition.from[i],b=p[transition.to];p.obj.position.lerpVectors(a.p,b.p,v);p.obj.quaternion.slerpQuaternions(a.q,b.q,v);p.obj.scale.lerpVectors(a.s,b.s,v)});renderer.shadowMap.needsUpdate=true;invalidate();if(t===1)transition=null}
if(room){const outsideBack=camera.position.z<-2.9,outsideLeft=camera.position.x<-2.4;room.traverse(o=>{if(o.name.startsWith('Back_'))o.visible=!outsideBack;if(o.name.startsWith('Left_wall'))o.visible=!outsideLeft})}if(frames>0){composer.render();frames--}});
