<?php declare(strict_types=1);

namespace rBibliaWeb\App;

use FastRoute;
use rBibliaWeb\Controller\BookController;
use rBibliaWeb\Controller\SearchController;
use rBibliaWeb\Controller\TranslationController;
use rBibliaWeb\Response\LandingPageResponse;
use rBibliaWeb\Response\PageNotFoundResponse;
use rBibliaWeb\Value\Action;

class WebApp
{
    private const SERVER_ID = 'rBiblia Web Server';

    public function __construct(private readonly array $settings = [])
    {
    }

    public function run(): void
    {
        $dispatcher = FastRoute\simpleDispatcher(function(FastRoute\RouteCollector $r): void {
            $landingPageAction = new Action(new LandingPageResponse(), 'render', $this->settings);

            $r->addRoute('GET', '/', $landingPageAction);
            $r->addRoute('GET', '/{l:[a-z]{2}}/{t:[a-z]{2}_\w+}/{b:[a-z0-9]{3}}/{c:\d+}', $landingPageAction);

            $r->addGroup('/api/{language:[a-z]{2}}', function (FastRoute\RouteCollector $r): void {
                $translationController = new TranslationController($this->settings);

                $r->addRoute('GET', '/translation', new Action($translationController, 'getTranslationList'));
                $r->addGroup('/translation/{translationId:[a-z]{2}_\w+}',
                    function (FastRoute\RouteCollector $r) use ($translationController): void {
                    $r->addRoute('GET', '', new Action($translationController, 'getTranslationStructureById'));
                    $r->addRoute('GET', '/book/{bookId:[a-z0-9]{3}}/chapter/{chapterId:\d+}', new Action(
                        $translationController, 'getVerses'
                    ));
                });

                $r->addRoute('GET', '/book', new Action(new BookController(), 'getBookList'));
                $r->addRoute('POST', '/search', new Action(new SearchController($this->settings), 'query'));
            });
        });

        // fetch method and URI
        $httpMethod = $_SERVER['REQUEST_METHOD'];
        $uri = (string) $_SERVER['REQUEST_URI'];

        // strip query string (?foo=bar) and decode URI
        if (false !== $pos = strpos($uri, '?')) {
            $uri = substr($uri, 0, $pos);
        }
        $uri = rawurldecode($uri);

        // send extra header for identification
        header(sprintf('X-Powered-By: %s', self::SERVER_ID));

        $routeInfo = $dispatcher->dispatch($httpMethod, $uri);
        switch ($routeInfo[0]) {
            case FastRoute\Dispatcher::METHOD_NOT_ALLOWED:
            case FastRoute\Dispatcher::NOT_FOUND:
                (new PageNotFoundResponse())->render();
                break;
            case FastRoute\Dispatcher::FOUND:
                $routeInfo[1]->call($routeInfo[2]);
                break;
        }
    }
}
