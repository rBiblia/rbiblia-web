<?php

declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Bible\Books;
use rBibliaWeb\Response\JsonResponse;

class BookController extends JsonResponse
{
    public static function getBookList(): void
    {
        self::setResponse(Books::ALIASES);
    }
}
