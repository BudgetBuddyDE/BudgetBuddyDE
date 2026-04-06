# Beschreibung

Ich möchte das Backend um die Funktionalität von Attachments erweitern. Benutzer sollen daher möglich sein Dateianhänge zu ihren Einträgen hinzuzufügen und zu verknüpfen. Vorerst sollen diese Funktionalität nur vom Backend bereitgestellt werden, damit die Frontend-Entwicklung nicht verzögert wird. Es ist jedoch wichtig, dass die API so gestaltet wird, dass sie später problemlos in das Frontend integriert werden kann.

Die Attachments sollen mithilfe einer uuid-v7 (als ID im Backend) identifiert werden können. Die Dateien werden in eine S3 kompatiblen Speicher hochgeladen mithlfe der AWS S3 SDK. Die Dateien sollen mithlfe von signed URLs bereitgestellt (aberufen werden). Es ist natürlich wichtig, dass die Attachments sicher gespeichert und abgerufen werden können, um die Privatsphäre und Sicherheit der Benutzer zu gewährleisten.

# Richtlinien

## API Design

> Verwende Tabellen und API Ressourcen von den @budgetbuddyde/api und @budgetbuddyde/db NPM Packeten

- Vorerst sollen Attachments nur für Transaktionen implementiert werden. Dafür gibt es bereits Endpunkte im `transaction.rouer.ts` welche für die Endpunkte genutzt werden
- Es gibt einen abstrakten Attachment Handler welcher für die Verwaltung und registrierung von Attachments zuständig ist. Dieser Handler soll so gestaltet sein, dass er leicht erweitert werden kann, um in Zukunft auch andere Entitäten als Transaktionen zu unterstützen.
- Transaktionen (und andere Attachments)-Handler basieren alle auf dem abstrakten Attachment Handler.
- Ein winston Logger soll für die Protokollierung von Aktivitäten im Zusammenhang mit Attachments verwendet werden, um die Nachverfolgung und Fehlerbehebung zu erleichtern. Dabei sollen die verfügbaren Log-Level genutzt werden, um die Protokollierung entsprechend der Schwere der Ereignisse zu gestalten.
- Das implementierte Verhalten soll durch Unit-Tests, um die Zuverlässigkeit und Stabilität der Funktionalität sicherzustellen. Dabei sollen verschiedene Szenarien getestet werden, um sicherzustellen, dass die Attachments korrekt verwaltet und bereitgestellt werden.
- Die Signed URLs sollen so gestaltet sein, dass sie nur für einen begrenzten Zeitraum gültig sind, um die Sicherheit der Dateien zu gewährleisten. Es soll auch sichergestellt werden, dass nur autorisierte Benutzer Zugriff auf die Attachments haben.
- Die Signed URLs sollen gecached werden. Der Cache soll invalidiert werden, wenn ein Attachment gelöscht oder aktualisiert wird, um sicherzustellen, dass Benutzer immer Zugriff auf gültige URLs haben. Auch soll der Cache das Interface von cache.ts implementieren.

- Die Endpunkte für Attachments müssen beim Abrufen der Attachments (abrufen aller Transaktion Attachments) die generische (bereits implementierte) Pagination supporten

- Die API in @budgetbuddyde/api soll für Transkationen angepasst werden.

# Hinweise

- Alle allgemeinen Änderungen für die Attachments sollen in der Dokumentation festgehalten werden
- Alle Änderungen für die Transaktionen sollen in der Dokumentation festgehalten werden