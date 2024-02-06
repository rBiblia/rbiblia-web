<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Response\JsonResponse;

class BookController extends JsonResponse
{
    use LanguageProviderTrait;

    public function getBookList(string $language): void
    {
        $this->setResponse($this->getLanguageProvider($language)->getAliases());
    }
}
