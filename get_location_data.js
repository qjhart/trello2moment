/*
  Take a Google Maps link and use it to generate a 
  JSON rep of the Schema.org Place.

  Example Output

    {
      "@id" : "_:b11",
      "@type" : "schema:Place",
      "latitude" : "37.664235",
      "longitude" : "-121.725368",
      "name" : "Livermore, California",
      "url" : <INPUT_URL>
    }
  
  Bonus Points - specify address vs place name
*/
const http = require('http');
const request = require('request');
let location = "https://goo.gl/maps/1Z84CzL8oewDcVud8";

let locationArray = [
  'https://goo.gl/maps/FoinpAim1hxpwhPf8', 
  'https://goo.gl/maps/wem1wbwThoRFNTxW8', 
  'https://goo.gl/maps/Cz1c9cSo6TCQyvh76'
];

locationArray.forEach(el => getLocationData(el));

function getLocationData(gmap_link) {
  let options = {
    url: gmap_link,
    timeout: 2000,
    followAllRedirects: true
  }

  request(options, (error, response, body) => {
    let path  = response.request.uri.path;
    let array = path.split(/[\/]/).filter(el => el.length > 0);

    let rawLatLng   = array.filter(element => /^@/.test(element));
    let latLngArray = rawLatLng[0].split(',');
    let lat = latLngArray[0].slice(1);
    let lng = latLngArray[1];
    
    let rawLocName   = array[2];
    //let locationName = rawLocName.replace(/(\+)/gi, ' ');
    console.log(typeof rawLocName);

    /*
    let obj = {
      lat: lat,
      lng: lng,
      name: locationName
    }

    console.log(obj);
    */
  });
}