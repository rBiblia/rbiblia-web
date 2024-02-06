<?php declare(strict_types=1);

$finder = PhpCsFixer\Finder::create()
    ->path('src/core/')
    ->path('public_html/index.php')
    ->path('src/config/app.php.dist')
    ->path('tests/')
    ->path('rector.php')
    ->path('.php-cs-fixer.php')
    ->path('bin/console.php')
    ->in(__DIR__);

$config = new PhpCsFixer\Config();

return $config->setRules([
        '@PHP71Migration' => true,
        '@Symfony:risky' => true,
        'array_syntax' => ['syntax' => 'short'],
        'combine_consecutive_unsets' => true,
        'heredoc_to_nowdoc' => true,
        'no_extra_blank_lines' => [
            'tokens' => [
                'break', 'continue', 'extra', 'return', 'throw', 'use', 'parenthesis_brace_block', 'square_brace_block', 'curly_brace_block'
            ],
        ],
        'echo_tag_syntax' => ['format' => 'long'],
        'no_useless_else' => true,
        'no_useless_return' => true,
        'ordered_class_elements' => true,
        'ordered_imports' => true,
        'php_unit_strict' => true,
        'return_type_declaration' => true,
        'simplified_null_return' => false,
        'void_return' => true,
        'phpdoc_order' => true,
        'semicolon_after_instruction' => true,
        'strict_comparison' => true,
        'strict_param' => true,
        'phpdoc_align' => false,
        'declare_strict_types' => true,
    ])
    ->setRiskyAllowed(true)
    ->setFinder($finder);
