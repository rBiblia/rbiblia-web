# Code Review: Wydajnosc Mobile

Data: 2026-03-08

Zakres:
- statyczny code review repozytorium
- fokus na wydajnosc i responsywnosc na slabszych telefonach z Androidem
- bez zmian w kodzie

Kontekst zgloszenia:
- problemy z dzialaniem na Oukitel WP62
- problemy z dzialaniem na Hotwav Cyber 13 Pro
- przegladarki: Opera i Firefox

## Wniosek ogolny

Najbardziej prawdopodobna przyczyna problemow to nie pojedynczy blad przegladarki, tylko suma kosztow:
- ciezki startup aplikacji
- pelny render rozdzialu jako duze drzewo React
- duza liczba handlerow dotyku i scrolla
- kosztowne efekty CSS/GPU na overlayach i panelach
- dodatkowy koszt porownan tekstu i pobierania danych dla funkcji comparison

Na urzadzeniach tej klasy taki zestaw bardzo latwo prowadzi do:
- dlugiego czasu startu
- przycinek przy przewijaniu
- opoznionych reakcji na dotyk
- chwilowych zawieszek po otwieraniu paneli i porownan

## Najwazniejsze findings

### 1. Ciezki startup aplikacji

Priorytet: P1

Pliki:
- [assets/app.js](/d:/rbiblia-web/assets/app.js#L3)
- [assets/AppWithIntlProvider.js](/d:/rbiblia-web/assets/AppWithIntlProvider.js#L3)
- [webpack.config.js](/d:/rbiblia-web/webpack.config.js#L10)
- [src/view/index.phtml](/d:/rbiblia-web/src/view/index.phtml#L34)

Obserwacje:
- aplikacja laduje sie jako jeden entry bundle bez code splittingu
- na starcie ladowany jest Bootstrap SCSS, Open Sans i wszystkie trzy paczki tlumaczen
- skrypt aplikacji jest ladowany od razu jako glowny bundle

Skutek:
- wysoki koszt parsowania i kompilacji JS na main thread
- wolniejszy first render na slabszych CPU

Dodatkowy sygnal:
- aktualny artefakt w repo ma ok. 2.64 MB `app.js` oraz ok. 416 KB `app.css` przed kompresja

### 2. Pelny render calego rozdzialu

Priorytet: P1

Pliki:
- [assets/js/Reader.js](/d:/rbiblia-web/assets/js/Reader.js#L29)
- [assets/js/Verse.js](/d:/rbiblia-web/assets/js/Verse.js#L24)
- [assets/js/Verse.js](/d:/rbiblia-web/assets/js/Verse.js#L260)

Obserwacje:
- `Reader` renderuje wszystkie wersety przez `Object.entries(verses).map(...)`
- kazdy `Verse` ma wlasne `state`, `ref`, `useEffect` oraz zestaw handlerow
- na pojedynczym wersecie sa obslugiwane klikniecia, long press, touch move, mouse move, keydown

Skutek:
- duza liczba wezlow DOM i listenerow
- koszt renderu i rerenderu rosnie wraz z dlugoscia rozdzialu
- przewijanie moze byc niestabilne na slabszych urzadzeniach

### 3. Comparison jest kosztowny CPU i sieciowo

Priorytet: P1

Pliki:
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L193)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L333)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L372)
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L98)
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L331)

Obserwacje:
- dla porownania wersetu pobierany jest caly rozdzial dla kazdej translacji
- liczony jest diff tokenow i wariant LCS
- chapter comparison renderuje duza liczbe elementow dla obu translacji naraz

Skutek:
- skoki obciazenia CPU po otwarciu porownania
- dodatkowy koszt transferu i parsowania danych
- ryzyko chwilowych freezow na slabszych telefonach

### 4. Dublowanie obslugi scrolla i gestow

Priorytet: P2

Pliki:
- [assets/js/useSwipeNavigation.js](/d:/rbiblia-web/assets/js/useSwipeNavigation.js#L26)
- [assets/js/Bible.js](/d:/rbiblia-web/assets/js/Bible.js#L473)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L493)
- [assets/js/Verse.js](/d:/rbiblia-web/assets/js/Verse.js#L101)
- [assets/js/useScrollDirection.js](/d:/rbiblia-web/assets/js/useScrollDirection.js#L17)
- [assets/js/BottomNavigation.js](/d:/rbiblia-web/assets/js/BottomNavigation.js#L20)
- [assets/js/SideMenu.js](/d:/rbiblia-web/assets/js/SideMenu.js#L48)

Obserwacje:
- sa globalne listenery `touchstart`, `touchmove`, `touchend` na `document`
- dodatkowo wersety maja wlasne handlery dotykowe
- `useScrollDirection` jest uzywany w wiecej niz jednym miejscu

Skutek:
- wyzszy koszt obslugi gestow
- wieksze ryzyko konfliktow pomiedzy scroll, swipe i long press
- szczegolnie problematyczne w Firefox i Opera na Androidzie

### 5. Ciezkie efekty CSS i stale warstwy kompozytowe

Priorytet: P2

Pliki:
- [assets/scss/_mixins.scss](/d:/rbiblia-web/assets/scss/_mixins.scss#L3)
- [assets/scss/_mixins.scss](/d:/rbiblia-web/assets/scss/_mixins.scss#L10)
- [assets/scss/_side-menu.scss](/d:/rbiblia-web/assets/scss/_side-menu.scss#L79)
- [assets/scss/_notes.scss](/d:/rbiblia-web/assets/scss/_notes.scss#L26)
- [assets/scss/_translation-selector.scss](/d:/rbiblia-web/assets/scss/_translation-selector.scss#L480)
- [assets/scss/_base.scss](/d:/rbiblia-web/assets/scss/_base.scss#L93)

Obserwacje:
- aplikacja szeroko uzywa `backdrop-filter: blur(...)`
- stosowane sa `will-change`, `translateZ(0)`, `backface-visibility`
- panele i modale sa `position: fixed` z duzymi cieniami i animacjami

Skutek:
- wyzszy koszt compositingu i repaintow
- ryzyko spadkow FPS przy otwieraniu paneli oraz przy scrollu pod overlayem

### 6. Koszt zalezy od danych konkretnego uzytkownika

Priorytet: P3

Pliki:
- [assets/js/migrateOldNotes.js](/d:/rbiblia-web/assets/js/migrateOldNotes.js#L21)
- [assets/app.js](/d:/rbiblia-web/assets/app.js#L10)
- [assets/js/Notes.js](/d:/rbiblia-web/assets/js/Notes.js#L253)
- [assets/js/Notes.js](/d:/rbiblia-web/assets/js/Notes.js#L945)

Obserwacje:
- migracja starych notatek uruchamia sie synchronicznie przed pierwszym renderem
- panel notatek laduje i filtruje dane z `localStorage` w calosci

Skutek:
- problem moze wystepowac tylko u czesci uzytkownikow
- im wiecej danych w storage, tym gorsze odczucie wydajnosci

## Dodatkowe uwagi

- Wyszukiwarka ma juz lokalna wirtualizacje wynikow, co jest plusem: [assets/js/SearchPanel.js](/d:/rbiblia-web/assets/js/SearchPanel.js#L545)
- Ten mechanizm nie jest jednak uzywany w glownym readerze, czyli tam, gdzie koszt renderu jest najwiekszy
- Service worker pre-cache'uje glowny JS i CSS, ale to pomaga bardziej na siec niz na koszt wykonania JS: [public_html/sw.js](/d:/rbiblia-web/public_html/sw.js#L17)

## Najbardziej prawdopodobny root cause

Najbardziej prawdopodobny scenariusz jest taki:
- telefon otwiera ciezki bundle
- aplikacja wykonuje kosztowny startup
- po wejsciu w rozdzial renderowany jest pelny zestaw wersetow z wieloma listenerami
- przy dodatkowych panelach i overlayach dochodzi koszt blur, animacji i fixed layerow

To razem bardzo dobrze tlumaczy problemy powtarzalne na slabszych telefonach, niezaleznie od tego, czy uzywana jest Opera czy Firefox.

## Co profilowac najpierw

Jesli zespol bedzie robil reprodukcje na urzadzeniu, rekomendowana kolejnosc profilowania:
1. startup i czas do pierwszego interaktywnego renderu
2. zmiana rozdzialu i render listy wersetow
3. scroll w glownym readerze
4. otwieranie `ComparisonGrid` i `ChapterComparison`
5. otwieranie Notes i SideMenu
6. przypadki uzytkownikow z duza iloscia danych w `localStorage`

## Metoda

Raport zostal przygotowany jako statyczny code review repozytorium:
- bez modyfikacji kodu
- bez testow na fizycznych urzadzeniach
- bez runtime profilingu

Wnioski sa oparte na architekturze renderowania, kosztach startu, obsludze wejscia oraz wzorcach CSS typowo problematycznych dla slabszych telefonow z Androidem.
