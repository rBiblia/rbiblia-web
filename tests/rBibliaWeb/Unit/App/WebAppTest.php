<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\App;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\App\WebApp;

class WebAppTest extends TestCase
{
    private array $serverBackup;

    protected function setUp(): void
    {
        $this->serverBackup = $_SERVER;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->serverBackup;
    }

    public function testWebAppRoutesToBookList(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['REQUEST_URI'] = '/api/en/book';

        $app = new WebApp($this->getSettings());

        $this->expectOutputRegex('("code":200)');
        $this->expectOutputRegex('("gen":)');

        try {
            $app->run();
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testWebAppRoutesToNotFound(): void
    {
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['REQUEST_URI'] = '/api/en/nonexistent-route';

        $app = new WebApp($this->getSettings());

        $this->expectOutputRegex('("code":404)');
        $this->expectOutputRegex('("message":"Not found")');

        try {
            $app->run();
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    private function getSettings(): array
    {
        return [
            'security_query_limit' => 0,
            'db_driver' => 'pdo_sqlite',
            'db_name' => ':memory:',
            'db_user' => '',
            'db_pass' => '',
            'db_host' => '',
            'mailer' => [
                'name' => 'Postman',
                'smtp_host' => 'localhost',
                'smtp_user' => 'user',
                'smtp_password' => 'pass',
                'smtp_port' => 25,
                'smtp_auth' => true,
            ],
            'report' => [
                'email_to_address' => 'to@example.com',
                'email_to_name' => 'To Name',
                'subject' => 'Subject',
            ],
        ];
    }
}
