<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class Milestone
{
    /**
     * @param string $type A Path data-field type (`text`, `textarea`, `number`, `date`, `datetime`,
     *     `boolean`, `select`, `multiselect`, `text_array`, `object`, `object_array`) or the data-less `completion`.
     * @param list<MilestoneField>|null $fields The field definitions of an `object` or `object_array`
     *     milestone; null for every other type.
     * @param 'string'|'number'|'boolean'|'string[]'|'object'|'object[]'|null $valueType The JSON shape of
     *     this milestone's value, as Path reports it; null for `completion`.
     * @param list<string>|null $options The choices of a `select` or `multiselect` milestone.
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
        public readonly ?string $valueType = null,
        public readonly ?array $options = null,
    ) {
    }
}
