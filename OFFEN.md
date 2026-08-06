# Was noch offen ist

Stand: 6. August 2026. Kurze Liste dessen, was bewusst nicht erledigt wurde,
jeweils mit Begründung — damit später niemand rätseln muss.

---

## ⏳ Mit Frist: Node.js 20 läuft aus

**Bis 30. Oktober 2026** (noch rund 85 Tage).

Im Deploy-Protokoll steht:

> Runtime Node.js 20 was deprecated on 2026-04-30 and will be decommissioned
> on 2026-10-30, after which you will not be able to deploy without upgrading.

Die Cloud Functions laufen weiter — aber **ab diesem Datum lässt sich nichts
mehr deployen**, bis auf eine neuere Node-Version umgestellt wurde. Das trifft
dann auch dringende Korrekturen.

### Warum es nicht einfach nebenbei erledigt wurde

Der Versuch gab es in diesem Projekt schon einmal: die Umstellung auf Node 22
ist daran gescheitert, dass Firebase Functions der **1. Generation** dabei neu
angelegt statt aktualisiert werden. Dabei können Auslöser und geplante Läufe
verlorengehen. Damals musste auf Node 20 zurückgedreht werden.

Alle 13 Functions hier sind 1. Generation (`firebase-functions/v1`).

### Wie man es sauber macht

Nicht zwischen Tür und Angel, sondern als eigener Schritt mit Zeit:

1. `functions/package.json`: `"node": "20"` → `"22"`
2. `firebase-functions` von `^5.0.0` auf die aktuelle Fassung heben
   (bringt laut Warnung im Protokoll Änderungen mit sich, die geprüft werden
   müssen)
3. Deployen und danach **einzeln nachsehen**, ob alles noch da ist:
   - die geplanten Läufe: `birthdayGreetings` (08:00), `dueTaskReminder`
     (07:30), `monthlyReport` (08:00 am Ersten), `purgeTrash` (03:30),
     `appointmentMailScheduler` (alle 30 Minuten)
   - die Auslöser auf neue Nachrichten, Aufgaben, Infos und Termine
4. Zum Prüfen den Testbericht-Knopf und den Geburtstags-Auslöser benutzen

**Nicht an einem Tag machen, an dem etwas Wichtiges ansteht.** Falls etwas
schiefgeht, ist der Rückweg auf Node 20 bis zum 30. Oktober noch offen.

---

## 🏢 Mehrere Firmen in einer App (Mandantenfähigkeit)

Nur nötig, wenn StudioChat wirklich an andere verkauft werden soll.

Heute liegen alle Daten flach: `studios/studio-6/todos`. Für einen zweiten
Kunden müsste eine Ebene darüber: `firmen/{firmaId}/studios/…` — und jede
Sicherheitsregel, jede Abfrage und jede Cloud Function müsste die Firma
mitführen.

**Aufwand:** groß, und es lohnt sich erst, wenn ein zweiter Kunde konkret ist.
Vorher ist es Arbeit auf Verdacht. Solange es nur um Körperformen geht, bringt
der Umbau keinen einzigen Vorteil.

---

## 🤖 KI-Funktionen

Siehe `KI-PLAN.md`. Technisch vorbereitet, bewusst nicht gebaut.

**Der Knackpunkt ist nicht die Technik, sondern der Datenschutz.** StudioChat
ist eine Mitarbeiter-App; Stimmen und Leistungsdaten an einen Dritten zu geben
ist einwilligungs- und mitbestimmungsrelevant. Das gehört geklärt, bevor
irgendetwas gebaut wird.

---

## 📧 E-Mail-Absender

Läuft aktuell über Gmail. Für den Monatsbericht an den Chef völlig in Ordnung.

Für die **Termin-Mails an Kunden** sollte vor dem echten Einsatz auf die eigene
Geschäftsdomain gewechselt werden: eine Terminbestätigung von einer
gmail-Adresse wirkt nicht wie von einem Unternehmen mit 14 Studios und landet
deutlich öfter im Spam.

Dafür müssen nur die fünf Werte in den GitHub-Secrets ausgetauscht werden,
siehe `MAIL-SETUP.md`. Kein Code ändert sich.

---

## 🔍 Suche über alle Studios

Die Suche findet Putzplan-Notizen, Abwesenheiten und Übergaben nur für das
Studio, das gerade geöffnet ist.

**Das ist Absicht:** diese Daten werden bewusst pro Studio geladen. Alle 14
Studios dauerhaft mitzuladen würde die Datenbank-Zugriffe vervielfachen — genau
der Fehler, der bei der Online-Anzeige schon einmal beinahe zu Kosten weit über
dem kostenlosen Kontingent geführt hätte.

Falls studioübergreifend gesucht werden soll: als eigene Suche bauen, die nur
auf Knopfdruck lädt — nicht als Dauer-Abgleich.

---

## Kleinigkeiten

- **Wischen zum Abhaken** ist nie auf einem echten Gerät geprüft worden.
  Berührungen lassen sich in der Testumgebung nicht nachstellen. Der Aufbau
  stimmt; ob es sich gut anfühlt, zeigt erst der Alltag.
- **Drei Test-Chef-Konten** sollten entfernt werden:
  Chef-Bereich → Team → „Chef-Zugänge".
- **`firebase-functions`** meldet beim Deploy, dass die Fassung veraltet ist.
  Zusammen mit dem Node-Wechsel oben erledigen, nicht einzeln.
