import numpy as np, wave, sys
SR=48000; out=sys.argv[1]; DUR=float(sys.argv[2])
rng=np.random.default_rng(7)
def save(name,x):
    x=np.clip(x,-1,1); 
    if x.ndim==1: x=np.stack([x,x],1)
    w=wave.open(f"{out}/{name}.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
def t(d): return np.arange(int(d*SR))/SR
def lp(x,a):  # one-pole lowpass, a in (0,1)
    from scipy.signal import lfilter
    return lfilter([a],[1,a-1],x,axis=0)
def env(n,att,rel): 
    e=np.ones(n); A=int(att*SR); R=int(rel*SR)
    if A: e[:A]=np.linspace(0,1,A)
    if R: e[-R:]*=np.linspace(1,0,R)**2
    return e
# ---------- SFX ----------
def whoosh(d=0.6,up=True):
    n=int(d*SR); x=rng.standard_normal(n)
    from scipy.signal import butter,sosfilt
    f=np.linspace(300,4000,n) if up else np.linspace(4000,300,n)
    y=np.zeros(n); blk=1024
    for i in range(0,n,blk):
        sos=butter(2,[f[i]*0.6,f[i]*1.4],btype='band',fs=SR,output='sos'); y[i:i+blk]=sosfilt(sos,x[i:i+blk])
    e=np.sin(np.linspace(0,np.pi,n))**2
    y=y*e; return y/np.abs(y).max()*0.7
save("whoosh",whoosh()); save("whoosh_short",whoosh(0.35))
tt=t(0.12); save("pop",np.sin(2*np.pi*(900-500*tt/0.12)*tt)*np.exp(-tt*35)*0.8)
tt=t(0.05); save("click",(np.sin(2*np.pi*2200*tt)*0.5+rng.standard_normal(len(tt))*0.3)*np.exp(-tt*120)*0.7)
tt=t(0.9); d=(np.sin(2*np.pi*1318.5*tt)+0.5*np.sin(2*np.pi*1975.5*tt)+0.25*np.sin(2*np.pi*2637*tt))*np.exp(-tt*5); save("ding",d/np.abs(d).max()*0.6)
tt=t(1.5); r=np.sin(2*np.pi*np.cumsum(np.linspace(200,1200,len(tt)))/SR)*np.linspace(0,1,len(tt))**2; r+=lp(rng.standard_normal(len(tt)),0.2)*np.linspace(0,1,len(tt))**3*0.6; save("riser",r/np.abs(r).max()*0.6)
tt=t(1.2); b=np.sin(2*np.pi*(55+60*np.exp(-tt*20))*tt)*np.exp(-tt*3.5); b+=lp(rng.standard_normal(len(tt)),0.05)*np.exp(-tt*6)*0.5; save("impact",b/np.abs(b).max()*0.9)
tt=t(0.08); save("tick",np.sin(2*np.pi*3000*tt)*np.exp(-tt*80)*0.4)
# ---------- MUSIC ----------
BPM=96; beat=60/BPM; n=int(DUR*SR); L=np.zeros((n,2))
def add(sig,start,pan=0.0):
    i=int(start*SR); j=min(n,i+len(sig)); 
    if i>=n: return
    s=sig[:j-i]; L[i:j,0]+=s*(1-max(0,pan)); L[i:j,1]+=s*(1+min(0,pan))
def note(f): return 440*2**((f-69)/12)
tk=t(0.45); kick=np.sin(2*np.pi*np.cumsum(50+90*np.exp(-tk*30))/SR)*np.exp(-tk*7)*0.9
th=t(0.06); hat=lp(rng.standard_normal(len(th)),0.9); hat=(hat-lp(hat,0.3))*np.exp(-th*70)*0.25
ts=t(0.25); snare=(rng.standard_normal(len(ts))*0.5+np.sin(2*np.pi*190*ts)*0.5)*np.exp(-ts*18)*0.35
# progression Am - F - C - G (Fmaj7 flavour), each 2 bars
chords=[[57,60,64,67],[53,57,60,64],[48,55,60,64],[55,59,62,67]]; bass=[45,41,48,43]
bar=4*beat; total_bars=int(DUR/bar)+1
for b in range(total_bars):
    c=(b//2)%4; t0=b*bar
    # pad
    tp=t(bar+0.3); pad=np.zeros(len(tp))
    for m in chords[c]:
        for det in (-0.08,0.08): pad+=np.sin(2*np.pi*note(m+12*0)*(1+det/100)*tp)+0.3*np.sin(2*np.pi*note(m)*2*tp)
    pad=lp(pad*env(len(tp),0.25,0.4),0.15)*0.035; add(pad,t0)
    # pluck arp
    for k in range(8):
        m=chords[c][[0,1,2,3,2,1,2,3][k]]+12; tq=t(0.4)
        pl=np.sin(2*np.pi*note(m)*tq)*np.exp(-tq*9)*0.05; add(pl,t0+k*beat/2,pan=0.4 if k%2 else -0.4)
    # bass
    for k in (0,2.5):
        tb=t(beat*1.4); bs=np.tanh(2*np.sin(2*np.pi*note(bass[c]-12)*tb))*env(len(tb),0.01,0.3)*0.16; add(lp(bs,0.2),t0+k*beat)
    if b>=2:  # drums enter after intro
        for k in range(4):
            if k in (0,2): add(kick,t0+k*beat)
            if k in (1,3): add(snare,t0+k*beat)
        for k in range(8): add(hat*(1 if k%2 else 0.6),t0+k*beat/2,pan=0.2)
L/=np.abs(L).max(); L*=0.8
fade=int(3*SR); L[-fade:]*=np.linspace(1,0,fade)[:,None]
save("music",L)
