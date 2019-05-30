// import Vue from './vue.js';

const mastodonCardVue = new Vue({
  el: '#mastodonCard',
  data: {
    title: 'Your Mastodon-Feed',
    mastodoncontent: '',
  },
  created: function() {

  },
  methods: {
    mastodonLogin: function(event) {

      const mInstance = document.getElementById('mastodonInstance').value;
      console.log("Auth with " + mInstance);
      doMastodonAuth(mInstance);
    },
    say: function(message) {
      alert(message)
    }
  }
});
let mAuth = false;
let mToken;
let mInstance;
initMastodon();

function initMastodon() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mLogin')) {
    if (urlParams.get('mLogin') === '1' && urlParams.get('mCode')) {
      // Logged in successfully
      mAuth = true;
      mToken = urlParams.get('mCode');
      mInstance = getCookie('mInstance');
      setCookie('mToken', mToken, 30);
      console.log("Mastodon Auth Token: " + mToken);
      mContent();
    } else {
      mastodonCardVue.mastodoncontent = `
      Server Side authentication Error happened.
    `;
    }
  }

  // ToDo: Check Valid session

  // ToDo: Check if code is available
  mastodonCardVue.mastodoncontent = `
`;
if(mAuth) {
  document.getElementById('mLoginInstance').style.display = "none";
}
}

function mContent() {
  if (mAuth) {
    fetch('https://' + mInstance + '/api/v1/timelines/home', {
      headers: {
        "Authorization": "Bearer " + mToken
      }
    }).then((d) => {
      return d.json();
    }).then((d) => {
      console.log(d);
    });

  }
}

function doMastodonAuth(mInstance) {
  if (mInstance.length < 5) {
    mastodonCardVue.mastodoncontent = `
      Invalid Instance.
    `;
    return;
  }
  fetch('/mastodon/' + mInstance + '/oauth', {
    method: 'GET'
  }).then((res) => res.json()).then((json) => {
    if (!json.client_id) {
      throw "No client_id";
    }
    if (!json.success) {
      throw "Server Side Problem";
    }
    setCookie('mInstance', mInstance, 30);
    window.location.replace("https://" + mInstance + "/oauth/authorize?scope=read&response_type=code&redirect_uri=https://dashboard.tinf17.in&client_id=" + json.client_id);
  }).catch((e) => {
    mastodonCardVue.mastodoncontent = `
      Login failed.
    `;

  });
}

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
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
  return "";
}
