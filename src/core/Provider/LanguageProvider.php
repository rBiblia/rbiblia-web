<?php declare(strict_types=1);

namespace rBibliaWeb\Provider;

use rBibliaWeb\Exception\LanguageNotSupportedException;

class LanguageProvider
{
    final public const ERROR_LANGUAGE_NOT_SUPPORTED = 'Given language code is not supported';

    private array $data = [];

    public function __construct(readonly string $language)
    {
        $path = sprintf('%s/%s.json', APP_PATH_LANGUAGE, $language);

        if (!file_exists($path)) {
            throw new LanguageNotSupportedException($language);
        }

        $this->data = json_decode((string)file_get_contents($path), true, 512, \JSON_THROW_ON_ERROR);
    }

    public function getAliases(): array
    {
        return $this->data['aliases'];
    }

    public function showMessage(string $messageId): string
    {
        return $this->data['messages'][$messageId];
    }
}
