#! /usr/bin/make -f
SHELL:=/bin/bash

# use make riot=path/to/riot if not in your $PATH
riot:=riot

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=pY20Yz5x
moment:=trello2moment

trello=http https://api.trello.com/1/boards/${board}/ key==${key} token==${token}

import:${board}/board.json

files:=$(patsubst %,${board}/%.json,lists cards)

.PHONY:files
files:${files}

${board}/board.json:
	[[ -d ${board} ]] || mkdir ${board};\
	${trello} lists==all cards==all card_attachments==true | jq . > $@

thumbnails: ${board}/board.json
	[[ -d ${moment} ]] || mkdir ${moment};\
	for i in $$(jq -r '.cards[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<"$$i";  \
		echo i=$$i l=$$l a=$$a ; \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
		echo https://api.trello.com/1/cards/$$a key==${key} token==${token} ;\
	  b=$$(basename $$url); \
	  [[ -d ${moment}/$$l ]] || mkdir ${moment}/$$l; \
		[[ -f ${moment}/$$l/$$b ]] || http $$url > ${moment}/$$l/$$b ;\
	  echo "${moment}/$$l/$$b";\
	done

${moment}.ttl:${board}/board.json
	./trello2moment --board=${board} 2>${moment}.err > ${moment}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}_t.ttl  | sed -e 's/<z:/</g' > $@
	rm -f ${moment}_t.ttl

${moment}.json:
	${riot} --formatted=jsonld --base=z: ${moment}.ttl | sed 's/z:#//' > $@