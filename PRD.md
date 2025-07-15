# Product Requirement Document (PRD) - Foam Clone

## 1. Einführung

### 1.1 Zweck
Dieses Dokument beschreibt die Funktionalität und die Anforderungen für die Anwendung "Foam Clone", einen Wissensgraphen, der alle Dateientypen und besonders Markdown-Notizen und deren Verknüpfungen visualisiert. Ziel ist es, eine interaktive und intuitive Oberfläche für die Navigation und Erkundung von verknüpften Informationen zu bieten, ähnlich wie bei Tools wie Foam oder Obsidian.

### 1.2 Ziele
*   [x] **Bereitstellung einer klaren, interaktiven Visualisierung** von Markdown-Notizen und ihren Beziehungen.
*   [x] **Ermöglichung der einfachen Navigation** und des Zugriffs auf Notizendetails.
*   [x] **Unterstützung der Konfiguration des Notizverzeichnisses** durch den Benutzer.
*   [x] **Suchfunktionen** zur schnellen Auffindung von Informationen.
*   [x] **Gewährleistung einer reaktionsschnellen und performanten Benutzeroberfläche**.
*   [x] **Anpassbares Erscheinungsbild** durch einen Dark/Light-Modus.
*   [x] **Direkte Dateiverwaltung** (Erstellen, Bearbeiten, Löschen, Umbenennen) innerhalb der App.

### 1.3 Umfang
Die erste Version der Anwendung wird sich auf die Kernfunktionalitäten der Graphenvisualisierung, Navigation, Suche und Verzeichnisverwaltung konzentrieren. Zusätzliche Funktionen wie Notizbearbeitung oder erweiterte Graphenanalysen werden für zukünftige Iterationen in Betracht gezogen.

## 2. Produktübersicht

Foam Clone ist eine Webanwendung, die es Benutzern ermöglicht, ihre Markdown-Notizen als interaktiven Wissensgraphen zu visualisieren. Notizen werden als "Knoten" dargestellt, während interne Wikilinks (z.B. `[[Notizname]]`) und die Ordnerstruktur als "Verbindungen" (Links) zwischen diesen Knoten angezeigt werden. Die Anwendung bietet Steuerelemente zur Anpassung der Graphenvisualisierung und eine Seitenleiste für die Suche, Statistiken, Konfiguration und die direkte Bearbeitung von Dateien.

### 2.1 Kernfunktionen

*   **Interaktive Graphenvisualisierung**: Darstellung von Notizen und Ordnern als Knoten in einem kraftbasierten Layout.
*   **Link-Typen**: Unterscheidung zwischen Wikilinks (Notiz-zu-Notiz-Verknüpfungen) und Parent-Child-Links (Ordner-Notiz-Beziehungen).
*   **Knoteninformationen und Editor**: Anzeige von Details (Name, Typ, Pfad) und Bearbeitung des Inhalts von ausgewählten Notizen.
*   **Suchfunktion**: Möglichkeit, Notizen nach Namen oder Inhalt zu durchsuchen und zu relevanten Knoten im Graphen zu springen.
*   **Konfiguration des Notizverzeichnisses**: Der Benutzer kann das Basisverzeichnis der Markdown-Notizen festlegen.
*   **Dynamische Graphenparameter**: Anpassung von D3-Simulationsparametern wie Kraftstärke, Link-Distanz und Ladungsstärke.
*   **Echtzeit-Statistiken**: Anzeige von Anzahl der Knoten, Links, Dateien und Ordnern.
*   **Legende**: Erklärung der Farbcodierung von Knoten (Dateien vs. Ordner).
*   **Theme-Umschaltung**: Wechsel zwischen Dark- und Light-Modus.
*   **CRUD-Operationen**: Erstellen, Lesen, Aktualisieren und Löschen von Dateien direkt im Dateisystem des Benutzers.

## 3. User Stories / Personas

### 3.1 Wissensarbeiter / Forscher
Als Wissensarbeiter möchte ich meine Markdown-Notizen in einer visuellen und interaktiven Karte sehen können, um Zusammenhänge zwischen Ideen leichter zu erkennen und zu navigieren.

