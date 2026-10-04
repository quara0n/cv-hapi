"""Render original CV Hapi typography/motion around real, fictional product captures.
Usage: python marketing/video/render_video.py [--audio path] [--feed]
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import argparse, json, subprocess, math

ROOT=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--audio');p.add_argument('--feed',action='store_true');args=p.parse_args()
W,H=1080,1350 if args.feed else 1920
BLUE='#315cf3'; INK='#242d3e'; MUTED='#586477'; BG='#f5f6f2'
def font(size,bold=False):return ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',size)
def crop(file,rect):
 im=Image.open(ROOT/file).convert('RGB');x,y,w,h=rect
 return im.crop((int(x),int(y),int(x+w),int(y+h)))
b=json.loads((ROOT/'cv-bounds.json').read_text()); cv=crop('product-mk-full.jpg',(b['x'],b['y'],b['width'],b['height']))
editor=crop('review-mk-full.jpg',(279,900,725,360))
comparison=crop('compare-mk-full.jpg',(279,875,725,215))
scenes=[
 {'title':['Твоето CV.','Појасно.'],'sub':'Запознај го CV Hapi.','image':cv,'duration':1.7,'caption':'Направи го следниот чекор со јасно CV.'},
 {'title':['Направи CV.','Преземи PDF.'],'sub':'Бесплатно. Без регистрација.','image':cv,'duration':3.8,'caption':'Уредувачот и стандардниот PDF се бесплатни.'},
 {'title':['Веќе имаш CV?','Подобри го.'],'sub':'AI-предлози за твојот документ.','image':editor,'duration':6,'caption':'Една AI-проверка — £2 еднократно.'},
 {'title':['Ти ги избираш','измените.'],'sub':'Спореди. Провери. Зачувај.','image':comparison,'duration':3.5,'caption':'Провери ги фактите пред да ја зачуваш измената.'},
 {'title':['CV Hapi.'],'sub':'cvhapi.com','image':None,'duration':5.0,'caption':''}
]
duration=sum(s['duration'] for s in scenes)
if args.audio:
 extra=max(0,float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',args.audio]).decode())+1-duration)
 scenes[-1]['duration']+=extra;duration+=extra
def centered(draw,text,y,size=44,bold=False,color=INK):
 f=font(size,bold);box=draw.textbbox((0,0),text,font=f);draw.text(((W-(box[2]-box[0]))/2,y),text,font=f,fill=color)
def wrap(text,size,maxwidth):
 f=font(size);words=text.split();lines=[];line=''
 for word in words:
  new=(line+' '+word).strip()
  if f.getlength(new)>maxwidth and line:lines.append(line);line=word
  else:line=new
 if line:lines.append(line)
 return lines
def frame(scene,progress):
 im=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(im)
 if scene['image'] is None:
  # Build the site's wordmark letter by letter, then reveal its homepage headline.
  elapsed=progress*scene['duration'];word='CVhapi';f=font(152,True)
  widths=[f.getlength(letter) for letter in word];x=(W-sum(widths))/2;y=H*.36
  for index,letter in enumerate(word):
   t=max(0,min(1,(elapsed-.12-index*.15)/.45));ease=1-(1-t)**3
   layer=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(layer)
   rgb=(36,45,62) if index<2 else (49,92,243)
   ld.text((x,y+(1-ease)*45),letter,font=f,fill=(*rgb,round(255*t)))
   im=Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB');x+=widths[index]
  for text,yy,size,delay,color in [
   ('Направи CV.',y+215,52,1.35,INK),
   ('Преземи го бесплатно.',y+285,52,1.55,BLUE),
   ('cvhapi.com',y+415,35,2.1,MUTED)]:
   t=max(0,min(1,(elapsed-delay)/.6));layer=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(layer)
   centered(ld,text,yy+(1-t)*16,size,True if size==52 else False,color)
   layer.putalpha(layer.getchannel('A').point(lambda a:round(a*t)))
   im=Image.alpha_composite(im.convert('RGBA'),layer).convert('RGB')
  return im
 d.text((88,100),'CV',font=font(46,True),fill=INK);d.text((153,100),'hapi',font=font(46,True),fill=BLUE)
 d.rounded_rectangle((W-270,104,W-90,157),radius=24,fill='#e8edff');d.text((W-249,111),'ТВОЈОТ CV',font=font(22,True),fill=BLUE)
 title_y=230 if H==1920 else 205
 for i,line in enumerate(scene['title']):centered(d,line,title_y+i*86,66,True)
 centered(d,scene['sub'],title_y+195,34,False,MUTED)
 if scene['image'] is not None:
  asset=scene['image'];maxh=850 if H==1920 else 500
  scale=min(880/asset.width,maxh/asset.height)*(1+0.016*progress)
  image=asset.resize((int(asset.width*scale),int(asset.height*scale)),Image.Resampling.LANCZOS)
  x=(W-image.width)//2;y=title_y+280+(maxh-image.height)//2-int(8*progress)
  d.rounded_rectangle((x-13,y-13,x+image.width+13,y+image.height+13),radius=24,fill='#dde1ec')
  im.paste(image,(x,y));d=ImageDraw.Draw(im)
 cy=H-(390 if H==1920 else 230)
 lines=wrap(scene['caption'],34,880)
 for j,line in enumerate(lines):centered(d,line,cy+j*49,34,True)
 centered(d,'Скратено демо · измислен пример',H-(235 if H==1920 else 115),23,False,MUTED)
 return im
out=ROOT/('cvhapi-mk-feed.mp4' if args.feed else 'cvhapi-mk-vertical.mp4')
if not args.audio:out=out.with_stem(out.stem+'-silent-preview')
cmd=['ffmpeg','-y','-loglevel','warning','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','pipe:0']
if args.audio:cmd+=['-i',args.audio]
cmd+=['-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p']
if args.audio:cmd+=['-af','loudnorm=I=-16:TP=-1.5:LRA=11,apad','-c:a','aac','-b:a','192k','-ar','48000']
cmd+=['-t',str(duration),'-movflags','+faststart',str(out)]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for index,scene in enumerate(scenes):
 frame(scene,.5).save(ROOT/f'storyboard-{index+1}.jpg',quality=92)
 total=round(scene['duration']*24)
 for n in range(total):proc.stdin.write(frame(scene,n/max(1,total-1)).tobytes())
 print(f'Scene {index+1} rendered',flush=True)
proc.stdin.close();rc=proc.wait()
if rc:raise SystemExit(rc)
print(out,flush=True)
