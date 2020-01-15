#! /usr/bin/make -f
SHELL:=/bin/bash

# Need Riot installed
riot:=~/apache-jena-3.8.0/bin/riot

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=NgVOlKPZ
moment:=chardonney

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
	  IFS='|' read l a <<<$$i;  \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
	  b=$$(basename $$url); \
	  [[ -d ${moment}/$$l ]] || mkdir ${moment}/$$l; \
		[[ -f ${moment}/$$l/$$b ]] || http $$url > ${moment}/$$l/$$b ;\
	  echo "${moment}/$$l/$$b";\
	done

${moment}.ttl:${board}/board.json
	./trello2moment --board=${board} 2>${moment}.err > ${moment}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}_t.ttl  | sed -e 's/<z:/</g' > $@
	rm -f ${moment}_t.ttl
