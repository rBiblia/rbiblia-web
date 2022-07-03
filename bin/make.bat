@echo off

if ["%1"] == [""] (
    echo Available arguments for 'make' command are:
    echo.
    echo asset       - build assets using webpack-encore
    echo asset-watch - recompile assets automatically when files change
    echo dev         - prepare development environment
    echo prod        - install only `prod` dependencies and optimize build before deployment
    echo lint        - run linter on assets folder
)

if ["%1"] == ["asset"] (
    yarn encore dev
)

if ["%1"] == ["asset-watch"] (
    yarn encore dev --watch
)

if ["%1"] == ["dev"] (
    composer install
    yarn install
    make assets

    echo Build optimized for development.
)

if ["%1"] == ["prod"] (
    composer install -o --no-dev
    yarn encore production

    echo Build optimized for deployment.
)

if ["%1"] == ["lint"] (
    node_modules\.bin\eslint assets
)
