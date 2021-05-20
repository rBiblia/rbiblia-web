Instalacja.

- Sklonuj repozytorium.

- Zainstaluj zależności PHP:

```bash
composer install -o
```

- Utwórz i skonfiguruj plik `src/config/app.php` bazując na `app.php.dist`.

- Zaimportuj strukturę dla bazy MySQL z pliku `/docs/db_structure.sql`.

- Zaimportuj tłumczenia (zobacz również plik [console.md](console.md)):

```bash
bin\console i --all
```
