const Encore = require('@symfony/webpack-encore');

if (!Encore.isRuntimeEnvironmentConfigured()) {
    Encore.configureRuntimeEnvironment(process.env.NODE_ENV || 'dev');
}

Encore
    .setOutputPath('public_html/assets/')
    .setPublicPath('/assets')

    .addEntry('app', './assets/app.js')

    .disableSingleRuntimeChunk()
    .cleanupOutputBeforeBuild()

    .configureBabelPresetEnv((config) => {
        config.useBuiltIns = 'usage';
        config.corejs = 3;
})

.enableSassLoader()
;

module.exports = Encore.getWebpackConfig();