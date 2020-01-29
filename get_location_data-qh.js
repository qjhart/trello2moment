// https://loige.co/unshorten-expand-short-urls-with-node-js/

/**
  Expand Google Maps short link to pull required location data  

  ## RDF (Resources Description Framework)   

  ### Tutorials
  [Turtle Format](https://www.w3.org/TR/turtle/)
  [N3.js on Github](https://github.com/rdfjs/N3.js)
  [RDF Model](https://www.w3.org/TR/rdf-primer/#rdfmodel)
  [Tutorial](https://www.w3.org/2000/10/swap/doc/tutorial-1.pdf)
  [N3.JS Documentation](https://rdf.js.org/N3.js/)
  [Who Says Using RDF is hard?](https://www.rubensworks.net/blog/2019/10/06/using-rdf-in-javascript/)

  plain literals: constant values represented by character strings

  Example:
    predicate => http://purl.org/dc/elements/1.1/language
    literal   => "En" (for English)
  
    Literals may not be used as subjects or predicates in RDF statements
*/

const request = require('request');
const N3 = require('n3');
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

var prefix = {
  schema: 'http://schema.org/',
  ucdlib: 'http://digital.ucdavis.edu/schema#',
	w: 'http://library.ucdavis.edu/wine-ontology#',
  fast: 'http://id.worldcat.org/fast/',
	wdt: 'http://www.wikidata.org/prop/direct/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
}

var rdf = {
  type:1
}
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

let locationArray = [
  'https://goo.gl/maps/FoinpAim1hxpwhPf8', 
  'https://goo.gl/maps/wem1wbwThoRFNTxW8', 
  'https://goo.gl/maps/Cz1c9cSo6TCQyvh76',
  "https://www.google.com/maps/place/Stag's+Leap+Wine+Cellars/@38.3992276,-122.3257286,17z/data=!3m1!4b1!4m8!1m2!3m1!2sStag's+Leap+Wine+Cellars!3m4!1s0x80850024581748e9:0x799218271937af8c!8m2!3d38.3992275!4d-122.3235402"
];

let expandedUrlArray = [
  {
    cardId: "iPD48uUA",
    url: "https://www.google.com/maps/place/Crepeville/@38.5444091,-121.7422749,16.75z/data=!4m5!3m4!1s0x8085290b6a688f2d:0xd7a81b8d31f3985a!8m2!3d38.543952!4d-121.7438203?shorturl=1",
  },
  {
    cardId: "DvGF3KKI",
    url: "https://www.google.com/maps/place/38%C2%B032'26.4%22N+121%C2%B044'09.2%22W/@38.540653,-121.737729,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!7e2!8m2!3d38.5406528!4d-121.7358835?shorturl=1",
  },
  {
    cardId: "EJPTVGXY",
    url: "https://www.google.com/maps/place/502+Alvarado+Ave,+Davis,+CA+95616/@38.5615695,-121.7529294,17z/data=!3m1!4b1!4m5!3m4!1s0x808529b909a7ebf7:0xaa24258ec52d52aa!8m2!3d38.5615695!4d-121.7507354?shorturl=1"
  },
  {
    cardId: "sk79HEjl",
    url: "https://www.google.com/maps/place/Stag's+Leap+Wine+Cellars/@38.3992276,-122.3257286,17z/data=!3m1!4b1!4m5!3m4!1s0x80850024581748e9:0x799218271937af8c!8m2!3d38.3992276!4d-122.3235399"
  }
];

(async function Main() {
  const writer = new N3.Writer({prefixes: prefix});
  
  function add(s,p,o) {
    return writer.addQuad(s,p,o);
  }

  /**
   * End Result - Proper Formatting:
      [
        a schema:Place; 
        schema:url "https://goo.gl/maps/YFS5oT6aiNgLQYQS6";
        schema:name "Moscow,+Russia";
        schema:latitude 55.5807482;
        schema:longitude 36.825156
      ]
  */  
  for ( let i = 0; i < locationArray.length; i++ ) {
    let locationObj;
    let node = namedNode('#'+i);
    add(node, rdf.type, schema.WebPage);
    add(node, schema.Title, literal('foo'));

    if ( locationArray[i].includes('https://goo.gl/maps/')) {
      // Is short link
      let data = await get_location_data(locationArray[i]);
      locationObj = format_location_data(clean_path(data), i);    
    } else {
      // Is full link
      locationObj = format_location_data(clean_path(locationArray[i]));        
    }

    // Run Local Test => locationObj = format_location_data(clean_path(expandedUrlArray[i].url));

    let b = writer.blank([
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
    ]);
    add(node, schema.spatial, b);
  }  
  writer.end((error, result) => {
    console.log(result);
  });
})();

function get_location_data(gmap_link) {
  let options = {
    uri: gmap_link,
    followRedirect: false,
    method: 'HEAD'
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      //console.log("Finished waiting.");
      request.get(options, (error, response) => setTimeout(() => {
        if ( error ) reject(error)
        else resolve(response.headers.location);
      }, 1000));
    }, 250);
  });
}

function clean_path(path) {
  //let regex = new RegExp(/(^\w+:|^)\/\/([^\/,\s]+\.[^\/,\s]+?)(?=\/|,|\s|$|\?|#)?(\/\w+)?(\/\w+\/)/);
  path = path.replace(/(^\w+:|^)\/\/([^\/,\s]+\.[^\/,\s]+?)(?=\/|,|\s|$|\?|#)\/(maps)\/(place)\//, '');
  let array = path.split(/[\/]/).filter(el => el.length > 0);
  return array;
}

function format_location_data(array) {  
  let rawLatLng   = array.filter(element => /^@/.test(element));  
  let latLngArray = rawLatLng[0].split(',');
  let lat = latLngArray[0].slice(1);
  let lng = latLngArray[1];
  let locationName = array[0].replace(/(\+)/gi, ' ').replace(/(\%)/gi, '\u00B0');
  let shortLink = 'https://goo.gl/maps/FoinpAim1hxpwhPf8';
  
  let obj = {};

  return obj = {
    location: locationName,
    url: shortLink,
    lat: lat,
    lng: lng
  }
}