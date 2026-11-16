#!/bin/sh
# Generate the e2e fixture library — runs INSIDE the e2e Jellyfin container (it
# ships jellyfin-ffmpeg, so CI and dev machines need no ffmpeg of their own).
#
#   e2e-fixtures.sh <root>      → <root>/music/<Artist>/<Album>/NN - Title.mp3 (+cover.jpg)
#                                 <root>/books/<Book>/NN - Part N.mp3
#
# Every file is REAL, decodable audio (a tone, 32 kbps mono MP3 — direct-play in
# Chromium, no AAC), ≥ 60 s long (the native seek-to-42s and audiobook-resume
# scenarios need headroom), fully tagged (title/artist/album artist/album/track/
# disc/genre/year) so Jellyfin builds artists, albums, discs, genres and books
# exactly as the scenarios assume (see e2e/features/** — "love" songs + artist,
# the two-disc "Rent", "Pop" genre, a multi-part audiobook). Deterministic:
# the same library every run, so a failing scenario is a bug, never "the data".
set -eu
ROOT="${1:?usage: e2e-fixtures.sh <root>}"
FFMPEG="${FFMPEG:-/usr/lib/jellyfin-ffmpeg/ffmpeg}"
# Quiet, overwrite, tone source. Frequency varies per track so clips differ.
ff() { "$FFMPEG" -nostdin -hide_banner -loglevel error -y "$@"; }

# cover <dir> <hex-rgb> — a flat-colour 600×600 album cover (Jellyfin reads it as
# the album's primary image → every track row/search result shows art).
cover() {
  mkdir -p "$1"
  ff -f lavfi -i "color=c=0x$2:s=600x600:d=1" -frames:v 1 "$1/cover.jpg"
}

# track <dir> <artist> <albumartist> <album> <year> <genre> <disc> <disctotal> <n> <total> <title> <secs> <hz>
track() {
  dir=$1 artist=$2 aartist=$3 album=$4 year=$5 genre=$6 disc=$7 dtot=$8 n=$9
  shift 9; total=$1 title=$2 secs=$3 hz=$4
  mkdir -p "$dir"
  ff -f lavfi -i "sine=frequency=${hz}:duration=${secs}" -af volume=0.25 -ac 1 -ar 44100 \
    -c:a libmp3lame -b:a 32k -id3v2_version 3 \
    -metadata "title=$title" -metadata "artist=$artist" -metadata "album_artist=$aartist" \
    -metadata "album=$album" -metadata "track=$n/$total" -metadata "disc=$disc/$dtot" \
    -metadata "genre=$genre" -metadata "date=$year" \
    "$dir/$(printf '%02d' "$n") - $title.mp3"
}

# album <artist> <album> <year> <genre> <hex> <titles…> — one-disc album, 60–74 s tracks.
album() {
  artist=$1 name=$2 year=$3 genre=$4 hex=$5; shift 5
  dir="$ROOT/music/$artist/$name"; cover "$dir" "$hex"
  total=$#; n=0
  for title in "$@"; do
    n=$((n + 1))
    track "$dir" "$artist" "$artist" "$name" "$year" "$genre" 1 1 "$n" "$total" "$title" $((60 + n * 2)) $((220 + n * 37))
  done
}

M="$ROOT/music"; mkdir -p "$M"
# ≥ 5 songs with "love" in the title (search "love" must show MORE than the
# 4-row preview) and ONE artist whose name contains "love" (artist search).
album "Lovelight Parade" "Neon Letters" 2021 Pop 1db954 \
  "Love in Stereo" "Lovesick Avenue" "Paper Love" "Midnight Lovers" \
  "Glovebox Radio" "Static Hearts" "Harbor Lights" "Last Train"
album "Ada Vance" "Love Letters EP" 2023 Pop e63946 \
  "Love Letters" "Dear Love" "Quiet Streets" "Porch Light"
album "The Tidal Room" "Saltwater" 2019 Indie 457b9d \
  "Undertow" "Lanterns" "Salt and Cedar" "Northern Pier" "Driftwood" "Low Tide" "Kelp Forest" "Open Water"
album "Juniper Fields" "Orchard Songs" 2020 Pop f4a261 \
  "Apple Blossom" "Ladder Days" "Cider Moon" "Fence Line" "Honey Jar" "Harvest Dance" "Barn Owl" "First Frost"
album "Copper Kettle" "Brass and Steam" 2018 Rock 6d597a \
  "Boiler Room" "Rivet Gun" "Iron Horse" "Smokestack" "Gear Shift" "Pressure Valve" "Foundry" "Coal Dust"
# A TWO-DISC album named exactly "Rent" (album.feature: "Disc 1" / "Disc 2" headers).
R="$M/Marlow Street Company/Rent"; cover "$R" 2a9d8f
d=0; for title in "Overture" "Tune Up" "Rent Day" "One Song Glory" "Light My Candle"; do
  d=$((d + 1)); track "$R/Disc 1" "Marlow Street Company" "Marlow Street Company" "Rent" 2017 Pop 1 2 "$d" 5 "$title" $((60 + d * 3)) $((330 + d * 29))
done
d=0; for title in "Seasons of Rent" "Take Me or Leave Me" "Without You" "Finale A" "Finale B"; do
  d=$((d + 1)); track "$R/Disc 2" "Marlow Street Company" "Marlow Street Company" "Rent" 2017 Pop 2 2 "$d" 5 "$title" $((60 + d * 3)) $((310 + d * 31))
done

# Audiobooks: a `books` library turns these into AudioBook items. Jellyfin 12
# derives each later part's `Album` from the PREVIOUS part's title (not from the
# album tag), so every part carries the BOOK TITLE as its title — then all parts
# share one Album and the app groups them into one book (groupBooks). Each part
# ≥ 120 s so "resume where I left off" (needs > 12 s played, ≥ 15 s from the end)
# has room. "Harbor Winds" sorts first → it is the book the scenarios play and
# resume.
B="$ROOT/books"
book() {
  title=$1 author=$2 parts=$3 hex=$4; dir="$B/$title"; cover "$dir" "$hex"
  p=0; while [ "$p" -lt "$parts" ]; do
    p=$((p + 1))
    track "$dir" "$author" "$author" "$title" 2022 Audiobook 1 1 "$p" "$parts" "$title" 150 $((180 + p * 23))
  done
}
book "Harbor Winds" "Mara Quill" 3 264653
book "The Lighthouse Letters" "Tobias Reyn" 2 8d99ae

echo "e2e-fixtures: $(find "$M" -name '*.mp3' | wc -l) songs, $(find "$B" -name '*.mp3' | wc -l) audiobook parts under $ROOT"
