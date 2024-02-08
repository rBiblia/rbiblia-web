<?php declare(strict_types=1);

namespace rBibliaWeb\Controller\Traits;

use rBibliaWeb\Exception\LanguageNotSupportedException;
use rBibliaWeb\Provider\LanguageProvider;

trait LanguageProviderTrait
{
    use ResponseTrait;

    private ?LanguageProvider $languageProvider = null;

    private function getLanguageProvider(string $language): LanguageProvider
    {
        if (!$this->languageProvider instanceof LanguageProvider) {
            try {
                $this->languageProvider = new LanguageProvider($language);
            } catch (LanguageNotSupportedException $e) {
                $this->setErrorResponse($e->getMessage());

                exit;
            }
        }

        return $this->languageProvider;
    }
}
