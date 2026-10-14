# Idempotente Ausführungen von Wiederkehrenden Zahlungen

## Konzept

Es soll möglich sein, den Job für wiederkehrende Zahlungen mehrmals auszuführen, ohne dass dies zu doppelten Zahlungen führt. Dies wird durch die Verwendung von eindeutigen Identifikatoren für jede Zahlung erreicht, die sicherstellen, dass jede Zahlung nur einmal verarbeitet wird.

## Identifikatoren

Es gibt eine Tabelle, in welcher ein Hash für jede ausgeführte Zahlung gespeichert wird. Dieser Hash beinhaltet alle variablen Parameter der Zahlung, wie z.B. den Betrag, die Empfängerinformationen und das Datum der Zahlung. Wenn eine Zahlung erneut ausgeführt wird, wird der Hash erneut berechnet und mit den bereits gespeicherten Hashes verglichen. Wenn ein übereinstimmender Hash gefunden wird, wird die Zahlung nicht erneut verarbeitet.

Wenn der Hash nicht gefunden wird, wird die Zahlung verarbeitet und der neue Hash in der Tabelle gespeichert. Dies stellt sicher, dass jede Zahlung nur einmal ausgeführt wird, auch wenn der Job mehrmals gestartet wird.
