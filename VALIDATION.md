# Valid Types for Validation
- `String`
  - `String.Hex`
  - `String.Email`
  - `String.IP`  :arrow_right: _IP Address_
  - `String.Url`
  - `String.Uri`  :arrow_right: _Same as String.Url_
  - `String.Lowercase`  :arrow_right: _Only lowercase letters_
  - `String.Uppercase`  :arrow_right: _Only Uppercase Letters_
  - `String.Base64` 
- `Boolean`
- `Bool`  :arrow_right: _Same as Boolean_
- `Object`
- `Number`
- `Array`
- `Null`
## Usage
All types can be used in uppercase or lowercase letters. They will be converted into lowercase letters automatically.

**Match exactly one _Type_**
```yaml
someItem: Type(String)
```

**Match at least one of the given _Types_**
```yaml
# use the | character as a seperator
someItem: Type(String | String.Hex | Null | Boolean)
```
