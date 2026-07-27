<?php

declare(strict_types=1);

namespace VchLt\Path\Token;

interface TokenStorageInterface
{
    public function getToken(): ?string;

    public function setToken(?string $token): void;
}
