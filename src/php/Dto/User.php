<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

class User
{
    public function __construct(
        public readonly string $id,
        public readonly ?string $name = null,
        public readonly ?string $email = null,
        public readonly ?string $firstName = null,
        public readonly ?string $lastName = null,
    ) {
    }
}
