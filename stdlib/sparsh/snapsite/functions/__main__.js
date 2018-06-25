const request = require("request");
/**
* This takes a snapshot of the url provided and stores it on https://web.archive.org/
* @param {string} url The url to the webpage that you want to archive
* @returns {string} The url to the archived snapshot on web.archive.org
*/
module.exports = (url = 'https://twitter.com/sparshrestha', context, callback) => {

  var options = { method: 'POST',
    url: 'https://pragma.archivelab.org',
    headers: 
     { 'Cache-Control': 'no-cache',
       'Content-Type': 'application/json' },
    body: { url: url },
    json: true };
  
  request(options, function (error, response, body) {
    if (error) {
      return callback(error);
    }
    console.log(body);
    return callback(null, "https://web.archive.org" + body.wayback_id);
  });
  
};
