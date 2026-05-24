FROM php:8.3-apache

RUN apt update && apt upgrade -y && apt install -y \
      git\
      unzip\
      libicu-dev \
      sudo \
    && docker-php-ext-configure pdo_mysql --with-pdo-mysql=mysqlnd \
    && docker-php-ext-configure intl \
    && docker-php-ext-install \
      pdo_mysql \
      intl \
      opcache \
    && rm -rf /tmp/* \
    && rm -rf /var/list/apt/* \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# set PHP memory limit to 1GB
RUN echo "memory_limit = 1G" > /usr/local/etc/php/conf.d/memory-limit.ini

# install composer globally
COPY .docker/composer_installer.sh /tmp/composer_installer.sh
RUN sh /tmp/composer_installer.sh

# install node
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
RUN . ~/.bashrc
RUN bash -lc "nvm install 20 --latest-npm"
RUN bash -lc "nvm use 20"

# install yarn
RUN bash -lc "npm install -g yarn"

# modify default apache site
RUN sed -i 's#/var/www/html#/var/www/html/public_html#' /etc/apache2/sites-enabled/000-default.conf 

# enable required apache modules
RUN a2enmod headers
RUN a2enmod rewrite

# restart apache
RUN service apache2 restart
