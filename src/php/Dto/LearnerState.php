<?php

declare(strict_types=1);

namespace VchLt\Path\Dto;

final class LearnerState
{
    /**
     * @param list<Milestone> $milestones
     * @param list<Progress> $progress
     */
    public function __construct(
        public readonly ?AuthenticatedUser $user,
        public readonly ?Course $course,
        public readonly array $milestones,
        public readonly array $progress,
    ) {
    }

    public static function loggedOut(): self
    {
        return new self(null, null, [], []);
    }
}
