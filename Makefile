#! /usr/bin/make -f

SHELL:=/bin/bash

define pod

=pod

=head1 SYNOPSIS

  make [-n] key=I<trello_key> token=I<trello_token> board=I<board_id> moment=I<moment_name> <command>
  where command is one of: import ${board}.json thumbnails  ${board}.ttl moment

This Makefile is used to create a dams moment from a trello board.  The commands will create a number of items needed for the moment

=head1 COMMANDS

=over 4

=item B<make import>

Imports all the required data from the trello board.  This

=back

=head1 OPTIONS

=over 4

=item B<key=I<trello_key>>

This is the key for API access to the trello key. You can get this from....

=item B<token=I<trello_token>>

This is the token for API access to the trello key. You can get this from....

=back

=head1 FILE STRUCTURE

The following diagram shows an example file structure.

- moments
		- cats
    - cats_moment.ttl (the moment description)
			- cats.ttl (new part)
	- pY20Yz5x.json (This is the downloaded board)
	- pY20Yz5z.ttl ( This is created from trello to moment )
	- cats
		- cats.json ( converted from ../pY20Yz5z.ttl with RIOT )
			- Z4444 (a card)
					- image_name.jpg

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
	${trello} lists==all cards==all card_attachments==true | jq . > ${moment}/$@

thumbnails: ${moment}/${board}.json
	[[ -d ${moment} ]] || mkdir ${moment}; \
	for i in $$(jq -r '.cards[] | select(.cover.idAttachment != null) | .shortLink+ "|" + .id + "/attachments/" +  .cover.idAttachment' $< ); do \
	  IFS='|' read l a <<<"$$i"; \
		echo i=$$i l=$$l a=$$a ; \
	  url=$$(http https://api.trello.com/1/cards/$$a key==${key} token==${token} | jq -r .url); \
		echo https://api.trello.com/1/cards/$$a key==${key} token==${token}; \
	  b=$$(basename $$url); \
	  [[ -d ${moment}/$$l ]] || mkdir ${moment}/$$l; \
		[[ -f ${moment}/$$l/$$b ]] || http $$url > ${moment}/$$l/$$b; \
	  echo "${moment}/$$l/$$b"; \
	done

${board}.ttl: ${moment}/${board}.json
	./trello2moment --moment=${moment} --board=${board} 2>${moment}/${board}.err > ${moment}/${board}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${board}_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${board}_t.ttl

${moment}_moment.ttl: ${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} --description=true 2>${moment}/${moment}_moment.err > ${moment}/${moment}_moment_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${moment}_moment_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${moment}_moment_t.ttl

${moment}.ttl: ${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} 2>${moment}/${moment}.err > ${moment}/${moment}_t.ttl
	${riot} --formatted=ttl --base=z: ${moment}/${moment}_t.ttl | sed -e 's/<z:/</g' > ${moment}/$@
	rm -f ${moment}/${moment}_t.ttl

${moment}.json: ${moment}/${board}.ttl
	${riot} --formatted=jsonld --base=z: ${moment}/${board}.ttl | sed 's/z:#//' > ${moment}/$@
