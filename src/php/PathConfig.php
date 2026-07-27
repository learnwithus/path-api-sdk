<?php

declare(strict_types=1);

namespace VchLt\Path;

final class PathConfig
{
    public function __construct(
        public readonly string $courseId,
        public readonly string $courseUrl = '',
        public readonly string $pathUrl = 'https://path.vchlearn.ca',
    ) {
        if ($this->courseId === '') {
            throw new \InvalidArgumentException('courseId must not be empty.');
        }
    }
}
