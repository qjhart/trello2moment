#! /usr/bin/make -f

SHELL:=/bin/bash

define pod

=pod

=head1 NAME 

Trello2Moment - Turn a Trello board into a properly formatted Moment.

=head1 SYNOPSIS

This Makefile is used to create a DAMS Moment from a Trello board.  
The commands will create a number of items needed for the Moment.

C<<< make [-n] key=I<trello_key> token=I<trello_token> board=I<board_id> moment=I<moment_name> <command> >>>

=head2 File structure

=begin text

	- cats 
	 - pY20Yz5x.json ( This is the downloaded board )
	 - pY20Yz5z.ttl ( This is created from Trello2Moment )
	 - cats.json ( converted from ../pY20Yz5z.ttl with RIOT )
	 - cats_moment.ttl ( the Moment description )
	 - cats.ttl ( the Moment )
	 - Z4444 ( a card )
	  - image_name.jpg

=end text

=head2 Methods

=item C<${board}.json import>

Imports all the required data from the trello board. 
Creates the json and the associated card thumbnail images.

=item C<${board}.ttl>

create board.ttl

=item C<${moment}_moment.ttl>

create moment description

=item C<${moment}.json>

create moment.json

=item C<${moment}.json.ttl>

create moment.json.ttl

=cut

endef

# use make riot=path/to/riot if not in your $PATH
riot:=riot

key:=supply_on_cmd
token:=supply_token_on_cmd

board:=pY20Yz5x
moment:=cats

trello=http https://api.trello.com/1/boards/${board}/ key==${key} token==${token}


.PHONY: INFO check

INFO::
	@pod2usage -exit 0 ${MAKEFILE_LIST}

check::
	@podchecker ${MAKEFILE_LIST}

import:${board}.json thumbnails

${board}.json:
	[[ -d ${moment} ]] || mkdir ${moment}; \
	${trello} lists==all cards==visible card_attachments==true | jq . > ${moment}/$@

thumbnails: ${moment}/${board}.json
	[[ -d ${moment} ]] || mkdir ${moment}; \
	for i in $$(jq -r '.cards[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" + .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<"$$i"; \
		echo i=$$i l=$$l a=$$a ; \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
		echo https://api.trello.com/1/cards/$$a key==${key} token==${token}; \
	  b=$$(basename $$url); \
	  [[ -d ${moment}/$$l ]] || mkdir ${moment}/$$l; \
		[[ -f ${moment}/$$l/$$b ]] || http $$url > ${moment}/$$l/$$b; \
	  echo "${moment}/$$l/$$b"; \
	done

triptych: ${moment}/${board}.json
	[[ -d ${moment}/triptych ]] || mkdir ${moment}/triptych; \
	for i in $$(jq -r '.cards[] | select(.name == "Triptych") | .shortLink + "|" + .attachments[].id' $< ) ; do \
		IFS='|' read l a <<<"$$i"; \
		echo i=$$i l=$$l a=$$a; \
		url=$$(http https://api.trello.com/1/cards/$$l/attachments/$$a key==${key} token==${token} | jq -r .url); \
		b=$$(basename $$url); \
		[[ -d ${moment}/triptych/$$l ]] || mkdir ${moment}/triptych/$$l; \
		[[ -f ${moment}/triptych/$$l/$$b ]] || http $$url > ${moment}/triptych/$$l/$$b; \
	done

${board}.ttl: ${moment}/${board}.json
	./trello2moment --moment=${moment} --board=${board} 2>${moment}/${board}.err > ${moment}/${board}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${board}_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${board}_t.ttl

${moment}_moment.ttl: ${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} --description=true 2>${moment}/${moment}_moment.err > ${moment}/${moment}_moment_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${moment}_moment_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${moment}_moment_t.ttl

${moment}.json: ${moment}/${board}.ttl
	${riot} --formatted=jsonld --base=z: ${moment}/${board}.ttl | sed 's/z:#//' > ${moment}/$@

${moment}.json.ttl: ${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} 2>${moment}/${moment}.err > ${moment}/${moment}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${moment}_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${moment}_t.ttl
