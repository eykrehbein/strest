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
# Manual chained executions
node dist/main.js tests/success/chaining/login.strest.yml --save
node dist/main.js tests/success/chaining/verify_login_chained.strest.yml --load --save
```
