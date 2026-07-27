<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class Course
{
    public function __construct(
        public readonly string $id,
        public readonly string $title,
    ) {
    }
}
