<?php declare(strict_types=1);

namespace rBibliaWeb\Controller\Traits;

use rBibliaWeb\Provider\LanguageProvider;

trait DatabaseConnectionErrorResponseTrait
{
    private function renderDatabaseConnectionErrorResponse(string $language): void
    {
        $this->setErrorResponse($this->getLanguageProvider($language)
            ->showMessage(LanguageProvider::MSG_ERROR_DATABASE_CONNECTION_FAILED));
    }
}
