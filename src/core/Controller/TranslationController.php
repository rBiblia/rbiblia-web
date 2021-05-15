<?php

declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\ParameterType;
use rBibliaWeb\Bible\Books;

class TranslationController extends DatabaseController
{
    const TABLE_TRANSLATION = 'translation';
    const TABLE_DATA = 'data_%s';

    const ERROR_TRANSLATION_NOT_FOUND = 'Translation not found';
    const ERROR_NO_VERSES_FOUND = 'No verses found in a given chapter';

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
}
