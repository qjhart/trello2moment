#! /usr/bin/make -f
SHELL:=/bin/bash

key:=supply_on_cmd
token:=supply_token_on_cmd

#board:=NgVOlKPZ
#moment:=chardonney

board:=K2CNYMZP
moment:=jop

api=http https://api.trello.com/1/boards/$1 key==${key} token==${token}

import:${board}/${moment}.json

files:=$(patsubst %,${board}/%.json,lists cards)

.PHONY:files
files:${files}

${board}/${moment}.json:
	[[ -d ${board} ]] || mkdir ${board};\
	$(call api,${board}) > $@

${files}:${board}/%.json:${board}/${moment}.json
	$(call api,${board}/$*) > $@

thumbnails: ${board}/cards.json
	for i in $$(jq -r '.[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<$$i;  \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
	  b=$$(basename $$url); \
	  mkdir ${moment}/$$l; \
	  http $$url > ${moment}/$$l/$$b ;\
	done

${moment}.ttl:
	./trello2moment --board=${board} 2>${moment}.err > $@

.PHONY: thumbnail.ttl

thumbnail.ttl: ${board}/cards.json ${moment}.ttl
	for i in $$(jq -r '.[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<$$i;  \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
	  b=$$(basename $$url); \
	  echo "<#$$l> schema:thumbnail <$$l/$$b> ." ;\
	done | tee --append ${moment}.ttl
