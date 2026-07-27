<?php

declare(strict_types=1);

namespace VchLt\Path\Internal;

use VchLt\Path\Exception\ResponseException;

final class LearnerStoreValidator
{
    /** @param array<mixed> $store @return array<string, mixed> */
    public static function validate(array $store): array
    {
        if ($store !== [] && array_is_list($store)) {
            throw new ResponseException('Expected the learner store to be an object.');
        }
        foreach ($store as $key => $value) {
            if (!is_string($key) || !self::validValue($value)) {
                throw new ResponseException('Invalid learner store response.');
            }
        }
        return $store;
    }

    private static function validValue(mixed $value): bool
    {
        if ($value === null || is_string($value) || is_int($value) || is_float($value) || is_bool($value)) {
            return true;
        }
        if (!is_array($value)) {
            return false;
        }
        if (array_is_list($value)) {
            if ($value === [] || count(array_filter($value, static fn (mixed $item): bool => !is_string($item))) === 0) {
                return true;
            }
            foreach ($value as $item) {
                if (!is_array($item) || !self::validObject($item)) {
                    return false;
                }
            }
            return true;
        }
        return self::validObject($value);
    }

    /** @param array<mixed> $value */
    private static function validObject(array $value): bool
    {
        foreach ($value as $key => $item) {
            if (!is_string($key) || (
                $item !== null &&
                !is_string($item) &&
                !is_int($item) &&
                !is_float($item) &&
                !is_bool($item) &&
                !(is_array($item) && array_is_list($item) && count(array_filter(
                    $item,
                    static fn (mixed $entry): bool => !is_string($entry),
                )) === 0)
            )) {
                return false;
            }
        }
        return true;
    }
}
