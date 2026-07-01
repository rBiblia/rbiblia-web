<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Exception\VerseNotFoundException;
use rBibliaWeb\Value\About;
use rBibliaWeb\Value\Body;
use rBibliaWeb\Value\Translation;

class TranslationTest extends TestCase
{
    private About $about;
    private Body $body;
    private Translation $translation;

    protected function setUp(): void
    {
        $this->about = new About(
            'translations/kjv.db',
            'hash123',
            'King James Version',
            'KJV',
            'en'
        );

        $this->body = new Body();
        $this->body->addVerse('gen', 1, 1, 'In the beginning');
        $this->body->addVerse('gen', 1, 2, 'And the earth');
        $this->body->addVerse('exo', 1, 1, 'Now these are');

        $this->translation = new Translation($this->about, $this->body);
    }

    public function testGetAbout(): void
    {
        $this->assertSame($this->about, $this->translation->getAbout());
    }

    public function testGetTotalVerseCount(): void
    {
        $this->assertSame(3, $this->translation->getTotalVerseCount());
    }

    public function testGetBooks(): void
    {
        $this->assertSame(['gen', 'exo'], $this->translation->getBooks());
    }

    public function testGetChapters(): void
    {
        $this->assertSame([1], $this->translation->getChapters('gen'));
    }

    public function testGetVerses(): void
    {
        $this->assertSame([1, 2], $this->translation->getVerses('gen', 1));
    }

    public function testGetVerseAtReturnsCorrectVerse(): void
    {
        $verse = $this->translation->getVerseAt('gen', 1, 2);
        $this->assertSame('gen', $verse->getBookId());
        $this->assertSame(1, $verse->getChapterId());
        $this->assertSame(2, $verse->getVerseId());
        $this->assertSame('And the earth', $verse->getContent());
    }

    public function testGetVerseAtThrowsVerseNotFoundException(): void
    {
        $this->expectException(VerseNotFoundException::class);
        $this->expectExceptionMessage('Verse [gen 1:3] was not found in the translation');
        $this->translation->getVerseAt('gen', 1, 3);
    }
}
