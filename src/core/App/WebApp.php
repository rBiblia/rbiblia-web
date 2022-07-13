<?php declare(strict_types=1);

namespace rBibliaWeb\App;

use Bramus\Router\Router;
use rBibliaWeb\Controller\TranslationController;
use rBibliaWeb\Response\LandingPageResponse;
use rBibliaWeb\Response\PageNotFoundResponse;

class WebApp
{
    private array $settings = [];

    public function __construct(array $settings = [])
    {
        $this->settings = $settings;
    }

    public function run(): void
    {
        $router = new Router();
        $router->setNamespace('rBibliaWeb\Controller');

        $router->mount('', function () use ($router): void {
            $router->get('/', function (): void {
                LandingPageResponse::render($this->settings);
            });

            $router->mount('/b', function () use ($router): void {
                $router->get('/(.*)', function (): void {
                    LandingPageResponse::render($this->settings);
                });
            });

            TranslationController::createDatabaseConnection($this->settings);

            $router->mount('/api/([a-z]{2})', function () use ($router): void {
                $router->get('/translation', 'TranslationController@getTranslationList');
                $router->mount('/translation/([a-z]{2}_\w+)', function () use ($router): void {
                    $router->get('', 'TranslationController@getTranslationStructureById');
                    $router->get('/book/([a-z0-9]{3})/chapter/(\d+)', 'TranslationController@getVerses');
                });
                $router->get('/book', 'BookController@getBookList');
            });
        });

        $router->set404(function (): void {
            PageNotFoundResponse::render();
        });

        $router->run();
    }
}
