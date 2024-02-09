#!/usr/bin/env php
<?php declare(strict_types=1);

const APP_FILE_CONFIG = __DIR__.'/../src/config/app.php';

require_once __DIR__.'/../src/vendor/autoload.php';

if (!file_exists(APP_FILE_CONFIG)) {
    exit(sprintf('ERROR: Settings file `%s` not exists!', APP_FILE_CONFIG));
}

$settings = require_once APP_FILE_CONFIG;

$app = new rBibliaWeb\App\ConsoleApp($settings);
$app->run();
