module.exports = function(api, options) {
  const dev = Boolean(options && options.development)

  return {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: dev
              ? [
                  'last 2 versions',
                  '> 5%',
                  'Safari 7', // for PhantomJS support
                ]
              : ['last 1 chrome version'],
          },
        },
      ],
    ],
    plugins: [
      '@babel/plugin-proposal-object-rest-spread',
      '@babel/plugin-proposal-class-properties',
    ],
  }
}
