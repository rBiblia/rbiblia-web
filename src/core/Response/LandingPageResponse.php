<?php

declare(strict_types=1);

namespace rBibliaWeb\Response;

class LandingPageResponse
{
    const TEMPLATE_INDEX = __DIR__.'/../View/index.phtml';

    public static function render(array $settings = []): void
    {
        if (isset($settings['stats_class']) && file_exists($settings['stats_class'])) {
            require_once $settings['stats_class'];

            $matomo = \matomo::getCode(26);
        }

        $cssTimestamp = filemtime(getcwd().'/assets/app.css');
        $jsTimestamp = filemtime(getcwd().'/assets/app.js');

        require_once self::TEMPLATE_INDEX;
    }
}
