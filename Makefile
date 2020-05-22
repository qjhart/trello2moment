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
	 - Z4444 ( a card )
	  - image_name.jpg

=end text

=head2 Methods

=item C<${moment}_moment.ttl>

create moment description

=item C<${moment}/${moment}.json>

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

.PHONY: INFO check

INFO::
	@pod2usage -exit 0 ${MAKEFILE_LIST}

check::
	@podchecker ${MAKEFILE_LIST}

${moment}_moment.ttl:
	./trello2moment --overwrite --thumbnails --key=${key} --token=${token} --board=${board} --moment=${moment}

${moment}/${moment}.json: ${moment}_moment.ttl
	${riot} --formatted=jsonld --base=z: $< | sed 's/z:#//' > $@

triptych: ${moment}/${board}.json
	[[ -d ${moment}/triptych ]] || mkdir ${moment}/triptych; \
	for i in $$(jq -r '.cards[] | select(.name == "Triptych") | .shortLink + "|" + .attachments[].id' $< ) ; do \
		IFS='|' read l a <<<"$$i"; \
		echo i=$$i l=$$l a=$$a; \
		url=$$(http https://api.trello.com/1/cards/$$l/attachments/$$a key==${key} token==${token} | jq -r .url); \
		b=$$(basename $$url); \
		[[ -d ${moment}/triptych/$$l ]] || mkdir ${moment}/triptych/$$l; \
		[[ -f ${moment}/triptych/$$l/$$b ]] || http $$url > ${moment}/triptych/$$l/$$b; \
		./trello2moment --moment=${moment} --board=${board} --output_file=${moment}/triptych/$$l/$$b.ttl; \
	done
