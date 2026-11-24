<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class Progress
{
    /**
     * @param bool|int|float|string|list<string>|array<string, bool|int|float|string|list<string>|null>|list<array<string, bool|int|float|string|list<string>|null>>|null $value
     */
    public function __construct(
        public readonly int $id,
        public readonly string $userId,
        public readonly int $courseMilestoneId,
        public readonly mixed $value,
        public readonly bool $complete,
        public readonly ?string $updatedBy,
        public readonly string $milestoneSlug,
        public readonly ?string $updatedByName,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {
    }
}
