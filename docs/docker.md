### Korzystanie z Dockera

**Wariant podstawowy**

Utworzenia obrazu i uruchomienie kontenera:

```bash
$ docker-compose build
$ docker-compose up
```

Logowanie do kontenera:

```bash
$ docker-compose exec web bash
```

Aby przygotować środowisko do odpalenia w kontenerze, jeśli nie dysponujesz Windowsem i nie mozesz uruchomić pliku `bin/make.bat`, wykonaj następujące komendy w kontenerze:

```bash
$ composer install
$ yarn install
$ yarn encore dev --watch
```

Podgląd strony będzie dostępny pod adresem http://localhost

**Wariant rozszerzony (i bardziej elastyczny)**

Odpalenie kontenera:

```bash
$ make start
```

Utworzony zostanie obraz i uruchomiony kontener. Strona będzie dostępna pod adresem http://localhost

Logowanie do kontenera:

```bash
$ make login
```

Użyj komendy `make` bez parametru, aby uzyskać listę wszystkich obsługiwanych poleceń.
