import json, math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen

WORD = sys.argv[1] if len(sys.argv) > 1 else "TELÓN"
FONT = "/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyreheroscn-bold.otf"
W, H, FR, OP = 1920, 1080, 60, 30           # 30 frames @60fps = 0.5 s
CX, CY = W/2, H/2
ANG = math.radians(22)                        # direccion del wipe (abajo-derecha) -> borde en "/"
D = (math.cos(ANG), math.sin(ANG))
SLAB = 2700                                   # ancho de cada franja a lo largo de D
OFF = 2500                                    # fuera de pantalla (izq/der)
L = 3200                                      # semilargo del borde (sobrado para full-bleed)

def rgb(h): return [int(h[i:i+2],16)/255 for i in (1,3,5)] + [1]
BLUE, RED, YEL, CREAM = rgb("#1A3A82"), rgb("#D9261C"), rgb("#FFC400"), rgb("#FFF3D1")

# ---------- easing ----------
OUT = ((0.30,0.0),(0.15,1.0))      # arranca firme, asienta suave
IN  = ((0.85,0.0),(0.70,1.0))      # espejo exacto de OUT
LIN = ((0.0,0.0),(1.0,1.0))

def prop(keys, dims=1):
    """keys: [(t, value, ease_to_next)]; value scalar or list."""
    ks=[]
    for n,(t,v,ez) in enumerate(keys):
        v = v if isinstance(v,list) else [v]
        kf={"t":t,"s":v}
        if n < len(keys)-1:
            nv = keys[n+1][1]; nv = nv if isinstance(nv,list) else [nv]
            (ox,oy),(ix,iy)=ez
            kf["e"]=nv
            kf["o"]={"x":[ox]*dims,"y":[oy]*dims}
            kf["i"]={"x":[ix]*dims,"y":[iy]*dims}
        ks.append(kf)
    return {"a":1,"k":ks}
def static(v): return {"a":0,"k":v}

def layer(ind, name, shapes, p, s=None, o=None):
    return {"ddd":0,"ind":ind,"ty":4,"nm":name,"sr":1,
        "ks":{"o":o or static(100),"r":static(0),"p":p,"a":static([0,0,0]),
              "s":s or static([100,100,100])},
        "ao":0,"shapes":shapes,"ip":0,"op":OP,"st":0,"bm":0}

def group(paths, color, name):
    it=[{"ty":"sh","ks":{"a":0,"k":p},"nm":"p%d"%n} for n,p in enumerate(paths)]
    it.append({"ty":"fl","c":static(color),"o":static(100),"r":1,"nm":"fill"})
    it.append({"ty":"tr","p":static([0,0]),"a":static([0,0]),"s":static([100,100]),
               "r":static(0),"o":static(100),"sk":static(0),"sa":static(0)})
    return {"ty":"gr","it":it,"nm":name}

def poly(pts):
    return {"i":[[0,0]]*len(pts),"o":[[0,0]]*len(pts),"v":[list(map(lambda x: round(x,2),p)) for p in pts],"c":True}

# ---------- franjas diagonales ----------
E = (-D[1], D[0])  # direccion del borde (perpendicular a D)
def slab_path():
    a,b = SLAB/2, L
    return poly([(-a*D[0]-b*E[0], -a*D[1]-b*E[1]), ( a*D[0]-b*E[0],  a*D[1]-b*E[1]),
                 ( a*D[0]+b*E[0],  a*D[1]+b*E[1]), (-a*D[0]+b*E[0], -a*D[1]+b*E[1])])
def pos(s): return [round(CX+s*D[0],2), round(CY+s*D[1],2), 0]

def slab_layer(ind, name, color, t_in, t_out):
    # t_in=(ini,fin) entrada ; t_out=(ini,fin) salida
    keys=[(0,pos(-OFF),LIN),(t_in[0],pos(-OFF),OUT),(t_in[1],pos(0),LIN),
          (t_out[0],pos(0),IN),(t_out[1],pos(OFF),LIN),(OP-1,pos(OFF),LIN)]
    # (ultimo key sostiene fuera de pantalla hasta el final)
    keys=[k for k in keys]
    return layer(ind,name,[group([slab_path()],color,name)],prop(keys,1))

# ---------- tipografia como paths ----------
class P(BasePen):
    def __init__(s,gs): super().__init__(gs); s.cs=[]; s.cur=None
    def _moveTo(s,p): s.cur=[("M",p)]
    def _lineTo(s,p): s.cur.append(("L",p))
    def _curveToOne(s,a,b,c): s.cur.append(("C",a,b,c))
    def _qCurveToOne(s,a,b):
        p0=s._getCurrentPoint()
        c1=(p0[0]+2/3*(a[0]-p0[0]),p0[1]+2/3*(a[1]-p0[1]))
        c2=(b[0]+2/3*(a[0]-b[0]),b[1]+2/3*(a[1]-b[1]))
        s.cur.append(("C",c1,c2,b))
    def _closePath(s):
        if s.cur: s.cs.append(s.cur)
        s.cur=None
    _endPath=_closePath

