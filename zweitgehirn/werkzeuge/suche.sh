#!/usr/bin/env bash
# Einfache Volltextsuche über Wiki und Rohquellen.
#
#   ./werkzeuge/suche.sh "kundenbindung"       # überall suchen
#   ./werkzeuge/suche.sh -w "kundenbindung"    # nur im Wiki
#   ./werkzeuge/suche.sh -r "kundenbindung"    # nur in den Rohquellen
#
# Solange das Wiki klein ist, reicht das völlig. Wird es groß (mehrere hundert
# Seiten), lohnt ein richtiger Index – z. B. qmd (github.com/tobi/qmd).

set -euo pipefail

VAULT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZIELE=("$VAULT/wiki" "$VAULT/raw-sources")

while getopts "wrh" opt; do
  case "$opt" in
    w) ZIELE=("$VAULT/wiki") ;;
    r) ZIELE=("$VAULT/raw-sources") ;;
    h) sed -n '2,10p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) exit 1 ;;
  esac
done
shift $((OPTIND - 1))

if [ $# -eq 0 ]; then
  echo "Suchbegriff fehlt.  Beispiel: $0 \"kundenbindung\"" >&2
  exit 1
fi

BEGRIFF="$*"

if command -v rg >/dev/null 2>&1; then
  rg --ignore-case --line-number --heading --color=always \
     --glob '*.md' --glob '*.txt' -- "$BEGRIFF" "${ZIELE[@]}" || {
       echo "Keine Treffer für: $BEGRIFF"; exit 0; }
else
  grep --recursive --ignore-case --line-number --color=always \
       --include='*.md' --include='*.txt' -- "$BEGRIFF" "${ZIELE[@]}" || {
         echo "Keine Treffer für: $BEGRIFF"; exit 0; }
fi
