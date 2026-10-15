# Idempotente Ausführungen von wiederkehrenden Zahlungen

## Ziel und Planungsstand

Automatische Buchungen wiederkehrender Zahlungen sollen vor mehrfacher Ausführung geschützt werden. Der Job darf
wiederholt oder parallel laufen, auch in mehreren Backend-Instanzen, ohne für denselben geplanten Termin zusätzliche
Transaktionen zu erzeugen.

Die fachlichen Anforderungen und Umfangsgrenzen wurden abgestimmt. Das nachfolgende Datenmodell und der
Verarbeitungsablauf sind implementiert, einschließlich Migration, Unit- und PostgreSQL-Tests sowie Dokumentation.
Die Migration wurde ausschließlich in einer isolierten Testdatenbank angewendet; der produktive Rollout steht noch aus.
Weitere fachliche oder technische Entscheidungen sollen mit dem Auftraggeber abgestimmt werden.

Die Garantie lautet bewusst **„höchstens einmal automatisch gebucht“**, nicht „jeder Termin wird garantiert gebucht“.

## Ausgangszustand vor der Umsetzung

- `services/backend/src/jobs/processRecurringPayments.ts` verarbeitet ausschließlich Termine des heutigen Tages in der
  konfigurierten Job-Zeitzone. Verpasste Tage werden nicht nachgeholt.
- Jeder Joblauf erzeugt derzeit neue Transaktionen, ohne einen Ausführungsnachweis zu prüfen oder zu speichern.
- `services/backend/src/utils/createTransactionFromRecurringPayment.ts` wird sowohl vom Job als auch von der manuellen
  Ausführung verwendet und erzeugt jeweils eine neue Transaktion.
- Die manuelle Route `POST /api/recurringPayment/:id/execute` ordnet die Buchung keinem geplanten Termin zu.
- Die Terminübersicht berechnet Termine aus dem aktuellen Zeitplan. Sie zeigt keinen tatsächlichen Ausführungsstatus und
  keine Zuordnung zu erzeugten Transaktionen, obwohl die bestehende Nutzerdokumentation eine solche Zuordnung beschreibt.

## Fachliche Anforderungen

### Identität einer automatischen Ausführung

Eine automatische Ausführung wird durch die **ID der wiederkehrenden Zahlung und ihr geplantes Datum**, jeweils dem
Besitzer zugeordnet, identifiziert.

Der ursprünglich vorgeschlagene Hash über veränderliche Zahlungsdaten entfällt. Eine Änderung von Betrag, Empfänger,
Kategorie, Zahlungsmethode oder anderen Feldern darf keine zweite automatische Buchung desselben Termins ermöglichen.
Zwei eigenständige wiederkehrende Zahlungen mit identischen Zahlungsdaten müssen unabhängig voneinander gebucht werden.

### Verhalten bei Wiederholung und Änderungen

- Mehrere Jobläufe für dieselbe Zahlungs-ID und dasselbe geplante Datum erzeugen höchstens eine automatische Transaktion.
- Parallele Jobläufe und mehrere Backend-Instanzen unterliegen demselben Schutz.
- Nach einer erfolgreichen Buchung ermöglichen Änderungen an Zahlungsdaten keine erneute automatische Ausführung für
  denselben Termin. Noch nicht ausgeführte Termine verwenden die dann geltenden Zahlungsdaten.
- Das Bearbeiten oder Löschen einer automatisch erzeugten Transaktion hebt den Ausführungsnachweis nicht auf.
- Das Löschen einer wiederkehrenden Zahlung entfernt ihre Ausführungsnachweise nicht. Bereits erzeugte Transaktionen
  bleiben wie bisher bestehen.
- Wird dieselbe Zahlungs-ID später für denselben Besitzer wieder importiert, bleiben bereits ausgeführte Termine geschützt.
- Ein neu angelegter Eintrag mit einer neuen Zahlungs-ID gilt als eigenständige wiederkehrende Zahlung.
- Beim Löschen des Benutzerkontos werden auch dessen Ausführungsnachweise gelöscht.

