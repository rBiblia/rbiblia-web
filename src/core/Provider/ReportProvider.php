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
        'notes',
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
        $this->report = new Report($this->getInputStream($language, self::SUPPORTED_PARAMS, $inputStream));
    }

    public function getReport(): Report
    {
        return $this->report;
    }
}
