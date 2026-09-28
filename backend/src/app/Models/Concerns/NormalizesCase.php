<?php

namespace App\Models\Concerns;

trait NormalizesCase
{
    protected static function bootNormalizesCase(): void
    {
        static::saving(function ($model) {
            foreach ($model->normalizedFields ?? [] as $field) {
                if (isset($model->attributes[$field]) && is_string($model->attributes[$field])) {
                    $model->attributes[$field] = mb_strtolower(trim($model->attributes[$field]));
                }
            }
        });
    }
}
