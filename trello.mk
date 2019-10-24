#! /usr/bin/make -f
SHELL:=/bin/bash

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=NgVOlKPZ

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
