#!/bin/bash
# check.sh — self-review after a render. Usage: bash scripts/check.sh [out/film.mp4]
# Writes out/check/: sheet.png (12 frames), f-<sec>.png at given times, and prints
# the motion curve (mean frame difference per 0.5 s) with unplanned spikes flagged.
#   TIMES="0 4.8 10 19.9" bash scripts/check.sh     # extra stills at these seconds
set -e
cd "$(dirname "$0")/.."
in="${1:-out/film.mp4}"; out=out/check; mkdir -p "$out"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")

# 1. format against src/spec.ts FILM
spec() { grep -oE "FILM *= *\{[^}]*" src/spec.ts | grep -oE "$1: *[0-9.a-z]+" | head -1 | sed -E 's/.*: *//'; }
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$in")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$in")
R=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print int($1/($2?$2:1)+0.5)}')
A=$(ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "$in" | head -1)
echo "format: ${W}x${H} ${R}fps ${D}s audio=${A:-none}"
fail=0
[ -n "$(spec width)" ] && [ "$(spec width)" != "$W" ] && { echo "  FAIL width $W, spec says $(spec width)"; fail=1; }
[ -n "$(spec height)" ] && [ "$(spec height)" != "$H" ] && { echo "  FAIL height $H, spec says $(spec height)"; fail=1; }
[ -n "$(spec fps)" ] && [ "$(spec fps)" != "$R" ] && { echo "  FAIL fps $R, spec says $(spec fps)"; fail=1; }
[ -n "$(spec duration)" ] && awk "BEGIN{exit !($D < $(spec duration) - 0.1 || $D > $(spec duration) + 0.1)}" && { echo "  FAIL duration $D, spec says $(spec duration)"; fail=1; }
[ "$(spec sound)" = "true" ] && [ -z "$A" ] && { echo "  FAIL spec has sound: true but the video has no audio"; fail=1; }
grep -q "title: 'TITLE'" src/spec.ts 2>/dev/null && { echo "  FAIL src/spec.ts is still the starter placeholder (TITLE, 10 s): write FILM and COPY from the prompt"; fail=1; }
[ $fail = 0 ] && echo "  format matches spec.ts"

# 2. first frame and loop seam
px() { ffmpeg -loglevel error -ss "$1" -i "$in" -frames:v 1 -vf "crop=60:60:30:30,scale=1:1" -f rawvideo -pix_fmt rgb24 - | xxd -p; }
c0=$(px 0); c1=$(px 1)
dd=$(awk -v a="$c0" -v b="$c1" 'function h(s,i){return ("0x" substr(s,i,2))+0} BEGIN{m=0; for(i=1;i<=5;i+=2){d=h(a,i)-h(b,i); if(d<0)d=-d; if(d>m)m=d}; print m}')
if [ "$dd" -gt 6 ]; then echo "  FAIL frame 0 background #$c0 differs from 1 s #$c1 (a colour flash at the start)"; fail=1; else echo "  frame 0 background matches (#$c0)"; fi
if ! grep -qE '"loop": *false' scripts/cues.json 2>/dev/null; then
  ffmpeg -loglevel error -y -i "$in" -frames:v 1 -vf "scale=480:270,format=gray" "$out/.first.png"
  ffmpeg -loglevel error -y -sseof -1 -i "$in" -an -update 1 -vf "scale=480:270,format=gray" "$out/.last.png"
  ss=$(ffmpeg -hide_banner -i "$out/.first.png" -i "$out/.last.png" -lavfi ssim -f null - 2>&1 | grep -oE 'All:[0-9.]+' | tail -1 | cut -d: -f2)
  if awk "BEGIN{exit !($ss < 0.97)}"; then echo "  FAIL loop seam: last frame vs first frame SSIM $ss (< 0.97)"; fail=1; else echo "  loop seam ok (SSIM $ss)"; fi
fi

# 3. sound: spectrogram + loudness (a real score shows pitched lines with decays, not flat noise blocks)
if [ -n "$A" ]; then
  ffmpeg -loglevel error -y -i "$in" -lavfi "showspectrumpic=s=1200x240:legend=0:scale=log" "$out/audio.png"
  ffmpeg -hide_banner -i "$in" -vn -af volumedetect -f null - 2>&1 | grep -oE "(mean|max)_volume: [-0-9.]+ dB" | tr '\n' ' '; echo "(spectrogram: $out/audio.png)"
fi
ffmpeg -loglevel error -y -i "$in" -vf "fps=12/$D,scale=480:-1,tile=4x3" -frames:v 1 "$out/sheet.png"
for t in 0 ${TIMES:-} $(awk "BEGIN{printf \"%.2f\", $D/2}") $(awk "BEGIN{printf \"%.2f\", $D-0.05}"); do
  ffmpeg -loglevel error -y -ss "$t" -i "$in" -frames:v 1 -vf scale=960:-1 "$out/f-$t.png"
done
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$in" | awk -F/ '{print int($1/($2?$2:1)+0.5)}')
HALF=$(( FPS / 2 ))
echo "motion per 0.5 s (mean |frame diff|, 0-255):"
ffmpeg -loglevel error -i "$in" -vf "scale=192:108,format=gray,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-" -f null - 2>/dev/null \
  | grep -o 'YAVG=[0-9.]*' | cut -d= -f2 \
  | awk -v h="$HALF" '{s+=$1; n++; if (n%h==0) {v[++k]=s/h; s=0}}
      END {
        for (i=1;i<=k;i++) a[i]=v[i]; m=k; for(i=1;i<=m;i++)for(j=i+1;j<=m;j++)if(a[j]<a[i]){x=a[i];a[i]=a[j];a[j]=x}
        med=a[int((m+1)/2)]; if (med<0.05) med=0.05
        for (i=1;i<=k;i++) { t=(i-1)*0.5; flag=(v[i]>4*med && v[i]>1)?"  <-- spike":""; if (v[i]<0.005) flag="  (still)"; printf "%6.1fs %6.2f%s\n", t, v[i], flag }
        printf "median %.2f — a spike must be a planned hit; a run of (still) longer than the planned hold is a dead spot\n", med }'
echo "stills: $out"
