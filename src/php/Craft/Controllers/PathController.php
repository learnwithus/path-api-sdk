<?php

declare(strict_types=1);

namespace VchLt\Path\Craft\Controllers;

use VchLt\Path\Craft\PathModule;
use craft\web\Controller;
use yii\web\Response;

final class PathController extends Controller
{
    protected array|int|bool $allowAnonymous = true;

    public function actionLogout(): Response
    {
        $this->requirePostRequest();
        $module = PathModule::getInstance();
        $module->getPath()->logout();

        return $this->redirect($module->logoutRedirect);
    }
}
