<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Provider;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Provider\ReportProvider;
use rBibliaWeb\Value\Report;

class ReportProviderTest extends TestCase
{
    private const array VALID_PAYLOAD = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'notes' => 'Some notes',
        'content' => 'Corrected content',
        'original_content' => 'Original content',
        'translation' => 'en_kjv',
        'book' => 'gen',
        'chapter' => 1,
        'verse' => 1,
    ];

    public function testGetReportWithValidInputStream(): void
    {
        $inputStream = json_encode(self::VALID_PAYLOAD);
        $provider = new ReportProvider('en', $inputStream);

        $report = $provider->getReport();
        $this->assertInstanceOf(Report::class, $report);
        $this->assertSame('John Doe', $report->getName());
        $this->assertSame('john@example.com', $report->getEmail());
        $this->assertSame('en_kjv', $report->getTranslation());
    }

    public function testConstructorThrowsExceptionOnMalformedJson(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        // Expecting some JSON validation error message
        new ReportProvider('en', 'malformed-json');
    }

    public function testConstructorThrowsExceptionOnMissingParameters(): void
    {
        $payload = self::VALID_PAYLOAD;
        unset($payload['email']); // Remove required field

        $this->expectException(\InvalidArgumentException::class);
        new ReportProvider('en', json_encode($payload));
    }
}
