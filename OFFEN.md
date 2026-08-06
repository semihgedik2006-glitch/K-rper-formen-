# Was noch offen ist

Stand: 6. August 2026. Kurze Liste dessen, was bewusst nicht erledigt wurde,
jeweils mit Begründung — damit später niemand rätseln muss.

---

## ✅ Erledigt: Node.js 22 (war bis 30.10.2026 befristet)

Am 6. August umgestellt und geprüft. Das Deploy-Protokoll zeigt für alle
16 Functions:

```
updating Node.js 22 (1st Gen) function ...
✔ Successful update operation.
```

**Aktualisiert, nicht neu angelegt** — genau darauf kam es an. Beim
gescheiterten Versuch zuvor war das anders; dabei können Auslöser und
geplante Läufe verlorengehen. Kein einziges „creating" oder „deleting" im
Protokoll.

Während des gesamten Deploys blieben die Functions erreichbar (alle 45
Sekunden geprüft, kein Ausfall). Alle fünf geplanten Läufe sind mit
umgezogen: `birthdayGreetings`, `dueTaskReminder`, `monthlyReport`,
`purgeTrash`, `appointmentMailScheduler`.

> Offen bleibt die Warnung, dass `firebase-functions` (^5.0.0) veraltet
> ist. Das ist **kein** Ablaufdatum, sondern ein Hinweis. Bewusst nicht
> gleichzeitig geändert: mit zwei Änderungen auf einmal wäre bei einem
> Fehler nicht zu erkennen gewesen, woran es lag. Kann in Ruhe
> nachgezogen werden — die Fassung bringt laut Hinweis Änderungen mit
> sich, die geprüft werden müssen.

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
- **Test-Chef-Konten**: am 6. August entfernt, zwei echte Konten bleiben.
- **`firebase-functions`** meldet beim Deploy, dass die Fassung veraltet ist.
  Kein Ablaufdatum, nur ein Hinweis — siehe oben.
