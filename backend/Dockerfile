# backend/Dockerfile
FROM php:8.2-cli

WORKDIR /var/www/html

# Install system dependencies and AWS CLI v2
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        gd \
        pdo \
        pdo_mysql \
        zip

# Enable CORS for development
RUN echo "extension=pdo_mysql.so" > /usr/local/etc/php/conf.d/pdo_mysql.ini

# Copy application files
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p /var/www/html/uploads/profiles \
    && mkdir -p /var/www/html/uploads/maintenance \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/uploads

# Expose port 8000
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health.php || exit 1

# Start PHP built-in server
CMD ["php", "-S", "0.0.0.0:8000", "-t", "."]