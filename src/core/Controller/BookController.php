<?php

declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Exception\LanguageNotSupportedException;
use rBibliaWeb\Provider\LanguageProvider;
use rBibliaWeb\Response\JsonResponse;

class BookController extends JsonResponse
{
    public static function getBookList(string $language): void
    {
        try {
            $languageProvider = new LanguageProvider($language);
        } catch (LanguageNotSupportedException $e) {
            self::setErrorResponse(LanguageProvider::ERROR_LANGUAGE_NOT_SUPPORTED);
        }

        self::setResponse($languageProvider->getAliases());
    }
}
