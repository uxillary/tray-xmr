import{readFile,writeFile}from'node:fs/promises';
export function color(value){const m=value?.match(/^rgba?\(([^)]+)\)/);if(!m)return null;const n=m[1].match(/[\d.]+/g).map(Number);return [...n.slice(0,3),n[3]??1];}
export function over(top,bottom){const a=top[3];return top.slice(0,3).map((c,i)=>c*a+bottom[i]*(1-a)).concat(1);}
export function luminance(rgb){return rgb.slice(0,3).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((n,c,i)=>n+c*[.2126,.7152,.0722][i],0);}
export function ratio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const hex=c=>'#'+c.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const unique=colors=>[...new Map(colors.map(c=>[c.map(n=>Math.round(n*100)/100).join(','),c])).values()];
function layers(value){let depth=0,start=0;const result=[];for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;if(value[i]===')')depth--;if(value[i]===','&&depth===0){result.push(value.slice(start,i));start=i+1;}}result.push(value.slice(start));return result.reverse();}
function backgrounds(row,pseudo){let values=[[255,255,255,1]];for(const layer of [...row.stack].reverse()){const base=color(layer.background);if(base)values=unique(values.map(b=>over(base,b)));const images=[...layers(layer.image),...(layer.tag==='BODY'?layers(pseudo):[])];for(const image of images){const stops=[...image.matchAll(/rgba?\([^)]+\)/g)].map(m=>color(m[0]));if(stops.length)values=unique(values.flatMap(b=>stops.map(stop=>over(stop,b))));}}return values;}
if(ratio([0,0,0],[255,255,255])!==21||Math.abs(luminance([255,0,0])-.2126)>1e-12||over([255,255,255,.5],[0,0,0,1])[0]!==127.5||ratio([255,255,255],[119,119,119])>=4.5)throw Error('Contrast reference-vector failure');
const input=process.argv[2]??'docs/evidence/m12b4/contrast-rendered.json';
const pages=JSON.parse(await readFile(input,'utf8'));const results=[];
for(const page of pages)for(const row of page.records){
  const foreground=color(row.foreground);if(!foreground)continue;
  const opacity=row.stack.reduce((n,s)=>n*Number(s.opacity),1);if(opacity===0)continue;
  const kind=row.kind??'text';const large=parseFloat(row.size)>=24||(parseFloat(row.size)>=18.6666667&&Number(row.weight)>=700);const threshold=kind==='text'?(large?3:4.5):3;
  let bgs=backgrounds(kind==='focus'?{...row,stack:row.stack.slice(1)}:row,page.bodyBefore);let ink=foreground;let mode=kind==='focus'?'offset outline against surrounding background':kind;
  if(kind==='boundary'){
    const outer=backgrounds({...row,stack:row.stack.slice(1)},page.bodyBefore);const fill=color(row.fill);
    if(fill&&outer.every(bg=>ratio(over(fill,bg),bg)>=3)){bgs=outer;ink=fill;mode='identifying fill against adjacent background';}
    else{bgs=unique([...bgs,...outer]);mode='identifying border against inside and outside backgrounds';}
  }
  const pairs=bgs.map(background=>({background,foreground:over([...ink.slice(0,3),ink[3]*opacity],background)})).map(pair=>({...pair,ratio:ratio(pair.foreground,pair.background)})).sort((a,b)=>a.ratio-b.ratio);
  const worst=pairs[0],best=pairs.at(-1);results.push({path:page.path,viewport:page.viewport,state:page.label,kind,mode,tag:row.tag,id:row.id,class:row.class,text:row.text,foreground:hex(worst.foreground),background:hex(worst.background),size:row.size,weight:row.weight,criterion:kind==='text'?'1.4.3':'1.4.11',threshold,minimumRatio:worst.ratio,maximumRatio:best.ratio,status:worst.ratio>=threshold?'PASS':best.ratio<threshold?'FAIL':'NOT VERIFIED',gradientEnvelope:pairs.length>1,opacity,placeholder:!!row.placeholder});
}
await writeFile(input.replace('contrast-rendered','contrast-results'),JSON.stringify({method:'Computed rendered sRGB colors with ancestor alpha compositing; conservative gradient-stop envelope, not anti-aliased glyph sampling. PASS only if the entire envelope passes. FAIL only if its best case fails; mixed cases need local verification. Filled controls assessed against surrounding background; otherwise border assessed against both sides. Native unmodified UI outlines and decorative separators are not asserted as authored control boundaries.',referenceVectors:4,pages:pages.length,results},null,2)+'\n');
console.log(JSON.stringify({samples:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL'),uncertain:results.filter(r=>r.status==='NOT VERIFIED')},null,2));
