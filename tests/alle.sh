#!/usr/bin/env bash
# Alle Durchläufe, und zwar so, dass ein Fehlschlag auch auffällt.
#
# WARUM ES DIESE DATEI GIBT
# -------------------------
# Vorher lief die Regression als Einzeiler, der nur den Exit-Code prüfte:
#
#     for f in tests/test-*.js; do node "$f" || echo "kaputt"; done
#
# 29 der 38 Durchläufe geben aber gar keinen Exit-Code. Sie schreiben
# "Fehler: ..." in die Ausgabe und beenden sich trotzdem mit 0. Der
# Einzeiler meldete deshalb "alles grün", während test-navigation.js
# gerade "Chef sieht 7 statt 6 Kacheln" ausgab.
#
# Zwei Lehren, beide hier eingebaut:
#   1. Ein Prüfer, der nur eine Sorte Fehlersignal kennt, prüft nichts.
#      Dieser hier kennt vier: Exit-Code, "✗", "Fehler: <etwas>" und
#      PAGEERROR.
#   2. Ein Durchlauf, der gar nichts ausgibt, ist verdächtig, nicht gut.
#      Auch das wird gemeldet.
#
# Aufruf:  bash tests/alle.sh
#          bash tests/alle.sh test-chat        (nur passende)

set -u
cd "$(dirname "$0")/.."

NODE=${NODE:-/opt/node22/bin/node}
export NODE_PATH=${NODE_PATH:-/opt/node22/lib/node_modules}
MUSTER=${1:-}
ZEIT=${ZEIT:-240}

# Server muss laufen, sonst scheitert alles auf dieselbe Art
if ! curl -s -o /dev/null --max-time 3 http://127.0.0.1:8765/index.html; then
  echo "Kein Testserver auf 8765. Starte einen:"
  echo "  python3 -m http.server 8765"
  exit 2
fi

gruen=0; rot=0; stumm=0
# Leer vorbelegen: mit "set -u" ist ein unbenutztes Array am Ende ein
# Fehler, und dann stirbt der Läufer genau dann, wenn ALLES grün war.
ROTE=()

for f in tests/test-*.js; do
  name=$(basename "$f" .js)
  [ -n "$MUSTER" ] && [[ "$name" != *"$MUSTER"* ]] && continue

  aus=$(timeout "$ZEIT" "$NODE" "$f" 2>&1); rc=$?

  grund=""
  if [ $rc -ne 0 ]; then
    grund="Exit-Code $rc"
  elif printf '%s' "$aus" | grep -qE '^✗'; then
    grund=$(printf '%s' "$aus" | grep -E '^✗' | head -3 | tr '\n' ' ')
  elif printf '%s' "$aus" | grep -qE '^Fehler:' &&
       ! printf '%s' "$aus" | grep -qE '^Fehler: *keine *$'; then
    # "Fehler:" steht in vielen Durchläufen am Ende, gefolgt von "keine"
    # oder von der Liste. Nur die Liste zählt.
    grund=$(printf '%s' "$aus" | grep -A3 -E '^Fehler:' | tr '\n' ' ')
  elif printf '%s' "$aus" | grep -q 'PAGEERROR'; then
    grund=$(printf '%s' "$aus" | grep 'PAGEERROR' | head -2 | tr '\n' ' ')
  fi

  if [ -n "$grund" ]; then
    rot=$((rot+1)); ROTE+=("$name — ${grund:0:180}")
    printf '  ✗ %-34s %s\n' "$name" "${grund:0:90}"
  elif [ -z "$(printf '%s' "$aus" | tr -d '[:space:]')" ]; then
    # Ein Durchlauf ohne jede Ausgabe hat vermutlich gar nichts geprüft.
    stumm=$((stumm+1))
    printf '  ? %-34s (keine Ausgabe – prüft der überhaupt etwas?)\n' "$name"
  else
    gruen=$((gruen+1))
    printf '  ✓ %-34s\n' "$name"
  fi
done

echo
echo "══════════════════════════════════════════════"
echo "  $gruen grün · $rot rot · $stumm ohne Ausgabe"
echo "══════════════════════════════════════════════"
if [ "${#ROTE[@]}" -gt 0 ]; then
  echo
  for z in "${ROTE[@]}"; do echo "  ✗ $z"; done
fi
# Nicht in eine Pipe schreiben lassen und dabei den Rückgabewert
# verlieren: wer "bash tests/alle.sh | tail" aufruft, bekommt sonst den
# Wert von tail. Deshalb steht das Ergebnis auch im Text.
[ "$rot" -eq 0 ] || exit 1
exit 0
