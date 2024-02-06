<?php declare(strict_types=1);

namespace rBibliaWeb\Response;

abstract class JsonResponse
{
    private const STATUS_OK = 200;
    private const STATUS_ERROR = 404;

    private array $response = [];

    public function renderResponse(): void
    {
        header('Content-Type: application/json');

        echo json_encode($this->response, \JSON_THROW_ON_ERROR);
    }

    protected function setResponse(array $response = []): void
    {
        http_response_code(self::STATUS_OK);

        $this->response = [
            'code' => self::STATUS_OK,
            'data' => $response,
        ];

        $this->renderResponse();
    }

    protected function setErrorResponse(string $message): void
    {
        http_response_code(self::STATUS_ERROR);

        $this->response = [
            'code' => self::STATUS_ERROR,
            'message' => $message,
        ];

        $this->renderResponse();
    }
}
