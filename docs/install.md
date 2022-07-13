### Instalacja

- Sklonuj repozytorium.

- Utwórz i skonfiguruj plik `src/config/app.php` bazując na `app.php.dist`.

- Zaimportuj strukturę dla bazy MySQL z pliku `/docs/db_structure.sql`.

- Zainstaluj zależności:

```bash
bin\make dev
```

- Zaimportuj tłumczenia (zobacz również plik [console.md](console.md)):

```bash
bin\console i --all
```

###

Korzystanie z dockera.

```bash
$ docker-compose up
```

Logowanie się do kontenera dockera

```bash
$ docker-compose exec web bash
```

Aby przygotować środowisko do odpalenia w kontenerze,
    jeśli nie dysponujesz Windowsem
    i nie mozesz uruchomić pliku make.bat,
wykonaj następujące komendy w kontenerze:

```
$ composer install
$ yarn install
$ yarn encore dev --watch
```

Podgląd strony będzie dostępny pod adresem http://localhost/ .
