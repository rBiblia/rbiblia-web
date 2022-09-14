<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

class Verse
{
    public function __construct(
        private readonly string $bookId,
        private readonly int $chapterId,
        private readonly int $verseId,
        private readonly string $content
    ) {
    }

    public function getBookId(): string
    {
        return $this->bookId;
    }

    public function getChapterId(): int
    {
        return $this->chapterId;
    }

    public function getVerseId(): int
    {
        return $this->verseId;
    }

    public function getContent(): string
    {
        return $this->content;
    }
}
