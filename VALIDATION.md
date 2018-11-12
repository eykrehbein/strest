# Validation

## maxRetries

maxRetries is best when combined with delay.  The request continues to execute until the expected validated response is received.

[example](tests/success/success_validate_retries/maxRetries.strest.yml)

## Valid Types for Validation

- `string`
  - `string.hex`
  - `string.email`
  - `string.ip`  :arrow_right: _IP Address_
  - `string.url`
  - `string.uri`  :arrow_right: _Same as String.Url_
  - `string.lowercase`  :arrow_right: _Only lowercase letters_
  - `string.uppercase`  :arrow_right: _Only Uppercase Letters_
  - `string.base64`
- `boolean`
- `bool`  :arrow_right: _Same as Boolean_
- `object`
- `number`
- `array`
- `null`

## Usage

All types can be used in uppercase or lowercase letters. They will be converted into lowercase letters automatically.

**Match exactly one _Type_**

```yaml
validate:
- jsonpath: content.id
  type: [ string ]
```

**Match at least one of the given _Types_**

```yaml
validate:
- jsonpath: content.id
  type: [ string, string.hex, "null", boolean]
```
