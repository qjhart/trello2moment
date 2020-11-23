# trello2moment

Converts A Trello board to a moment

## Overview

This script will convert a Trello board into a moment.  Cards and their descriptors are read and conveted to a set of schema.org webpages.  A makefile is also included which provides the conversion of the moment.ttl file into a JSONLD format.  This is the file of choice for the client.

#### Creating a `fin-import` ready object

``` bash 
moment=foo
board=<Trello board id>
key=<trello key>
token=<trello token>
./trello2moment --overwrite --thumbnails --key=${key} --token=${token} --board=${board} --moment=${moment}
riot --formatted=JSONLD --base=z: ${moment}_moment.ttl | sed 's/"z:\(.*\)"/"\1"/' > ${moment}/${moment}.jsonld
```


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

