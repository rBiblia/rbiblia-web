<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\SearchQuery;

class SearchQueryTest extends TestCase
{
    public function testGetQueryReturnsCorrectValue(): void
    {
        $data = ['query' => 'Jesus', 'translation' => 'en_kjv'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame('Jesus', $searchQuery->getQuery());
    }

    public function testGetTranslationReturnsCorrectValue(): void
    {
        $data = ['query' => 'Jesus', 'translation' => 'en_kjv'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame('en_kjv', $searchQuery->getTranslation());
    }

    public function testSearchQueryWithPolishCharacters(): void
    {
        $data = ['query' => 'miłość', 'translation' => 'pl_ubg'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame('miłość', $searchQuery->getQuery());
        $this->assertSame('pl_ubg', $searchQuery->getTranslation());
    }

    public function testSearchQueryWithEmptyQuery(): void
    {
        $data = ['query' => '', 'translation' => 'en_kjv'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame('', $searchQuery->getQuery());
    }

    public function testSearchQueryWithLongQuery(): void
    {
        $longQuery = str_repeat('a', 1000);
        $data = ['query' => $longQuery, 'translation' => 'en_kjv'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame($longQuery, $searchQuery->getQuery());
    }

    public function testSearchQueryWithSpecialCharacters(): void
    {
        $data = ['query' => '"God\'s love"', 'translation' => 'en_kjv'];
        $searchQuery = new SearchQuery($data);

        $this->assertSame('"God\'s love"', $searchQuery->getQuery());
    }
}
