# File Structure
# - moments
#		- cats
# 		- cats.ttl (New part)
# ✓ 	- pY20Yz5x.json (This is the downloaded board)
# ✓ 	- pY20Yz5z.ttl ( This is created from trello to moment )
# ✓ 	- cats 
# ✓ 		- cats.json ( converted from ../pY20Yz5z.ttl with RIOT )
# ✓			- Z4444 (a card)
# ✓					- image_name.jpg

#! /usr/bin/make -f
SHELL:=/bin/bash

# use make riot=path/to/riot if not in your $PATH
riot:=riot

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=pY20Yz5x
moment:=cats

trello=http https://api.trello.com/1/boards/${board}/ key==${key} token==${token}

import:${board}.json

files:=$(patsubst %,${board}/%.json,lists cards)
.PHONY:files
files:${files}

${board}.json:
	[[ -d ${moment} ]] || mkdir moments/${moment}; \
	${trello} lists==all cards==all card_attachments==true | jq . > moments/${moment}/$@

thumbnails: moments/${moment}/${board}.json
	[[ -d ${moment} ]] || mkdir moments/${moment}/${moment}; \
	for i in $$(jq -r '.cards[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<"$$i"; \
		echo i=$$i l=$$l a=$$a ; \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
		echo https://api.trello.com/1/cards/$$a key==${key} token==${token}; \
	  b=$$(basename $$url); \
	  [[ -d ${moment}/$$l ]] || mkdir moments/${moment}/${moment}/$$l; \
		[[ -f ${moment}/$$l/$$b ]] || http $$url > moments/${moment}/${moment}/$$l/$$b; \
	  echo "${moment}/$$l/$$b"; \
	done

${board}.ttl: moments/${moment}/${board}.json
	./trello2moment --moment=${moment} --board=${board} 2>moments/${moment}/${board}.err > moments/${moment}/${board}_t.ttl
	${riot} --formatted=ttl --base=z: moments/${moment}/${board}_t.ttl  | sed -e 's/<z:/</g' > moments/${moment}/$@
	rm -f moments/${moment}/${board}_t.ttl

${moment}.json: moments/${moment}/${board}.ttl 
	[[ -d ${moment} ]] || mkdir moments/${moment}/${moment}; \
	rm -f moments/${moment}/${moment}/${moment}.json; \
	${riot} --formatted=jsonld --base=z: moments/${moment}/${board}.ttl | sed 's/z:#//' > moments/${moment}/${moment}/$@