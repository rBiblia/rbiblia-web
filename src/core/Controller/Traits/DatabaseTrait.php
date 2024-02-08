<?php declare(strict_types=1);

namespace rBibliaWeb\Controller\Traits;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use rBibliaWeb\Provider\LanguageProvider;

trait DatabaseTrait
{
    use ResponseTrait;

    protected Connection $db;

    private function createDatabaseConnection(array $settings): void
    {
        $params = [
            'dbname' => $settings['db_name'],
            'user' => $settings['db_user'],
            'password' => $settings['db_pass'],
            'host' => $settings['db_host'],
            'driver' => $settings['db_driver'],
        ];

        $this->db = DriverManager::getConnection($params);
    }

    private function renderDatabaseConnectionErrorResponse(string $language): void
    {
        $this->setErrorResponse($this->getLanguageProvider($language)
            ->showMessage(LanguageProvider::MSG_ERROR_DATABASE_CONNECTION_FAILED));
    }
}
