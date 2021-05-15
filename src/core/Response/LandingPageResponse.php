<?php

declare(strict_types=1);

namespace rBibliaWeb\Response;

class LandingPageResponse
{
    const TEMPLATE_INDEX = __DIR__.'/../View/index.phtml';

    public static function render(): void
    {
        require_once self::TEMPLATE_INDEX;
    }
}
