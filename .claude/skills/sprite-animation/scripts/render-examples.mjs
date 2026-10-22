import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright-core';

const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'examples/dead-zone');
const manifest=JSON.parse(await fs.readFile(path.join(output,'manifest.json'),'utf8'));
execFileSync(process.env.FFMPEG_PATH??'ffmpeg',['-version'],{stdio:'ignore'});
let executablePath=process.env.SPRITE_BROWSER_EXECUTABLE;
if(!executablePath)for(const candidate of ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 '/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome']){
 try{await fs.access(candidate);executablePath=candidate;break;}catch{}
}
if(!executablePath)throw Error('Set SPRITE_BROWSER_EXECUTABLE to a Chromium browser executable');
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><title>Sprite example export</title>');return;}
  const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root))throw Error('Outside example checkout');
  const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.png')?'image/png':'application/octet-stream'});res.end(body);
 }catch(error){res.writeHead(404);res.end(error.message);}
});
let browser,framesDir;
const previews=[];
try{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({headless:true,executablePath});
 const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 framesDir=await fs.mkdtemp(path.join(tmpdir(),'sprite-readme-frames-'));
 for(const[id,record]of Object.entries(manifest.characters)){
  const turnaround=id==='suv',action=turnaround?'idle':'walk',motion=record.previewMotion??action,fps=turnaround?4:record.clips.walk.fps;
  const frames=turnaround?record.directions.map(direction=>record.clips.idle.directions[direction][0]):record.clips.walk.directions.SE;
  const images=await page.evaluate(async({id,record,frames})=>{
   const image=new Image();image.src='/examples/dead-zone/'+record.image;await image.decode();
   const c=document.createElement('canvas');c.width=192;c.height=192;const g=c.getContext('2d');
   const scale=id==='suv'?1.8:1.1,foot={x:96,y:158};
   return frames.map(frame=>{
    g.clearRect(0,0,192,192);g.fillStyle='#e2e7e2';g.fillRect(0,0,192,192);
    g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.ellipse(foot.x,foot.y,id==='suv'?26:22,id==='suv'?13:11,0,0,Math.PI*2);g.fill();
    g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
    g.drawImage(image,frame.x,frame.y,frame.width,frame.height,
     foot.x-record.footAnchor.x*scale,foot.y-record.footAnchor.y*scale,frame.width*scale,frame.height*scale);
    return c.toDataURL('image/png').split(',')[1];
   });
  },{id,record,frames});
  const folder=path.join(framesDir,id);await fs.mkdir(folder);
  for(const[i,data]of images.entries())await fs.writeFile(path.join(folder,String(i).padStart(3,'0')+'.png'),Buffer.from(data,'base64'));
  await fs.writeFile(path.join(output,id+'.png'),Buffer.from(images[0],'base64'));
  execFileSync(process.env.FFMPEG_PATH??'ffmpeg',['-hide_banner','-loglevel','error','-y',
   '-framerate',String(fps),'-i',path.join(folder,'%03d.png'),'-filter_complex',
   '[0:v]split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=none',
   '-loop','0',path.join(output,id+'.gif')]);
  const inspection=frames.map((frame,i)=>({id:id+'/'+action+'/'+(turnaround?record.directions[i]:'SE')+'/'+i,
   rect:{x:frame.x,y:frame.y,w:frame.width,h:frame.height},anchor:record.footAnchor,durationMs:1000/fps}));
  await fs.writeFile(path.join(output,id+'-'+(turnaround?'turnaround':motion)+'.json'),JSON.stringify(inspection,null,2)+'\n');
  previews.push({id,action:turnaround?'directional-turnaround':motion,direction:turnaround?'all':'SE',
   frames:frames.length,fps,durationSeconds:frames.length/fps,width:192,height:192,
   image:id+'.gif',poster:id+'.png',source:record.image});
 }
 if(errors.length)throw Error(errors.join('\n'));
 await fs.writeFile(path.join(output,'previews.json'),JSON.stringify({version:1,previews},null,2)+'\n');
 console.log(JSON.stringify({output,previews:previews.map(({id,frames,fps})=>({id,frames,fps}))},null,2));
}finally{
 await browser?.close();await new Promise(resolve=>server.close(resolve));
 if(framesDir)await fs.rm(framesDir,{recursive:true,force:true});
}
