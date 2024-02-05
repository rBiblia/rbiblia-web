<?php declare(strict_types=1);

namespace rBibliaWeb\Response;

class LandingPageResponse
{
    private const TEMPLATE_INDEX = __DIR__.'/../../view/index.phtml';

    public function render(array $settings = []): void
    {
        if (isset($settings['stats_class']) && file_exists($settings['stats_class'])) {
            require_once $settings['stats_class'];

            $matomo = \matomo::getCode(26);
        }

        $cssTimestamp = filemtime(APP_PATH_ASSETS.'/app.css');
        $jsTimestamp = filemtime(APP_PATH_ASSETS.'/app.js');

        require_once self::TEMPLATE_INDEX;
    }
}
