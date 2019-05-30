// Everything related to the mastodon-instance
// Init Vue-Object for data binding
const mastodonCardVue = new Vue({
  el: '#mastodonCard',
  data: {
    title: 'Your Mastodon-Feed',
    mastodoncontent: '',
  },
  created: function() {

  },
  methods: {},
});

// Register event listeners for auth-button and enter
document.querySelector('#mastodonLoginClick').onclick = () => {
  const mInstance = document.getElementById('mastodonInstance').value;
  console.log('Auth with ' + mInstance);
  doMastodonAuth(mInstance);
};
document.querySelector('#mastodonInstance').addEventListener("keyup", function(event) {
  // 13 = enter
  if (event.keyCode === 13) {
    event.preventDefault();
    // Trigger button click
    document.getElementById("mastodonLoginClick").click();
  }
});

// Init variables for mastodon state, default to not authenticated
let mAuth = false;
let mToken;
let mInstance;

// Run initialization
initMastodon();

function initMastodon() {
  // Check if querystring has the auth key (comes from backend)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mLogin')) {
    if (urlParams.get('mLogin') === '1' && urlParams.get('mCode')) {
      // Logged in successfully
      mAuth = true;
      mToken = urlParams.get('mCode');
      mInstance = getCookie('mInstance');
      setCookie('mToken', mToken, 30);
      console.log('Mastodon Auth Token: ' + mToken);
    } else {
      mastodonCardVue.mastodoncontent = `
      Server Side authentication Error happened.
    `;
    }
  }
  // Check if auth key and instance is available as cookie -> probably logged in
  if (getCookie('mInstance') && getCookie('mToken')) {
    mAuth = true;
    mToken = getCookie('mToken');
    mInstance = getCookie('mInstance');
  }
  // Check Valid session by trying endpoint
  if (mAuth) {
    fetch('https://' + mInstance + '/api/v1/accounts/verify_credentials', {
      headers: {
        'Authorization': 'Bearer ' + mToken,
      },
    }).then((d) => {
      console.log(d);
      if (d.ok) {
        // Successfull: Display content
        mContent();
      } else {
        // Error: Do nothing, start with defaults
        mAuth = false;
        console.log(d);
        mastodonCardVue.mastodoncontent = `
      Error authenticating with Mastodon!
    `;
      }
    }).catch((e) => {
      console.log(e);
      mAuth = false;
    });
  }
  mastodonCardVue.mastodoncontent = `
`;
}

function mContent() {
  if (mAuth) {
    // Remove the authentication/instance form
    document.getElementById('mLoginInstance').style.display = 'none';
    // Get the timeline
    fetch('https://' + mInstance + '/api/v1/timelines/home', {
      headers: {
        'Authorization': 'Bearer ' + mToken,
      },
    }).then((d) => {
      return d.json();
    }).then((d) => {
      for (let s in d) {
        // Build HTML for each post
        mastodonCardVue.mastodoncontent += mRenderStatus(d[s]);
      }
    });

  }
}

function mRenderStatus(s) {
  let htmlStatus = '<div class=\'mStatus\' id=\'' + s.id + '\'>';
  // Post header: author, image and date
  htmlStatus += '<p class=\'mStatusPrefix\'><span class=\'mAuthorImgBox\'><a href=\'' + s.account.url + '\'\' target=\'_blank\' class=\'mAuthorImgLink\'><img src=\'' + s.account.avatar + '\' class=\'mAuthorImg\'></a></span>';
  htmlStatus += '<span class=\'mAuthor\'><a href=\'' + s.account.url + '\'\' target=\'_blank\' class=\'mAuthorLink\'>' + s.account.display_name + '</a><br>';
  htmlStatus += '<a class=\'mAuthorUser mAuthorLink\' href=\'' + s.account.url + '\'\' target=\'_blank\'>@' + s.account.username + '</a></span>';
  htmlStatus += '<span class=\'mCreated\'>' + formatDate(new Date(s.created_at)) + '</span></p>';
  // Post content
  htmlStatus += '<p class=\'mContent\'>' + s.content + '</p>';
  // Image
  if (s.media_attachments[0] && s.media_attachments[0].type === 'image') {
    htmlStatus += '<a href=\'' + s.media_attachments[0].text_url + '\' target=\'_blank\'><img src=\'' + s.media_attachments[0].preview_url + '\' class=\'mImg\'></a>';
  }
  // Link
  htmlStatus += '<hr><a class=\'mLink\' target=\'_blank\' href=\'' + s.url + '\'>View on Mastodon</a></div>';
  return htmlStatus;
}
// Helper methods
// builds date for display
function formatDate(date) {
  var day = '0' + date.getDate();
  var month = '0' + date.getMonth();
  var hour = '0' + date.getHours();
  var minute = '0' + date.getMinutes();

  return day.slice(-2) + '.' + month.slice(-2) + ' ' + hour.slice(-2) + ':' + minute.slice(-2);
}

// Does redirection to authentication page
function doMastodonAuth(mInstance) {
  if (mInstance.length < 5) {
    mastodonCardVue.mastodoncontent = `
      Invalid Instance.
    `;
    return;
  }
  // get client_id from backend
  fetch('/mastodon/' + mInstance + '/oauth', {
    method: 'GET',
  }).then((res) => res.json()).then((json) => {
    if (!json.client_id) {
      throw 'No client_id';
    }
    if (!json.success) {
      throw 'Server Side Problem';
    }
    setCookie('mInstance', mInstance, 30);
    // redirect
    window.location.replace('https://' + mInstance + '/oauth/authorize?scope=read&response_type=code&redirect_uri=https://dashboard.tinf17.in&client_id=' + json.client_id);
  }).catch((e) => {
    mastodonCardVue.mastodoncontent = `
      Login failed.
    `;

  });
}
// Cookie helper functions
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
