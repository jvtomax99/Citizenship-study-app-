#!/bin/sh
# Finish a render for the app: voice levelled to -16 LUFS, 720 x 1280 H.264 small enough for the web,
# moov atom up front so it starts playing at once, and a poster frame.
# Run in promo/ after `npm run render:en` (or :es): sh tools/finish.sh en
set -e
L=${1:-en}
mkdir -p ../media
ffmpeg -loglevel error -y -i out/how-to-use-$L.mp4 \
  -vf scale=720:-2:flags=lanczos -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p \
  -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 96k -ar 48000 \
  -movflags +faststart ../media/how-to-use-$L.mp4
ffmpeg -loglevel error -y -ss 11 -i out/how-to-use-$L.mp4 -frames:v 1 -vf scale=540:-2 -q:v 4 ../media/how-to-use-$L.jpg
ls -la ../media/how-to-use-$L.mp4 ../media/how-to-use-$L.jpg
