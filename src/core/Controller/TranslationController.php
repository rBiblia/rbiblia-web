<?php

declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\ParameterType;
use rBibliaWeb\Bible\Books;

class TranslationController extends DatabaseController
{
    const TABLE_SECURITY = 'security';
    const TABLE_TRANSLATION = 'translation';
    const TABLE_DATA = 'data_%s';

    const ERROR_TRANSLATION_NOT_FOUND = 'Translation not found';
    const ERROR_NO_VERSES_FOUND = 'No verses found in a given chapter';
    const ERROR_QUERY_LIMIT_EXCEEDED = 'Query limit for IP address exceeded, try tomorrow';
    const ERROR_WRONG_IP_ADDRESS = 'Cannot determine IP address of the user';

    const SECURITY_QUERY_LIMIT = 100;

    public static function getTranslationList(): void
    {
        /** @noinspection PhpUnhandledExceptionInspection */
        $statement = self::$db->executeQuery(sprintf(
            'SELECT id, language, name, description, date FROM %s ORDER BY language ASC',
            self::TABLE_TRANSLATION
        ));

        $response = [];
        while (($row = $statement->fetchAssociative()) !== false) {
            $response[] = [
                'id' => $row['id'],
                'language' => $row['language'],
                'name' => $row['name'],
                'description' => $row['description'],
                'date' => $row['date'],
            ];
        }

        self::setResponse($response);
    }

    public static function getTranslationStructureById(string $translationId): void
    {
        self::checkIfTranslationTableExists($translationId);

        /** @noinspection PhpUnhandledExceptionInspection */
        $statement = self::$db->executeQuery(sprintf(
            'SELECT DISTINCT book, chapter FROM %s ORDER BY book ASC, chapter ASC',
            self::getTranslationTable($translationId)
        ));

        $results = [];
        while (($row = $statement->fetchAssociative()) !== false) {
            $results[$row['book']][] = (int) $row['chapter'];
        }

        $response = [];
        foreach (array_keys(Books::ALIASES) as $alias) {
            if (isset($results[$alias])) {
                $response[$alias] = $results[$alias];
            }
        }

        self::setResponse($response);
    }

    public static function getVerses(string $translationId, string $bookId, int $chapterId): void
    {
        self::checkIfTranslationTableExists($translationId);
        self::trackAndValidateQueryUsage();

        /** @noinspection PhpUnhandledExceptionInspection */
        $statement = self::$db->executeQuery(sprintf(
            'SELECT verse, content FROM %s WHERE book=? AND chapter=? ORDER BY verse ASC',
            self::getTranslationTable($translationId)
        ), [
            $bookId,
            $chapterId,
        ], [
            ParameterType::STRING,
            ParameterType::INTEGER,
        ]);

        $response = [];
        while (($row = $statement->fetchAssociative()) !== false) {
            $response[$row['verse']] = $row['content'];
        }

        if (empty($response)) {
            self::setErrorResponse(self::ERROR_NO_VERSES_FOUND);
        }

        self::setResponse($response);
    }

    private static function checkIfTranslationTableExists(string $translationId): void
    {
        /** @noinspection PhpUnhandledExceptionInspection */
        $result = self::$db->fetchOne('SHOW TABLES LIKE ?', [
            self::getTranslationTable($translationId),
        ], [
            ParameterType::STRING,
        ]);

        if (empty($result)) {
            self::setErrorResponse(self::ERROR_TRANSLATION_NOT_FOUND);
        }
    }

    private static function getTranslationTable(string $translationId): string
    {
        return sprintf(self::TABLE_DATA, $translationId);
    }

    private static function trackAndValidateQueryUsage(): void
    {
        $ip = self::getIP();

        // IP address is incorrect
        if (empty($ip) || '0.0.0.0' === $ip) {
            self::setErrorResponse(self::ERROR_WRONG_IP_ADDRESS);
        }

        /* @noinspection PhpUnhandledExceptionInspection */
        // remove all IP addresses older than today
        self::$db->executeQuery(sprintf(
            'DELETE FROM %s WHERE DATE<CURDATE()',
            self::TABLE_SECURITY
        ));

        /** @noinspection PhpUnhandledExceptionInspection */
        // query for a given IP address
        $response = self::$db->fetchOne(sprintf(
            'SELECT query_counter FROM %s WHERE ip=? AND DATE(date)=CURDATE()',
            self::TABLE_SECURITY
        ), [
            ip2long($ip),
        ], [
            ParameterType::INTEGER,
        ]);

        // insert IP address for tracking
        if (false === $response) {
            /* @noinspection PhpUnhandledExceptionInspection */
            self::$db->insert(self::TABLE_SECURITY, [
                'ip' => ip2long($ip),
            ]);

            return;
        }

        // limit exceeded, thrown an exception
        if ((int) $response >= self::SECURITY_QUERY_LIMIT) {
            self::setErrorResponse(self::ERROR_QUERY_LIMIT_EXCEEDED);
        }

        /* @noinspection PhpUnhandledExceptionInspection */
        // increment query counter for current IP address
        self::$db->executeQuery(sprintf(
            'UPDATE %s SET query_counter=query_counter+1 WHERE ip=? AND DATE(date)=CURDATE()',
            self::TABLE_SECURITY
        ), [
            ip2long($ip),
        ], [
            ParameterType::INTEGER,
        ]);
    }

    private static function getIP(): string
    {
        $httpXForwardedFor = getenv('HTTP_X_FORWARDED_FOR');

        if (empty($httpXForwardedFor)) {
            return getenv('REMOTE_ADDR');
        }

        return $httpXForwardedFor;
    }
}
