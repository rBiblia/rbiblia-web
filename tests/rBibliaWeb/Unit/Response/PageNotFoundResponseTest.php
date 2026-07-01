<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Response;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Response\PageNotFoundResponse;

class PageNotFoundResponseTest extends TestCase
{
    public function testRenderOutputs404ResponseAndThrowsException(): void
    {
        $response = new PageNotFoundResponse();

        $this->expectOutputRegex('("code":404)');
        $this->expectOutputRegex('("message":"Not found")');

        try {
            $response->render();
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }
}
