<?php

declare(strict_types=1);

namespace VchLt\Path\Exception;

final class ApiException extends PathException
{
    public function __construct(
        string $message,
        public readonly int $statusCode,
        public readonly ?string $responseBody = null,
    ) {
        parent::__construct($message, $statusCode);
    }
}
