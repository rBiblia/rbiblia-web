<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Exception\LanguageNotSupportedException;
use rBibliaWeb\Provider\LanguageProvider;
use rBibliaWeb\Response\JsonResponse;

class BookController extends JsonResponse
{
    public function getBookList(string $language): void
    {
        $languageProvider = null;
        try {
            $languageProvider = new LanguageProvider($language);
        } catch (LanguageNotSupportedException) {
            $this->setErrorResponse(LanguageProvider::ERROR_LANGUAGE_NOT_SUPPORTED);
        }

        $this->setResponse($languageProvider->getAliases());
    }
}
