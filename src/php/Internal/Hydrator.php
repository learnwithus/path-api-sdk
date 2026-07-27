<?php

declare(strict_types=1);

namespace VchLt\Path\Internal;

use VchLt\Path\Dto\AuthenticatedUser;
use VchLt\Path\Dto\Course;
use VchLt\Path\Dto\LearnerState;
use VchLt\Path\Dto\Milestone;
use VchLt\Path\Dto\Progress;
use VchLt\Path\Exception\ResponseException;

final class Hydrator
{
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
        );
    }

    /** @param array<string, mixed> $data */
    private static function milestone(array $data): Milestone
    {
        $type = self::string($data, 'type');
        if (!in_array($type, ['boolean', 'string', 'array', 'number', 'completion'], true)) {
            throw new ResponseException('Invalid milestone type.');
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
        );
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
        if (!is_array($value) || !array_is_list($value)) {
            return false;
        }
        foreach ($value as $item) {
            if (!is_string($item) && !is_int($item) && !is_float($item)) {
                return false;
            }
        }
        return true;
    }
}
