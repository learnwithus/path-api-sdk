<?php

declare(strict_types=1);

namespace VchLt\Path\Internal;

use VchLt\Path\Dto\AuthenticatedUser;
use VchLt\Path\Dto\Course;
use VchLt\Path\Dto\LearnerState;
use VchLt\Path\Dto\Milestone;
use VchLt\Path\Dto\MilestoneField;
use VchLt\Path\Dto\MilestoneFlag;
use VchLt\Path\Dto\Progress;
use VchLt\Path\Exception\ResponseException;

final class Hydrator
{
    /** A milestone's type: a Path data-field type, or the data-less `completion`. */
    private const MILESTONE_TYPES = [
        'text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'text_array',
        'object', 'object_array', 'completion',
    ];

    /** The scalar data-field types an `object` or `object_array` milestone's fields can use. */
    private const MILESTONE_FIELD_TYPES = [
        'text', 'textarea', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'text_array',
    ];

    /** The JSON shapes Path reports as a milestone's or field's `valueType`. */
    private const VALUE_TYPES = ['string', 'number', 'boolean', 'string[]', 'object', 'object[]'];

    /** Allowed severity levels for a milestone progress flag. */
    private const MILESTONE_FLAG_LEVELS = [
        MilestoneFlag::LEVEL_INFO,
        MilestoneFlag::LEVEL_WARNING,
        MilestoneFlag::LEVEL_CRITICAL,
    ];

    /** @param array<string, mixed> $data */
    public static function learnerState(array $data): LearnerState
    {
        $user = self::map($data, 'user');
        $course = self::map($data, 'course');
        $attributes = self::attributes($data);
        $milestones = self::list($data, 'milestones');
        $progress = self::list($data, 'progress');

        self::assertAttributes($attributes);

        return new LearnerState(
            new AuthenticatedUser(
                self::string($user, 'id'),
                self::nullableString($user, 'name'),
                self::nullableString($user, 'email'),
                self::nullableString($user, 'firstName'),
                self::nullableString($user, 'lastName'),
                $attributes,
            ),
            new Course(self::string($course, 'id'), self::string($course, 'title')),
            array_map(self::milestone(...), $milestones),
            array_map(self::progress(...), $progress),
        );
    }

    /** @param array<string, mixed> $data */
    public static function progress(array $data): Progress
    {
        $value = $data['value'] ?? null;
        if (!self::isMilestoneValue($value)) {
            throw new ResponseException('Invalid progress value.');
        }

        return new Progress(
            self::integer($data, 'id'),
            self::string($data, 'userId'),
            self::integer($data, 'courseMilestoneId'),
            $value,
            self::boolean($data, 'complete'),
            self::nullableString($data, 'updatedBy'),
            self::string($data, 'milestoneSlug'),
            self::nullableString($data, 'updatedByName'),
            self::string($data, 'createdAt'),
            self::string($data, 'updatedAt'),
            self::milestoneFlag($data['flag'] ?? null),
        );
    }

    private static function milestoneFlag(mixed $value): ?MilestoneFlag
    {
        if ($value === null) {
            return null;
        }
        if (
            !is_array($value)
            || array_is_list($value)
            || !in_array($value['level'] ?? null, self::MILESTONE_FLAG_LEVELS, true)
            || !is_string($value['message'] ?? null)
        ) {
            throw new ResponseException('Invalid milestone flag.');
        }

        return new MilestoneFlag($value['level'], $value['message']);
    }

    /** @param array<string, mixed> $data */
    private static function milestone(array $data): Milestone
    {
        $type = self::string($data, 'type');
        if (!in_array($type, self::MILESTONE_TYPES, true)) {
            throw new ResponseException('Invalid milestone type.');
        }
        $valueType = $data['valueType'] ?? null;
        if (
            ($type === 'completion' && $valueType !== null)
            || ($type !== 'completion' && !in_array($valueType, self::VALUE_TYPES, true))
        ) {
            throw new ResponseException('Invalid milestone value type.');
        }
        $options = $data['options'] ?? null;
        if (!self::isNullableStringList($options)) {
            throw new ResponseException('Invalid milestone options.');
        }

        return new Milestone(
            self::integer($data, 'id'),
            self::string($data, 'courseId'),
            self::string($data, 'title'),
            self::string($data, 'slug'),
            $type,
            self::integer($data, 'order'),
            self::string($data, 'createdAt'),
            self::string($data, 'updatedAt'),
            self::milestoneFields($data['fields'] ?? null),
            $valueType,
            $options,
        );
    }

