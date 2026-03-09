# Mobile Performance Review: Fullscreen vs Drawer UI

Data: 2026-03-10

Zakres:
- statyczny code review
- analiza wspolnych cech dwoch grup interfejsu
- fokus na problemy wydajnosciowe na slabszych smartfonach

## Cel

Zidentyfikowac wspolny mianownik dla dwoch grup funkcji:

Grupa A:
- SideMenu opcji
- menu notatek
- wyszukiwanie

Grupa B:
- porownywarka wersetow
- porownywarka rozdzialow
- menu wyboru ksiag

Oraz odpowiedziec, dlaczego grupa B na niektorych urzadzeniach:
- nie dziala poprawnie
- albo powoduje bardzo mocne spowolnienie responsywnosci

podczas gdy grupa A:
- miewa przyciecia
- ale zwykle pozostaje uzywalna nawet na slabszych telefonach

## Wniosek glowny

Roznica nie sprowadza sie tylko do tego, ze jedna grupa otwiera sie jako okienko, a druga pelnoekranowo.

Rzeczywisty podzial jest taki:

- Grupa A to panele typu drawer
- Grupa B to pelnoekranowe workspace overlaye

To sa dwa rozne wzorce UI, ktore maja bardzo rozny koszt renderowania, compositingu i obslugi scrolla na mobile.

## Grupa A: drawer / panel boczny

Do tej grupy naleza:
- SideMenu
- Notes
- Search

### Wspolne cechy

- ograniczona szerokosc
- panel osadzony przy prawej krawedzi
- wejscie przez `transform: translateX(...)`
- osobny scroll wewnatrz panelu
- glowna tresc aplikacji pozostaje w tle
- panel nie zajmuje calego viewportu

### Potwierdzenie w kodzie

