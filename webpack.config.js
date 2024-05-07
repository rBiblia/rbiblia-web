const Encore = require("@symfony/webpack-encore");

if (!Encore.isRuntimeEnvironmentConfigured()) {
  Encore.configureRuntimeEnvironment(process.env.NODE_ENV || "dev");
}

Encore.setOutputPath("public_html/assets/")
  .setPublicPath("/assets")

  .addEntry("app", "./assets/app.js")

  .disableSingleRuntimeChunk()
  .cleanupOutputBeforeBuild()
  .enableReactPreset()

  .configureBabelPresetEnv((config) => {
    config.useBuiltIns = "usage";
    config.corejs = 3;
  })

  .enableSassLoader()

  .copyFiles({
    from: "./assets/images",
    to: "[path][name].[ext]",
  })

  .copyFiles({
    from: "./assets/docs",
    to: "[path][name].[ext]",
  });

module.exports = Encore.getWebpackConfig();
