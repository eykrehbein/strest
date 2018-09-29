# How to write Test? The Schema
- [`version`](#version) _Required_
- [`requests`](#requests) _Required_
  - [`request`](#request)
    - [`url`](#url) _Required_
    - [`method`](#method) _Required_
    - [`data`](#data)
      - [`json`](#data)
      - [`params`](#data)
      - [`raw`](#data)
    - [`headers`](#headers)
    - [`validate`](#validate)
      - [`raw`](#validate)
      - [`json`](#validate)
    - [`log`](#log)
    - [`delay`](#delay)
    - [`repeat`](#repeat)


# Specifications
### `version`
**_Required_**<br>
Property specifying the version of the schema. Available versions:
- `1`

### `requests`
**_Required_**<br>
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
### `request`
**_At least one request is required_**<br>

A single request. You can name the request however you want. Try not to overwrite names because
this will also overwrite the response data and you'll no longer be able to retrieve the data from the overwritten request.
```yaml
# Example
requests:
  someRequestName: # <- a Request
    ..
```
### `url`
**_Required_**<br>
The target URL to which the request will be sent to. _Needs to start with `http` or `https`_
```yaml
# Basic Example
someRequestName:
  url: http://localhost:3000/api

# Example with a connected value
someConnectedRequest:
  url: http://localhost:3000/api/user/Value(getUser.id)/friends
```
### `method`
**_Required_**<br>
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

### `delay`
If present, the execution of the request will be delayed by the specified number of milliseconds.
```yaml
# Example
someRequest:
  delay: 2000 # Wait 2 seconds before perfoming request
  url: ...
  method: ...
```

### `data`
Specify data that you want to be sent with the request. This data can be formatted either `raw` or as `json`. You may only use one of those keys in a request.

However, `params` can always be added. They'll be added to the request's URL.

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

# Raw Data Example
someRequest:
  url: ...
  method: ...
  data:
    raw: 'Some raw data to be sent'

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
### `headers`
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
### `repeat`
The following example request will be executed 5 times in a row

```yaml
# Example
someRequest:
  url: ...
  method: ...
  repeat: 5
```

### `validate`
Validate the incoming response either by a specific value or by a [`Type`](VALIDATION.md).
[More information](README.md#ResponseValidation) about how to validate responses.

### `log`
If set to `true`, the following information will be logged into the console for this request.
- Response Code
- Response Text
- HTTP Headers
- Response Data

If you want to log information of all requests into the console, use the `-p` flag when using the `strest` command
