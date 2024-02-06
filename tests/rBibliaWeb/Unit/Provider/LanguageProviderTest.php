<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Provider;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Exception\LanguageNotSupportedException;
use rBibliaWeb\Provider\LanguageProvider;

class LanguageProviderTest extends TestCase
{
    private LanguageProvider $languageProvider;

    protected function setUp(): void
    {
        $this->languageProvider = new LanguageProvider('en');
    }

    public function testIfLanguageProviderReturnsSomeAliases(): void
    {
        $results = $this->languageProvider->getAliases();

        $this->assertIsArray($results);
        $this->assertArrayHasKey('eph', $results);
        $this->assertArrayHasKey('gal', $results);
        $this->assertArrayHasKey('luk', $results);
        $this->assertArrayHasKey('group', $results['luk']);
        $this->assertArrayHasKey('name', $results['luk']);
        $this->assertArrayHasKey('aliases', $results['luk']);
        $this->assertIsArray($results['luk']['aliases']);
    }

    public function testIfLanguageProviderIsAbleToTranslateMessage(): void
    {
        $results = $this->languageProvider->showMessage(LanguageProvider::MSG_ERROR_NO_VERSES_FOUND);

        $this->assertSame('No verses found in a given chapter', $results);
    }

    public function testIfLanguageProviderHandlesUnsupportedLanguages(): void
    {
        $this->expectException(LanguageNotSupportedException::class);

        new LanguageProvider('not-supported-language-id');
    }
}
