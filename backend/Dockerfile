FROM php:8.2-apache

# Enable Apache mod_rewrite for Laravel / custom routes if needed
RUN a2enmod rewrite

WORKDIR /var/www/html
COPY . .

EXPOSE 9000
CMD ["apache2-foreground"]
