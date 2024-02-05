<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

readonly class Verse
{
    public function __construct(
        private string $bookId,
        private int $chapterId,
        private int $verseId,
        private string $content
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

    public function serialize(): array
    {
        return [
            'book' => $this->bookId,
            'chapter' => $this->chapterId,
            'verse' => $this->verseId,
            'content' => $this->content,
        ];
    }
}
