<?php

use VchLt\Path\Craft\PathModule;

return [
    'modules' => [
        'path' => [
            'class' => PathModule::class,
            'pathUrl' => '$PATH_URL',
            'courseId' => '$PATH_COURSE_ID',
            'courseUrl' => '$PATH_COURSE_URL',
            'logoutRedirect' => '/',
        ],
    ],
    'bootstrap' => ['path'],
];
