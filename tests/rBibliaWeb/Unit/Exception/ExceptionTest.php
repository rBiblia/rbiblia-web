<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Exception;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Exception\LanguageNotSupportedException;
use rBibliaWeb\Exception\VerseNotFoundException;

class ExceptionTest extends TestCase
{
    public function testLanguageNotSupportedExceptionFormatting(): void
    {
        $exception = new LanguageNotSupportedException('fr');
        $this->assertSame('Language [fr] is not supported', $exception->getMessage());
    }

    public function testVerseNotFoundExceptionFormatting(): void
    {
        $exception = new VerseNotFoundException('gen', 1, 1);
        $this->assertSame('Verse [gen 1:1] was not found in the translation', $exception->getMessage());
    }
}