### Manuelle Ausführung

Die manuelle Ausführung bleibt eine bewusste **Zusatzbuchung unabhängig vom Zeitplan**:

- Jeder erfolgreiche manuelle Aufruf erzeugt eine weitere Transaktion.
- Manuelle Ausführungen markieren keinen automatischen Termin als erledigt.
- Automatische Ausführungsnachweise blockieren keine manuellen Zusatzbuchungen.
- Es wird kein Request-Idempotenzschlüssel und keine zusätzliche UI-Bestätigung eingeführt.
- Wiederholtes Klicken oder ein Retry nach einer unklaren Netzwerkantwort kann weiterhin zusätzliche manuelle Buchungen
  erzeugen. Diese Grenze muss ausdrücklich dokumentiert werden.

## Umfang und bewusste Grenzen

- **Nur heutige Termine:** Maßgeblich bleibt das heutige Datum in der konfigurierten Job-Zeitzone. Vergangene Termine werden
  nicht nachgeholt.
- **Keine neue Retry-Logik:** Der bestehende Job-Zeitplan bleibt unverändert. Fehlgeschlagene Buchungen können bei einem
  weiteren Joblauf am selben Tag erneut versucht werden; zusätzliche Wiederholungen werden nicht eingeplant. Am nächsten
  Tag wird ein fehlgeschlagener Termin nicht nachgeholt.
- **Nur interne Ausführungstabelle:** Es gibt keine neue Oberfläche und keine Änderung der öffentlichen REST- oder
  MCP-Verträge. Die Terminübersicht bleibt eine Zeitplan-Projektion, keine Ausführungshistorie.
- **Keine Export-/Import-Erweiterung:** Ausführungsnachweise werden nicht in Anwendungsdaten-ZIP-Archive aufgenommen. Ein
  Import in eine neue Datenbank übernimmt somit keine Ausführungshistorie. Bereits vorhandene Nachweise in derselben
  Datenbank bleiben wirksam.
- **Datenbank-Backup:** Ein vollständiges Datenbank-Backup erhält die Ausführungsnachweise.
- **Keine Zuordnung alter Buchungen:** Vor der Umstellung erzeugte Transaktionen werden nicht anhand ähnlicher Zahlungsdaten
  nachträglich zugeordnet.
- **Keine automatische Bereinigung:** Ausführungsnachweise bleiben bis zur Löschung des zugehörigen Benutzerkontos erhalten.

## Technischer Umsetzungsvorschlag

### Ausführungstabelle

In `packages/db/src/backend` wird eine neue interne Tabelle eingeführt, beispielsweise
`recurring_payment_execution`, mit folgenden Feldern:

| Feld                   | Zweck                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| `owner_id`             | Besitzer; wird bei Kontolöschung mit entfernt                            |
| `recurring_payment_id` | Dauerhaft gespeicherte Identität der wiederkehrenden Zahlung             |
| `scheduled_for`        | Geplantes Datum als `YYYY-MM-DD`, ohne Uhrzeit                           |
| `executed_at`          | Tatsächlicher Ausführungszeitpunkt                                       |
| `transaction_id`       | Optionale Referenz auf die erzeugte Transaktion                          |
| `content`              | Optionaler, versionierter JSON-Text-Snapshot der gebuchten Zahlungsdaten |

Ein Datenbank-Constraint erzwingt die Eindeutigkeit von **Besitzer + Zahlungs-ID + geplantem Datum**.

Der optionale Snapshot dient der Dokumentation der tatsächlich verwendeten Zahlungsdaten und ist ausdrücklich kein
weiterer Duplikatschlüssel. Er wird als kompakter JSON-Text gespeichert, nicht als Base64. Historische Nachweise dürfen
keinen Snapshot enthalten; die Spalte bleibt deshalb nullable.

