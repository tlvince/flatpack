# flatpack

> CouchDB database creation helper

Creates databases and a corresponding `_security` document, ensuring databases
are never publicly accessible.

## Usage

1. Copy `config/default.example.json` and populate its values according to the
   table below
2. Run `npm start`

## Config

Property  | Description
--------  | -----------
`couchdb` | A URL to a CouchDB instance

These properties can also be set using [environment variables][env].

[env]: https://github.com/lorenwest/node-config/wiki/Environment-Variables

## Author

© 2014 Tom Vincent <git@tlvince.com>

## License

Licensed under the [MIT license](http://tlvince.mit-license.org).
