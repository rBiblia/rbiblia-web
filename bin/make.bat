@echo off

if ["%1"] == [""] (
    echo Available arguments for 'make' command are:
    echo.
    echo assets       - build assets using webpack-encore
    echo assets-watch - recompile assets automatically when files change
    echo dev          - prepare development environment
    echo prod         - install only `prod` dependencies and optimize build before deployment
    echo lint         - run linter on assets folder
)

if ["%1"] == ["assets"] (
    yarn encore dev
)

if ["%1"] == ["assets-watch"] (
    yarn encore dev --watch
)

if ["%1"] == ["dev"] (
    composer install
    yarn install
    make assets

    echo Build optimized for development.
    echo Type `bin\make prod` before deployment.
)

if ["%1"] == ["prod"] (
    composer install -o --no-dev
    yarn encore production

    echo Build optimized for deployment.
    echo This build from now on will not work in `dev` environment.
)

if ["%1"] == ["lint"] (
    node_modules\.bin\eslint assets
)
