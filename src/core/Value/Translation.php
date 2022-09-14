<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

use rBibliaWeb\Exception\VerseNotFoundException;

class Translation
{
    private array $verses;

    private int $totalVerseCount;

    public function __construct(private readonly About $about, Body $body)
    {
        $this->verses = $body->getContent();
        $this->totalVerseCount = $body->getTotalVerseCount();
    }

    public function getAbout(): About
    {
        return $this->about;
    }

    public function getVerseAt(string $bookId, $chapterId, $verseId): Verse
    {
        if (!isset($this->verses[$bookId][$chapterId][$verseId])) {
            throw new VerseNotFoundException($bookId, $chapterId, $verseId);
        }

        return new Verse($bookId, $chapterId, $verseId, $this->verses[$bookId][$chapterId][$verseId]);
    }

    public function getBooks(): array
    {
        return array_keys($this->verses);
    }

    public function getChapters(string $bookId): array
    {
        return array_keys($this->verses[$bookId]);
    }

    public function getVerses(string $bookId, int $chapterId): array
    {
        return array_keys($this->verses[$bookId][$chapterId]);
    }

    public function getTotalVerseCount(): int
    {
        return $this->totalVerseCount;
    }
}
