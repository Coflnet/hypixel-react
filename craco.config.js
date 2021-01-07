const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
    style: {
        postcss: {
            plugins: [
                purgecss({
                    content: ['./src/**/*.html', './src/**/*.tsx', './src/**/*.ts'],
                    safelist: [
                        /^badge.*/,
                        /^modal.*/,
                        /^btn.*/,
                        /^card.*/,
                        'btn',
                        'active',
                        'body',
                        'list-group-item',
                        'list-group-item-action',
                        'form-control',
                        'form-group',
                        'sr-only',
                        'close',
                        'input'
                    ]
                }),
            ],
        },
    },
};