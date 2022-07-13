<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

class Verse
{
    /** @var string */
    private $bookId;

    /** @var int */
    private $chapterId;

    /** @var int */
    private $verseId;

    /** @var string */
    private $content;

    public function __construct(string $bookid, int $chapterId, int $verseId, string $content)
    {
        $this->bookId = $bookid;
        $this->chapterId = $chapterId;
        $this->verseId = $verseId;
        $this->content = $content;
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
