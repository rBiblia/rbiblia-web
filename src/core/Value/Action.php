<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

readonly class Action
{
    public function __construct(
        private object $controller,
        private string $action,
        private array $arguments = []
    ) {
    }

    public function call(array $arguments): void
    {
        $controller = $this->controller;
        $action = $this->action;

        if ($this->arguments !== []) {
            $controller->$action($this->arguments);

            return;
        }

        // convert string numbers to int types for every argument value
        foreach ($arguments as $k => $v) {
            if (is_numeric($v)) {
                $arguments[$k] = (int) $v;
            }
        }

        $controller->$action(...$arguments);
    }
}
