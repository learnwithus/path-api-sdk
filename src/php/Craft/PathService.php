<?php

declare(strict_types=1);

namespace VchLt\Path\Craft;

use VchLt\Path\Dto\AuthenticatedUser;
use VchLt\Path\Dto\Course;
use VchLt\Path\Dto\LearnerState;
use VchLt\Path\Dto\Progress;
use VchLt\Path\PathClient;
use VchLt\Path\PathConfig;
use yii\base\Component;

final class PathService extends Component
{
    private ?PathClient $client = null;
    private ?LearnerState $learnerState = null;

    public function getClient(): PathClient
    {
        if ($this->client === null) {
            $module = PathModule::getInstance();
            $this->client = new PathClient(
                new PathConfig($module->courseId, $module->courseUrl, $module->pathUrl),
                tokenStorage: new CraftTokenStorage(),
            );
        }
        return $this->client;
    }

    public function getLearnerState(): LearnerState
    {
        return $this->learnerState ??= $this->getClient()->getLearnerState();
    }

    public function checkAuth(): ?AuthenticatedUser
    {
        return $this->getLearnerState()->user;
    }

    public function getUser(): ?AuthenticatedUser
    {
        return $this->getLearnerState()->user;
    }

    public function getCourse(): ?Course
    {
        return $this->getLearnerState()->course;
    }

    /** @return list<\VchLt\Path\Dto\Milestone> */
    public function getMilestones(): array
    {
        return $this->getLearnerState()->milestones;
    }

    public function getProgress(string $milestoneSlug): ?Progress
    {
        return $this->getClient()->getProgress($this->getLearnerState(), $milestoneSlug);
    }

    public function getLoginUrl(?string $callbackUrl = null): string
    {
        return $this->getClient()->getLoginUrl($callbackUrl);
    }

    /** @return array<string, mixed> */
    public function getLearnerStore(): array
    {
        return $this->getClient()->getLearnerStore();
    }

    public function submitProgress(string $milestoneSlug, mixed $input = null): Progress
    {
        $progress = $this->getClient()->submitProgress($milestoneSlug, $input);
        $this->learnerState = null;
        return $progress;
    }

    /** @param array<string, mixed> $values @return array<string, mixed> */
    public function updateLearnerStore(array $values): array
    {
        return $this->getClient()->updateLearnerStore($values);
    }

    public function logout(): void
    {
        $this->getClient()->logout();
        $this->learnerState = LearnerState::loggedOut();
    }
}
