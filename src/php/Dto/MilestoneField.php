<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

/** One field of an `object` milestone, defined like a Path data field. Values are stored under `key`. */
final class MilestoneField
{
    /**
     * @param 'text'|'textarea'|'number'|'date'|'datetime'|'checkbox'|'select'|'multiselect'|'list' $fieldType
     * @param 'string'|'number'|'boolean'|'string[]' $valueType The primitive type of this field's
     *     value, derived by the SDK from `fieldType`.
     * @param list<string>|null $options The allowed choices of a `select` or `multiselect` field.
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $fieldType,
        public readonly string $valueType,
        public readonly ?array $options = null,
        public readonly mixed $defaultValue = null,
    ) {
    }
}
