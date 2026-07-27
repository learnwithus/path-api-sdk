<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class AuthenticatedUser extends User
{
    /**
     * @param array<string, string|int|float|bool|list<string>|null> $attributes
     */
    public function __construct(
        string $id,
        ?string $name,
        ?string $email,
        ?string $firstName,
        ?string $lastName,
        public readonly array $attributes,
    ) {
        parent::__construct($id, $name, $email, $firstName, $lastName);
    }
}
