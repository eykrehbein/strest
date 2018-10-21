# How to write Test? The Schema

<!-- TOC depthFrom:2 -->

- [`version` **_Required_**](#version-_required_)
- [`variables`](#variables)
- [`allowInsecure`](#allowinsecure)
- [`requests` **_Required_**](#requests-_required_)
    - [`request` **_At least one request is required_**](#request-_at-least-one-request-is-required_)
        - [`url` **_Required_**](#url-_required_)
        - [`method` **_Required_**](#method-_required_)
        - [`if`](#if)
        - [`delay`](#delay)
        - [`data`](#data)
            - [`json`](#json)
            - [`raw`](#raw)
            - [`params`](#params)
        - [`headers`](#headers)
        - [`auth`](#auth)
          - [`basic`](#basic)
        - [`validate`](#validate)
            - [`raw`](#raw-1)
            - [`json`](#json-1)
            - [`code`](#code)
            - [`jsonpath`](#jsonpath)
        - [`log`](#log)

<!-- /TOC -->

## `version` **_Required_**

Property specifying the version of the schema. Available versions:

- `1`

## `variables`
You can define custom variables to use them later in a request. They work across files, so you can define them in one file and use them in an other.

```yml
# Example
variables:
  example_url: https://jsonplaceholder.typicode.com/todos/1
  example_id: 1

requests:
  test:
    url: Var(example_url)
    ...
    validate:
      json:
        id: Variable(example_id) # Both, Var() and Variable() are allowed
```

## `allowInsecure`

Boolean to allow:

- insecure certificates
- self-signed certificates
- expired certificates

```yaml
# Example
allowInsecure: true
someRequest:
  url: ...
  method: ...
```

## `requests` **_Required_**

Array which holds all the requests that are going to be tested

```yaml
# Example
requests:
  request1:
    ..
  request2:
    ..
  request1000:
    ..
```

### `request` **_At least one request is required_**

A single request. You can name the request however you want. Try not to overwrite names because
this will also overwrite the response data and you'll no longer be able to retrieve the data from the overwritten request.

```yaml
# Example
requests:
  someRequestName: # <- a Request
    ..
```

#### `if`

This provides conditional execution of a request.

```yaml
version: 1

requests:
  if_Set:
    url: https://jsonplaceholder.typicode.com/posts
    method: POST
    data:
      json:
        foo: 1
  skipped:
    if:
      operand: Value(if_Set.foo)
      equals: 2
    url: https://jsonplaceholder.typicode.com/todos/2
    method: GET
  executed:
    if:
      operand: Value(if_Set.foo)
      equals: 1
    url: https://jsonplaceholder.typicode.com/todos/2
    method: GET
```

#### `url` **_Required_**

The target URL to which the request will be sent to. _Needs to start with `http` or `https`_

```yaml
# Basic Example
someRequestName:
  url: http://localhost:3000/api

# Example with a connected value
someConnectedRequest:
  url: http://localhost:3000/api/user/Value(getUser.id)/friends
```

#### `method` **_Required_**

The HTTP request method that will be used Strest to perform the request. All strings are accepted but consider to use one of the requests listed in the [Mozilla Developer Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

```yaml
# Example
somePostRequest:
  url: ...
  method: POST

someGetRequest:
  url: ...
  method: GET
```

#### `delay`

If present, the execution of the request will be delayed by the specified number of milliseconds.

```yaml
# Example
someRequest:
  delay: 2000 # Wait 2 seconds before perfoming request
  url: ...
  method: ...
```

#### `data`

Specify data that you want to be sent with the request. This data can be formatted either `raw` or as `json`. You may only use one of those keys in a request.

However, `params` can always be added. They'll be added to the request's URL.

##### `json`

```yaml
# JSON Example
someRequest:
  url: ...
  method: ...
  data:
    json:
      username: testUser
      password: test123
      nested:
        nestedKey: false
```

##### `raw`

```yaml
# Raw Data Example
someRequest:
  url: ...
  method: ...
  data:
    raw: 'Some raw data to be sent'
```

##### `params`

```yaml
# Params as a string Example
someRequest:
  url: ...
  method: ...
  data:
    json: ...
    params: 'name=testUser&password=test123'

# Params as an object Example
someRequest:
  url: ...
  method: ...
  data:
    raw: ...
    params: 
      name: testUser
      password: test123
```

#### `headers`

Specify HTTP headers that you want to be sent with the request. Formatted as an Object.

```yaml
# Basic Example
someRequest:
  url:
  method:
  headers:
    Authorization: Bearer Asmdoaodmasodm2omksd
    ...

# Example with a connected value
someRequest:
  url:
  method:
  headers:
    Authorization: Bearer Value(login.token)
    ...

```
#### `auth`

Predefined authentication methods which will set the `Authorization` header automatically

#### `basic`

HTTP Basic Authentication. Requires username and password.

```yaml
# Example
someRequest:
  url:
  method:
  auth:
    basic:
      username: myusername
      password: test123
  ...
```

#### `validate`

Validate the incoming response either by a specific value or by a [`Type`](VALIDATION.md).
[More information](README.md#ResponseValidation) about how to validate responses.

##### `raw`

Validate a response against a raw

##### `json`

Validate response against a json

##### `code`

Expect the returned status code to be a specific number or in a range of numbers.

```yaml
# Example (simple)
someRequest:
  url: ...
  method: ...
  validate:
    code: 200 # expect the request to return the response code 200
# Example (range)
someRequest:
  url: ...
  method: ...
  validate:
    code: 2xx # expect the request to return a response code which is in the range of 200-299
```

##### `jsonpath`

Specify a [jsonpath](https://github.com/dchester/jsonpath#jpvalueobj-pathexpression-newvalue) lookup.  The first match from the jsonpath is evaluated.  This currently deos not support objects.

```yml
version: 1

requests:
  jsonpath:
    url: https://jsonplaceholder.typicode.com/posts
    method: POST
    data:
      json:
        myArray:
        - foo: 1
          bar: 1
        - foo: 2
          bar: 2
    validate:
      jsonpath:
        myArray.1.foo: 2
```

Read [jsonpath](https://github.com/dchester/jsonpath#jpvalueobj-pathexpression-newvalue) for more info and see [this file](tests/success/validate/jsonpath.strest.yml) for more complex example

#### `log`

If set to `true`, the following information will be logged into the console for this request.

- Response Code
- Response Text
- HTTP Headers
- Response Data

If you want to log information of all requests into the console, use the `-p` flag when using the `strest` command
