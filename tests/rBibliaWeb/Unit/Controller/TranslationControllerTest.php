<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Controller;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Result;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use rBibliaWeb\Controller\TranslationController;

class TranslationControllerTest extends TestCase
{
    private array $settings;
    private MockObject $dbMock;

    protected function setUp(): void
    {
        $this->settings = [
            'db_name' => 'test',
            'db_user' => 'user',
            'db_pass' => 'pass',
            'db_host' => 'host',
            'db_driver' => 'pdo_mysql',
            'security_query_limit' => 5,
        ];

        $this->dbMock = $this->createMock(Connection::class);
    }

    public function testGetTranslationListSuccess(): void
    {
        $resultMock = $this->createMock(Result::class);
        $resultMock->expects($this->exactly(2))
            ->method('fetchAssociative')
            ->willReturnOnConsecutiveCalls(
                [
                    'id' => 'en_kjv',
                    'language' => 'en',
                    'name' => 'King James Version',
                    'description' => 'KJV description',
                    'date' => '1611',
                ],
                false
            );

        $this->dbMock->expects($this->once())
            ->method('executeQuery')
            ->willReturn($resultMock);

        $controller = $this->getController();

        $this->expectOutputRegex('("code":200)');
        $this->expectOutputRegex('("id":"en_kjv")');

        try {
            $controller->getTranslationList('en');
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testGetTranslationListDatabaseError(): void
    {
        $this->dbMock->expects($this->once())
            ->method('executeQuery')
            ->willThrowException(new class('DB Error') extends \Exception implements \Doctrine\DBAL\Exception {});

        $controller = $this->getController();

        $this->expectOutputRegex('("code":404)');

        try {
            $controller->getTranslationList('en');
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testGetTranslationStructureByIdSuccess(): void
    {
        // 1. checkIfTranslationTableExists returns non-empty result (table exists)
        $this->dbMock->expects($this->once())
            ->method('fetchOne')
            ->with($this->stringContains('SHOW TABLES LIKE'))
            ->willReturn('data_en_kjv');

        // 2. getTranslationStructureById query
        $resultMock = $this->createMock(Result::class);
        $resultMock->expects($this->exactly(3))
            ->method('fetchAssociative')
            ->willReturnOnConsecutiveCalls(
                ['book' => 'gen', 'chapter' => 1],
                ['book' => 'gen', 'chapter' => 2],
                false
            );

        $this->dbMock->expects($this->once())
            ->method('executeQuery')
            ->willReturn($resultMock);

        $controller = $this->getController();

        $this->expectOutputRegex('("code":200)');
        $this->expectOutputRegex('("gen":\[1,2\])');

        try {
            $controller->getTranslationStructureById('en', 'en_kjv');
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        }
    }

    public function testGetVersesSuccessAndTracksIP(): void
    {
        // 1. checkIfTranslationTableExists
        $this->dbMock->method('fetchOne')
            ->willReturnOnConsecutiveCalls(
                'data_en_kjv', // table exists check
                1 // ip tracking query_counter (ip long exists, counter = 1)
            );

        // 2. executeQuery calls:
        // - DELETE from security
        // - SELECT verse, content
        // - UPDATE query_counter
        $resultMock = $this->createMock(Result::class);
        $resultMock->expects($this->exactly(3))
            ->method('fetchAssociative')
            ->willReturnOnConsecutiveCalls(
                ['verse' => 1, 'content' => 'In the beginning'],
                ['verse' => 2, 'content' => 'And the earth'],
                false
            );

        $this->dbMock->expects($this->exactly(3))
            ->method('executeQuery')
            ->willReturnCallback(function (string $sql) use ($resultMock) {
                if (str_contains($sql, 'SELECT verse, content')) {
                    return $resultMock;
                }
                return $this->createMock(Result::class);
            });

        $controller = $this->getController();

        // Mock IP to be valid
        putenv('REMOTE_ADDR=127.0.0.1');

        $this->expectOutputRegex('("code":200)');
        $this->expectOutputRegex('("1":"In the beginning")');

        try {
            $controller->getVerses('en', 'en_kjv', 'gen', 1);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        } finally {
            putenv('REMOTE_ADDR=');
        }
    }

    public function testGetVersesThrowsErrorWhenWrongIP(): void
    {
        $this->dbMock->method('fetchOne')
            ->willReturn('data_en_kjv'); // table exists check

        $controller = $this->getController();

        // IP is empty
        putenv('REMOTE_ADDR=0.0.0.0');

        $this->expectOutputRegex('("code":404)');

        try {
            $controller->getVerses('en', 'en_kjv', 'gen', 1);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        } finally {
            putenv('REMOTE_ADDR=');
        }
    }

    public function testGetVersesLimitsExceeded(): void
    {
        // 1. checkIfTranslationTableExists
        $this->dbMock->method('fetchOne')
            ->willReturnOnConsecutiveCalls(
                'data_en_kjv', // table exists check
                5 // ip query_counter = 5 (limit is 5)
            );

        $controller = $this->getController();

        putenv('REMOTE_ADDR=127.0.0.1');

        $this->expectOutputRegex('("code":404)');

        try {
            $controller->getVerses('en', 'en_kjv', 'gen', 1);
        } catch (\RuntimeException $e) {
            $this->assertSame('Response sent', $e->getMessage());
        } finally {
            putenv('REMOTE_ADDR=');
        }
    }

    private function getController(): TranslationController
    {
        $controller = new TranslationController($this->settings);
        $reflection = new \ReflectionClass(TranslationController::class);
        $property = $reflection->getProperty('db');
        $property->setValue($controller, $this->dbMock);
        return $controller;
    }
}
