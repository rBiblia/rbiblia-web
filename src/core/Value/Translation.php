<?php

declare(strict_types=1);

namespace rBibliaWeb\Value;

use rBibliaWeb\Exception\VerseNotFoundException;

class Translation
{
    /** @var About */
    private $about;

    private $body = [];

    private $totalVerseCount = 0;

    public function __construct(About $about, Body $body)
    {
        $this->about = $about;
        $this->body = $body->getContent();
        $this->totalVerseCount = $body->getTotalVerseCount();
    }

    public function getAbout(): About
    {
        return $this->about;
    }

    public function getVerseAt(string $bookId, $chapterId, $verseId): Verse
    {
        if (!isset($this->body[$bookId][$chapterId][$verseId])) {
            throw new VerseNotFoundException($bookId, $chapterId, $verseId);
        }

        return new Verse($bookId, $chapterId, $verseId, $this->body[$bookId][$chapterId][$verseId]);
    }

    public function getBooks(): array
    {
        return array_keys($this->body);
    }

    public function getChapters(string $bookId): array
    {
        return array_keys($this->body[$bookId]);
    }

    public function getVerses(string $bookId, int $chapterId): array
    {
        return array_keys($this->body[$bookId][$chapterId]);
    }

    public function getTotalVerseCount(): int
    {
        return $this->totalVerseCount;
    }
}
