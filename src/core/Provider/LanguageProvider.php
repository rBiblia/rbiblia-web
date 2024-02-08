<?php declare(strict_types=1);

namespace rBibliaWeb\Provider;

use rBibliaWeb\Exception\LanguageNotSupportedException;

class LanguageProvider
{
    final public const MSG_ERROR_TRANSLATION_NOT_FOUND = 'error_translation_not_found';
    final public const MSG_ERROR_NO_VERSES_FOUND = 'error_no_verses_found';
    final public const MSG_ERROR_QUERY_LIMIT_EXCEEDED = 'error_query_limit_exceeded';
    final public const MSG_ERROR_WRONG_IP_ADDRESS = 'error_wrong_ip_address';
    final public const MSG_ERROR_DATABASE_CONNECTION_FAILED = 'error_database_connection_failed';
    final public const MSG_ERROR_JSON_IS_MALFORMED = 'error_json_is_malformed';
    final public const MSG_ERROR_JSON_PARAMETER_IS_MISSING = 'error_json_parameter_is_missing';

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
