# DATEV-Datei (LODAS) — Probe für das Lohnbüro

Die App erzeugt unter **Zeiten → Team → Monat & Konto → „DATEV"** eine
Datei für den ASCII-Import in **DATEV LODAS**. Gebaut ist sie nach dem
DATEV-Schnittstellenhandbuch LODAS (SSH, 45. Auflage, Januar 2016 — die
einzige Fassung, die wir einsehen konnten). **In einem echten LODAS
eingespielt wurde sie noch nicht.** Das kann nur das Lohnbüro.

## Bitte einmal so prüfen

1. In LODAS einen **Testmandanten** anlegen oder einen vorhandenen nehmen.
2. Die Datei `PROBE-LODAS-2026-09.txt` aus diesem Ordner öffnen und
   `BeraterNr`, `MandantenNr` und die Personalnummern (1 und 2) auf die
   des Testmandanten ändern. Die Lohnart **200** auf die eigene Lohnart
   für Stundenlohn ändern.
3. In LODAS: **Mandant → Daten übernehmen → ASCII-Import**, die Datei
   wählen.
4. Im Protokoll nachsehen:
   - Person 1: 131,80 Stunden (Schlüssel 01, Lohnart 200) und 3 genommene
     Urlaubstage (Schlüssel 71) im September 2026,
   - Person 2: 86,25 Stunden,
   - keine Warnung „Feld abgeschnitten".
5. Uns zurückmelden: ging es durch? Wenn nicht, die Meldung aus dem
   Protokoll — dann passen wir die Datei an.

## Was in der Datei steht — und warum

| Teil | Inhalt | Quelle im Handbuch |
|---|---|---|
| `[Allgemein]` | `Ziel=LODAS`, Berater (4–7 Ziffern), Mandant (1–5 Ziffern), `;` als Trenner, `,` als Komma, Datum `TT.MM.JJJJ` | Fach 2, „Abschnitt Allgemein" |
| `[Satzbeschreibung]` | Satzart 1 = Tabelle `u_lod_bwd_buchung_standard`, Felder Zeitraum; Wert; Bearbeitungsschlüssel; Lohnart; Personalnummer | Fach 3, Beispiel Satzart 3 (dieselbe Reihenfolge) |
| `[Bewegungsdaten]` | je Person und Monat eine Zeile **01** (Stunden, zwei Nachkommastellen) und auf Wunsch eine Zeile **71** (genommene Urlaubstage, eine Nachkommastelle, höchstens 99,5, **ohne** Lohnart) | Fach 3 (01 = Stundenbuchungen), Fach 4 (71: „Wert max: 99,5 (Tage)") |
| Zeitraum | immer der Monatserste, ein Monat je Datei | Fach 2, „Allgemeine Regeln" |
| Zeichen, Zeilenende | nur ASCII (damit ANSI ohne Umlaut-Frage), CR/LF | Fach 2, „Allgemeine Regeln" |

**Personalnummern höchstens 5 Ziffern.** LODAS schneidet zu lange Zahlen
**links** ab — aus 100023 würde 00023, und die Stunden landeten bei einer
anderen Person. Die App nimmt deshalb nur 1–5 Ziffern an und lässt
ältere, längere Nummern aus der Datei heraus (mit Namen in der Meldung).

## Nicht gebaut

- **Lohn und Gehalt (LuG)** — braucht eine eigene Formatbeschreibung.
- **Krankheitstage (Schlüssel 72)** und Stunden je Tag (Kalendarium).
