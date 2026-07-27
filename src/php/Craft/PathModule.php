<?php

declare(strict_types=1);

namespace VchLt\Path\Craft;

use Craft;
use craft\helpers\App;
use craft\web\Application;
use craft\web\twig\variables\CraftVariable;
use yii\base\Event;
use yii\base\InvalidConfigException;
use yii\base\Module;

final class PathModule extends Module
{
    public string $pathUrl = 'https://path.vchlearn.ca';
    public string $courseId = '';
    public string $courseUrl = '';
    public string $logoutRedirect = '/';

    public static function getInstance(): self
    {
        $module = Craft::$app->getModule('path');
        if (!$module instanceof self) {
            throw new InvalidConfigException('The Path module must be registered with the ID "path".');
        }
        return $module;
    }

    public function init(): void
    {
        Craft::setAlias('@VchLt/Path/Craft', __DIR__);
        $this->controllerNamespace = 'VchLt\\Path\\Craft\\Controllers';
        parent::init();

        $this->pathUrl = $this->resolve($this->pathUrl);
        $this->courseId = $this->resolve($this->courseId);
        $this->courseUrl = $this->resolve($this->courseUrl);
        $this->logoutRedirect = $this->resolve($this->logoutRedirect);
        if ($this->pathUrl === '' || $this->courseId === '' || $this->courseUrl === '') {
            throw new InvalidConfigException('PathModule requires pathUrl, courseId, and courseUrl.');
        }

        $this->setComponents([
            'path' => PathService::class,
        ]);

        Event::on(CraftVariable::class, CraftVariable::EVENT_INIT, static function (Event $event): void {
            /** @var CraftVariable $variable */
            $variable = $event->sender;
            $variable->set('path', PathVariable::class);
        });

        Event::on(Application::class, Application::EVENT_BEFORE_REQUEST, function (): void {
            $this->captureLoginToken();
        });
    }

    public function getPath(): PathService
    {
        /** @var PathService */
        return $this->get('path');
    }

    private function captureLoginToken(): void
    {
        $request = Craft::$app->getRequest();
        if ($request->getIsConsoleRequest()) {
            return;
        }
        $token = $request->getQueryParam('path-token');
        if (!is_string($token) || $token === '') {
            return;
        }

        (new CraftTokenStorage())->setToken($token);
        $response = Craft::$app->getResponse();
        $response->redirect(self::withoutPathToken($request->getAbsoluteUrl()), 303);
        $response->send();
        Craft::$app->end();
    }

    private function resolve(string $value): string
    {
        $resolved = App::parseEnv($value);
        return is_string($resolved) ? $resolved : '';
    }

    private static function withoutPathToken(string $url): string
    {
        $parts = parse_url($url);
        if ($parts === false) {
            return $url;
        }
        $pairs = isset($parts['query']) ? explode('&', $parts['query']) : [];
        $pairs = array_values(array_filter($pairs, static function (string $pair): bool {
            $name = explode('=', $pair, 2)[0];
            return rawurldecode($name) !== 'path-token';
        }));

        $authority = '';
        if (isset($parts['host'])) {
            $authority = ($parts['scheme'] ?? 'https') . '://';
            if (isset($parts['user'])) {
                $authority .= $parts['user'];
                if (isset($parts['pass'])) {
                    $authority .= ':' . $parts['pass'];
                }
                $authority .= '@';
            }
            $authority .= $parts['host'];
            if (isset($parts['port'])) {
                $authority .= ':' . $parts['port'];
            }
        }

        return $authority
            . ($parts['path'] ?? '')
            . ($pairs === [] ? '' : '?' . implode('&', $pairs))
            . (isset($parts['fragment']) ? '#' . $parts['fragment'] : '');
    }
}
