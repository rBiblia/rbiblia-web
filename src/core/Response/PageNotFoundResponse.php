<?php

declare(strict_types=1);

namespace rBibliaWeb\Response;

class PageNotFoundResponse extends JsonResponse
{
    public const ERROR_MESSAGE = 'Not found';

    public static function render(): void
    {
        self::setErrorResponse(self::ERROR_MESSAGE);
    }
}