### 3.2 Notizen/Dateien-Enthusiast
Als Notizen-Enthusiast möchte ich die Möglichkeit haben, mein lokales Notizverzeichnis einfach zu integrieren und zu visualisieren, ohne dass meine Notizen in eine Cloud hochgeladen werden müssen.

### 3.3 Entwickler / Power-User
Als Entwickler möchte ich die D3-simulationseinstellungen anpassen können, um die Darstellung des Graphen an meine Bedürfnisse anzupassen und die Performance zu optimieren. Ich möchte auch schnell Notizen über eine Suchleiste finden und direkt im Graphen sehen können.

### 3.4 Autor / Content Creator
Als Autor möchte ich neue Notizen erstellen und bestehende Notizen direkt in der Anwendung bearbeiten können, um meinen Workflow zu beschleunigen und nicht ständig zwischen verschiedenen Programmen wechseln zu müssen.

## 4. Funktionale Anforderungen

### 4.1 Graphenvisualisierung
- [x] **FR1.1**: Das System muss alle Dateitypen und deren übergeordnete Verzeichnisse als Knoten im Graphen darstellen.
- [x] **FR1.2**: Das System muss interne Wikilinks (`[[Notizname]]`) in Markdown-Dateien erkennen und als gerichtete oder ungerichtete Verbindungen (Links) zwischen den entsprechenden Notizknoten darstellen.
- [x] **FR1.3**: Das System muss Parent-Child-Beziehungen (Notiz gehört zu Ordner, Ordner gehört zu übergeordnetem Ordner) als Links darstellen.
- [x] **FR1.4**: Knoten, die Dateien repräsentieren, müssen eine Größe relativ zur Dateigröße haben. Ordnerknoten basieren auf der summierten Größe ihres Inhalts.
- [x] **FR1.5**: Knoten müssen farblich zwischen Dateien und Ordnern unterschieden werden können (konfigurierbare Farben).
- [x] **FR1.6**: Jeder Knoten muss einen beschreibenden Text (den Notiznamen) anzeigen.
- [x] **FR1.7**: Ordner müssen ihre enthaltenen Knoten visuell gruppieren, indem ein kraftbasiertes Layout sie zusammenzieht.
- [x] **FR1.8**: Die Sichtbarkeit von Knoten, Links und Beschriftungen muss einzeln umschaltbar sein.
- [x] **FR1.9**: Das System muss Backlinks (eingehende Verknüpfungen) für einen ausgewählten Knoten visuell hervorheben.

### 4.2 Datenaufnahme & Verknüpfung
- [x] **FR2.1**: Das System muss in der Lage sein, Dateien rekursiv aus einem vom Benutzer konfigurierten Basisverzeichnis zu lesen.
- [x] **FR2.2**: Das System muss Dateiinhalte von Markdown-Dateien parsen, um Wikilinks zu identifizieren.
- [ ] **FR2.3**: Das System muss die Graphendaten (Knoten und Links) über eine API bereitstellen.

### 4.3 Interaktivität & Navigation
- [x] **FR3.1**: Benutzer müssen den Graphen zoomen und verschieben (pan) können.
- [x] **FR3.2**: Benutzer müssen einzelne Knoten per Drag-and-Drop bewegen können.
- [x] **FR3.3**: Beim Doppelklicken auf einen Knoten müssen detaillierte Informationen in einer Infobox angezeigt werden und die Seitenleiste sich öffnen.
- [x] **FR3.4**: Beim Klicken auf den Graphen-Hintergrund muss die Knotenauswahl aufgehoben werden.
- [x] **FR3.5**: Beim Auswählen eines Knotens (z.B. über die Suche) muss der Graph automatisch auf diesen Knoten zentrieren und zoomen.
- [x] **FR3.6**: Tooltips müssen beim Mouseover über Knoten den Knotennamen und -typ anzeigen.

### 4.4 Konfiguration & Verwaltung
- [x] **FR4.1**: Der Benutzer muss das Notizbasisverzeichnis über die Benutzeroberfläche ändern und aktualisieren können.
- [x] **FR4.2**: Die Anwendung muss die Konfiguration persistent speichern (z.B. im LocalStorage).
- [x] **FR4.3**: Der Graph muss sich nach einer Verzeichnisänderung automatisch neu laden.
- [x] **FR4.4**: Ein Button zum manuellen Neuladen des Graphen muss vorhanden sein.

