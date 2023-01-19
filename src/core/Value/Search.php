<?php declare(strict_types=1);

namespace rBibliaWeb\Value;

use InvalidArgumentException;

class Search
{
    private const SUPPORTED_PARAMS = [
        'query',
        'translation',
    ];

    public function __construct(
        private readonly array $post
    ) {
        foreach (self::SUPPORTED_PARAMS as $param) {
            if (empty($this->post[$param])) {
                throw new InvalidArgumentException(sprintf('Parameter `%s` was not submitted or is invalid', $param));
            }
        }
    }

    public function getQuery(): string
    {
        return $this->post['query'];
    }

    public function getTranslation(): string
    {
        return $this->post['translation'];
    }
}
