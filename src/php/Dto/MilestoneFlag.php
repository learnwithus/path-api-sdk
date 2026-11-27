<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class MilestoneFlag
{
    public const LEVEL_INFO = 'info';
    public const LEVEL_WARNING = 'warning';
    public const LEVEL_CRITICAL = 'critical';

    /**
     * @param 'info'|'warning'|'critical' $level
     */
    public function __construct(
        public readonly string $level,
        public readonly string $message,
    ) {
    }
}
