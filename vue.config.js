module.exports = {
  chainWebpack: (config) => {
    config.resolve.symlinks(false);
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer("terser").tap(args => {
        const { terserOptions } = args[0]
        //terserOptions.compress = false
        terserOptions.mangle = false

        // args[0].sourceMap = false
        // args.cache = false
        // args.parallel = false

        return args
      })
    }
  },
  pages: {
    index: {
      entry: 'src/main.js',
      title: 'Tongue Twisters Across Multiple Nights Study'
    }
  }
}
