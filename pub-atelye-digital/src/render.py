import sys, subprocess
sys.path.insert(0, __file__.rsplit("/",1)[0])
import build
from engine import render_frame, FPS
k, n, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
step = float(sys.argv[4]) if len(sys.argv) > 4 else 1
NF = int(build.TOTAL * FPS)
per = (NF + n - 1) // n
f0, f1 = k * per, min(NF, (k + 1) * per)
p = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s","1080x1920","-r",str(FPS),"-i","-",
     "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",out], stdin=subprocess.PIPE)
for f in range(f0, f1):
    fr = render_frame(f / FPS, build.BG_IMG, build.scenes, build.CAPS)
    p.stdin.write(fr.convert("RGB").tobytes())
p.stdin.close(); p.wait()
print("done", k, f0, f1)
