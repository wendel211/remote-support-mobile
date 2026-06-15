module.exports = function (api) {
  const isTest = api.env('test');

  const plugins = [
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
          '@test': './src/test',
        },
      },
    ],
  ];

  if (!isTest) {
    plugins.push('react-native-reanimated/plugin');
  }

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      ...(!isTest ? ['nativewind/babel'] : []),
    ],
    plugins,
  };
};
