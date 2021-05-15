Obsluga zapytań REST.

Pobranie listy wszystkich tłumaczeń:

```
GET /translation
```

Pobranie struktury (księgi, rozdziały) wybranego tłumaczenia:

```
GET /translation/{translationId}
```

Pobranie wersetów z wybranego rozdziału:

```
GET /translation/{translationId}/book/{bookId}/chapter/{chapterId}
```

Pobranie pomocniczej listy wszystkich ksiąg wraz z aliasami:

```
GET /book
```
