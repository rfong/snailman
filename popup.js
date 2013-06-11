window.onload = function() {
  var urls = {
      'USPS': function(num) { return "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum="+num },
      'UPS': function(num) { return "http://wwwapps.ups.com/etracking/tracking.cgi?tracknum=" + num + "&track.x=Track" }
    },
    items = [
      {num:'9274899999165900403878', service:'USPS', name:'nokia'},
      {num:'9405503699300407380384', service:'USPS', name:'bpal'},
      {num:'1Z7759450319977203', service:'UPS', name:'mouse'},
    ];
 
  _.each(items, function(item) { 
    var el = document.createElement('div');
    el.innerHTML = '<a target="_blank" href="' + urls[item.service](item.num) + '">' + item.name + '</a>';
    el.onClick = 'chrome.tabs.create({url: ' + el.getAttribute('href') + '})';
    document.body.appendChild(el);
  });
};
