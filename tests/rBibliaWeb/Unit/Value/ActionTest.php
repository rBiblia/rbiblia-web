<?php declare(strict_types=1);

namespace rBibliaWeb\Unit\Value;

use PHPUnit\Framework\TestCase;
use rBibliaWeb\Value\Action;

class ActionTest extends TestCase
{
    public function testCallWithStaticConstructorArguments(): void
    {
        $controller = new class {
            public array $calledArgs = [];
            public function run(array $args): void
            {
                $this->calledArgs = $args;
            }
        };

        $action = new Action($controller, 'run', ['foo' => 'bar']);
        $action->call(['ignored' => 'value']);

        $this->assertSame(['foo' => 'bar'], $controller->calledArgs);
    }

    public function testCallWithDynamicArgumentsAndTypeConversion(): void
    {
        $controller = new class {
            public array $calledArgs = [];
            public function run(string $a, int $b): void
            {
                $this->calledArgs = [$a, $b];
            }
        };

        $action = new Action($controller, 'run');
        // '123' should be converted to integer 123
        $action->call(['test', '123']);

        $this->assertSame(['test', 123], $controller->calledArgs);
    }
}
