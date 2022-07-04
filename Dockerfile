FROM php:8.0-apache

RUN apt-get update && apt-get upgrade -y && apt-get install -y \
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

# install composer globally
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
RUN php composer-setup.php
RUN php -r "unlink('composer-setup.php');"
RUN sudo mv composer.phar /usr/local/bin/composer

# install node
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
RUN apt install nodejs

# install yarn
RUN npm install -g yarn

# modify default apache site
RUN sed -i 's#/var/www/html#/var/www/html/public_html#' /etc/apache2/sites-enabled/000-default.conf 

# enable required apache modules
RUN a2enmod headers
RUN a2enmod rewrite

# restart apache
RUN service apache2 restart
