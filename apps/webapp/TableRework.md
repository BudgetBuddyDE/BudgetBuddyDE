Es werden folgende Tabellen benötigt:

Alle Tabellen sollen TypeSafe sein, d.h. die Spalten und deren Typen müssen definiert werden, damit die Tabelle korrekt funktioniert und Fehler vermieden werden können.

Einfache Tabelle (BasicTable): Kompositionen einzelner Komponenten aus welcher eine einfache Tabelle aus MUI Komponenten erstellt werden kann. Andere Tabllen sollen auf den Komponenten des BasicTables basieren, damit es eine einheitliche Grundlage gibt.
Die Tabelle soll eine konfigurierbare Toolbar besitzen, welche die Möglichkeit bietet:
    1. Einen Title zu setzen
    2. Einen Subtitle zu setzen
    3. Einen Searchbar zu setzen
    4. Buttons zu setzen, welche Aktionen ausführen können (z.B. Exportieren, Hinzufügen, etc.)

Es soll eine EntityTable geben, welche auf der BasicTable Komponente basiert. Er soll sich technsich und fachlich an der aktuellen EntityTable orientieren um das direkte Fetchen über die Slices zu ermöglichen.


Es soll einen DataTable geben, welcher auf MUI-X DataTable basiert. Er soll als Grundbaustein dienen, um komplexere Tabellen zu erstellen, welche z.B. eine Paginierung oder Sortierung benötigen. Er soll so konzipiert sein, dass er flexibel genug ist, um verschiedene Arten von Daten anzuzeigen und zu verwalten.

Es soll einen EntityDataTable geben, welcher auf der DataTable Komponente basiert. Er soll sich technsich und fachlich an der aktuellen EntityTable orientieren um das direkte Fetchen über die Slices zu ermöglichen, aber zusätzlich die Funktionalitäten der DataTable bieten, wie z.B. Paginierung, Sortierung und erweiterte Filtermöglichkeiten.