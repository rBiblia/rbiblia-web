<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use Doctrine\DBAL\Exception;
use rBibliaWeb\Controller\Traits\DatabaseTrait;
use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Controller\Traits\ResponseTrait;
use rBibliaWeb\Provider\SearchQueryProvider;
use rBibliaWeb\Value\Verse;

class SearchController
{
    use DatabaseTrait;
    use LanguageProviderTrait;
    use ResponseTrait;

    public function __construct(array $settings)
    {
        $this->createDatabaseConnection($settings);
    }

    public function query(string $language): void
    {
        try {
            $inputStream = file_get_contents('php://input');
            $searchQuery = (new SearchQueryProvider($language, $inputStream))->getSearchQuery();
        } catch (\InvalidArgumentException $e) {
            $this->setErrorResponse($e->getMessage());

            return;
        }

        try {
            $statement = $this->db->executeQuery(sprintf(
                'SELECT book, chapter, verse, content FROM %s WHERE content LIKE :query ORDER BY book ASC, chapter ASC, verse ASC',
                TranslationController::getTranslationTable($searchQuery->getTranslation())),
                [
                    'query' => '%' . $searchQuery->getQuery() . '%',
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
                'translation' => $searchQuery->getTranslation(),
                'query' => $searchQuery->getQuery(),
                'results' => $results,
            ]);
        } catch (Exception) {
            $this->renderDatabaseConnectionErrorResponse($language);
        }
    }
}
