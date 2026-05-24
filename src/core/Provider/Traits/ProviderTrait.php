<?php declare(strict_types=1);

namespace rBibliaWeb\Provider\Traits;

use InvalidArgumentException;
use JsonException;
use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Provider\LanguageProvider;

trait ProviderTrait
{
    use LanguageProviderTrait;

    public function getInputStream(string $language, array $supportedParams, string|false $inputStream): array
    {
        if ($inputStream === false) {
            $inputStream = '';
        }

        try {
            $queryData = json_decode($inputStream, true, 512, \JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new InvalidArgumentException($this->getLanguageProvider($language)
                ->showMessage(LanguageProvider::MSG_ERROR_JSON_IS_MALFORMED));
        }

        foreach ($supportedParams as $param) {
            if (empty($queryData[$param])) {
                throw new InvalidArgumentException(\sprintf($this->getLanguageProvider($language)
                    ->showMessage(LanguageProvider::MSG_ERROR_JSON_PARAMETER_IS_MISSING), $param));
            }
        }

        return $queryData;
    }
}
