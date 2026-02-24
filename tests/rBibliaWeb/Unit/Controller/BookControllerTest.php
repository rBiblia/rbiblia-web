<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Controller;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Controller\BookController;

class BookControllerTest extends TestCase
{
    private BookController $bookController;

    protected function setUp(): void
    {
        $this->bookController = new BookController();
    }

    public function testIfGetBookListReturnsSomeBooks(): void
    {
        $this->expectOutputRegex('(habak)');
        $this->expectOutputRegex('(colossians)');
        $this->expectOutputRegex('(philemon)');

        try {
            $this->bookController->getBookList('en');
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }
}