def to_lottie(contour, mp, mv):
    v=[contour[0][1]]; ins=[(0,0)]; outs=[(0,0)]
    for seg in contour[1:]:
        if seg[0]=="L":
            v.append(seg[1]); ins.append((0,0)); outs.append((0,0))
        else:
            _,a,b,c=seg; pv=v[-1]
            outs[-1]=(a[0]-pv[0],a[1]-pv[1]); v.append(c)
            ins.append((b[0]-c[0],b[1]-c[1])); outs.append((0,0))
    if len(v)>1 and abs(v[-1][0]-v[0][0])<1e-6 and abs(v[-1][1]-v[0][1])<1e-6:
        ins[0]=ins[-1]; v.pop(); ins.pop(); outs.pop()
    r=lambda q:[round(q[0],2),round(q[1],2)]
    return {"v":[r(mp(p)) for p in v],"i":[r(mv(p)) for p in ins],"o":[r(mv(p)) for p in outs],"c":True}

font=TTFont(FONT); gs=font.getGlyphSet(); cmap=font.getBestCmap()
SLANT=math.tan(math.radians(9)); TRACK=18
pen_contours=[]; x=0
for ch in WORD:
    g=cmap[ord(ch)]; pen=P(gs); gs[g].draw(pen)
    for c in pen.cs:
        pen_contours.append([(seg[0],*[(q[0]+x,q[1]) for q in seg[1:]]) for seg in c])
    x+=gs[g].width+TRACK
shear=lambda q:(q[0]+q[1]*SLANT,q[1])
xs=[];ys=[]
for c in pen_contours:
    for seg in c:
        for q in seg[1:]:
            sx,sy=shear(q); xs.append(sx); ys.append(sy)
cap=max(y for y in (gs[cmap[ord('T')]].width and [0]) or [0]) # placeholder
from fontTools.pens.boundsPen import BoundsPen
bp=BoundsPen(gs); gs[cmap[ord('T')]].draw(bp); CAP=bp.bounds[3]
minx,maxx=min(xs),max(xs); topy=max(ys)
TARGET_W=1330; sc=TARGET_W/(maxx-minx)
ox=-(minx+maxx)/2*sc; oy=(CAP/2)*sc
mp=lambda q:(shear(q)[0]*sc+ox, -shear(q)[1]*sc+oy)
mv=lambda q:(shear(q)[0]*sc, -shear(q)[1]*sc) if False else ((q[0]+q[1]*SLANT)*sc, -q[1]*sc)
text_paths=[to_lottie(c,mp,mv) for c in pen_contours]
capH=CAP*sc; accent_top=topy*sc-oy   # (y hacia abajo negativo)
print("cap px",round(capH),"ancho px",round((maxx-minx)*sc),"acento sobre centro",round(-(-topy*sc+oy)))

# ---------- animacion del titulo ----------
def text_layer(ind,name,color,dx,dy):
    pk=[(0,[CX+dx,CY+dy,0],LIN),(OP-1,[CX+dx,CY+dy,0],LIN)]
    sk=prop([(0,[88,88,100],LIN),(7.5,[88,88,100],OUT),(12,[100,100,100],LIN),(18,[100,100,100],IN),(20.5,[107,107,100],LIN),(OP-1,[107,107,100],LIN)],3)
    ok=prop([(0,0,LIN),(7.5,0,OUT),(10.5,100,LIN),(18,100,IN),(20.5,0,LIN),(OP-1,0,LIN)],1)
    # pivote en el centro del texto: el origen del path ya esta centrado
    return layer(ind,name,[group(text_paths,color,name)],prop(pk,1) if False else static([CX+dx,CY+dy,0]),sk,ok)

top_y = -(CAP*sc/2) - (topy-CAP)*sc - 46   # sobre el acento de la O
RULE_H=18; RULE_W=TARGET_W
def rule_layer(ind,name,color,y,t0):
    sx=prop([(0,0,LIN),(t0,0,OUT),(t0+5,100,LIN),(17,100,IN),(20,0,LIN),(OP-1,0,LIN)],1)
    s=prop([(0,[0,100,100],LIN),(t0,[0,100,100],OUT),(t0+5,[100,100,100],LIN),(17,[100,100,100],IN),(20,[0,100,100],LIN),(OP-1,[0,100,100],LIN)],3)
    r=poly([(-RULE_W/2,-RULE_H/2),(RULE_W/2,-RULE_H/2),(RULE_W/2,RULE_H/2),(-RULE_W/2,RULE_H/2)])
    return layer(ind,name,[group([r],color,name)],static([CX,CY+y,0]),s)

layers=[
  text_layer(1,"Titulo crema",CREAM,0,0),
  text_layer(2,"Titulo sombra roja",RED,13,13),
  rule_layer(3,"Regla amarilla",YEL,top_y,6.5),
  rule_layer(4,"Regla roja",RED,-top_y+CAP*sc*0+0,7.3),
  slab_layer(5,"Franja azul",BLUE,(3,14),(16,26)),
  slab_layer(6,"Franja roja",RED,(1.5,12.5),(17.5,27.5)),
  slab_layer(7,"Franja amarilla",YEL,(0,11),(19,29)),
]
doc={"v":"5.7.0","fr":FR,"ip":0,"op":OP,"w":W,"h":H,"nm":"Transicion cartel teatro","ddd":0,
     "assets":[],"layers":layers,"markers":[]}
json.dump(doc,open("transicion_telon.json","w"),separators=(",",":"))
print("ok", len(json.dumps(doc))//1024,"KB")
