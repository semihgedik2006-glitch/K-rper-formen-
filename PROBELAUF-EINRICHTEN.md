# Probelauf-Projekt einrichten — deine Klickanleitung

Für Stufe C aus `MANDANT-PLAN.md`: den Umzug der Daten erst in einer
Kopie proben, dann live. Du hattest genau das entschieden, und ich halte
mich daran.

**Zeitbedarf:** 20 bis 30 Minuten, davon die Hälfte Wartezeit.
**Kosten:** keine. Das Projekt bleibt im kostenlosen Rahmen, weil dort
niemand arbeitet.
**Wenn etwas hakt:** aufhören und mir sagen, wo. Nichts erraten — ein
falsch verbundenes Projekt wäre die eine Art, bei der aus einem
Probelauf ein Ernstfall wird.

---

## Schritt 0 — vorher wissen

Du legst ein **zweites, leeres** Firebase-Projekt an. Es hat mit
`formenchat` nichts zu tun und kann nichts daran kaputt machen. Es ist
eine Spielwiese, auf der ich den Umzug durchprobiere, bevor er eure
echten Daten anfasst.

Löschen kannst du es hinterher jederzeit wieder.

---

## Schritt 1 — Projekt anlegen

1. [console.firebase.google.com](https://console.firebase.google.com) öffnen
2. **„Projekt hinzufügen"**
3. Name: **`formenchat-probe`**
   → Firebase hängt eine Zufallszahl an, etwa `formenchat-probe-a1b2c`.
   **Diese vollständige Kennung brauche ich nachher — bitte notieren.**
4. Google Analytics: **aus**. Wird nicht gebraucht und spart einen Schritt.
5. **„Projekt erstellen"** → etwa eine Minute warten

---

## Schritt 2 — Datenbank

1. Linke Leiste → **Firestore Database** → **„Datenbank erstellen"**
2. Modus: **Im Produktionsmodus starten**
   *(Klingt falsch für eine Testumgebung, ist aber richtig: damit ist
   erstmal alles gesperrt, und ich spiele die echten Regeln ein. Im
   Testmodus wäre 30 Tage lang alles für jeden offen — dann würde der
   Probelauf etwas anderes prüfen als den Ernstfall.)*
3. Region: **`europe-west1` (Belgien)**

   > ⚠ **Das ist die eine Stelle, die du nicht ändern kannst.** Eine
   > Firestore-Region steht für immer fest. Steht dort etwas anderes als
   > bei `formenchat`, prüft der Probelauf eine andere Welt als die, in
   > der ihr arbeitet — und das Löschen und Neuanlegen kostet dich die
   > halbe Stunde noch einmal.

4. **„Aktivieren"** → ein bis zwei Minuten warten

---

## Schritt 3 — Anmeldung

1. Linke Leiste → **Authentication** → **„Los geht's"**
2. **E-Mail/Passwort** anklicken → **Aktivieren** → **Speichern**

Mehr nicht. Kein Google-Login, keine Telefonnummer.

---

## Schritt 4 — Speicher

1. Linke Leiste → **Storage** → **„Jetzt starten"**
2. Region: **wieder `europe-west1`**
3. Regeln: die Voreinstellung bestätigen — ich ersetze sie ohnehin

---

## Schritt 5 — Web-App registrieren

1. Zahnrad oben links → **Projekteinstellungen**
2. Runter zu **„Meine Apps"** → das Symbol **`</>`** (Web)
3. Kurzname: **`probe`**
4. **„Firebase Hosting einrichten"**: Haken **setzen**
5. **„App registrieren"**
6. Jetzt erscheint ein Block, der so anfängt:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "formenchat-probe-a1b2c.firebaseapp.com",
     projectId: "formenchat-probe-a1b2c",
     …
   };
   ```

   **Diesen ganzen Block kopieren und mir schicken.**

   > Diese Werte sind **nicht geheim** — sie stehen in jeder
   > ausgelieferten Web-App im Quelltext. Geschützt wird über die
   > Sicherheitsregeln, nicht über Geheimhaltung. Du kannst sie also
   > bedenkenlos in den Chat setzen.

---

## Schritt 6 — Bezahlplan

Das Probelauf-Projekt braucht **Cloud Functions**, und die gibt es nur
im Blaze-Plan.

1. Links unten → **Upgrade** → **Blaze**
2. Dasselbe Rechnungskonto wie bei `formenchat` auswählen

**Was das kostet:** nichts. In dem Projekt arbeitet niemand, es bleibt
im Freikontingent. Der Plan ist nur die Voraussetzung dafür, dass sich
Functions überhaupt bereitstellen lassen.

> Setz auch hier eine **Budget-Warnung auf 1 €** — Cloud-Konsole →
> Abrechnung → Budgets. Nicht weil ich etwas erwarte, sondern weil eine
> Endlosschleife in einer Testumgebung genau die Art Unfall ist, die man
> nicht bemerkt.

---

## Schritt 7 — Zugangsschlüssel für mich

Damit ich die Regeln und die Umzugs-Function dort bereitstellen kann,
brauche ich einen Dienstschlüssel.

1. Zahnrad → **Projekteinstellungen** → Reiter **Dienstkonten**
2. **„Neuen privaten Schlüssel generieren"** → **„Schlüssel generieren"**
3. Eine JSON-Datei wird heruntergeladen

> 🔒 **Diese Datei ist ein Generalschlüssel für das Probe-Projekt.** Wer
> sie hat, kommt an alles darin. Für `formenchat` würde ich sie
> **niemals** anfragen.
>
> Für die Probe-Umgebung ist sie vertretbar, weil dort nur Kopien
> liegen. Trotzdem:
> - **Nicht** in den Chat und **nicht** ins Git-Projekt.
> - Leg sie in GitHub unter *Settings → Secrets and variables →
>   Actions → New repository secret*, Name **`PROBE_SA_KEY`**, Inhalt =
>   der komplette Dateiinhalt.
> - Nach dem Probelauf: Zahnrad → Dienstkonten → den Schlüssel
>   **widerrufen**. Ein Schlüssel, den niemand mehr braucht, gehört weg.

**Wenn dir das zu weit geht:** sag es. Dann bereite ich alles so vor,
dass du den Umzug mit zwei Befehlen selbst startest und ich nur die
Ausgabe zu sehen bekomme. Das ist umständlicher, aber es ist dein
Schlüssel und deine Entscheidung.

---

## Was du mir am Ende schickst

| | |
|---|---|
| 1 | die vollständige Projektkennung, z. B. `formenchat-probe-a1b2c` |
| 2 | den `firebaseConfig`-Block aus Schritt 5 |
| 3 | „Blaze ist an" |
| 4 | „`PROBE_SA_KEY` liegt in den GitHub-Secrets" — **oder** „den Schlüssel gebe ich nicht raus" |

Damit baue ich den Probelauf. Melde dich auch, wenn du **mittendrin**
unsicher bist — lieber eine Zwischenfrage als ein Projekt in der
falschen Region.

---

## Was danach passiert (damit du weißt, worauf es hinausläuft)

1. Ich spiele eure Datenstruktur als Kopie ins Probe-Projekt.
2. Die Umzugs-Function läuft dort und schreibt alles nach
   `firmen/koerperformen/…`.
3. **Zählprüfung:** jede Sammlung vorher und nachher gleich viele
   Dokumente.
4. Die 39 automatischen Durchläufe laufen gegen die umgezogenen Daten.
5. Eine zweite Testfirma wird angelegt, und die Kreuztests prüfen, dass
   sie nichts von der ersten sieht.

Erst wenn das alles sauber ist, kommt der Live-Umzug bei euch — und auch
der ist eine **Kopie**, kein Verschieben. Die alten Daten bleiben 30 Tage
liegen, der Rückweg ist damit: die vorherige App-Fassung ausrollen.
