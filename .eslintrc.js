module.exports = {
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'prettier'
    ],
    plugins: ['prettier'],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        },
    },
    env: {
        browser: true,
        es6: true,
        node: true
    },
    rules: {
        "no-console": 0,
        "no-unused-vars": 0,
        "react/prop-types": 0,
        "prettier/prettier": ["error"]
    },
    settings: {
        react: {
            version: 'detect',
        }
    }
};
