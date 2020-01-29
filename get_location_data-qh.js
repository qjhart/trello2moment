const https=require('https');
const N3=require('n3');
const { namedNode, literal, defaultGraph, quad } = N3.DataFactory;

var prefix= {
  schema: 'http://schema.org/',
  ucdlib: 'http://digital.ucdavis.edu/schema#',
	w: 'http://library.ucdavis.edu/wine-ontology#',
  fast: 'http://id.worldcat.org/fast/',
	wdt: 'http://www.wikidata.org/prop/direct/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
};

var rdf= {
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

var urls=[
  'https://www.google.com/maps/place/Chateau+Montelena+Winery/@38.6025142,-122.599904,17z/data=!4m5!3m4!1s0x808442438c1e767b:0x6c066a4e839afe77!8m2!3d38.6025139!4d-122.5977217?shorturl=1',
  'https://www.google.com/maps/place/Ch%C3%A2teau+Montrose/@45.2465895,-0.7639582,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x8280f2f5b9da637c!8m2!3d45.2465895!4d-0.7617695?cid=9403783159148602236&shorturl=1',
  'https://www.google.com/maps/place/Heitz+Wine+Cellar/@38.5015586,-122.4187834,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x86f6ecf52796ec8!8m2!3d38.5015586!4d-122.4165947?shorturl=1',
  'https://www.google.com/maps/place/Ch%C3%A2teau+Mouton+Rothschild/@45.2130751,-0.7720411,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0x2fd38283bde3ddfb!8m2!3d45.2130751!4d-0.7698524?shorturl=1',
  'https://www.google.com/maps/place/Clos+Du+Val/@38.3871827,-122.3148005,17z/data=!3m1!4b1!4m5!3m4!1s0x0:0xacf2fbde6204aef6!8m2!3d38.3871827!4d-122.3126118?shorturl=1',
  'https://goo.gl/maps/DjrAkcqjzVJaQVBU8',
  'https://goo.gl/maps/SPdaMx1UxWP64Fuf6',
  'https://goo.gl/maps/UT32LvgCdj7xACwr8',
  'https://goo.gl/maps/UytBCsafionpyVFz7',
  'https://goo.gl/maps/a52pYyCBXtQhaqX39',
  'https://goo.gl/maps/qzmExtQtVLW12yX9A',
  'https://goo.gl/maps/gNjRYBf4CfA3gFRJ8',
  'https://goo.gl/maps/TnDhLGhGvvdccTpSA'
];

let writer = new N3.Writer({prefixes: prefix});

//var req=https.request(url,options,(res) =>
//{
//  console.log('statusCode:', res.statusCode);
//  console.log('headers:', res.headers.location);
//});
//req.end();

getLink = function(url) {
  // return new pending promise
  return new Promise((resolve, reject) => {
    const request = https.request(url,{method:'HEAD'},(res) => {
      //console.log('statusCode:', res.statusCode);
      //console.log('headers:', res.headers);
      if (res.statusCode != 302) {
        reject(new Error('Unexpected Response: ' + res.statusCode));
      }
      // return location
      resolve(res.headers.location);
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err));
    request.end();  // Send Request
  })
};

function format_location_data(map_link) {
  let place = new RegExp('^https://www.google.com/maps/place/');
  let path = map_link.replace(place, '');
  let array = path.split('/').filter(el => el.length > 0);

  let ll_re=new RegExp('@?(?<lat>.*),(?<lon>.*)(,\d*z)');
//  let found=array[1].match(ll_re);
//  let obj=found.groups;
  let locationName = array[0].replace(/(\+)/gi, ' ').replace(/(\%)/gi, '\u00B0');

  let obj={};
  obj.ul=map_link;
  obj.location=locationName;
  return obj;
}

async function addLinks() {
  for (let index = 0; index < urls.length; index++) {
    let url=urls[index];
    let link = await getLink(url);
    let locationOj=format_location_data(link);
    let b = writer.blank([
      {
        predicate: rdf.type,
        object: schema.Place
      },
      {
        predicate: schema.url,
        object: namedNode(url)
      },
      {
        predicate: schema.url,
        object: namedNode(link)
      }
//      {
//        predicate: schema.name,
//        object: literal(locationObj.location)
//      },
//       {
//         predicate: schema.longitude,
//         object: literal(parseFloat(locationObj.lat))
//       },
//       {
//         predicate: schema.latitude,
//         object: literal(parseFloat(locationObj.lng))
//       }
    ]);
    writer.addQuad(namedNode(url),schema.Place,b);
  }
}

async function add() {
  await addLinks();
  writer.end(function (error, result) {
    console.log(result);
  });
}

add();
