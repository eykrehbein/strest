<h1 align="center">
  <img src="https://res.cloudinary.com/eykhagen/image/upload/v1536487016/logo.png" height="300" width="300"/>
  <p align="center" style="font-size: 0.5em">:rocket: Flexible REST Tests</p>
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  <img src="https://img.shields.io/github/package-json/v/eykhagen/strest.svg" alt="License: MIT">
</p>


**:link: Connect multiple requests**: _Example_ Embed an authorization token you got as a response from a login request in your following requests automatically

**:memo: YAML Syntax**: Write all of your tests in YAML files

**:tada: Easy to understand**: You'll understand the concept in seconds and be able to start instantly (seriously!)

## Getting Started

Install Strest using `yarn`
```
yarn global add strest-cli
```
Or via `npm`
```
npm i -g strest-cli
```

To test something, you have to create a REST-API first. If you already have an API to test, you can skip this step.

We'll be using the [postman-echo](https://docs.postman-echo.com) test API in this tutorial.

To get started, create a file called `tutorial.strest.yml` _(The extension needs to be `.strest.yml` or `.strest.yaml`)_

```yaml
version: 1                            # only version at the moment

requests:                             # all test requests will be listed here
  testRequest:                        # name the request however you want
    url: https://postman-echo.com/get  # required
    method: GET                       # required
    data:                             # valid data types: params + json or raw
      params:
        foo1: bar1
        foo2: bar2
    # log: true # uncomment this to log the response
```
_No more configuration needed, so you're ready to go!_

To run the test, open your terminal and type
```
strest tutorial.strest.yml
```
You may also run multiple test files at the same time by pointing to the directory, where the files are stored
```yaml
strest # this will recursively search for all .strest.yml files in the cwd and it's subdirectories
# or
strest someDir/
```

Success! If you've done everything correctly, you'll get a response like this
```
[ Strest ] Found 1 test file(s)
[ Strest ] Schema validation: 1 of 1 file(s) passed

✔ Testing testRequest succeeded (0.457s)

[ Strest ] ✨  Done in 0.484s
```
## Writing .strest.yml test files
You can find a full __Documentation__ of how to write tests [here](SCHEMA.md)

## Documentation
- [How to write Tests](SCHEMA.md)
- [Validation Types](VALIDATION.md)
- [Examples](examples/)
- [Trello Board](https://trello.com/b/lqi6Aj9F)

## Using & Connecting multiple requests

With traditional tools like [Postman](https://www.getpostman.com/) or [Insomnia](https://insomnia.rest/) it's common to perform only a single request at a time. Moreover, you have to trigger each request on your own with a click on a button.

With __Strest__ you're able to predefine a very well structured test file once, and every time you make any changes to your API you can test it with just one command in your terminal. Additionally, you can add hundreds or thousands of requests and endpoints which will run synchronously one after the other.

To create multiple requests, simply add multiple entries into the `requests` yaml object.
```yaml
version: 1

requests:
  requestOne:
    ...
  requestTwo:
    ...
  requestThree:
    ...

```
Running this will result in something like
```
[ Strest ] Found 1 test file(s)
[ Strest ] Schema validation: 1 of 1 file(s) passed

✔ Testing requestOne succeeded (0.1s)
✔ Testing requestTwo succeeded (0.32s)
✔ Testing requestThree succeeded (0.11s)

[ Strest ] ✨  Done in 0.62s
```

### Connecting multiple requests

**What is meant by _connecting multiple requests_?**<br/>
Connecting multiple requests means that you write a request and in each of the following requests you are able to use and insert any of the data that was responded by this request.

**Usage**
```yaml
requests:
  
  login: # will return { token: "someToken" }
    ...

  authNeeded:
    delay: 2000 # Wait 2 seconds for token to become valid
    ...
    headers:
      Authorization: Bearer Value(login.token)
    ...
    validation:
      json:
        id: Value(login.users[0].id) # use arrays like you would in javascript

```
As you could see, the usage is very simple. Just use `Value(requestName.jsonKey)` to use any of the JSON data that was retrieved from a previous request. If you want to use raw data, just use `Value(requestName)` without any keys. <br><br>
You can use this syntax __*anywhere*__ regardless of whether it is inside of some string like `https://localhost/posts/Value(postKey.key)/...` or as a standalone term like `Authorization: Value(login.token)`

## Using random values with Faker
If you need to generate some random values, you are able to do so by using [Faker API](http://marak.github.io/faker.js/) templates. 

**Usage**
```yaml
version: 1                            

requests:                             
  userRequest:                        
    url: http://localhost:3001/user   
    method: GET                       
    data:                             
      params:
        name: Fake(name.firstName) Fake(name.lastName)
    log: true                         
    
```
Visit [Faker.js Documentation](http://marak.github.io/faker.js/) for more methods

## Replacing values with predefined environment variables
**Usage**
```yaml
version: 1                            

requests:                             
  userRequest:                        
    url: Env(MY_TEST_URL)/user   
    method: GET                       
    data:                             
      params:
        fromEnvironment: Env(MY_ENV_VAR)                         

```

## Response Validation
With **Strest** you can validate responses either by a specific value or by a `Type`. _[List of all valid Types](VALIDATION.md)_

#### Raw Validation
```yaml
requests:
  example:
    ...
    validate:
      raw: "the response has to match this string exactly"
```
#### JSON Validation
```yaml
requests:
  example:
    ...
    validate:
      json:
        user: 
          name: Type(String) # name has to be of type String
          id: Type(Null | Number | String) # id has to be of type Number, String or Null
          iconUrl: Type(String.Url)
        someOtherData: "match this string" 
```
## Errors
**Strest** is a testing library so of course, you'll run into a few errors when testing an endpoint. Error handling is made very simple so can instantly see what caused an error and fix it.
If a request fails, the process will be exited with _exit code 1_ and no other requests will be executed afterwards.

_Example of a Validation Error_
```
[ Strest ] Found 1 test file(s)
[ Strest ] Schema validation: 1 of 1 file(s) passed

✖ Testing test failed (0.2s)

[ Validation ] The required item test wasn't found in the response data

[ Strest ] ✨  Done in 0.245s
```

## Allow Insecure certs

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

## Configuration
You can create a file in your Computer's home directory called `.strestConfig.yml` which will be the custom config for **Strest**.

*Setup*
```yaml
config:
  primaryColor: "#2ed573" # Hexadecimal Color Code (don't forget the quotation marks)
  secondaryColor: "#ff4757" # Hexadecimal Color Code
  errorColor: "#576574" # Hexadecimal Color Code

```

## License
Strest is [MIT Licensed](LICENSE)
