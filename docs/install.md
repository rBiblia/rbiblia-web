### Instalacja od podstaw

- Sklonuj repozytorium.

- Utwórz i skonfiguruj plik `src/config/app.php` bazując na `app.php.dist`.

- Zaimportuj strukturę dla bazy MySQL z pliku `/docs/db_structure.sql`.

- Zainstaluj zależności (zobacz plik [docker.md](docker.md) w celu uzyskania instrukcji jak korzystać z Dockera w projekcie):

```bash
$ make dev
```

- Zaimportuj tłumaczenia **wewnątrz kontenera** (zobacz również plik [console.md](console.md)):

```bash
$ bin/console i --all
```
