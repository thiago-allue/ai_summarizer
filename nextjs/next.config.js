
const withTM = require('next-transpile-modules')([
  'antd',
  '@ant-design/icons',
  '@ant-design/icons-svg',
  'rc-util',
  'rc-picker',
  'rc-pagination',
  'rc-input'
]);

module.exports = withTM({
  reactStrictMode: true,
});
