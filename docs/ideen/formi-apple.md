# Formi, wie Apple ihn gestalten würde

Stand 23.10.2026. Vier Entwürfe wurden gezeigt (Licht-Kugel wie Siri, Formi
in der Insel, Glaskugel, Zeichen + Widget). Die Antwort aus dem Betrieb:

> „ich finde die insel und die widgets super krass falls das geht können
> wir das schonmal umsetzten sonst bauen wir das ein wenn wir die web app
> zur normalen app machen, liquid glas finde ich unnötig wenn überhaupt
> soll das den hintergrund verzerren etwas weils ja ein schwarzes loch ist
> und so, diesen leucht ring am rand find ich auch mega … nur die
> lichtkugel würde ich nicht wollen es soll am ende immer noch ein
> schwarzes loch sein vom aussehen und verhalten her"

## Entschieden

| Entwurf | Stand |
|---|---|
| Insel | **gebaut (Runde 247)** — in der App, oben in der Mitte |
| Leuchtrand | **gebaut (Runde 247)** — solange Formi arbeitet |
| Hintergrund verzerren statt Glas | **gebaut (Runde 247)** — Lichtkrümmung um die Kugel (Chromium) |
| Widgets | **folgt mit der echten App** — siehe unten |
| Licht-Kugel (Siri) | **nicht** — Formi bleibt ein schwarzes Loch |
| Liquid Glass | **nicht** |

## Was eine Web-App nicht kann

- **Die echte Dynamic Island / Live-Aktivitäten** gibt es nur für Apps aus
  dem App Store (ActivityKit). Eine Web-App kann dort nichts anzeigen. Die
  Insel in Runde 247 lebt deshalb IN der App.
- **Widgets auf dem Home-Bildschirm** (iOS WidgetKit, Android App
  Widgets) gibt es ebenfalls nur für installierte Apps. Eine Web-App
  bekommt keine.
- **Lichtkrümmung in Safari:** Safari kennt SVG-Filter in
  `backdrop-filter` nicht. Auf iPhone und Mac bleibt der Kreis um Formi
  deshalb durchsichtig; mit einer echten App (SwiftUI, Metal-Shader)
  ginge es.

## Für die echte App vorgemerkt

**Live-Aktivität in der Insel** (dasselbe, was die Insel in der App
heute zeigt): kompakt links Formi, rechts was er tut; ausgeklappt das
Ergebnis mit Haken. Dazu der laufende Stempel („seit 06:58 im Dienst")
als Live-Aktivität.

**Widgets:**

| Grösse | Inhalt |
|---|---|
| klein | Formi (das Loch) + „3 offen" für heute; Tippen öffnet „Heute" |
| mittel | Formi + die nächsten zwei Aufgaben mit Haken (iOS 17: abhaken direkt im Widget) |
| gross | Schicht heute, offene Aufgaben, Putzplan-Stand — wie die Startseite |
| Sperrbildschirm | rundes Zeichen: das Loch mit Scheibe, die Scheibe füllt sich mit dem Tag (wie `fk-tag-0…3`) |

Das Loch bleibt in jeder Grösse das Zeichen — kein Glas, keine Licht-Kugel.
