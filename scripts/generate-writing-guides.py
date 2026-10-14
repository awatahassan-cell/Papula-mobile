"""Generate vector stencils and tracing centerlines from the app's bundled Arabic font.
Requires Pillow and numpy only. Single letters (and non-joining double waw) need no contextual joining.
Run from any directory. Glyph order/IDs come directly from mockLetters.ts.
"""
from pathlib import Path
from collections import deque, defaultdict
import json, re, math, sys
import numpy as np
from PIL import Image, ImageFont, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
FONT_PATH = ROOT / 'node_modules/@expo-google-fonts/ibm-plex-sans-arabic/700Bold/IBMPlexSansArabic_700Bold.ttf'
SIZE = 400
SCALE = SIZE / 100

def rdp(points, epsilon):
    if len(points) <= 2: return points
    keep = {0, len(points)-1}
    stack = [(0,len(points)-1)]
    while stack:
        a,b = stack.pop()
        p,q = points[a],points[b]
        dx,dy = q[0]-p[0],q[1]-p[1]
        denom = dx*dx+dy*dy
        best,split = epsilon,-1
        for i in range(a+1,b):
            x,y = points[i]
            t = max(0,min(1,((x-p[0])*dx+(y-p[1])*dy)/denom)) if denom else 0
            d = math.hypot(x-p[0]-t*dx,y-p[1]-t*dy)
            if d > best: best,split = d,i
        if split >= 0: keep.add(split); stack.extend([(a,split),(split,b)])
    return [points[i] for i in sorted(keep)]

def components(mask):
    unseen = set(zip(*np.nonzero(mask)))
    groups=[]
    while unseen:
        first=unseen.pop(); group=[first]; queue=deque([first])
        while queue:
            y,x=queue.popleft()
            for dy,dx in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
                item=(y+dy,x+dx)
                if item in unseen: unseen.remove(item);group.append(item);queue.append(item)
        groups.append(group)
    return sorted(groups,key=len,reverse=True)

def skeletonize(mask):
    a=mask.astype(np.uint8).copy()
    while True:
        removed=0
        for step in range(2):
            p=[np.roll(np.roll(a,dy,axis=0),dx,axis=1) for dy,dx in [(1,0),(1,-1),(0,-1),(-1,-1),(-1,0),(-1,1),(0,1),(1,1)]]
            n=sum(p)
            transitions=sum(((p[i]==0)&(p[(i+1)%8]==1)).astype(np.uint8) for i in range(8))
            if step==0:
                c1=(p[0]*p[2]*p[4]==0);c2=(p[2]*p[4]*p[6]==0)
            else:
                c1=(p[0]*p[2]*p[6]==0);c2=(p[0]*p[4]*p[6]==0)
            erase=(a==1)&(n>=2)&(n<=6)&(transitions==1)&c1&c2
            erase[0,:]=erase[-1,:]=False;erase[:,0]=erase[:,-1]=False
            removed+=int(erase.sum());a[erase]=0
        if not removed: return a.astype(bool)

def center_paths(group):
    ys=[p[0] for p in group];xs=[p[1] for p in group]
    # Compact dot components are taps rather than artificial line shapes.
    if max(xs)-min(xs)<24 and max(ys)-min(ys)<24:
        return [[(sum(xs)/len(xs),sum(ys)/len(ys))]]
    mask=np.zeros((SIZE,SIZE),dtype=bool)
    for y,x in group: mask[y,x]=True
    pixels=set(zip(*np.nonzero(skeletonize(mask))))
    graph={}
    for y,x in pixels:
        adjacent=[]
        for dy,dx in [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]:
            other=(y+dy,x+dx)
            if other not in pixels: continue
            # Do not add a redundant diagonal shortcut across an orthogonal corner.
            if dy and dx and ((y,x+dx) in pixels or (y+dy,x) in pixels): continue
            adjacent.append(other)
        graph[(y,x)]=adjacent
    edges=set()
    def key(a,b): return tuple(sorted((a,b)))
    lines=[]
    nodes=sorted(graph,key=lambda p:(p[0],-p[1]))
    starts=[p for p in nodes if len(graph[p])!=2]+nodes
    for start in starts:
        for neighbor in graph[start]:
            if key(start,neighbor) in edges: continue
            line=[start,neighbor];edges.add(key(start,neighbor));prev,now=start,neighbor
            while len(graph[now])==2:
                candidate=next(p for p in graph[now] if p!=prev)
                if key(now,candidate) in edges: break
                edges.add(key(now,candidate));line.append(candidate);prev,now=now,candidate
            xy=[(x+0.5,y+0.5) for y,x in line]
            length=sum(math.dist(xy[i],xy[i+1]) for i in range(len(xy)-1))
            # Pixel thinning can leave very small spurs; do not teach those as strokes.
            if length>=4: lines.append(rdp(xy,0.8))
    if not lines:
        return [[(sum(xs)/len(xs),sum(ys)/len(ys))]]
    return lines

