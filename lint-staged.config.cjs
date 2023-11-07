module.exports = {
  '*{.ts,.js}': ['prettier --write', 'eslint --ext .tsx,.ts --fix ./src', () => 'npm run tsc --silent']
};
