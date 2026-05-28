<?php declare(strict_types=1);

namespace rBibliaWeb\Provider;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Provider\Traits\ProviderTrait;
use rBibliaWeb\Value\Report;

class ReportProvider
{
    use LanguageProviderTrait;
    use ProviderTrait;

    private const array SUPPORTED_PARAMS = [
        'name',
        'email',
        'content',
        'original_content',
        'translation',
        'book',
        'chapter',
        'verse',
    ];

    private ?Report $report = null;

    public function __construct(string $language, string|false $inputStream)
    {
        $data = $this->getInputStream($language, self::SUPPORTED_PARAMS, $inputStream);
        
        $jsonInput = $inputStream !== false ? $inputStream : '{}';
        $decoded = \json_decode($jsonInput, true);
        $data['notes'] = isset($decoded['notes']) ? (string)$decoded['notes'] : '';

        $this->report = new Report($data);
    }

    public function getReport(): Report
    {
        return $this->report;
    }
}
