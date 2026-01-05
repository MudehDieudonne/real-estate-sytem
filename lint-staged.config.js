export default {
  '*.js': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{css,scss,html}': ['prettier --write'],
};
