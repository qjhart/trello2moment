# trello2moment

Converts A Trello board to a moment

## Overview

This script will convert a Trello board into a moment.  Cards and their descriptors are read and conveted to a set of schema.org webpages.  

## Example

The `NgVOlKPZ` directory shows an example board setup, and the `chardonney[.ttl]` is an example derived moment it's mostly from `./trello2moment --board=NgVOlKPZ` although the example has been hand modified to actually work.

### Run Example

#### Accessing Trello's API

1. Create a Trello account
2. Ask for an invitation to be added to the required Moment board
3. Navigate to `https://trello.com/app-key`
4. Retrieve your API key and Token.
5. Save these somewhere private. Do not commit the Makefile to github without removing this information first.
6. Install [httpie](https://httpie.org/) because it's the best and everyone should use it.

#### Set up

Make sure the following programs are installed on your system.

1. [Httpie](https://httpie.org/)
2. [JQ](https://stedolan.github.io/jq/)
3. [Apache Jena - Riot](https://jena.apache.org/documentation/io/)
    - If you installed Jena using Homebrew make sure the path for riot in the Make file is pointing to the correct location to run the riot executable.

      **Example**

      ```bash
      riot:=/usr/local/Cellar/jena/X.X.X/bin/riot
      ```

#### Store Key and Token as Variables in Terminal Session

Open a Terminal window. Cut and paste your key and token into the Terminal.
  
Example:

```bash
key=1234 token=abcdef
```

Run `echo $key && echo $token`.

#### Trello2Moment Usage (w/out Make file)

Run `node trello2moment --board=BOARD_NAME --moment=MOMENT_NAME [--description=true]`


## LDP

Don't ask, but there this example is currently available in the [sandbox](https://sandbox.dams.library.ucdavis.edu/fcrepo/rest/collection/ex-poetry/chardonney)
