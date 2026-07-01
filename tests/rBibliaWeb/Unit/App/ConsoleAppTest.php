<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\App;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\App\ConsoleApp;
use Symfony\Component\Console\Application;

class ConsoleAppTest extends TestCase
{
    public function testConsoleAppConstructRegistersImportCommand(): void
    {
        $settings = ['some_config' => 'value'];
        $app = new ConsoleApp($settings);

        $reflection = new \ReflectionClass(ConsoleApp::class);
        $property = $reflection->getProperty('application');
        /** @var Application $symfonyApp */
        $symfonyApp = $property->getValue($app);

        $this->assertInstanceOf(Application::class, $symfonyApp);
        $this->assertTrue($symfonyApp->has('import'));
        $this->assertSame($settings, $app->settings);
    }
}
