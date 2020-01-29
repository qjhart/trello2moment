#! /usr/bin/env node
'use strict';

const yargs=require('yargs');
const jf=require('jsonfile');
const fs=require('fs');
const path=require('path');
const N3=require('n3');
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;
const n3u=N3.Util;
const marked = require('marked');
const traverse = require('traverse');
const request=require('request');

var prefix= {
  schema: 'http://schema.org/',
  ucdlib: 'http://digital.ucdavis.edu/schema#',
	w: 'http://library.ucdavis.edu/wine-ontology#',
  fast: 'http://id.worldcat.org/fast/',
	wdt: 'http://www.wikidata.org/prop/direct/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
}

var rdf= {type:1};
Object.keys(rdf).forEach((k)=>{rdf[k]=namedNode(prefix.rdf+k)});

var schema = {
  CreativeWork:1,
  Person:1,
  Place:1,
  VisualArtwork:1,
  WebPage:1,
  Event:1,
  Thing:1,
  description:1,
  license:1,
  relatedLink:1,
  url:1,
  name:1,
  publisher:1,
  significantLinks:1,
  spatial:1,
  longitude:1,
  latitude:1,
  temporal:1,
  thumbnail:1,
}
Object.keys(schema).forEach((k)=>{schema[k]=namedNode(prefix.schema+k)});

/**
  GOAL:
    organize/loop everything and prepare as an array/object.
    THEN send it to the writer
*/
// Hardcoding this for the sake of testing
let board_name = 'K2CNYMZP';

let card_type = {};
let cards = getCards(board_name);
mapCardsFunction(cards);

// https://itnext.io/https-medium-com-popov4ik4-what-about-promises-in-loops-e94c97ad39c0
async function mapCardsFunction(cards) {
  let resolvedFinalArray = await Promise.all(cards.map(async(el) => {
    try {
      const result = await find_location(el);
      return result;
    } catch (error) {
      console.log("mapsCardFunction Error", error);
    }
  }));

  add_card(resolvedFinalArray);
}