- [assets/scss/_side-menu.scss](/d:/rbiblia-web/assets/scss/_side-menu.scss#L78)
- [assets/scss/_notes.scss](/d:/rbiblia-web/assets/scss/_notes.scss#L26)
- [assets/scss/_search.scss](/d:/rbiblia-web/assets/scss/_search.scss#L26)
- [assets/scss/_mobile.scss](/d:/rbiblia-web/assets/scss/_mobile.scss#L59)

### Znaczenie wydajnosciowe

Ta grupa jest relatywnie lzejsza, bo:
- repaint i compositing obejmuja mniejszy obszar ekranu
- panel zwykle ma mniejszy DOM niz widok full screen
- mniejsza jest liczba elementow renderowanych jednoczesnie
- animacja wejscia jest prostsza i lokalna

### Dlaczego mimo to bywaja przyciecia

Sa nadal obecne koszty:
- `backdrop-filter`
- `box-shadow`
- `position: fixed`
- `will-change`
- osobny scroll i animowane wejscie panelu

Pliki:
- [assets/scss/_mixins.scss](/d:/rbiblia-web/assets/scss/_mixins.scss#L3)
- [assets/scss/_mixins.scss](/d:/rbiblia-web/assets/scss/_mixins.scss#L10)
- [assets/scss/_notes.scss](/d:/rbiblia-web/assets/scss/_notes.scss#L5)
- [assets/scss/_search.scss](/d:/rbiblia-web/assets/scss/_search.scss#L5)

W praktyce:
- slab­sze telefony to odczuwaja
- ale zwykle jeszcze nie przekracza to progu calkowitej nieuzywalnosci

## Grupa B: fullscreen workspace overlay

Do tej grupy naleza:
- SelectionGrid
- ComparisonGrid
- ChapterComparison

### Wspolne cechy

- zajmuja caly viewport
- sa nakladane jako pelnoekranowa warstwa nad aplikacja
- maja wlasny duzy kontener layoutu i scrolla
- renderuja duzo tresci naraz
- czesto utrzymuja aktywne tlo aplikacji pod spodem
- korzystaja z overlay/background blur na calym ekranie

### Potwierdzenie w kodzie

- [assets/js/SelectionGrid.js](/d:/rbiblia-web/assets/js/SelectionGrid.js#L99)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L583)
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L208)
- [assets/scss/_selection-grid.scss](/d:/rbiblia-web/assets/scss/_selection-grid.scss#L5)
- [assets/scss/_comparison-modal.scss](/d:/rbiblia-web/assets/scss/_comparison-modal.scss#L2)
- [assets/scss/_mobile.scss](/d:/rbiblia-web/assets/scss/_mobile.scss#L443)

### Wspolny mianownik architektoniczny

To nie sa zwykle modale.

To sa pelnoekranowe powierzchnie robocze, ktore:
- przykrywaja cala aplikacje
- same potrafia byc ciezkie
- jednoczesnie nie odpinaja w praktyce glownych komponentow znajdujacych sie pod spodem

W `Bible` reader pozostaje zamontowany niezaleznie od otwarcia tych widokow:
- [assets/js/Bible.js](/d:/rbiblia-web/assets/js/Bible.js#L646)
- [assets/js/Bible.js](/d:/rbiblia-web/assets/js/Bible.js#L670)

To oznacza, ze urzadzenie utrzymuje naraz:
- glowny reader
- pelnoekranowy overlay
- dodatkowy duzy DOM overlayu
- warstwy compositingu i blur

## Dlaczego fullscreen powoduje duzo gorsze lagi

### 1. Blur i compositing obejmuja caly ekran

Najwazniejsza wspolna cecha problematyczna dla tej grupy:
- `backdrop-filter` na warstwie pelnoekranowej

Pliki:
- [assets/scss/_selection-grid.scss](/d:/rbiblia-web/assets/scss/_selection-grid.scss#L11)
- [assets/scss/_comparison-modal.scss](/d:/rbiblia-web/assets/scss/_comparison-modal.scss#L4)
- [assets/scss/_mobile.scss](/d:/rbiblia-web/assets/scss/_mobile.scss#L447)

Skutek:
- GPU musi przetwarzac caly viewport
- koszt rośnie przy scrollu i animacji
- slabsze urzadzenia Android bardzo zle znosza ten wzorzec

### 2. Overlaye buduja duzy DOM

`SelectionGrid`:
- renderuje wiele sekcji i wiele kafelkow ksiag/rozdzialow
- [assets/js/SelectionGrid.js](/d:/rbiblia-web/assets/js/SelectionGrid.js#L127)

`ComparisonGrid`:
- renderuje panel glowny, sticky area, wiele slotow porownania i teksty porownawcze
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L602)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L724)

`ChapterComparison`:
- renderuje caly rozdzial w ukladzie desktopowym lub mobilnym
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L331)
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L355)

Skutek:
- duzy koszt layoutu
- duzy koszt paintu
- wzrost zapotrzebowania na pamiec

### 3. Tlo pozostaje aktywne

Fullscreen overlay nie zastępuje aplikacji, tylko naklada sie na nia.

W praktyce nadal istnieje:
- Reader z wersetami
- BottomNavigation
- dodatkowe stany i event handling aplikacji glownej

Plik:
- [assets/js/Bible.js](/d:/rbiblia-web/assets/js/Bible.js#L616)

Skutek:
- uklad nie jest minimalny
- koszty tła nie znikaja
- przy slabszym sprzecie system dochodzi szybciej do limitu wydajnosci

### 4. W porownywarkach dochodzi koszt danych i CPU

`ComparisonGrid`:
- pobiera caly rozdzial dla kazdej translacji, mimo ze pokazuje pojedynczy werset
- liczy diffy tekstu i LCS

Pliki:
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L189)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L333)
- [assets/js/ComparisonGrid.js](/d:/rbiblia-web/assets/js/ComparisonGrid.js#L372)

`ChapterComparison`:
- pobiera dwa cale rozdzialy i renderuje ich sume

Plik:
- [assets/js/ChapterComparison.js](/d:/rbiblia-web/assets/js/ChapterComparison.js#L89)

Skutek:
- spowolnienie nie jest tylko wizualne
- to takze obciazenie CPU i parsowania danych

### 5. Sticky i nested scroll podnosza koszt na mobile

W `ComparisonGrid` jest sticky pinned area:
- [assets/scss/_comparison-modal.scss](/d:/rbiblia-web/assets/scss/_comparison-modal.scss#L58)

W `ChapterComparison` jest osobny przewijany body:
- [assets/scss/_mobile.scss](/d:/rbiblia-web/assets/scss/_mobile.scss#L652)

Skutek:
- dodatkowe przeliczenia layoutu podczas przewijania
- wieksze ryzyko lagow na slabszych Androidach

## Dlaczego grupa A dziala, a grupa B juz nie

Najkrotsza odpowiedz:

Grupa A obciaza tylko fragment ekranu.

Grupa B obciaza:
- caly ekran
- caly compositing viewportu
- duzy DOM overlayu
- aktywne tlo aplikacji
- czasem dodatkowo siec i CPU

To jest wspolny mianownik, ktory najlepiej tlumaczy:
- przyciecia w drawerach
- ale znacznie gorsze lagi lub calkowita nieuzywalnosc fullscreen view

## Najbardziej prawdopodobny root cause

Najbardziej prawdopodobny problem nie jest w pojedynczej funkcji fullscreen API.

Najbardziej prawdopodobny root cause to wzorzec architektoniczny:
- pelnoekranowy overlay
- z blur na calym viewportcie
- z duza iloscia renderowanej tresci
- przy pozostawieniu aktywnej aplikacji pod spodem

Na slabszych smartfonach ten wzorzec przekracza budzet wydajnosci i daje:
- opoznienia dotyku
- jank przy scrollu
- zawieszanie po otwarciu widoku
- w skrajnych przypadkach wrazenie, ze funkcja "nie dziala"

## Ktore elementy sa najbardziej podejrzane

Najbardziej ryzykowne dla mobile sa:
- pelnoekranowe `backdrop-filter`
- duze pelnoekranowe kontenery `fixed`
- sticky header w `ComparisonGrid`
- renderowanie wielu translacji naraz
- renderowanie calego rozdzialu w `ChapterComparison`
- utrzymywanie aktywnego readera pod fullscreen overlayem

## Podsumowanie

Wspolny mianownik grupy A:
- drawer / side panel
- mniejszy obszar repaintu
- mniejszy koszt DOM
- mniejszy koszt compositingu

Wspolny mianownik grupy B:
- pelnoekranowy workspace overlay
- blur i compositing na calym ekranie
- duzy DOM
- aktywne tlo aplikacji pod spodem
- w czesci przypadkow dodatkowy koszt sieci i CPU

To jest najtrafniejsze wyjasnienie, dlaczego fullscreenowe funkcje na niektorych urzadzeniach niedzialaja lub dramatycznie psuja responsywnosc, a panele typu SideMenu/Notes/Search tylko czasem przycinaja.

## Metoda

Raport przygotowany na podstawie statycznego przegladu kodu:
- bez zmian w kodzie
- bez runtime profilingu
- bez testow na fizycznych urzadzeniach

Wnioski wynikaja z architektury UI, sposobu renderowania, stylow CSS oraz wzorcow znanych z problemow wydajnosciowych na slabszych telefonach z Androidem.
