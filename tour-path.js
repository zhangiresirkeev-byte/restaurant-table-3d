export const DURATION_SECONDS=30;
export const WIDE_CAMERA=[2.9,2.6,3.9];
export const WIDE_TARGET=[0,.4,0];
const NEAR_CAMERA=[.57,1.19,.76],NEAR_TARGET=[0,.88,0];
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
const blend=(a,b,t)=>t<=0?[...a]:t>=1?[...b]:a.map((v,i)=>v+(b[i]-v)*t);

// All camera, screen and mechanical events share one 30-second timeline.
export function sampleTour(seconds){
  const s=clamp(seconds/DURATION_SECONDS)*DURATION_SECONDS;
  let camera,target,page=0,drawerOpen=0,phase;
  if(s<4){phase='approach';const f=ease(s/4);camera=[2.9*(1.04-.04*f),2.7-.1*f,3.9*(1.04-.04*f)];target=WIDE_TARGET;}
  else if(s<18){phase='table-orbit';const a=Math.atan2(2.9,3.9)+Math.PI*2*ease((s-4)/14);camera=[Math.sin(a)*4.86,2.6,Math.cos(a)*4.86];target=WIDE_TARGET;}
  else if(s<21){phase='approach-device';const f=ease((s-18)/3);camera=blend(WIDE_CAMERA,NEAR_CAMERA,f);target=blend(WIDE_TARGET,NEAR_TARGET,f);page=1;}
  else if(s<26){phase='device-orbit';const a=Math.atan2(.57,.76)+Math.PI*2*ease((s-21)/5);camera=[Math.sin(a)*.95,1.19,Math.cos(a)*.95];target=NEAR_TARGET;page=s<23?1:2;drawerOpen=ease((s-21)/.75);}
  else{phase='return';const f=ease((s-26)/4);camera=blend(NEAR_CAMERA,WIDE_CAMERA,f);target=blend(NEAR_TARGET,WIDE_TARGET,f);page=2;drawerOpen=1-ease((s-26)/.75);}
  return{seconds:s,camera:[...camera],target:[...target],page,drawerOpen,phase,complete:seconds>=DURATION_SECONDS};
}
