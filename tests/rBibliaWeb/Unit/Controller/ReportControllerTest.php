<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Controller;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Controller\ReportController;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\Mailer;
use Symfony\Component\Mailer\Transport\TransportInterface;
use Symfony\Component\Mime\Email;

class ReportControllerTest extends TestCase
{
    private array $settings;

    protected function setUp(): void
    {
        $this->settings = [
            'mailer' => [
                'smtp_user' => 'user',
                'smtp_password' => 'pass',
                'smtp_host' => 'host',
                'smtp_port' => '25',
                'name' => 'My Mailer',
            ],
            'report' => [
                'email_to_address' => 'to@example.com',
                'email_to_name' => 'To Name',
                'subject' => 'Subject',
            ],
        ];
    }

    public function testSubmitSuccess(): void
    {
        $controller = new ReportController($this->settings);

        $transportMock = $this->createMock(TransportInterface::class);
        $transportMock->expects($this->once())
            ->method('send')
            ->with($this->callback(function (Email $email) {
                $this->assertSame('to@example.com', $email->getTo()[0]->getAddress());
                $this->assertSame('Subject', $email->getSubject());
                $this->assertStringContainsString('Imię i nazwisko: John Doe', (string)$email->getHtmlBody());
                $this->assertStringContainsString('Adres zwrotny: john@example.com', (string)$email->getHtmlBody());
                $this->assertStringContainsString('Tłumaczenie: en_kjv', (string)$email->getHtmlBody());
                return true;
            }));

        $mailer = new Mailer($transportMock);

        $reflection = new \ReflectionClass(ReportController::class);
        $property = $reflection->getProperty('mailer');
        $property->setValue($controller, $mailer);

        $inputStream = json_encode([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'notes' => 'Some notes',
            'content' => 'Corrected content',
            'original_content' => 'Original content',
            'translation' => 'en_kjv',
            'book' => 'gen',
            'chapter' => 1,
            'verse' => 1,
        ]);

        $this->expectOutputRegex('("code":200)');

        try {
            $controller->submit('en', (string)$inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testSubmitMailerThrowsTransportException(): void
    {
        $controller = new ReportController($this->settings);

        $transportMock = $this->createMock(TransportInterface::class);
        $transportMock->expects($this->once())
            ->method('send')
            ->willThrowException(new class('SMTP Error') extends TransportException {
            });

        $mailer = new Mailer($transportMock);

        $reflection = new \ReflectionClass(ReportController::class);
        $property = $reflection->getProperty('mailer');
        $property->setValue($controller, $mailer);

        $inputStream = json_encode([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'notes' => 'Some notes',
            'content' => 'Corrected content',
            'original_content' => 'Original content',
            'translation' => 'en_kjv',
            'book' => 'gen',
            'chapter' => 1,
            'verse' => 1,
        ]);

        $this->expectOutputRegex('("code":404)');
        $this->expectOutputRegex('("message":"SMTP Error")');

        try {
            $controller->submit('en', (string)$inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testSubmitInvalidInput(): void
    {
        $controller = new ReportController($this->settings);

        $inputStream = json_encode([
            'name' => 'John Doe',
            // Missing email
        ]);

        $this->expectOutputRegex('("code":404)');

        try {
            $controller->submit('en', (string)$inputStream);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }
}