Die Löschregeln müssen die fachlichen Anforderungen erhalten:

- `owner_id` referenziert das Benutzerkonto mit Löschung der Nachweise bei Kontolöschung.
- Die Zahlungs-ID bleibt auch nach dem Löschen der wiederkehrenden Zahlung gespeichert. Es wird kein löschender
  Fremdschlüssel zur wiederkehrenden Zahlung verwendet.
- Beim Löschen der erzeugten Transaktion wird ausschließlich `transaction_id` auf `NULL` gesetzt. Der Ausführungsnachweis
  selbst bleibt bestehen.
- Der interne Verarbeitungsablauf darf die Transaktionsreferenz nicht mit einer Transaktion eines anderen Besitzers verknüpfen.

Die Tabellenänderung wird durch eine reguläre Drizzle-Migration einschließlich der erforderlichen Metadaten eingeführt.
Tabellen, Relationen und gegebenenfalls Schemas werden über die bestehenden öffentlichen Package-Grenzen exportiert.

### Atomare Verarbeitung

Für jede automatische Ausführung gilt:

1. Eine Datenbanktransaktion starten.
2. Den eindeutigen Ausführungsnachweis innerhalb dieser Transaktion reservieren.
3. Bei einem Konflikt mit einem bereits vorhandenen Nachweis ohne neue Buchung überspringen.
4. Andernfalls die Finanztransaktion erzeugen und ihre Referenz im Ausführungsnachweis hinterlegen.
5. Ausführungsnachweis und Finanztransaktion gemeinsam bestätigen.

Bei einem Fehler werden beide Schreibvorgänge zurückgerollt. Es darf weder eine bestätigte Buchung ohne Nachweis noch
einen bestätigten Nachweis ohne erfolgreich erzeugte Buchung geben. Eine später vom Nutzer gelöschte Buchung ist davon
ausgenommen; in diesem Fall bleibt der Nachweis bewusst mit leerer Transaktionsreferenz bestehen.

Ein vorheriges Lesen „Nachweis vorhanden?“ reicht allein nicht aus, weil parallele Läufe beide keinen Nachweis finden
könnten. Die Absicherung erfolgt daher direkt durch den Datenbank-Constraint und den atomaren Schreibablauf. Ein
zusätzlicher globaler oder verteilter Job-Lock ist für diesen Duplikatschutz nicht erforderlich.

Die automatische Verarbeitung erhält einen eigenen internen Ausführungspfad, damit die bestehende manuelle
Buchungsfunktion unverändert bleibt. Bei einer Wiederholung nach einem erfolgreichen Commit, aber einer unklaren
Rückmeldung, verhindert der bereits gespeicherte Nachweis eine zweite automatische Buchung.

### Job und Protokollierung

`services/backend/src/jobs/processRecurringPayments.ts` verwendet künftig den idempotenten automatischen Ausführungspfad.
Der Job unterscheidet in Ergebnis und Protokollierung:

- **Neu gebucht:** Eine Transaktion und ihr Ausführungsnachweis wurden gemeinsam gespeichert.
- **Bereits ausgeführt / übersprungen:** Ein Ausführungsnachweis ist vorhanden; dies ist kein Fehler.
- **Fehlgeschlagen:** Die Buchung konnte nicht abgeschlossen werden; der fehlgeschlagene Versuch hinterlässt keinen
  bestätigten Ausführungsnachweis.

Die vorhandenen Batches und die Weiterverarbeitung nach einzelnen Fehlern bleiben erhalten. Nach neuen Buchungen werden
die Transaktions-, Budget- und Insights-Caches der betroffenen Besitzer weiterhin invalidiert. Reines Überspringen erzeugt
keine neue Domain-Mutation.

Die bestehende gemeinsame UTC-Rekurrenzlogik, das date-only-Format und das Verhalten monatlicher Ankertage bleiben erhalten.
Es wird keine parallele Kalenderlogik eingeführt.

