<?php declare(strict_types=1);

namespace rBibliaWeb\App;

use rBibliaWeb\Command\ImportCommand;
use Symfony\Component\Console\Application;

class ConsoleApp
{
    /** @var Application */
    private $application;

    public function __construct(array $settings = [])
    {
        $this->application = new Application();

        $importCommand = new ImportCommand($settings);
        $this->application->add($importCommand);
    }

    public function run(): void
    {
        $this->application->run();
    }
}