    /** @return list<MilestoneField>|null */
    private static function milestoneFields(mixed $value): ?array
    {
        if ($value === null) {
            return null;
        }
        if (!is_array($value) || !array_is_list($value)) {
            throw new ResponseException('Invalid milestone fields.');
        }

        return array_map(static function (mixed $field): MilestoneField {
            if (
                !is_array($field)
                || !is_string($field['key'] ?? null)
                || !is_string($field['label'] ?? null)
                || !in_array($field['fieldType'] ?? null, self::MILESTONE_FIELD_TYPES, true)
                || !in_array($field['valueType'] ?? null, ['string', 'number', 'boolean', 'string[]'], true)
                || !self::isNullableStringList($field['options'] ?? null)
                || (array_key_exists('optional', $field) && !is_bool($field['optional']))
            ) {
                throw new ResponseException('Invalid milestone field.');
            }
            return new MilestoneField(
                $field['key'],
                $field['label'],
                $field['fieldType'],
                $field['valueType'],
                $field['options'] ?? null,
                $field['defaultValue'] ?? null,
                (bool) ($field['optional'] ?? false),
            );
        }, $value);
    }

    /** @param array<string, mixed> $data @return array<string, mixed> */
    private static function map(array $data, string $key): array
    {
        $value = $data[$key] ?? null;
        if (!is_array($value) || array_is_list($value)) {
            throw new ResponseException("Expected {$key} to be an object.");
        }
        return $value;
    }

    /** @param array<string, mixed> $data @return array<string, mixed> */
    private static function attributes(array $data): array
    {
        $value = $data['attributes'] ?? null;
        if (!is_array($value) || ($value !== [] && array_is_list($value))) {
            throw new ResponseException('Expected attributes to be an object.');
        }
        return $value;
    }

    /** @param array<string, mixed> $data @return list<array<string, mixed>> */
    private static function list(array $data, string $key): array
    {
        $value = $data[$key] ?? null;
        if (!is_array($value) || !array_is_list($value)) {
            throw new ResponseException("Expected {$key} to be a list.");
        }
        foreach ($value as $item) {
            if (!is_array($item) || array_is_list($item)) {
                throw new ResponseException("Expected each {$key} entry to be an object.");
            }
        }
        return $value;
    }

    /** @param array<string, mixed> $data */
    private static function string(array $data, string $key): string
    {
        if (!isset($data[$key]) || !is_string($data[$key])) {
            throw new ResponseException("Expected {$key} to be a string.");
        }
        return $data[$key];
    }

    /** @param array<string, mixed> $data */
    private static function nullableString(array $data, string $key): ?string
    {
        $value = $data[$key] ?? null;
        if ($value !== null && !is_string($value)) {
            throw new ResponseException("Expected {$key} to be a string or null.");
        }
        return $value;
    }

    /** @param array<string, mixed> $data */
    private static function integer(array $data, string $key): int
    {
        if (!isset($data[$key]) || !is_int($data[$key])) {
            throw new ResponseException("Expected {$key} to be an integer.");
        }
        return $data[$key];
    }

    /** @param array<string, mixed> $data */
    private static function boolean(array $data, string $key): bool
    {
        if (!array_key_exists($key, $data) || !is_bool($data[$key])) {
            throw new ResponseException("Expected {$key} to be a boolean.");
        }
        return $data[$key];
    }

    /** @param array<string, mixed> $attributes */
    private static function assertAttributes(array $attributes): void
    {
        foreach ($attributes as $value) {
            $valid = $value === null || is_string($value) || is_int($value) || is_float($value) || is_bool($value);
            $valid = $valid || (is_array($value) && array_is_list($value) && count(array_filter(
                $value,
                static fn (mixed $item): bool => !is_string($item),
            )) === 0);
            if (!$valid) {
                throw new ResponseException('Invalid learner attribute value.');
            }
        }
    }

    private static function isMilestoneValue(mixed $value): bool
    {
        if ($value === null || is_bool($value) || is_int($value) || is_float($value) || is_string($value)) {
            return true;
        }
        if (!is_array($value)) {
            return false;
        }
        if (!array_is_list($value)) {
            return self::isObjectMilestoneValue($value);
        }
        // A list holds strings (`text_array`, `multiselect`) or field groups (`object_array`).
        if ($value === [] || count(array_filter($value, static fn (mixed $item): bool => !is_string($item))) === 0) {
            return true;
        }
        foreach ($value as $item) {
            if (!is_array($item) || ($item !== [] && array_is_list($item)) || !self::isObjectMilestoneValue($item)) {
                return false;
            }
        }
        return true;
    }

    private static function isNullableStringList(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }
        if (!is_array($value) || !array_is_list($value)) {
            return false;
        }
        foreach ($value as $item) {
            if (!is_string($item)) {
                return false;
            }
        }
        return true;
    }

    /** An `object` milestone value, or one group of an `object_array`, maps field keys to scalars, lists of strings, or null. */
    private static function isObjectMilestoneValue(array $value): bool
    {
        foreach ($value as $key => $item) {
            if (!is_string($key)) {
                return false;
            }
            if ($item === null || is_string($item) || is_int($item) || is_float($item) || is_bool($item)) {
                continue;
            }
            if (!is_array($item) || !array_is_list($item)) {
                return false;
            }
            foreach ($item as $entry) {
                if (!is_string($entry)) {
                    return false;
                }
            }
        }
        return true;
    }
}
