<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class Milestone
{
    /**
     * @param list<MilestoneField>|null $fields The field definitions of an `object` milestone; null
     *     for every other type.
     */
    public function __construct(
        public readonly int $id,
        public readonly string $courseId,
        public readonly string $title,
        public readonly string $slug,
        public readonly string $type,
        public readonly int $order,
        public readonly string $createdAt,
        public readonly string $updatedAt,
        public readonly ?array $fields = null,
    ) {
    }
}
