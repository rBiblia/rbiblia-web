<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\About;

class AboutTest extends TestCase
{
    public function testGettersReturnCorrectValues(): void
    {
        $about = new About(
            'translations/kjv.db',
            'hash123',
            'King James Version',
            'KJV',
            'en',
            'Holy Bible KJV',
            true,
            '1611'
        );

        $this->assertSame('translations/kjv.db', $about->getFile());
        $this->assertSame('hash123', $about->getHash());
        $this->assertSame('King James Version', $about->getName());
        $this->assertSame('KJV', $about->getShortname());
        $this->assertSame('en', $about->getLanguage());
        $this->assertSame('Holy Bible KJV', $about->getDescription());
        $this->assertTrue($about->getAuthorised());
        $this->assertSame('1611', $about->getDate());
        $this->assertSame('kjv', $about->getId());
    }

    public function testDefaultValues(): void
    {
        $about = new About(
            'translations/web.db',
            'hash456',
            'World English Bible',
            'WEB',
            'en'
        );

        $this->assertSame('', $about->getDescription());
        $this->assertFalse($about->getAuthorised());
        $this->assertSame('', $about->getDate());
    }
}
