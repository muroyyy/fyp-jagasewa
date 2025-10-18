FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    less \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

# CRITICAL: Install PHP PDO MySQL extension
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Enable error logging
RUN echo "log_errors = On" >> /usr/local/etc/php/php.ini-production && \
    echo "error_log = /var/log/php_errors.log" >> /usr/local/etc/php/php.ini-production && \
    echo "display_errors = Off" >> /usr/local/etc/php/php.ini-production && \
    cp /usr/local/etc/php/php.ini-production /usr/local/etc/php/php.ini

# Enable Apache rewrite module
RUN a2enmod rewrite

# Set ServerName to suppress Apache warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY . .

EXPOSE 80

CMD ["apache2-foreground"]