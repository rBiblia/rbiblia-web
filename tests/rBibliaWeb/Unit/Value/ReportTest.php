<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\Report;

class ReportTest extends TestCase
{
    private const array VALID_DATA = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'notes' => "Line 1\nLine 2",
        'content' => "Correction 1\nCorrection 2",
        'original_content' => 'Original Text',
        'translation' => 'en_kjv',
        'book' => 'gen',
        'chapter' => 1,
        'verse' => 1,
    ];

    public function testGettersReturnCorrectValues(): void
    {
        $report = new Report(self::VALID_DATA);

        $this->assertSame('John Doe', $report->getName());
        $this->assertSame('john@example.com', $report->getEmail());
        $this->assertSame("Line 1<br />\nLine 2", $report->getNotes());
        $this->assertSame("Correction 1<br />\nCorrection 2", $report->getContent());
        $this->assertSame('Original Text', $report->getOriginalContent());
        $this->assertSame('en_kjv', $report->getTranslation());
        $this->assertSame('gen', $report->getBook());
        $this->assertSame('1', $report->getChapter());
        $this->assertSame('1', $report->getVerse());
    }

    public function testGetIPWithRemoteAddr(): void
    {
        $report = new Report(self::VALID_DATA);

        putenv('HTTP_X_FORWARDED_FOR=');
        putenv('REMOTE_ADDR=192.168.1.1');
        $this->assertSame('192.168.1.1', $report->getIP());
    }

    public function testGetIPWithForwardedFor(): void
    {
        $report = new Report(self::VALID_DATA);

        putenv('HTTP_X_FORWARDED_FOR=10.0.0.1');
        putenv('REMOTE_ADDR=192.168.1.1');
        $this->assertSame('10.0.0.1', $report->getIP());

        // Cleanup
        putenv('HTTP_X_FORWARDED_FOR=');
        putenv('REMOTE_ADDR=');
    }
}
