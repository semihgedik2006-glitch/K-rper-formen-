---
name: knoepfe
description: Pflicht vor JEDEM neuen oder geänderten Knopf in StudioChat. Prüft Symbol-Zentrierung, Abzeichen, Fingerziele und doppelte Symbole — gemessen, nicht geschätzt. Auslöser sind Wörter wie Knopf, Button, Icon, Symbol, Abzeichen, Badge, Zähler, „sieht off aus", icon-btn, kopf-plus, chip.
---

# Knöpfe: messen, bevor es einen neuen gibt

Aus einer Rückmeldung vom 31.8.2026: *„das sieht auch wieder so off aus
und bitte achte auf sowas bei ALLEN Knöpfen IMMER bevor es neue gibt."*

Ein Vorsatz reicht dafür nicht — beim nächsten Mal rutscht dasselbe
wieder durch. Deshalb steht die Regel als **Messung** da, nicht als
Merksatz.

## Die Reihenfolge, immer

1. **`bash tests/alle.sh test-knoepfe` laufen lassen — VOR der Änderung.**
   Was schon rot ist, ist nicht deine Schuld; was danach rot ist, schon.
2. Knopf bauen.
3. **Nachmessen, nicht ansehen.** Ein Bildschirmfoto zeigt, DASS etwas
   nicht stimmt; die Zahlen sagen, WAS.
4. `node tools/csp.js --setzen`, dann `test-knoepfe`, `test-gestaltung`,
   `test-abgeschnitten`, `test-quer`.
5. Eine Gegenprobe: den alten Zustand kurz zurückbauen. Wird der
   Durchlauf nicht rot, prüft er nichts.

## Was gemessen wird — und warum genau das

`tests/test-knoepfe.js` geht jede Ansicht ab und prüft jeden sichtbaren
Knopf:

| Regel | Warum sie so lautet |
|---|---|
| Nur-Symbol-Knöpfe: Zeichen mittig (±2px) | `button[data-ikon]:not(.btn)` setzt `inline-flex` ohne `justify-content` und überschreibt damit das `place-items:center` von `.icon-btn`. Drei Knöpfe standen 12px daneben, jahrelang unbemerkt. |
| Abzeichen liegt nicht auf dem Symbol | Das ist der Grund, aus dem die Glocke „off" aussah — nachgemessen 64 px² Überdeckung. |
| Abzeichen wird von keinem Vorfahren abgeschnitten | Ein halber Kreis sieht aus wie Absicht, wenn man ihn nicht sucht. |
| Ein Element mit `data-ikon` trägt kein eigenes `<svg>` (in `test-gestaltung.js`) | 22 Knöpfe zeichneten ihr Symbol doppelt. Alle sichtbar falsch, keiner je gemeldet. |

## Schwellen herleiten, nicht wählen

Für das Abzeichen lag „höchstens 40 % der Knopfbreite" nahe. Das wäre
**ans Ergebnis angepasst** gewesen: alt 43 %, neu 36 % — die Zahl hätte
nur die beiden Fälle getrennt, ohne etwas zu erklären.

„Ein Abzeichen darf nicht auf dem Symbol liegen" trennt dieselben zwei
Fälle **und** sagt, warum es schlecht aussah. Solche Regeln halten;
gewählte Schwellen halten nur bis zum nächsten Sonderfall.

## Zwei Fallen beim Messen selbst

- **Verstecktes Wort zählt als Text.** `tbBericht` trägt „Bericht" unter
  620px als `display:none`, `tbGlocke` die „0" des Abzeichens. Ein Filter
  über `textContent` hält beide für Knöpfe mit Text und übersieht sie.
  Prüfe auf *sichtbaren* Inhalt (`getClientRects()`), und lass absolut
  gesetzte Kinder aus — sie nehmen im Fluss keinen Platz ein.
- **Zwei Fehler können sich gegenseitig verdecken.** Der 12px-Versatz
  ließ rechts eine Lücke, in der das Abzeichen allein stand. Erst als
  das Symbol mittig saß, wurde die Kollision messbar. Wenn eine Messung
  „unauffällig" sagt, obwohl das Auge etwas sieht: nach dem zweiten
  Fehler suchen.

## Änderst du eine gemeinsame Regel, miss die Reichweite

`justify-content:center` pauschal auf `button[data-ikon]` hätte den
Menüeintrag „Umfrage" um 20px verschoben — gemessen, bevor es passierte.
Deshalb trägt die Korrektur nur die zwei Bauformen, die wirklich nur ein
Zeichen tragen (`.icon-btn`, `.attach-btn`).

Dieselbe Falle in anderer Form: eine geteilte **Klasse** ändert, was
`querySelector` auswählt. Der Bearbeiten-Stift hieß der Maße wegen
`pp-del` — danach traf `document.querySelector('.pp-del')` den Stift
statt des Papierkorbs. Eine Klasse ist ein Name, keine Formatvorlage.
