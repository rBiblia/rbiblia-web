<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\Body;

class BodyTest extends TestCase
{
    public function testBodyStartsEmpty(): void
    {
        $body = new Body();
        $this->assertSame([], $body->getContent());
        $this->assertSame(0, $body->getTotalVerseCount());
    }

    public function testAddVersePopulatesContentAndIncrementsCount(): void
    {
        $body = new Body();
        $body->addVerse('gen', 1, 1, 'In the beginning');
        $body->addVerse('gen', 1, 2, 'And the earth');
        $body->addVerse('exo', 2, 1, 'And there went');

        $expectedContent = [
            'gen' => [
                1 => [
                    1 => 'In the beginning',
                    2 => 'And the earth',
                ]
            ],
            'exo' => [
                2 => [
                    1 => 'And there went',
                ]
            ],
        ];

        $this->assertSame($expectedContent, $body->getContent());
        $this->assertSame(3, $body->getTotalVerseCount());
    }
}
