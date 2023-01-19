<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use InvalidArgumentException;
use rBibliaWeb\Value\Search;
use rBibliaWeb\Value\Verse;

class SearchController extends DatabaseController
{
    public static function query(): void
    {
        $search = null;

        try {
            $search = new Search($_POST);
        } catch (InvalidArgumentException $e) {
            self::setErrorResponse($e->getMessage());
        }

        /** @noinspection PhpUnhandledExceptionInspection */
        $statement = self::$db->executeQuery(sprintf(
            'SELECT book, chapter, verse, content FROM %s WHERE content LIKE :query ORDER BY book ASC, chapter ASC, verse ASC',
             TranslationController::getTranslationTable($search->getTranslation())),
            [
                'query' => '%'.$search->getQuery().'%',
            ]
        );

        $results = [];
        while (($row = $statement->fetchAssociative()) !== false) {
            $results[] = (new Verse(
                $row['book'],
                $row['chapter'],
                $row['verse'],
                $row['content']
            ))->serialize();
        }

        self::setResponse([
            'translation' => $search->getTranslation(),
            'query' => $search->getQuery(),
            'results' => $results,
        ]);
    }
}
