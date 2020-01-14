# trello2moment

Converts A Trello board to a moment

## Overview

This script will convert a Trello board into a moment.  Cards and their descriptors are read and conveted to a set of schema.org webpages.  

## Example

The `NgVOlKPZ` directory shows an example board setup, and the `chardonney[.ttl]` is an example derived moment it's mostly from `./trello2moment --board=NgVOlKPZ` although the example has been hand modified to actually work.

### Run Example

Open a Terminal window and run `make`.  The json should be created inside a directory which will be named after the Trello board's ID.

#### Quick Note

Example Terminal command:

```bash
make key=12345 token=abcdefg
```

This would avoid the temptation of pasting your key/token directly into the Make file at any point.

## Accessing Trello's API

To access Trello's API you will need an API key.

1. Create a Trello account
2. Ask for an invitation to be added to the required Moment board
3. Navigate to `https://trello.com/app-key`
4. Retrieve your API key and Token.
5. Save these somewhere private. Do not commit the Makefile to github without removing this information first.
6. Install [httpie](https://httpie.org/) because it's the best and everyone should use it.

## LDP

Don't ask, but there this example is currently available in the [sandbox](https://sandbox.dams.library.ucdavis.edu/fcrepo/rest/collection/ex-poetry/chardonney)