### 4.5 Suche
- [x] **FR5.1**: Das System muss eine Suchleiste bereitstellen, um Notizen nach Namen oder Inhalt zu filtern.
- [x] **FR5.2**: Suchergebnisse müssen in einer Liste in der Seitenleiste angezeigt werden.
- [x] **FR5.3**: Beim Klicken auf ein Suchergebnis muss der entsprechende Knoten im Graphen hervorgehoben und fokussiert werden.
- [x] **FR5.4**: Die Suche muss debounced sein, um unnötige API-Aufrufe zu vermeiden.

### 4.6 Informationsanzeige
- [x] **FR6.1**: Die Seitenleiste muss Echtzeit-Statistiken anzeigen: Gesamtzahl der Knoten, Links, Dateien und Ordner.
- [x] **FR6.2**: Die Infobox für ausgewählte Knoten muss mindestens den Namen, Typ, Pfad und eine Inhaltsvorschau (begrenzte Länge) anzeigen.
- [x] **FR6.3**: Eine Legende muss die Bedeutung der Knotenfärbung und Linktypen erklären.

### 4.7 Performance & Skalierbarkeit (Basis)
- [x] **FR7.1**: Das System muss in der Lage sein, Graphen mit einigen hundert Knoten und Links reibungslos darzustellen und zu interagieren.
- [x] **FR7.2**: Die Graphendaten müssen nach Änderungen (z.B. Bearbeiten, Löschen) automatisch aktualisiert werden. Das automatische Aktualisierungsintervall wurde entfernt.

### 4.8 Exportfunktionen
- [x] **FR8.1**: Das System muss eine Funktion zum Exportieren der aktuellen Graphenansicht als SVG- oder PNG-Datei bereitstellen.

### 4.9 Datei-Management (CRUD)
- [x] **FR9.1**: Das System muss dem Benutzer erlauben, eine Lese- und Schreibberechtigung für ein Verzeichnis zu erteilen.
- [x] **FR9.2**: Benutzer müssen in der Lage sein, neue Markdown-Dateien im aktuellen Verzeichnis oder einem Unterverzeichnis zu erstellen.
- [x] **FR9.3**: Benutzer müssen den Inhalt einer ausgewählten Datei in einem Textbereich in der Seitenleiste bearbeiten und speichern können.
- [x] **FR9.4**: Benutzer müssen eine ausgewählte Datei nach Bestätigung löschen können.
- [x] **FR9.5**: Benutzer müssen eine ausgewählte Datei umbenennen können.
- [x] **FR9.6**: Alle Dateioperationen (Erstellen, Aktualisieren, Löschen, Umbenennen) müssen eine automatische Aktualisierung der Graphenansicht auslösen.
- [x] **FR9.7**: Das System muss eine Möglichkeit bieten, den Pfad einer Datei zu kopieren, um sie in einem externen Editor zu öffnen.

## 5. Nicht-Funktionale Anforderungen

### 5.1 Performance
*   [x] **NFR1.1**: Der Graph muss innerhalb von 3 Sekunden für ein Verzeichnis mit bis zu 500 Markdown-Dateien geladen werden.
*   [x] **NFR1.2**: Interaktionen wie Ziehen von Knoten, Zoomen und Verschieben müssen flüssig und ohne spürbare Verzögerung erfolgen.
*   [x] **NFR1.3**: Das Aktualisieren des Graphen nach einer Dateiänderung darf die Benutzerinteraktion nicht merklich stören.

### 5.2 Usability
*   [x] **NFR2.1**: Die Benutzeroberfläche muss intuitiv und leicht verständlich sein.
*   [x] **NFR2.2**: Alle interaktiven Elemente müssen klare visuelle Rückmeldungen geben (z.B. Hover-Effekte, Klick-Effekte, Speicherstatus).
*   [x] **NFR2.3**: Die Anwendung muss eine konsistente Farbgebung und Typografie verwenden.

### 5.3 Maintainability
*   [x] **NFR3.1**: Der Code muss modular und gut kommentiert sein (insbesondere für D3-Visualisierung und React-Komponenten).
*   [x] **NFR3.2**: Die Trennung von Datenverarbeitung (Hooks) und Darstellung (Komponenten) muss klar sein.
*   [x] **NFR3.3**: Die Verwendung von TypeScript soll die Wartbarkeit und Fehlervermeidung verbessern.

