<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Controller;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Controller\SearchController;

class SearchControllerTest extends TestCase
{
    private SearchController $searchController;

    protected function setUp(): void
    {
        $settings = [
            'db_name' => ':memory:',
            'db_user' => '',
            'db_pass' => '',
            'db_host' => '',
            'db_driver' => 'pdo_sqlite',
        ];

        $this->searchController = new SearchController($settings);

        $reflection = new \ReflectionClass(SearchController::class);
        $property = $reflection->getProperty('db');
        $property->setAccessible(true);
        $db = $property->getValue($this->searchController);

        $db->executeStatement('CREATE TABLE data_en_kjv (book VARCHAR(3), chapter INT, verse INT, content TEXT)');
        $db->executeStatement('INSERT INTO data_en_kjv (book, chapter, verse, content) VALUES ("gen", 1, 1, "In the beginning God created the heaven and the earth")');
    }

    public function testQueryReturnsResults(): void
    {
        $inputStream = json_encode(['translation' => 'en_kjv', 'query' => 'God heaven']);

        $this->expectOutputRegex('(In the beginning God)');

        try {
            $this->searchController->query('en', $inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testQueryInvalidJsonReturnsError(): void
    {
        $inputStream = 'invalid';

        $this->expectOutputRegex('("code":404)');

        try {
            $this->searchController->query('en', $inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testQueryEmptyWordsReturnsNoResults(): void
    {
        $inputStream = json_encode(['translation' => 'en_kjv', 'query' => '   ']);

        $this->expectOutputRegex('("results":\[\])');

        try {
            $this->searchController->query('en', $inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testQueryDatabaseErrorReturnsErrorResponse(): void
    {
        $inputStream = json_encode(['translation' => 'en_nonexistent', 'query' => 'God']);

        $this->expectOutputRegex('("code":404)');

        try {
            $this->searchController->query('en', $inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }
}
