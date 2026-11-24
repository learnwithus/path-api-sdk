<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

/** One field of an `object` or `object_array` milestone, defined like a Path data field. Values are stored under `key`. */
final class MilestoneField
{
    /**
     * @param 'text'|'textarea'|'number'|'date'|'datetime'|'boolean'|'select'|'multiselect'|'text_array' $fieldType
     * @param 'string'|'number'|'boolean'|'string[]' $valueType The primitive type of this field's
     *     value, as Path reports it.
     * @param list<string>|null $options The allowed choices of a `select` or `multiselect` field.
     * @param bool $optional Whether a submitted value may leave this field out.
     */
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $fieldType,
        public readonly string $valueType,
        public readonly ?array $options = null,
        public readonly mixed $defaultValue = null,
        public readonly bool $optional = false,
    ) {
    }
}
