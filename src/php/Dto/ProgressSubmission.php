<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class ProgressSubmission
{
    private function __construct(
        private readonly bool $hasData,
        public readonly mixed $data,
        public readonly ?bool $complete,
        public readonly ?MilestoneFlag $flag = null,
    ) {
    }

    public static function withData(mixed $data, ?bool $complete = null, ?MilestoneFlag $flag = null): self
    {
        return new self(true, $data, $complete, $flag);
    }

    public static function completion(?bool $complete = null, ?MilestoneFlag $flag = null): self
    {
        return new self(false, null, $complete, $flag);
    }

    public function hasData(): bool
    {
        return $this->hasData;
    }
}