## Einführung im Bestand

Der Schutz beginnt mit der Umstellung. Alte Transaktionen besitzen keine verlässliche Zuordnung zur wiederkehrenden
Zahlung und werden nicht nachträglich in Ausführungsnachweise überführt.

### Sicherer Rollout

1. Ein vollständiges Datenbank-Backup erstellen.
2. Alle alten Backend-Instanzen stoppen und laufende Jobs beenden lassen.
3. Die neue Migration anwenden.
4. Ausschließlich die neue Backend-Version starten, bevor der erste Joblauf eines Tages erfolgt, für den noch keine alte
   Version automatische Buchungen erzeugt hat.
5. Den ersten geschützten Joblauf und seine Protokollierung kontrollieren.

Wenn die alte Version am Umstellungstag bereits gebucht hat, darf die neue Version denselben Tag nicht erneut verarbeiten,
da für die alten Buchungen keine Nachweise existieren. Der erste geschützte Lauf muss dann an einem folgenden Tag erfolgen.

Ein Mischbetrieb alter und neuer Versionen bietet keinen zuverlässigen Schutz, weil die alte Version keine Nachweise
schreibt. Ein Rollback auf die alte Version hebt den Schutz ebenfalls auf. Diese Grenzen werden in der
Self-Hosting-Dokumentation beschrieben.

## Umsetzungsschritte

1. Die neue Ausführungstabelle, ihre Constraints, Löschregeln und die Drizzle-Migration ergänzen.
2. Einen internen atomaren Ausführungspfad für automatische Buchungen implementieren; manuelle Ausführungen unverändert lassen.
3. Den Job auf diesen Pfad umstellen und die Ergebniszählung sowie Protokollierung um übersprungene Termine erweitern.
4. Die Cache-Invalidierung nach tatsächlich neuen Buchungen erhalten.
5. Unit-Tests und einen gezielten PostgreSQL-Test für atomare Verarbeitung und parallele Ausführungen ergänzen.
6. Die nachfolgend aufgeführte Dokumentation aktualisieren und den sicheren Rollout beschreiben.
7. Die betroffenen Workspaces prüfen: Tests, Formatierung, Linting, Typecheck und Build. Prerequisite-Builds erfolgen über
   den bestehenden Turborepo-Abhängigkeitsgraphen.

## Abnahmekriterien und Tests

### Idempotenz und Datenidentität

- Wiederholte Ausführung derselben Zahlungs-ID für dasselbe geplante Datum erzeugt genau eine automatische Transaktion.
- Parallele Ausführung desselben Termins erzeugt genau eine automatische Transaktion und einen Ausführungsnachweis.
- Unterschiedliche Zahlungs-IDs werden trotz identischer Zahlungsdaten unabhängig voneinander gebucht.
- Unterschiedliche geplante Daten derselben Zahlungs-ID sind unabhängig voneinander ausführbar.
- Änderungen an Zahlungsdaten ermöglichen keine erneute Buchung eines bereits ausgeführten Termins.
- Benutzerkonten und ihre Ausführungsnachweise bleiben voneinander isoliert.

### Atomarität und Fehlerverhalten

- Ein fehlgeschlagener Schreibvorgang hinterlässt weder eine Teilbuchung noch einen bestätigten Ausführungsnachweis.
- Ein weiterer Versuch nach einem zurückgerollten Fehler kann erfolgreich buchen.
- Eine Wiederholung nach erfolgreichem Commit mit unklarer Rückmeldung erzeugt keine zweite Buchung.
- Ein Fehler bei einer Zahlung verhindert nicht die Verarbeitung weiterer Zahlungen im Job.
- Bereits ausgeführte Termine werden als übersprungen und nicht als Fehler protokolliert.
- Cache-Invalidierung bleibt für tatsächlich neue Buchungen erhalten.

### Änderungen und Löschungen

