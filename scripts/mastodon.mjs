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
initMastodon();

function initMastodon() {
  // ToDo: Check Cookie

  // ToDo: Check Valid session

  // ToDo: Check if code is available
  mastodonCardVue.mastodoncontent = `
<div>
        <input type="text" id="mastodonInstance" placeholder="Your instance (e.g. mastodon.social)">
        <button type="button" id="mastodonLoginClick" v-on:click="mastodonLogin">Authenticate</button>
      </div>`;
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
    window.location.replace("https://" + mInstance + "/oauth/authorize?scope=read&response_type=code&redirect_uri=https://dashboard.tinf17.in&client_id=" + json.client_id);
  }).catch((e) => {
    mastodonCardVue.mastodoncontent = `
      Login failed.
    `;

  });
}
