# How to write Test? The Schema

<!-- TOC depthFrom:2 -->

- [`version` **_Required_**](#version-_required_)
- [`variables`](#variables)
- [`allowInsecure`](#allowinsecure)
- [`requests` **_Required_**](#requests-_required_)
    - [`requestName` **_At least one request is required_**](#requestname-_at-least-one-request-is-required_)
        - [`if`](#if)
        - [`delay`](#delay)
        - [`request` **_Required_**](#request-_required_)
            - [`url` **_Required_**](#url-_required_)
            - [`method` **_Required_**](#method-_required_)
            - [`postData`](#postdata)
                - [`mimeType`](#mimetype)
                - [`text`](#text)
            - [`queryString`](#querystring)
            - [`headers`](#headers)
        - [`auth`](#auth)
            - [`basic`](#basic)
        - [`validate`](#validate)
            - [jsonpath *required*](#jsonpath-required)
            - [Expect](#expect)
            - [Type](#type)
            - [Regex](#regex)
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

### `requestName` **_At least one request is required_**

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
      operand: <$ if_Set.content.foo $>
      equals: 2
    request:
      url: https://jsonplaceholder.typicode.com/todos/2
      method: GET
  executed:
    if:
      operand: <$ if_Set.content.foo $>
      equals: 1
    request:
      url: https://jsonplaceholder.typicode.com/todos/2
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

#### `request` **_Required_**

The request object conforms with [HAR](http://www.softwareishard.com/blog/har-12-spec/#request)

##### `url` **_Required_**

The target URL to which the request will be sent to. _Needs to start with `http` or `https`_

```yaml
# Basic Example
someRequestName:
  url: http://localhost:3000/api

# Example with a connected value
someConnectedRequest:
  url: http://localhost:3000/api/user/Value(getUser.id)/friends
```

##### `method` **_Required_**

The HTTP request method that will be used Strest to perform the request. All strings are accepted but consider to use one of the requests listed in the [Mozilla Developer Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)

```yaml
# Example
somePostRequest:
  request:
    url: ...
    method: POST

```

##### `postData`

Follows [this](http://www.softwareishard.com/blog/har-12-spec/#postData) schema.

###### `mimeType`

Set the mimeType to:

- application/json
- plain/text

###### `text`

```yaml
# JSON Example
version: 1

requests:
  postRequest:
    request:
      url: https://postman-echo.com/post
      method: POST
      postData:
        mimeType: application/json # Set the mimeType
        text:
          foo:
            bar: "baz"
```

```yaml
# Raw Data Example
version: 1

requests:
  postRequest:
    request:
      url: https://postman-echo.com/post
      method: POST
      postData:
        mimeType: text/plain  # Set the mimeType
        text: "This is raw text"
```

##### `queryString`

Conforms to [this](http://www.softwareishard.com/blog/har-12-spec/#queryString) shema.

```yaml
version: 1

requests:
  responseHeaders:
    request:
      url: https://postman-echo.com/response-headers
      method: GET
      queryString:
      - name: foo1
        value: bar1
      - name: foo2
        value: bar2
```

##### `headers`

Specify HTTP headers that you want to be sent with the request. Formatted as an Array.

```yaml
# Basic Example
version: 1

requests:
  requestHeaders:
    request:
      url: https://postman-echo.com/headers
      method: GET
      headers:
        - name: exampleHeader
          value: "Lorem ipsum dolor sit amet"
    validate:
      - jsonpath: content.headers.exampleheader
        expect: "Lorem ipsum dolor sit amet"
  requestHeaders2:
    request:
      url: https://postman-echo.com/headers
      method: GET
      headers:
        [{ "name": "h1", "value": "v1" }, { "name": "h2", "value": "v2" }]
    validate:
      - jsonpath: content.headers.h1
        expect: "v1"
      - jsonpath: content.headers.h2
        expect: "v2"
```

#### `auth`

Predefined authentication methods which will set the `Authorization` header automatically

##### `basic`

HTTP Basic Authentication. Requires username and password.

```yaml
# Example
someRequest:
  request:
  ...
  auth:
    basic:
      username: myusername
      password: test123
```

#### `validate`

The immediate response is stored in [HAR Format](http://www.softwareishard.com/blog/har-12-spec/#response)

With **Strest** you can validate responses with:

- exact match (expect)
- regex
- type _[List of all valid Types](VALIDATION.md)_

Read [jsonpath](https://github.com/dchester/jsonpath#jpvalueobj-pathexpression-newvalue) for more info and see [this file](tests/success/validate/jsonpath.strest.yml) for more complex example

##### jsonpath *required*

Read [jsonpath](https://github.com/dchester/jsonpath#jpvalueobj-pathexpression-newvalue) for more info and see [this file](tests/success/validate/jsonpath.strest.yml) for more complex example

##### Expect

```yaml
requests:
  example:
    ...
    validate:
    - jsonpath: content
      expect: "the response has to match this string exactly"
```

##### Type

```yaml
version: 1

requests:
  typeValidate:
    request:
      url: https://jsonplaceholder.typicode.com/todos
      method: GET
    validate:
    - jsonpath: headers["content-type"]
      type: [ string ]
    - jsonpath: status
      type: [ boolean, string, number ]
    - jsonpath: content.0.userId
      type: [ number ]
```

##### Regex

Regex can be used to validate status code or any other returned param

```yml
version: 1

requests:
  codeValidate:
    request:
      url: https://jsonplaceholder.typicode.com/todos
      method: GET
    validate: # Multiple ways to use regex to validate status code
    - jsonpath: status
      regex: 2\d+
    - jsonpath: status
      regex: 2[0-9]{2}
    - jsonpath: status
      regex: 2..
    - jsonpath: status
      regex: 2.*
```

Read [jsonpath](https://github.com/dchester/jsonpath#jpvalueobj-pathexpression-newvalue) for more info and see [this file](tests/success/validate/jsonpath.strest.yml) for more complex example

#### `log`

If set to `true`, the following information will be logged into the console for this request. [HAR](http://www.softwareishard.com/blog/har-12-spec/#response)

- Response Status
- Response Text
- Response Headers
- Response Content

If you want to log information of all requests into the console, use the `-p` flag when using the `strest` command
