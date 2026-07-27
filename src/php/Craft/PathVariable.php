<?php

declare(strict_types=1);

namespace VchLt\Path\Craft;

use VchLt\Path\Dto\AuthenticatedUser;
use VchLt\Path\Dto\Course;
use VchLt\Path\Dto\LearnerState;
use VchLt\Path\Dto\Progress;

final class PathVariable
{
    private function service(): PathService
    {
        return PathModule::getInstance()->getPath();
    }

    public function getLearnerState(): LearnerState
    {
        return $this->service()->getLearnerState();
    }

    public function checkAuth(): ?AuthenticatedUser
    {
        return $this->service()->checkAuth();
    }

    public function getUser(): ?AuthenticatedUser
    {
        return $this->service()->getUser();
    }

    public function getCourse(): ?Course
    {
        return $this->service()->getCourse();
    }

    /** @return list<\VchLt\Path\Dto\Milestone> */
    public function getMilestones(): array
    {
        return $this->service()->getMilestones();
    }

    public function getProgress(string $milestoneSlug): ?Progress
    {
        return $this->service()->getProgress($milestoneSlug);
    }

    public function getLoginUrl(?string $callbackUrl = null): string
    {
        return $this->service()->getLoginUrl($callbackUrl);
    }

    /** @return array<string, mixed> */
    public function getLearnerStore(): array
    {
        return $this->service()->getLearnerStore();
    }
}
