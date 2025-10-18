FROM php:8.2-apache

# Install AWS CLI
RUN apt-get update && apt-get install -y \
    unzip \
    curl \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf aws awscliv2.zip

RUN a2enmod rewrite

WORKDIR /var/www/html

COPY . .

EXPOSE 9000

CMD ["apache2-foreground"]