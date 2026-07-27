<?php

declare(strict_types=1);

namespace VchLt\Path\Craft;

use Craft;
use VchLt\Path\Token\TokenStorageInterface;
use yii\web\Cookie;

final class CraftTokenStorage implements TokenStorageInterface
{
    public const COOKIE_NAME = 'path_bearer_token';

    private ?string $currentToken;

    public function __construct()
    {
        $value = Craft::$app->getRequest()->getCookies()->getValue(self::COOKIE_NAME);
        $this->currentToken = is_string($value) && $value !== '' ? $value : null;
    }

    public function getToken(): ?string
    {
        return $this->currentToken;
    }

    public function setToken(?string $token): void
    {
        $this->currentToken = $token;
        $cookies = Craft::$app->getResponse()->getCookies();
        if ($token === null || $token === '') {
            $cookies->add(new Cookie([
                'name' => self::COOKIE_NAME,
                'value' => '',
                'expire' => 1,
                'path' => '/',
                'sameSite' => 'Lax',
                'secure' => Craft::$app->getRequest()->getIsSecureConnection(),
                'httpOnly' => false,
            ]));
            return;
        }

        $cookies->add(new Cookie([
            'name' => self::COOKIE_NAME,
            'value' => $token,
            'path' => '/',
            'sameSite' => 'Lax',
            'secure' => Craft::$app->getRequest()->getIsSecureConnection(),
            'httpOnly' => false,
        ]));
    }
}
