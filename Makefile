#! /usr/bin/make -f
SHELL:=/bin/bash

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=NgVOlKPZ
moment:=chardonney

api=http https://api.trello.com/1/boards/$1 key==${key} token==${token}

import:${board}

files:=$(patsubst %,${board}/%.json,lists cards)

.PHONY:files
files:${files}

${board}/board.json:
	[[ -d ${board} ]] || mkdir ${board};\
	$(call api,${board}) > $@

${files}:${board}/%.json:${board}/board.json
	$(call api,${board}/$*) > $@

thumbnails: ${board}/cards.json
	for i in $$(jq -r '.[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<$$i;  \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
	  b=$$(basename $$url); \
	  mkdir ${moment}/$$l; \
	  http $$url > ${moment}/$$l/$$b ;\
	done
