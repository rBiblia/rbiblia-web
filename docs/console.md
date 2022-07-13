### Instrukcja używania poleceń z linii komend

Import pojedynczego tłumaczenia z pliku *.bibx (np. `pl_bt5.bibix`):

```bash
$ bin/console i --file pl_bt5.bibx
```

Import wszystkich tłumaczeń z plików *.bibx:

```bash
$ bin/console i --all
```

Import wszystkich tłumaczeń z plików *.bibx tylko z wybranej grupy językowej (np. `pl`):

```bash
$ bin/console i --all --language pl
```

Import wszystkich autoryzowanych tłumaczeń z wybranej grupy językowej:

```bash
$ bin/console i --all --language pl --authorised 1
```

Przygotowanie dystrybucji developerskiej:

```bash
$ make dev
```

Przygotowanie dystrybucji produkcyjnej:

```bash
$ make prod
```

Kompilacja assetów:

```bash
$ make asset
```

Kompilacja assetów w czasie rzeczywistym:

```bash
$ make asset-watch
```
