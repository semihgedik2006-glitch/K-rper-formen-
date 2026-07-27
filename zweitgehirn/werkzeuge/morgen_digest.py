#!/usr/bin/env python3
"""Morgen-Briefing für den Zweitgehirn-Vault.

Zeigt: offene Aufgaben aus Memory.md, neue Rohquellen der letzten 24 Stunden
und die letzten Log-Einträge.

Aufruf:
    python3 werkzeuge/morgen_digest.py
    python3 werkzeuge/morgen_digest.py --stunden 72
"""

import argparse
import re
import time
from datetime import datetime
from pathlib import Path

VAULT = Path(__file__).resolve().parent.parent
TEXT_ENDUNGEN = {".md", ".txt"}
WOCHENTAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag",
              "Samstag", "Sonntag"]


def offene_aufgaben(memory: Path) -> list[str]:
    """Unerledigte Checkboxen aus Memory.md, in Reihenfolge des Auftretens."""
    if not memory.exists():
        return []
    muster = re.compile(r"^\s*[-*]\s*\[ \]\s*(.+?)\s*$")
    return [m.group(1) for line in memory.read_text(encoding="utf-8").splitlines()
            if (m := muster.match(line))]


def neue_quellen(ordner: Path, stunden: int) -> list[tuple[Path, float]]:
    """Dateien in raw-sources/, die zuletzt innerhalb des Zeitfensters geändert wurden."""
    if not ordner.exists():
        return []
    grenze = time.time() - stunden * 3600
    treffer = []
    for pfad in ordner.rglob("*"):
        if not pfad.is_file() or pfad.name.startswith("."):
            continue
        if pfad.name in {"LIESMICH.md", "Memory-VORLAGE.md"}:
            continue
        mtime = pfad.stat().st_mtime
        if mtime >= grenze:
            treffer.append((pfad, mtime))
    return sorted(treffer, key=lambda t: t[1], reverse=True)


def letzte_log_eintraege(log: Path, anzahl: int = 5) -> list[str]:
    if not log.exists():
        return []
    zeilen = [z.strip() for z in log.read_text(encoding="utf-8").splitlines()
              if z.startswith("## [")]
    return zeilen[-anzahl:]


def block(titel: str) -> None:
    print(f"\n{titel}")
    print("-" * len(titel))


def main() -> None:
    p = argparse.ArgumentParser(description="Morgen-Briefing aus dem Vault.")
    p.add_argument("--stunden", type=int, default=24,
                   help="Zeitfenster für neue Rohquellen (Standard: 24)")
    args = p.parse_args()

    heute = datetime.now()
    print("=" * 60)
    print(f" MORGEN-BRIEFING – {WOCHENTAGE[heute.weekday()]}, {heute:%d.%m.%Y}")
    print("=" * 60)

    aufgaben = offene_aufgaben(VAULT / "raw-sources" / "Memory.md")
    block(f"Offene Punkte ({len(aufgaben)})")
    if aufgaben:
        for a in aufgaben[:10]:
            print(f"  [ ] {a}")
        if len(aufgaben) > 10:
            print(f"  ... und {len(aufgaben) - 10} weitere")
    else:
        print("  keine – oder raw-sources/Memory.md existiert noch nicht")

    quellen = neue_quellen(VAULT / "raw-sources", args.stunden)
    block(f"Neue Rohquellen (letzte {args.stunden} h): {len(quellen)}")
    if quellen:
        for pfad, mtime in quellen[:15]:
            rel = pfad.relative_to(VAULT)
            groesse = pfad.stat().st_size
            hinweis = "" if pfad.suffix in TEXT_ENDUNGEN else "  (kein Text)"
            print(f"  {datetime.fromtimestamp(mtime):%d.%m. %H:%M}  {rel}"
                  f"  [{groesse/1024:.0f} kB]{hinweis}")
        print("\n  -> zum Verarbeiten:  claude \"Ingest der neuen Dateien in raw-sources/\"")
    else:
        print("  nichts Neues")

    eintraege = letzte_log_eintraege(VAULT / "wiki" / "log.md")
    block("Zuletzt im Wiki passiert")
    if eintraege:
        for e in eintraege:
            print(f"  {e[3:]}")
    else:
        print("  noch keine Einträge")

    print()


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        pass  # z. B. beim Weiterleiten an `head`
