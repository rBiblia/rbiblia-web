<?php declare(strict_types=1);

namespace rBibliaWeb\Exception;

use Exception;
use Throwable;

class VerseNotFoundException extends Exception
{
    public function __construct(string $bookId, int $chapterId, int $verseId, int $code = 0, Throwable $previous = null)
    {
        parent::__construct(sprintf('Verse [%s %d:%d] was not found in the translation', $bookId, $chapterId, $verseId), $code, $previous);
    }
}
