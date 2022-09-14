<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

class Body
{
    private array $body = [];

    private int $totalVerseCount = 0;

    public function addVerse(string $bookId, int $chapterId, int $verseId, string $content): void
    {
        $this->body[$bookId][$chapterId][$verseId] = $content;
        ++$this->totalVerseCount;
    }

    public function getContent(): array
    {
        return $this->body;
    }

    public function getTotalVerseCount(): int
    {
        return $this->totalVerseCount;
    }
}
