# backend/Dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build dependencies
FROM php:8.2-apache AS builder

WORKDIR /var/www/html

# Install build dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy composer files
COPY composer.json composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-autoloader

# Copy application files
COPY . .

# Generate optimized autoloader
RUN composer dump-autoload --optimize --classmap-authoritative

# Stage 2: Production image
FROM php:8.2-apache

WORKDIR /var/www/html

# Install only runtime dependencies (no build tools)
RUN apt-get update && apt-get install -y \
    libpng16-16 \
    libjpeg62-turbo \
    libfreetype6 \
    libzip4t64 \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc /usr/share/man

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd pdo pdo_mysql zip

# Configure PHP settings
RUN echo "extension=pdo_mysql.so" > /usr/local/etc/php/conf.d/pdo_mysql.ini \
    && echo "upload_max_filesize = 10M" > /usr/local/etc/php/conf.d/uploads.ini \
    && echo "post_max_size = 12M" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "max_file_uploads = 20" >> /usr/local/etc/php/conf.d/uploads.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

# Copy application from builder
COPY --from=builder --chown=www-data:www-data /var/www/html /var/www/html

# Create uploads directory
RUN mkdir -p uploads/profiles uploads/maintenance uploads/documents \
    && chown -R www-data:www-data uploads \
    && chmod -R 775 uploads

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/api/health.php || exit 1

# Start Apache
CMD ["apache2-foreground"]