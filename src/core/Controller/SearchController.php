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

    public function query(string $language, ?string $inputStream = null): void
    {
        try {
            $inputStream = $inputStream ?? file_get_contents('php://input');
            $searchQuery = (new SearchQueryProvider($language, $inputStream))->getSearchQuery();
        } catch (\InvalidArgumentException $e) {
            $this->setErrorResponse($e->getMessage());

            return;
        }

        try {
            $words = preg_split('/\s+/', trim($searchQuery->getQuery()), -1, \PREG_SPLIT_NO_EMPTY);
            
            if ($words === [] || $words === false) {
                $this->setResponse([
                    'translation' => $searchQuery->getTranslation(),
                    'query' => $searchQuery->getQuery(),
                    'results' => [],
                ]);
                return;
            }

            $whereParts = [];
            $queryParams = [];

            foreach ($words as $index => $word) {
                // To bypass SQLite/MySQL lack of full unicode case-insensitivity on some collations,
                // we search for both the lowercase version and the first-letter-uppercase version.
                $wordLower = mb_strtolower($word, 'UTF-8');
                $wordUpperFirst = mb_strtoupper(mb_substr($wordLower, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($wordLower, 1, null, 'UTF-8');
                
                $paramLower = 'word' . $index . '_lower';
                $paramUpper = 'word' . $index . '_upper';
                
                $whereParts[] = '(content LIKE :' . $paramLower . ' OR content LIKE :' . $paramUpper . ')';
                $queryParams[$paramLower] = '%' . $wordLower . '%';
                $queryParams[$paramUpper] = '%' . $wordUpperFirst . '%';
            }

            $whereClause = implode(' AND ', $whereParts);

            $sql = sprintf(
                'SELECT book, chapter, verse, content FROM %s WHERE %s ORDER BY book ASC, chapter ASC, verse ASC',
                TranslationController::getTranslationTable($searchQuery->getTranslation()),
                $whereClause
            );

            $statement = $this->db->executeQuery($sql, $queryParams);

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
