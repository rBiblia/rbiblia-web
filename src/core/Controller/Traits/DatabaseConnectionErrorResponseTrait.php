<?php declare(strict_types=1);

namespace rBibliaWeb\Controller\Traits;

trait DatabaseConnectionErrorResponseTrait
{
    private function renderDatabaseConnectionErrorResponse(string $language): void
    {
        $this->setErrorResponse($this->getLanguageProvider($language)->showMessage('error_database_connection_failed'));
    }
}
