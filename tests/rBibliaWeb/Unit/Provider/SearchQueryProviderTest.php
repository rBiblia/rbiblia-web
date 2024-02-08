<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Provider;

use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use rBibliaWeb\Provider\SearchQueryProvider;

class SearchQueryProviderTest extends TestCase
{
    private const INPUT_DATA = [
        'translation' => 'en_kjv',
        'query' => 'Jesus',
    ];

    public function testIfSearchQueryValueObjectWasCreatedWithCorrectData(): void
    {
        $searchQueryProvider = new SearchQueryProvider('en', json_encode(self::INPUT_DATA));
        $results = $searchQueryProvider->getSearchQuery();

        $this->assertSame(self::INPUT_DATA['translation'], $results->getTranslation());
        $this->assertSame(self::INPUT_DATA['query'], $results->getQuery());
    }

    public function testIfInvalidArgumentExceptionIsThrownWhenPayloadIsEmpty(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new SearchQueryProvider('en', false);
    }

    public function testIfInvalidArgumentExceptionIsThrownWhenTranslationParameterIsMissing(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $testData = self::INPUT_DATA;
        unset($testData['translation']);

        new SearchQueryProvider('en', json_encode($testData));
    }

    public function testIfInvalidArgumentExceptionIsThrownWhenQueryParameterIsMissing(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $testData = self::INPUT_DATA;
        unset($testData['query']);

        new SearchQueryProvider('en', json_encode($testData));
    }
}
