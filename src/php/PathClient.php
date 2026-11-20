<?php

declare(strict_types=1);

namespace VchLt\Path;

use GuzzleHttp\Client;
use GuzzleHttp\Psr7\HttpFactory;
use Psr\Http\Client\ClientExceptionInterface;
use Psr\Http\Client\ClientInterface;
use Psr\Http\Message\RequestFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\StreamFactoryInterface;
use VchLt\Path\Dto\AuthenticatedUser;
use VchLt\Path\Dto\LearnerState;
use VchLt\Path\Dto\Progress;
use VchLt\Path\Dto\ProgressSubmission;
use VchLt\Path\Exception\ApiException;
use VchLt\Path\Exception\ResponseException;
use VchLt\Path\Exception\TransportException;
use VchLt\Path\Internal\Hydrator;
use VchLt\Path\Internal\LearnerStoreValidator;
use VchLt\Path\Token\MemoryTokenStorage;
use VchLt\Path\Token\TokenStorageInterface;

final class PathClient
{
    private readonly ClientInterface $httpClient;
    private readonly RequestFactoryInterface $requestFactory;
    private readonly StreamFactoryInterface $streamFactory;
    private readonly TokenStorageInterface $tokenStorage;

    public function __construct(
        private readonly PathConfig $config,
        ?ClientInterface $httpClient = null,
        ?RequestFactoryInterface $requestFactory = null,
        ?StreamFactoryInterface $streamFactory = null,
        ?TokenStorageInterface $tokenStorage = null,
    ) {
        $factory = new HttpFactory();
        $this->httpClient = $httpClient ?? new Client();
        $this->requestFactory = $requestFactory ?? $factory;
        $this->streamFactory = $streamFactory ?? $factory;
        $this->tokenStorage = $tokenStorage ?? new MemoryTokenStorage();
    }

    public function getLearnerState(): LearnerState
    {
        try {
            return Hydrator::learnerState($this->requestJson('GET', '/api/learner'));
        } catch (\Throwable) {
            return LearnerState::loggedOut();
        }
    }

    public function checkAuth(): ?AuthenticatedUser
    {
        return $this->getLearnerState()->user;
    }

    public function getLoginUrl(?string $callbackUrl = null): string
    {
        $query = http_build_query([
            'courseId' => $this->config->courseId,
            'callbackUrl' => $callbackUrl ?? $this->config->courseUrl,
        ], '', '&', PHP_QUERY_RFC3986);

        return rtrim($this->config->pathUrl, '/') . '/learner/login?' . $query;
    }

    /**
     * Submit progress for a milestone. A bare input is the milestone value; an `object` milestone's
     * value is an associative array keyed by field. Use ProgressSubmission to set completeness
     * separately or for a data-less completion milestone.
     */
    public function submitProgress(string $milestoneSlug, mixed $input = null): Progress
    {
        $body = ['milestoneSlug' => $milestoneSlug];
        if ($input instanceof ProgressSubmission) {
            if ($input->hasData()) {
                $body['value'] = $input->data;
            }
            if ($input->complete !== null) {
                $body['complete'] = $input->complete;
            }
        } elseif ($input !== null) {
            $body['value'] = $input;
        }

        return Hydrator::progress($this->requestJson('POST', '/api/learner', $body));
    }

    /**
     * @return array<string, string|int|float|bool|list<string>|array<string, scalar|null>|list<array<string, scalar|null>>|null>
     */
    public function getLearnerStore(): array
    {
        return LearnerStoreValidator::validate($this->requestJson('GET', '/api/learner/store'));
    }

    /**
     * @param array<string, mixed> $values
     * @return array<string, mixed>
     */
    public function updateLearnerStore(array $values): array
    {
        return LearnerStoreValidator::validate(
            $this->requestJson('POST', '/api/learner/store', ['values' => $values]),
        );
    }

    public function logout(): void
    {
        $this->request('POST', '/api/learner/logout');
        $this->tokenStorage->setToken(null);
    }

    public function getProgress(LearnerState $state, string $milestoneSlug): ?Progress
    {
        $milestoneId = null;
        foreach ($state->milestones as $milestone) {
            if ($milestone->slug === $milestoneSlug) {
                $milestoneId = $milestone->id;
                break;
            }
        }
        if ($milestoneId === null) {
            return null;
        }
        foreach ($state->progress as $progress) {
            if ($progress->courseMilestoneId === $milestoneId) {
                return $progress;
            }
        }
        return null;
    }

    /** @param array<string, mixed>|null $body @return array<string, mixed> */
    private function requestJson(string $method, string $path, ?array $body = null): array
    {
        $response = $this->request($method, $path, $body);
        try {
            $decoded = json_decode((string) $response->getBody(), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new ResponseException('Path returned invalid JSON.', 0, $exception);
        }
        if (!is_array($decoded)) {
            throw new ResponseException('Path returned an invalid response shape.');
        }
        return $decoded;
    }

    /** @param array<string, mixed>|null $body */
    private function request(string $method, string $path, ?array $body = null): ResponseInterface
    {
        $query = http_build_query(['courseId' => $this->config->courseId], '', '&', PHP_QUERY_RFC3986);
        $url = rtrim($this->config->pathUrl, '/') . $path . '?' . $query;
        $request = $this->requestFactory->createRequest($method, $url)
            ->withHeader('Accept', 'application/json');

        $token = $this->tokenStorage->getToken();
        if ($token !== null && $token !== '') {
            $request = $request->withHeader('Authorization', 'Bearer ' . $token);
        }
        if ($body !== null) {
            try {
                $json = json_encode($body, JSON_THROW_ON_ERROR);
            } catch (\JsonException $exception) {
                throw new ResponseException('The request payload could not be encoded.', 0, $exception);
            }
            $request = $request
                ->withHeader('Content-Type', 'application/json')
                ->withBody($this->streamFactory->createStream($json));
        }

        try {
            $response = $this->httpClient->sendRequest($request);
        } catch (ClientExceptionInterface $exception) {
            throw new TransportException('The Path request failed.', 0, $exception);
        }

        // Persist token rotation even when Path subsequently reports an API error.
        $refreshedToken = trim($response->getHeaderLine('set-auth-token'));
        if ($refreshedToken !== '') {
            $this->tokenStorage->setToken($refreshedToken);
        }

        if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
            $rawBody = (string) $response->getBody();
            $message = 'Path request failed.';
            try {
                $error = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
                if (is_array($error) && isset($error['message']) && is_string($error['message'])) {
                    $message = $error['message'];
                }
            } catch (\JsonException) {
                // Preserve the generic message and raw response body.
            }
            throw new ApiException($message, $response->getStatusCode(), $rawBody);
        }

        return $response;
    }
}
