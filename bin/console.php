#!/usr/bin/env php
<?php

declare(strict_types=1);

require_once __DIR__.'/../src/vendor/autoload.php';

$settingsFile = __DIR__.
    '/../src/config/app.php';
if (!file_exists($settingsFile)) {
    exit(sprintf('ERROR: Settings file `%s` not exists!', $settingsFile));
}

$settings = include $settingsFile;

$app = new rBibliaWeb\App\ConsoleApp($settings);
$app->run();
