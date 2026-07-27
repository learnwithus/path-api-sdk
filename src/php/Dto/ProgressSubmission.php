<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class ProgressSubmission
{
    private function __construct(
        private readonly bool $hasData,
        public readonly mixed $data,
        public readonly ?bool $complete,
    ) {
    }

    public static function withData(mixed $data, ?bool $complete = null): self
    {
        return new self(true, $data, $complete);
    }

    public static function completion(?bool $complete = null): self
    {
        return new self(false, null, $complete);
    }

    public function hasData(): bool
    {
        return $this->hasData;
    }
}
