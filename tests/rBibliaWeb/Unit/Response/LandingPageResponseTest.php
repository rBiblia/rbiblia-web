<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Response;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Response\LandingPageResponse;

class LandingPageResponseTest extends TestCase
{
    private string $assetsDir;
    private string $cssFile;
    private string $jsFile;

    protected function setUp(): void
    {
        $this->assetsDir = APP_PATH_ASSETS;
        if (!is_dir($this->assetsDir)) {
            mkdir($this->assetsDir, 0777, true);
        }

        $this->cssFile = $this->assetsDir . '/app.css';
        $this->jsFile = $this->assetsDir . '/app.js';

        file_put_contents($this->cssFile, 'body { color: black; }');
        file_put_contents($this->jsFile, 'console.log("hello");');
    }

    protected function tearDown(): void
    {
        if (file_exists($this->cssFile)) {
            unlink($this->cssFile);
        }
        if (file_exists($this->jsFile)) {
            unlink($this->jsFile);
        }
        if (is_dir($this->assetsDir)) {
            rmdir($this->assetsDir);
        }
    }

    public function testRenderWithoutStatsClass(): void
    {
        $response = new LandingPageResponse();

        $this->expectOutputRegex('(<!DOCTYPE html>)');
        $this->expectOutputRegex('(<title>rBiblia Web</title>)');
        $this->expectOutputRegex('(<!-- the Matomo code will be placed here only in prod env -->)');

        $response->render();
    }
}
