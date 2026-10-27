<?php declare(strict_types=1);

namespace rBibliaWeb\Provider;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Provider\Traits\ProviderTrait;
use rBibliaWeb\Value\SearchQuery;

class SearchQueryProvider
{
    use LanguageProviderTrait;
    use ProviderTrait;

    private const array SUPPORTED_PARAMS = [
        'query',
        'translation',
    ];

    public ?SearchQuery $searchQuery {
        get {
            return $this->searchQuery;
        }
    }

    public function __construct(string $language, string|false $inputStream)
    {
        $this->searchQuery = new SearchQuery($this->getInputStream($language, self::SUPPORTED_PARAMS, $inputStream));
    }
}