def vector_outline(mask):
    outgoing=defaultdict(list)
    for y,x in zip(*np.nonzero(mask)):
        if not mask[y-1,x]: outgoing[(x,y)].append((x+1,y))
        if not mask[y,x+1]: outgoing[(x+1,y)].append((x+1,y+1))
        if not mask[y+1,x]: outgoing[(x+1,y+1)].append((x,y+1))
        if not mask[y,x-1]: outgoing[(x,y+1)].append((x,y))
    contours=[]
    while outgoing:
        start=next(iter(outgoing));now=start;contour=[start]
        while True:
            next_point=outgoing[now].pop()
            if not outgoing[now]: del outgoing[now]
            contour.append(next_point);now=next_point
            if now==start: break
        contour=contour[:-1]
        split=max(range(len(contour)),key=lambda i:math.dist(contour[0],contour[i]))
        smooth=rdp(contour[:split+1],0.65)+rdp(contour[split:]+[contour[0]],0.65)[1:]
        coords=[(round(x/SCALE,3),round(y/SCALE,3)) for x,y in smooth]
        contours.append('M'+' L'.join(f'{x:g} {y:g}' for x,y in coords)+' Z')
    return ' '.join(contours)

letters=re.findall(r"id: '([^']+)',\s*glyph: '([^']+)'",(ROOT/'src/data/mockLetters.ts').read_text(encoding='utf-8-sig'))
assert len(letters)==34
result={};previews=[]
for letter_id,glyph in letters:
    font_size=260
    while True:
        font=ImageFont.truetype(str(FONT_PATH),font_size)
        bbox=font.getbbox(glyph,anchor='ls')
        if bbox[2]-bbox[0]<=340 and bbox[1]>=-248 and bbox[3]<=92: break
        font_size-=2
    image=Image.new('L',(SIZE,SIZE),0)
    x=(SIZE-(bbox[2]-bbox[0]))/2-bbox[0]
    ImageDraw.Draw(image).text((x,280),glyph,font=font,fill=255,anchor='ls')
    mask=np.asarray(image)>100
    assert mask.any() and not mask[0,:].any() and not mask[-1,:].any()
    groups=components(mask)
    strokes=[]; component_ids=[]
    for component_id,group in enumerate(groups):
        lines=center_paths(group)
        strokes.extend(lines);component_ids.extend([component_id]*len(lines))
    strokes=[[{'x':round(x/SCALE,3),'y':round(y/SCALE,3)} for x,y in stroke] for stroke in strokes]
    assert strokes
    # Centerlines must lie within their actual rendered glyph, with no arbitrary hand-drawn geometry.
    for stroke in strokes:
        for point in stroke:
            px,py=int(point['x']*SCALE),int(point['y']*SCALE)
            assert mask[max(0,py-2):py+3,max(0,px-2):px+3].any(),(letter_id,point)
    result[letter_id]={'letterId':letter_id,'glyph':glyph,'outlinePath':vector_outline(mask),'strokes':strokes,'componentIds':component_ids,
      'instructionKu':'لە خاڵە سەوزەکە دەست پێ بکە و هەموو هێڵ و خاڵەکانی پیتەکە تەواو بکە',
      'suggestedSpeedMs':max(2800,len(strokes)*700),'fontSource':'IBMPlexSansArabic_700Bold'}
    previews.append((glyph,image,strokes))
(ROOT/'src/data/fontLetterGuides.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
# QA sheet includes the exact source glyph and its extracted tracing centerlines.
proof=Image.new('RGB',(7*200,5*240),'#fffef7');draw=ImageDraw.Draw(proof)
label_font=ImageFont.truetype(str(FONT_PATH),28)
for i,(glyph,image,strokes) in enumerate(previews):
    left=(i%7)*200;top=(i//7)*240
    tile=Image.new('RGB',(200,200),'#fffef7');scaled=image.resize((200,200))
    tile.paste('#b4c3d0',(0,0),scaled)
    d=ImageDraw.Draw(tile)
    for stroke in strokes:
        points=[(p['x']*2,p['y']*2) for p in stroke]
        if len(points)==1: d.ellipse((points[0][0]-2,points[0][1]-2,points[0][0]+2,points[0][1]+2),fill='#047857')
        else: d.line(points,fill='#0369a1',width=2)
    proof.paste(tile,(left,top));draw.text((left+100,top+204),glyph,font=label_font,fill='#78350f',anchor='mt')
if '--preview' in sys.argv:
    qa_path=Path(sys.argv[sys.argv.index('--preview')+1])
    qa_path.parent.mkdir(parents=True,exist_ok=True)
    proof.save(qa_path)
    print(f'QA: {qa_path}')
print(f'Generated {len(result)} font stencils; {sum(len(g["strokes"]) for g in result.values())} centerline paths.')
print(json.dumps({key:len(value['strokes']) for key,value in result.items()}))
