<?php declare(strict_types=1);

namespace rBibliaWeb\Exception;

use Exception;
use Throwable;

class LanguageNotSupportedException extends Exception
{
    public function __construct(string $language, int $code = 0, Throwable $previous = null)
    {
        parent::__construct(sprintf('Language [%s] is not supported', $language), $code, $previous);
    }
}
