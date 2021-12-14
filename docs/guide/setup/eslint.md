# Eslint

Peeky directly contains an Eslint plugin.

For now, it automatically declares all the Peeky globals.
In the future it may publish some rules to enforce good testing practices. 

## Usage

To enable this configuration use the `extends` property in your `.eslintrc`
config file:

```json
/* .eslintrc */
{
  "extends": ["plugin:@peeky/recommended"]
}
```
