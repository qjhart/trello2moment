#! /usr/bin/make -f

SHELL:=/bin/bash

define pod

=pod

=head1 SYNOPSIS

  make [-n] key=I<trello_key> token=I<trello_token> board=I<board_id> moment=I<moment_name> <command>
  where command is one of: import ${board}.json thumbnails  ${board}.ttl moment

This Makefile is used create a dams moment from a trello board.  The commands allow for the creation of a number of items needed for the momment

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
	${riot} --formatted=ttl --base=z: moments/${moment}/${board}_t.ttl | sed -e 's/<z:/</g' > moments/${moment}/$@
	rm -f moments/${moment}/${board}_t.ttl

${moment}_moment.ttl: moments/${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} --description=true 2>moments/${moment}/${moment}_moment.err > moments/${moment}/${moment}_moment_t.ttl
	${riot} --formatted=ttl --base=z: moments/${moment}/${moment}_moment_t.ttl | sed -e 's/<z:/</g' > moments/${moment}/$@
	rm -f moments/${moment}/${moment}_moment_t.ttl

${moment}.ttl: moments/${moment}/${board}.json
	./trello2moment --board=${board} --moment=${moment} 2>moments/${moment}/${moment}.err > moments/${moment}/${moment}_t.ttl
	${riot} --formatted=ttl --base=z: moments/${moment}/${moment}_t.ttl | sed -e 's/<z:/</g' > moments/${moment}/$@
	rm -f moments/${moment}/${moment}_t.ttl

${moment}.json: moments/${moment}/${board}.ttl
	[[ -d ${moment} ]] || mkdir moments/${moment}/${moment}; \
	rm -f moments/${moment}/${moment}/${moment}.json; \
	${riot} --formatted=jsonld --base=z: moments/${moment}/${board}.ttl | sed 's/z:#//' > moments/${moment}/${moment}/$@
