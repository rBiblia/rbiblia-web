<?php

declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\DriverManager;
use rBibliaWeb\Response\JsonResponse;

abstract class DatabaseController extends JsonResponse
{
    /** @var Connection */
    protected static $db;

    public static function createDatabaseConnection(array $settings): void
    {
        $params = [
            'dbname' => $settings['db_name'],
            'user' => $settings['db_user'],
            'password' => $settings['db_pass'],
            'host' => $settings['db_host'],
            'driver' => $settings['db_driver'],
        ];

        self::$db = DriverManager::getConnection($params);
    }
}
