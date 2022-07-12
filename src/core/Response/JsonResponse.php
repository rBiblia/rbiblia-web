<?php

declare(strict_types=1);

namespace rBibliaWeb\Response;

abstract class JsonResponse
{
    private const STATUS_OK = 200;
    private const STATUS_ERROR = 404;

    private static array $response = [];

    public static function renderResponse(): void
    {
        header('Content-Type: application/json');

        exit(json_encode(self::$response));
    }

    protected static function setResponse(array $response = []): void
    {
        http_response_code(self::STATUS_OK);

        self::$response = [
            'code' => self::STATUS_OK,
            'data' => $response,
        ];

        self::renderResponse();
    }

    protected static function setErrorResponse(string $message): void
    {
        http_response_code(self::STATUS_ERROR);

        self::$response = [
            'code' => self::STATUS_ERROR,
            'message' => $message,
        ];

        self::renderResponse();
    }
}