- Das Bearbeiten oder Löschen einer automatisch erzeugten Transaktion hebt den Schutz nicht auf.
- Das Löschen einer wiederkehrenden Zahlung erhält ihre Ausführungsnachweise.
- Das Wiederherstellen derselben Zahlungs-ID für denselben Besitzer in derselben Datenbank erhält den Schutz.
- Ein neuer Eintrag mit neuer Zahlungs-ID ist unabhängig von den Nachweisen gelöschter Einträge.
- Die Löschung des Benutzerkontos entfernt dessen Ausführungsnachweise.

### Bestehendes Verhalten und Umfangsgrenzen

- Manuelle Zusatzbuchungen und automatische Ausführungen beeinflussen einander nicht.
- Mehrere erfolgreiche manuelle Aufrufe erzeugen weiterhin mehrere Zusatzbuchungen.
- Pausen, Zeitplanberechnung, monatliche Ankertage und Zeitzonenverhalten bleiben erhalten.
- Verpasste Tage werden weiterhin nicht nachgeholt.
- Es wird keine neue Retry-Logik eingeführt.
- Öffentliche REST- und MCP-Verträge sowie Anwendungsdaten-Export und -Import bleiben unverändert.
- Die Terminübersicht bleibt eine Projektion des Zeitplans ohne tatsächlichen Ausführungsstatus.

Neben Unit-Tests gehört ein gezielter Test gegen PostgreSQL zur Abnahme. Reine Datenbank-Mocks können das Verhalten des
Unique-Constraints bei konkurrierenden Transaktionen nicht belegen. Dieser Test muss isolierte Testdaten verwenden und darf
keine produktiven Daten verändern.

Bestehende Testbereiche sind insbesondere:

- `services/backend/src/__tests__/processRecurringPayments.test.ts`
- `services/backend/src/__tests__/recurringTransaction.test.ts`
- `services/backend/src/__tests__/recurringPayment.execute.router.test.ts`

## Dokumentation als fester Bestandteil

Die Dokumentationsanpassung gehört zur Fertigstellung des Features und darf nicht als optionaler Folgeschritt entfallen.
Folgende Seiten werden gezielt angepasst:

### `apps/documentation/docs/users/recurring-payments.md`

- Automatischen Duplikatschutz und seine Identität erklären.
- Verhalten bei Änderungen und beim Löschen von Transaktionen oder wiederkehrenden Zahlungen beschreiben.
- Manuelle Ausführungen ausdrücklich als ungeschützte zusätzliche Buchungen erklären.
- Klarstellen, dass ausschließlich heutige Termine verarbeitet und verpasste Tage nicht nachgeholt werden.
- Die bisher unzutreffende Aussage zur Zuordnung erzeugter Transaktionen in der Terminübersicht korrigieren.

### `apps/documentation/docs/developers/database.md`

- Neue Tabelle, Eindeutigkeit und Besitzermodell ergänzen.
- Atomare Verarbeitung und die Löschregeln dokumentieren.
- Erklären, warum veränderliche Zahlungsdaten nicht Teil des Duplikatschlüssels sind.

### `apps/documentation/docs/self-hosting/updating.md`

- Sicheren Rollout und Beginn des Schutzes beschreiben.
- Grenzen bei bereits erfolgten alten Buchungen, Mischbetrieb und Rollback dokumentieren.

### `apps/documentation/docs/self-hosting/troubleshooting.md`

- Übersprungene Termine von fehlgeschlagenen Buchungen unterscheiden.
- Wiederholungsmöglichkeit am selben Tag und fehlendes Nachholen erläutern.
- Bestehende Aussagen zu vergangenen fälligen Terminen an das tatsächliche Verhalten anpassen.

### `apps/documentation/docs/users/data-management.md`

- Klarstellen, dass Anwendungsdaten-Archive keine Ausführungsnachweise enthalten.
- Unterschiede zwischen Wiederimport in dieselbe Datenbank, Import in eine neue Datenbank und vollständigem
  Datenbank-Backup beschreiben.
