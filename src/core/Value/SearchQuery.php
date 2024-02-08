<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

readonly class SearchQuery
{
    private string $query;

    private string $translation;

    public function __construct(array $data)
    {
        $this->query = $data['query'];
        $this->translation = $data['translation'];
    }

    public function getQuery(): string
    {
        return $this->query;
    }

    public function getTranslation(): string
    {
        return $this->translation;
    }
}