function add_card(array) {
  //console.log(array);
  let writer = new N3.Writer({prefixes: prefix});

  function add(s,p,o) {
    return writer.addQuad(s,p,o);
  }

  function add_desc(node, desc, formattedLocationObj) {
    // This version of add will do some additional testing for adding literals, etc
    function add_spo(s,p,o) {
      const urlre=/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/;

      if( typeof(o) === 'string' ) {
        o = o.replace(/[\s\n]+$/,'');
      }

      let predicates = {
        'when': schema.temporal,
        'description': schema.description,
        'links to learn more': schema.relatedLink,
        'location': schema.spatial
      };

      if ( typeof(p) === 'string' ) {
        p.replace(/[\s\n]+$/,'');
        p = predicates[p.toLowerCase()];
      }


      if ( typeof(s) === 'string' ) {
        if ( s.match(urlre) ) {
          s = namedNode(s.replace('https://trello.com/c/','#'));
        }
      }
      
      if ( p && o ) {
        if ( typeof(o) === 'string' ) {
          if ( o.match(urlre) ) {
            o = namedNode(o.replace('https://trello.com/c/','#'));
            //console.error(`{<${s.id}>,<${p.id}>,<${o}>}`);
          } else {
            o = literal(o);
            //console.error(`{<${s.id}>,<${p.id}>,"${o}"}`);
          }
        }
        add(s,p,o);
      }
    }

    let pred = '';
    let text = [''];
    let list_depth = 0;
    let obj = [];

    let json = marked.lexer(desc);
    // Silly way to flush
    json.push({type:'heading','text':'EndQ'});

    if ( formattedLocationObj ) {
      obj = formattedLocationObj;
    }

    json.forEach(item => {
      //console.error(item);
      switch (item.type) {
      case 'heading':
        add_spo(node,pred,text[0]);
        pred=item.text;
        list_depth=0;
        text=[''];
        break;
      case 'list_start':
        list_depth++;
        text[list_depth]='';
        //console.error(`list_depth=${list_depth}`);
        break;
      case 'list_end':
        list_depth--;
        //console.error(`list_depth=${list_depth}`);
        break;
      case 'list_item_start':
        break;
      case 'list_item_end':
        switch(pred) {
        case "Location":
          if (list_depth===1) {
            let full_gmap_link = text[list_depth].match(/^https?:\/\/www.google.com\/maps\//);
            if ( full_gmap_link ) {
              let locationObj = format_location_data(clean_path(full_gmap_link['input']), full_gmap_link['input']);
              add(node, schema.spatial, writer.blank([
                {
                  predicate: rdf.type,
                  object: schema.Place
                },
                {
                  predicate: schema.name,
                  object: literal(locationObj.location)
                },
                {
                  predicate: schema.url,
                  object: literal(locationObj.url)
                },
                {
                  predicate: schema.longitude,
                  object: literal(parseFloat(locationObj.lat))
                },
                {
                  predicate: schema.latitude,
                  object: literal(parseFloat(locationObj.lng))
                }
              ]));
            } else {
              add(node, schema.spatial, writer.blank(obj));
            }
            add_spo(node, pred, text[list_depth]);
          }
          break;
        case "When":
          if (list_depth===1) {
            add_spo(node,pred,text[list_depth]);
          }
          break;
        case "Links to Learn More":
          if (list_depth===2) {
            add_spo(node,pred,text[list_depth]);
          }
          break
        default:
          //console.error(`# ${node},${pred} ${text[1]} #`);
        }
        text[list_depth]='';
        break;
      case 'text':
        text[list_depth] += item.text;
        break;
      case 'space':
        text[list_depth] += ' ';
        break;
      case 'paragraph':
        text[list_depth] += item.text;
        break;
      default:
        break;
      }
    });    
  }

  function callback() {
     writer.end((error, result) => {
      if ( !error ) {
        fs.writeFile('result1.ttl', result, (err) => {
          console.log('Saved!');
          //console.log(result);
        });        
      } else {
        console.log("Error: ", error);
      }
    });
  }

  let itemsProcessed = 0;
  array.forEach((card, key, array) => {
    itemsProcessed++;
    if ( itemsProcessed === array.length ) callback();

    let attachment_re = new RegExp('https://trello.com/c/(.*)/.*$');
    let type = card_type[array[key].idList];

    if ( type ) {
      let n = namedNode('#' + array[key].shortLink);
      add(n,schema.name,literal(array[key].name));
      add(n,schema.publisher,namedNode('http://id.loc.gov/authorities/names/no2008108707'));
      add(n,schema.license,namedNode('http://rightsstatements.org/vocab/CNE/1.0/'));
      add(n,rdf.type,type);
      if ( array[key].idAttachmentCover ) {
        //console.error('card.cover');
        array[key].attachments.forEach(a => {
          if (a.id === array[key].idAttachmentCover) {
            //console.error('card.cover.add');
            add(n,schema.thumbnail,namedNode(path.join(array[key].shortLink,path.basename(a.url))));
          }
        });
      }

      if ( type === schema.significantLinks ) {   
        // Now get the labels to use
        array[key].labels.forEach(l => {
          let to_from = l.name.split(" / ");
          if ( to_from.length === 2 ) {
            let sub = namedNode(array[key].attachments[1].url.replace(attachment_re,`#$1`));
            let obj = namedNode(array[key].attachments[0].url.replace(attachment_re,`#$1`));

            // Create a unique predicate of type significant Links
            // At a later date, we can add rules to create the reversal
            let pred = n;
            if ("desc" in array[key]) {
              add(n,schema.description,literal(array[key].desc));
            }

            let pred_type = namedNode(prefix.ucdlib+to_from[0].replace(/\s+/g,'_'));

            add(pred,rdf.type,pred_type);
            add(pred,schema.name,literal(to_from[0]));
            add(sub,pred,obj);

            // At a Later Date, we can add in rules for reverse predicates so
            // this wouldn't be necessary
            let rev_pred = namedNode(n.id+'_rev');
            let rev_pred_type = namedNode(prefix.ucdlib+to_from[1].replace(/\s+/g,'_'));
            add(rev_pred,rdf.type,schema.significantLinks);
            add(rev_pred,rdf.type,rev_pred_type);
            add(rev_pred,schema.name,literal(to_from[1]));
            add(obj,rev_pred,sub);
          }
        });
      } else {
        add(n, rdf.type, schema.WebPage);        
        if ( "desc" in array[key] ) {

          if ( array[key]['location'] ) {
            add_desc(n, array[key].desc, array[key]['location']);
          } else {
            add_desc(n, array[key].desc);
          }

        }
      }
    }    
  });
}

function clean_path(path) {
  //let regex = new RegExp(/(^\w+:|^)\/\/([^\/,\s]+\.[^\/,\s]+?)(?=\/|,|\s|$|\?|#)?(\/\w+)?(\/\w+\/)/);
  path = decodeURIComponent(path.replace(/(^\w+:|^)\/\/([^\/,\s]+\.[^\/,\s]+?)(?=\/|,|\s|$|\?|#)\/(maps)\/(place)\//, ''));

  let array = path.split(/[\/]/).filter(el => el.length > 0);
  return array;
}

function format_location_data(array, shortLink) {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURI
  let rawLatLng   = array.filter(element => /^@/.test(element));  
  let latLngArray = rawLatLng[0].split(',');
  let lat = latLngArray[0].slice(1);
  let lng = latLngArray[1];
  let locationName = array[0].replace(/(\+)/gi, ' ').replace(/(\%)/gi, '\u00B0');
  
  let obj = {};

  return obj = {
    location: locationName,
    url: shortLink,
    lat: lat,
    lng: lng
  }
}

async function find_location(card) {  
  if ( "desc" in card ) {
    let gmap_link = card.desc.match(/https:\/\/goo.gl\/maps\/([\w]+)/g);
    if ( gmap_link ) {
      let options = {
        uri: gmap_link[0],
        followRedirect: false,
        method: 'HEAD'
      }

      let promise = new Promise((resolve, reject) => {
        setTimeout(() => {
          request.get(options, (error, response) => setTimeout(() => {
            if ( error ) reject(error);
            else {
              resolve(response.headers.location);
            }
          }, 1000));
        }, 1000);
      });

      try {
        let result = await promise;
        let locationObj = format_location_data(clean_path(result), gmap_link);
        card['location'] = [
          {
            predicate: rdf.type,
            object: schema.Place
          },
          {
            predicate: schema.name,
            object: literal(locationObj.location)
          },
          {
            predicate: schema.url,
            object: literal(locationObj.url)
          },
          {
            predicate: schema.longitude,
            object: literal(parseFloat(locationObj.lat))
          },
          {
            predicate: schema.latitude,
            object: literal(parseFloat(locationObj.lng))
          }
        ];
        return card;     
      } catch (err) {
        console.log("Error: ", err);
      }
    } else { 
      return card;
    }
  } else {
    console.log('No Desc', row);
  }
}

function getCards(board_name) {
  let warnl = []; 

  let board;
  let board_fn = path.join(board_name, 'board.json');

  try {
    board = jf.readFileSync(board_fn);
  } catch (error) {
    warnl.push(`${board_fn} not found`);
  }

  set_card_type_from_lists(board.lists);
  
  let cards = board.cards;

  function set_card_type_from_lists(lists) {
    lists.forEach((l)=>{
      let m = l.name;
      if (m==='Connections') {
        m='significantLinks';
      }
      if (m==='Object')
        m='Thing';

      if (m!=='Card Creation Guides') {
        if (m && schema[m]) {
          //console.error(`schema[${m}]`);
          card_type[l.id]=schema[m];
        } else {
          //console.error(`namedNode(${prefix.ucdlib}${m})`);
          card_type[l.id]=namedNode(prefix.ucdlib+m.replace(/\s+/g,'_'));
        }
      }
    });
  }  

  return cards;
}