### 5.4 Skalierbarkeit (Architektur)
*   [x] **NFR4.1**: Die Architektur muss es ermöglichen, die clientseitige Verarbeitung effizient zu gestalten.
*   [ ] **NFR4.2**: Die API-Endpunkte (falls zukünftig vorhanden) müssen RESTful sein.

## 6. Technische Überlegungen

### 6.1 Architektur
*   **Frontend**: React.js mit TypeScript für die Benutzeroberfläche.
*   **Graphenvisualisierung**: D3.js für die kraftbasierte Graphendarstellung.
*   **Datenquelle**: Client-seitige Dateiverarbeitung mit der File System Access API im `readwrite`-Modus.
*   **Modulsystem**: ES Modules (mit `importmap` für Browser-Ausführung).
*   **Styling**: Tailwind CSS.

### 6.2 Datenfluss
*   Benutzer wählt ein lokales Verzeichnis über die File System Access API aus und erteilt `readwrite`-Berechtigungen.
*   Der Client liest das Verzeichnis rekursiv, parst Markdown-Dateien, identifiziert Wikilinks und generiert Knoten- und Linkdaten.
*   Benutzer kann Dateien über die UI erstellen, bearbeiten oder löschen. Diese Aktionen verwenden das `FileSystemDirectoryHandle`, um das lokale Dateisystem zu ändern.
*   Client aktualisiert D3-Simulation und React-Komponenten basierend auf den Graphendaten nach jeder Änderung.

### 6.3 Entwicklungsumgebung
*   Standard-Webbrowser (Chrome, Edge, Opera oder andere, die die File System Access API unterstützen).

## 7. Zukünftige Erweiterungen (V2 und später)

### 7.1 Erweiterte Such- und Filterfunktionen

#### Fuzzy Search & Volltext-Indexierung
*   **Intelligente Suche**: Suche mit Tippfehlern-Toleranz basierend auf Levenshtein-Distanz
*   **Volltextsuche**: Durchsuchung aller Dateiinhalte mit Highlighting der Treffer im Editor
*   **Erweiterte Filter**: Kombinierbare Filter nach Dateityp, Größe, Erstellungsdatum, letzter Änderung
*   **Gespeicherte Suchabfragen**: Persistierung häufig genutzter Suchbegriffe im LocalStorage
*   **Suchhistorie**: Schnellzugriff auf vorherige Suchanfragen

#### Smart Filtering
*   **Regex-basierte Suche**: Erweiterte Suchmuster für Power-User
*   **Kombinierte Filter**: UND/ODER Logik für komplexe Filterkriterien
*   **Ausschluss-Filter**: "Alles außer..."-Funktionalität
*   **Größen-basierte Filter**: Schnelle Filterung nach Dateigröße (kleine/große Dateien)

### 7.2 Erweiterte Visualisierung

#### Alternative Graph-Layouts
*   **Hierarchisches Layout**: Baum-Struktur für klare Ordnerhierarchien
*   **Kreisförmiges Layout**: Radiale Anordnung für bessere Übersicht bei vielen Knoten
*   **Grid-Layout**: Strukturierte Rasteransicht für systematische Organisation
*   **Zeitbasiertes Layout**: Chronologische Anordnung nach Erstellungs-/Änderungsdatum

#### Erweiterte Node-Darstellung
*   **Miniatur-Vorschauen**: Direkte Anzeige von Bildern als Node-Inhalte
*   **Content-Tooltips**: Erste Zeilen des Dateiinhalts als erweiterte Tooltips
*   **Verschiedene Node-Formen**: Unterschiedliche Geometrien je nach Dateityp
*   **Zeitbasierte Farbkodierung**: Farbgebung nach Erstellungsdatum oder letzter Änderung

#### Graph-Navigation
*   **Breadcrumb-Navigation**: Pfadanzeige durch Ordnerstrukturen
*   **Focus Mode**: Anzeige nur des ausgewählten Knotens und direkter Nachbarn
*   **Zoom-to-fit**: Automatische Anpassung der Ansicht für ausgewählte Node-Gruppen
*   **Minimap**: Übersichtskarte für sehr große Graphen mit Positionsanzeige

### 7.3 Analytics & Insights

