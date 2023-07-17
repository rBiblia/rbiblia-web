### Uproszczona instrukcja rozpoczęcia pracy dla programistów

- Sklonuj repozytorium na dysk twardy swojego komputera.

- Utwórz i skonfiguruj plik `src/config/app.php` bazując na `app.php.dist`. Skontaktuj się z [autorem](https://kontakt.toborek.info), aby otrzymać gotowy plik umożliwiający pracę na bazie testowej.

- Uruchom Dockera:

```bash
make start
```

- Zainstaluj zależności Composera/Node oraz skompiluj assety:

```bash
make dev
```
