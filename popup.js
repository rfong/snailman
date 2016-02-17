// Make underscore use Mustache style templating
_.templateSettings = {
  interpolate: /\{\{(.+?)\}\}/g
};


var storage = chrome.storage.local;


var urls = {
  'USPS': "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=%s",
  'UPS': "http://wwwapps.ups.com/etracking/tracking.cgi?tracknum=%s&track.x=Track",
  'FedEx': "https://www.fedex.com/fedextrack/?tracknumbers=%s",
  'Japan Post': "https://trackings.post.japanpost.jp/services/srv/search/direct?locale=en&reqCodeNo1=%s",
  'DHL': "http://webtrack.dhlglobalmail.com/?trackingnumber=%s",
  'ELTA': "http://track.aftership.com/elta-courier/%s",
  'Canada Post': 'http://www.canadapost.ca/cpotools/apps/track/personal/findByTrackNumber?trackingNumber=%s',
};


// slightly lenient regexes
// todo strip whitespace before matching
var serviceRegexes = {
  'USPS': /^E\D{1}\d{9}$|^9\d{15,21}$/i,
  'UPS': /^1Z[0-9A-Z]{0,16}$/i,
  'FedEx': /^\d{12,14}$/i,
  'DHL': /^\d{10}$/i,
  'Canada Post': /^\d{16}$/i,
  'Japan Post': /\d{9}JP$/i,
  'ELTA': /\d{9}GR$/i,
};


function matchService(tracking) {
  for (var service in serviceRegexes) {
    if (tracking.match(serviceRegexes[service]))
      return service;
  } return null;
}


function getUrl(item) {
  if (item.service == null) return;
  return urls[item.service].replace('%s', item.tracking);
}


function updatePackages(packages) {
  storage.set({packages:packages});
  display();
}


function display() {
  storage.get('packages', function(response) {
    console.log(response.packages);
    $('#main tr:not(#add-package)').remove();

    var linkTemplate = _.template('\
      <a target="_blank" href="{{url}}" \
         onClick="chrome.tabs.create({url:{{url}}})">\
        {{service}} {{tracking}}</a>');

    var rowTemplate = _.template('\
      <tr class="item">\
        <td><b>{{description}}</b></td>\
        <td>{{tracking}}</td>\
        <td><i class="delete button icon-fixed-width icon-trash"></i></td>\
      </tr>');

    _.each(response.packages, function(item, tracking) { 
        var url, el;
        url = getUrl(item);
 
        el = $(rowTemplate({
          description: item.description,
          tracking: (
            item.service == null ?
            tracking + ' (unidentified carrier)' :
            linkTemplate({url: url, service: item.service, tracking: tracking})
          ),
        }));

        el.find('.delete').click(function() {
          storage.get('packages', function(response) {
            packages = response.packages;
            delete packages[tracking];
            updatePackages(packages);
          });
        });
  
        $('#main').append(el);
      }
    );
  });
}

$(document).ready(function() {

  display();

  var addHandler = function() {
    var tracking = $('input#tracking').val().toString().replace(/ /g, ''),
        service = matchService(tracking),
        description = $('input#description').val().toString();

    storage.get('packages', function(response) {
      packages = response.packages || {};
      packages[tracking] = {
        service: service,
        tracking: tracking,
        description: description,
        };
      updatePackages(packages);
    });
  };
  $('#add-package input').keypress(
    function(e){ if (e.which==13) addHandler() });
  $('#add-button').click(addHandler);

});

