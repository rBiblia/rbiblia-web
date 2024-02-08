<?php declare(strict_types=1);

namespace rBibliaWeb\Response;

use rBibliaWeb\Controller\Traits\ResponseTrait;

class PageNotFoundResponse
{
    use ResponseTrait;

    private const ERROR_MESSAGE = 'Not found';

    public function render(): void
    {
        $this->setErrorResponse(self::ERROR_MESSAGE);
    }
}
