#!/bin/bash
# One episode from the client's recording to the final video:  bash fini.sh N path/to/videyo-N.m4a
#   align (voice -> scene timings) -> build (scenes) -> render (HyperFrames) -> mix (voice + music + whoosh) -> out/Videyo-N-*.mp4
set -euo pipefail
cd "$(dirname "$0")"
export HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_UPDATE_CHECK=1
N="$1"; VOICE="$2"
python3 align.py "$N" "$VOICE"
python3 build.py "$N"
npx hyperframes lint 2>&1 | grep -E "✗|error\(s\)" || true
mkdir -p renders out
npx hyperframes render --quality high --output "renders/ep$N.mp4" 2>&1 | tail -2
python3 mix.py "$N"
SLUG=$(python3 -c "from script import EPISODES; import re, unicodedata as u; t=EPISODES[$N-1][0]; t=u.normalize('NFKD', t).encode('ascii','ignore').decode(); print(re.sub(r'[^A-Za-z0-9]+','-',t).strip('-'))")
ffmpeg -v error -y -i "renders/ep$N.mp4" -i "assets/audio/mix-ep$N.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart "out/Videyo-$N-$SLUG.mp4"
echo "out/Videyo-$N-$SLUG.mp4"
