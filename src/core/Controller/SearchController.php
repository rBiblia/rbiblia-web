<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\Exception;
use InvalidArgumentException;
use rBibliaWeb\Controller\Traits\DatabaseConnectionErrorResponseTrait;
use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Value\Search;
use rBibliaWeb\Value\Verse;

class SearchController extends DatabaseController
{
    use DatabaseConnectionErrorResponseTrait;
    use LanguageProviderTrait;

    public function __construct(array $settings)
    {
        $this->createDatabaseConnection($settings);
    }

    public function query(string $language): void
    {
        $search = null;

        try {
            $search = new Search($_POST);
        } catch (InvalidArgumentException $e) {
            $this->setErrorResponse($e->getMessage());
        }

        try {
            $statement = $this->db->executeQuery(sprintf(
                'SELECT book, chapter, verse, content FROM %s WHERE content LIKE :query ORDER BY book ASC, chapter ASC, verse ASC',
                TranslationController::getTranslationTable($search->getTranslation())),
                [
                    'query' => '%' . $search->getQuery() . '%',
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

            $this->setResponse([
                'translation' => $search->getTranslation(),
                'query' => $search->getQuery(),
                'results' => $results,
            ]);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }
}
