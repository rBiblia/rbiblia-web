<?php declare(strict_types=1);

namespace rBibliaWeb\Controller;

use rBibliaWeb\Controller\Traits\LanguageProviderTrait;
use rBibliaWeb\Controller\Traits\ResponseTrait;

class ReportController
{
    use LanguageProviderTrait;
    use ResponseTrait;

    public function __construct(array $settings)
    {
        // todo: setup mailer
    }

    public function submit(string $language): void
    {
        // todo: send report by mail

        $this->setResponse([
            'status' => true,
            'message' => '',
        ]);
    }
}
