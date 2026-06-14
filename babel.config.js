module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@app': './src/app',
            '@features': './src/features',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@shared': './src/shared',
            '@store': './src/store',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
