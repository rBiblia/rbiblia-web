<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Controller\Traits\ResponseTrait;

class BookController
{
    use LanguageProviderTrait;
    use ResponseTrait;

    public function getBookList(string $language): void
    {
        $this->setResponse($this->getLanguageProvider($language)->getAliases());
    }
}