#### Knowledge Graph Metriken
*   **Zentralitäts-Analyse**: Identifikation der wichtigsten Hub-Knoten im Netzwerk
*   **Orphaned Notes Erkennung**: Automatische Erkennung isolierter Dateien ohne Verbindungen
*   **Verbindungsstärke-Visualisierung**: Visuelle Darstellung der Link-Intensität
*   **Cluster-Erkennung**: Automatische Gruppierung thematisch verwandter Bereiche

#### Statistik-Dashboard
*   **Wachstums-Trends**: Zeitliche Entwicklung des Wissensgraphen mit Diagrammen
*   **Top-Listen**: Meist-verlinkte und meist-referenzierte Dateien
*   **Dateityp-Verteilung**: Statistische Auswertung der Inhaltstypen
*   **Link-Dichte-Analyse**: Verbindungsintensität pro Ordner oder Themenbereich

### 7.4 Erweiterte Datei-Operationen

#### Bulk-Operationen
*   **Multi-Select**: Gleichzeitige Auswahl und Bearbeitung mehrerer Dateien
*   **Batch-Umbenennung**: Massenumbenennung mit konfigurierbaren Patterns
*   **Bulk-Tag-Management**: Gleichzeitige Tag-Zuweisung für mehrere Dateien
*   **Massenverschiebung**: Drag & Drop für mehrere Dateien zwischen Ordnern

#### Erweiterte Drag & Drop Features
*   **Graph-basiertes Verschieben**: Dateien direkt im Graphen zwischen Ordnern verschieben
*   **Externer Import**: Drag & Drop für Dateien von außerhalb der Anwendung
*   **Visuelles Feedback**: Klare Rückmeldung während Verschiebe-Operationen
*   **Undo/Redo**: Rückgängig-Funktionalität für alle Verschiebe-Aktionen

### 7.5 Workflow-Verbesserungen

#### Template System
*   **Vordefinierte Templates**: Meeting Notes, Daily Journal, Project Planning, etc.
*   **Template-Bibliothek**: Kategorisierte Sammlung wiederverwendbarer Vorlagen
*   **Automatische Template-Anwendung**: Ordner-basierte Template-Zuweisung
*   **Custom Template-Editor**: Benutzeroberfläche zur Erstellung eigener Vorlagen

#### Snippet-System
*   **Wiederverwendbare Text-Bausteine**: Häufig genutzte Textfragmente
*   **Snippet-Kategorisierung**: Organisierte Verwaltung nach Themen
*   **Schnelle Einfügung**: Keyboard-Shortcuts für häufig genutzte Snippets
*   **Variable Platzhalter**: Dynamische Inhalte in Snippets (Datum, Name, etc.)

#### Advanced Editor Features
*   **Markdown-Syntax-Highlighting**: Farbliche Hervorhebung der Markdown-Syntax
*   **Live-Preview**: Gleichzeitige Anzeige von Markdown-Quelltext und gerendeter Ansicht
*   **Auto-Vervollständigung**: Intelligente Vorschläge für bestehende Dateinamen
*   **Wikilink-Vorschläge**: Automatische Vervollständigung beim Erstellen von Wikilinks

### 7.6 Erweiterte Dateiorganisation

#### Smart Folders
*   **Virtuelle Ordner**: Dynamische Ordner basierend auf Suchkriterien
*   **Automatische Kategorisierung**: KI-freie Kategorisierung nach Inhaltsmustern
*   **Tag-basierte Strukturen**: Ordnerorganisation basierend auf Datei-Tags
*   **Favoriten-System**: Schnellzugriff auf häufig genutzte Dateien

#### File Watching & Auto-Refresh
*   **Externe Änderungserkennung**: Automatische Erkennung von Dateiänderungen außerhalb der App
*   **Live-Graph-Updates**: Echtzeit-Aktualisierung des Graphen bei Änderungen
*   **Konfliktauflösung**: Intelligente Behandlung gleichzeitiger Änderungen
*   **Automatische Backups**: Sicherheitskopien vor kritischen Operationen

### 7.7 Erweiterte Export/Import Features

