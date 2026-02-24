<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\Verse;

class VerseTest extends TestCase
{
    private const TEST_BOOK_ID = 'gen';
    private const TEST_CHAPTER_ID = 1;
    private const TEST_VERSE_ID = 1;
    private const TEST_CONTENT = 'In the beginning God created the heaven and the earth.';

    private Verse $verse;

    protected function setUp(): void
    {
        $this->verse = new Verse(
            self::TEST_BOOK_ID,
            self::TEST_CHAPTER_ID,
            self::TEST_VERSE_ID,
            self::TEST_CONTENT
        );
    }

    public function testGetBookIdReturnsCorrectValue(): void
    {
        $this->assertSame(self::TEST_BOOK_ID, $this->verse->getBookId());
    }

    public function testGetChapterIdReturnsCorrectValue(): void
    {
        $this->assertSame(self::TEST_CHAPTER_ID, $this->verse->getChapterId());
    }

    public function testGetVerseIdReturnsCorrectValue(): void
    {
        $this->assertSame(self::TEST_VERSE_ID, $this->verse->getVerseId());
    }

    public function testGetContentReturnsCorrectValue(): void
    {
        $this->assertSame(self::TEST_CONTENT, $this->verse->getContent());
    }

    public function testSerializeReturnsCorrectArray(): void
    {
        $expected = [
            'book' => self::TEST_BOOK_ID,
            'chapter' => self::TEST_CHAPTER_ID,
            'verse' => self::TEST_VERSE_ID,
            'content' => self::TEST_CONTENT,
        ];

        $this->assertSame($expected, $this->verse->serialize());
    }

    public function testSerializeArrayHasCorrectKeys(): void
    {
        $serialized = $this->verse->serialize();

        $this->assertArrayHasKey('book', $serialized);
        $this->assertArrayHasKey('chapter', $serialized);
        $this->assertArrayHasKey('verse', $serialized);
        $this->assertArrayHasKey('content', $serialized);
    }

    public function testVerseWithEmptyContentIsValid(): void
    {
        $verse = new Verse('gen', 1, 1, '');
        
        $this->assertSame('', $verse->getContent());
    }

    public function testVerseWithSpecialCharactersInContent(): void
    {
        $specialContent = 'Test with "quotes" and special chars: ąęść';
        $verse = new Verse('gen', 1, 1, $specialContent);
        
        $this->assertSame($specialContent, $verse->getContent());
    }
}
