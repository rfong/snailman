var storage = chrome.storage.local;

function getUrl(item) {
  if (item.tracking == null) return null;
  switch(item.service) {
    case 'USPS':
      return "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum=" + item.tracking;
    case 'UPS':
      return "http://wwwapps.ups.com/etracking/tracking.cgi?tracknum=" + item.tracking + "&track.x=Track";
    default:
      return null;
  }
}

var active = true;

// only call display fn if state changed
function setActive(newState) {
  if (newState != active) {
    active = newState;
    display();
  }
}

function isDefaulted(selector) {
  return $(selector).val() == $(selector).attr('data-default');
}

function updatePackages(packages) {
  storage.set({packages:packages});
  display();
}

// refresh content
function display() {
  storage.get('packages', function(response) {
    $('#main').html('');

    _.each(response.packages, function(item, tracking) { 
        if (!item.active) return;
        var url, el;
        url = getUrl(item);
        if (url==null) return;
 
        el = $('<div class="item">\
            <div class="header"/>\
            <div class="info"/>\
          </div>');
        el.find('.header').html(
          (item.description ? '<b>'+item.description+'</b> - ' : '') +
          '<a target="_blank" href="' + url + '" \
              onClick="chrome.tabs.create({url:" + url + "})" >'
            + item.service + ' ' + tracking +
          '</a>' +
          '<i class="delete button icon-fixed-width icon-trash"></i>'
        );
        //el.find('.info').html('info placeholder');

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

  // set up inputs with defaults
  $('input[data-default]').each(function() {
    var val = $(this).attr('data-default');
    if (val) $(this).val(val).addClass('default');
  })
  .focusin(function() {
    if ($(this).val() == $(this).attr('data-default'))
      $(this).val('')
        .removeClass('default');
  })
  .focusout(function() {
    if ($(this).val().length==0)
      $(this).val( $(this).attr('data-default') )
        .addClass('default');
  });

  display();

  $('#current').click(function(){ setActive(true) });
  $('#history').click(function(){ setActive(false) });

  // tmp for debug
  $('#clear').click(function() {
    updatePackages({});
  });

  var addHandler = function() {
    var service = $('select#service').val(),
        tracking = $('input#tracking').val().toString(),
        description = $('input#description').val().toString();
    // any fields still defaulted?
    if (_.some( $('#add-package input'),
        function(e) { return isDefaulted(e) } ))
      return;
    // reset to defaults
    $('#add-package input[data-default]').each(function() {
      $(this).val( $(this).attr('data-default') ).addClass('default');
    });

    storage.get('packages', function(response) {
      packages = response.packages || {};

      // already exists
      if (_.some(packages, function(item,item_tracking){ item_tracking == tracking }))
        return;

      packages[tracking] = {
        service: service,
        tracking: tracking,
        description: description,
        active: true
        };
      updatePackages(packages);
    });
  };
  //$('#add').click(addHandler);
  $('#add-package input').keypress( function(e){ if (e.which==13) addHandler() });

});

