# Contributing

## Build

```bash
npm run build
```

## Manual testing

```bash
export STREST_URL=https://jsonplaceholder.typicode.com
node dist/main.js tests/success/
export STREST_GMT_DATE=$(TZ=GMT-0 date --date='10 seconds' --rfc-2822 | sed "s/+0000/GMT/g")
node dist/main.js tests/success_validate_retries/
node dist/main.js tests/failure/ --no-exit
node dist/main.js tests/success/bulk.yml -b
```

## Publishing - Information for Collaborators

When / before you merge a Pull Request, there are more steps to go.

1. Check whether the TravisCI check passed successfully
2. Update the npm version in the `package.json`
    - Patches / Bug fixes: `1.0.x`
    - Minor releases / New features: `1.x.0`
3. [Draft a new Release on Github](https://github.com/eykrehbein/strest/releases/new)
    - Tag Version = npm version

The new Release will automatically publish the new changes under the new package version into the npm registry. 