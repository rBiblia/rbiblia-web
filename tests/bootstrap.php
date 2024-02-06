<?php declare(strict_types=1);

const APP_FILE_CONFIG = __DIR__.'/../src/config/app.php';
const APP_PATH_LANGUAGE = __DIR__.'/../src/language';
const APP_PATH_ASSETS = __DIR__.'/assets';

$baseDir = dirname(__DIR__);

$loader = require __DIR__.'/../src/vendor/autoload.php';
$loader->add('rBiblia', [$baseDir.'/src/core', $baseDir.'/tests/']);
$loader->register();
