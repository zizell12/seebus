FROM php:8.4-fpm

RUN apt-get update && apt-get install -y \
    git curl zip unzip \
    libpng-dev libjpeg-dev libfreetype6-dev libonig-dev libxml2-dev \
    libzip-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

RUN mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache bootstrap/cache

CMD sh -c "git config --global --add safe.directory /var/www && \
    composer install --optimize-autoloader --no-interaction && \
    if [ ! -f .env ]; then cp .env.example .env; fi && \
    php artisan key:generate --force && \
    php artisan storage:link && \
    php artisan migrate --force && \
    chown -R www-data:www-data storage bootstrap/cache && \
    chmod -R 777 storage bootstrap/cache && \
    exec php-fpm"
