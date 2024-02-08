<?php declare(strict_types=1);

namespace rBibliaWeb\Provider;

use InvalidArgumentException;
use JsonException;
use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Value\SearchQuery;

class SearchQueryProvider
{
    use LanguageProviderTrait;

    private const SUPPORTED_PARAMS = [
        'query',
        'translation',
    ];

    private ?SearchQuery $searchQuery = null;

    public function __construct(string $language, string|false $inputStream)
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

        foreach (self::SUPPORTED_PARAMS as $param) {
            if (empty($queryData[$param])) {
                throw new InvalidArgumentException(sprintf($this->getLanguageProvider($language)
                    ->showMessage(LanguageProvider::MSG_ERROR_JSON_PARAMETER_IS_MISSING), $param));
            }
        }

        $this->searchQuery = new SearchQuery($queryData);
    }

    public function getSearchQuery(): SearchQuery
    {
        return $this->searchQuery;
    }
}