#### Erweiterte Export-Optionen
*   **Interaktive HTML-Exporte**: Vollständig funktionsfähige Graph-Ansicht als HTML
*   **PDF-Reports**: Umfassende Berichte mit Graph-Snapshots und Statistiken
*   **Datenexport**: JSON/CSV-Export der kompletten Graph-Datenstruktur
*   **Markdown-Export**: Export mit erhaltenen Wikilinks und Metadaten

#### Import-Verbesserungen
*   **Tool-Integration**: Import aus Obsidian Vaults, Roam Research, etc.
*   **Automatische Link-Konvertierung**: Intelligente Umwandlung verschiedener Link-Formate
*   **Batch-Import**: Massenimport mit Metadaten-Erhaltung
*   **Import-Vorschau**: Vorschau der Änderungen vor der Ausführung

### 7.8 UI/UX Verbesserungen

#### Erweiterte Keyboard Navigation
*   **Vollständige Shortcuts**: Keyboard-Zugriff für alle Funktionen
*   **Graph-Navigation**: Vim-ähnliche Navigation direkt im Graphen
*   **Kommandopalette**: Cmd+K-Style Schnellzugriff auf alle Funktionen
*   **Anpassbare Shortcuts**: Benutzerdefinierte Tastenkombinationen

#### Workspace Management
*   **Multi-Tab-Support**: Mehrere Workspaces gleichzeitig geöffnet
*   **Workspace-Einstellungen**: Individuelle Konfiguration pro Arbeitsbereich
*   **Session-Wiederherstellung**: Automatische Wiederherstellung beim Neustart
*   **Workspace-Templates**: Vordefinierte Arbeitsbereich-Konfigurationen

#### Performance Optimierungen
*   **Virtualisierung**: Effiziente Darstellung sehr großer Graphen (1000+ Knoten)
*   **Lazy Loading**: Bedarfsgerechtes Laden von Dateiinhalten
*   **Optimierte Rendering-Pipeline**: Verbesserte Performance bei komplexen Visualisierungen
*   **Memory-Management**: Intelligente Speicherverwaltung für große Dateien

### 7.9 Customization Features

#### Erweiterte Theme-Unterstützung
*   **Benutzerdefinierte Farbschemata**: Vollständig anpassbare Farbpaletten
*   **Node-Styling-Optionen**: Individuelle Gestaltung von Knoten und Links
*   **Custom CSS-Support**: Erweiterte Anpassungsmöglichkeiten für Power-User
*   **Theme-Import/Export**: Teilen und Importieren von benutzerdefinierten Themes

#### Layout Persistence
*   **Position-Speicherung**: Beibehaltung manuell angepasster Node-Positionen
*   **Layout-Presets**: Vordefinierte Layout-Konfigurationen für verschiedene Anwendungsfälle
*   **Projekt-spezifische Layouts**: Individuelle Layout-Einstellungen pro Verzeichnis
*   **Layout-Versionierung**: Verwaltung verschiedener Layout-Versionen

### 7.10 Prioritäten für zukünftige Entwicklung

**Höchste Priorität (V2.0):**
1. Fuzzy Search & Volltext-Indexierung
2. Template System
3. Focus Mode & erweiterte Navigation
4. Bulk-Operationen
5. Advanced Editor Features

**Mittlere Priorität (V2.1-V2.2):**
1. Alternative Graph-Layouts
2. Analytics Dashboard
3. Smart Folders
4. Erweiterte Export-Optionen
5. Keyboard Navigation

**Niedrigere Priorität (V3.0+):**
1. Workspace Management
2. Performance Optimierungen für sehr große Graphen
3. Erweiterte Customization Features
4. Import-Funktionen für andere Tools

## 8. Erfolgskriterien

*   Der Wissensgraph wird stabil und reaktionsschnell geladen und angezeigt.
*   Benutzer können Notizen und Ordner im Graphen leicht navigieren und Informationen abrufen.
*   Benutzer können Dateien direkt in der App erstellen, lesen, bearbeiten und löschen.
*   Die Suchfunktion liefert relevante Ergebnisse und ermöglicht ein schnelles Fokussieren auf Notizen.
*   Der Benutzer kann das Notizverzeichnis erfolgreich ändern und die Änderungen werden korrekt angewendet.
*   Die Anwendung bietet ausreichende Konfigurationsmöglichkeiten für die D3-Simulation.
*   Die Anwendung läuft lokal fehlerfrei und ohne Abstürze.