module.exports = {
  env: {
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 1 chrome version'],
            },
          },
        ],
      ],
    },
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: [
                'last 2 versions',
                '> 5%',
                'Safari 7', // for PhantomJS support
              ],
            },
          },
        ],
      ],
    }
  },
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-class-properties',
  ],
}
