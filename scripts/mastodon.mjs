/* eslint-disable guard-for-in */
// Everything related to the mastodon-instance
// Init Vue-Object for data binding
const mastodonCardVue = new Vue({
  el: '#mastodonCard',
  data: {
    title: 'Your Mastodon-Feed',
    mastodoncontent: '',
  },
});

/**
 * Adds a trailing zero if number only has one digit.
 * @param {number} num the number to convert
 * @return {string} number with trailing zero if only has one digit
 */
const toTwoDigitNumber = (num) => num < 10 && num >= 0 ?
  '0' + num.toFixed(0) :
  num.toFixed(0);

// Register event listeners for auth-button and enter
document.querySelector('#mastodonLoginClick').onclick = () => {
  const mInstance = document.getElementById('mastodonInstance').value;
  console.log('Auth with ' + mInstance);
  doMastodonAuth(mInstance);
};

document.querySelector('#mastodonInstance').addEventListener('keyup',
    function(event) {
      // 13 = enter
      if (event.keyCode === 13) {
        event.preventDefault();
        // Trigger button click
        document.getElementById('mastodonLoginClick').click();
      }
    });

// Init variables for mastodon state, default to not authenticated
let mAuth = false;
let mToken;
let mInstance;

// Run initialization
initMastodon();

/**
 * Initialize Mastodon
 */
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

/**
 * Get Mastodon content
 */
function mContent() {
  if (mAuth) {
    // Remove the authentication/instance form
    document.getElementById('mLoginInstance').style.display = 'none';
    // Get the timeline
    fetch('https://' + mInstance + '/api/v1/timelines/home', {
      headers: {
        'Authorization': 'Bearer ' + mToken,
      },
    }).then((d) => d.json())
        .then((d) => {
          for (const s in d) {
            // Build HTML for each post
            mastodonCardVue.mastodoncontent += mRenderStatus(d[s]);
          }
        });
  }
}

/**
 * Render status
 * @param {object} s Status object
 * @return {string} Rendered HTML
 */
function mRenderStatus(s) {
  let htmlStatus = '<div class=\'mStatus\' id=\'' + s.id + '\'>';
  // Post header: author, image and date
  htmlStatus += `<p class="mStatusPrefix">
  <span class="mAuthorImgBox">
    <a href="${s.account.url}" target="_blank" class="mAuthorImgLink">
      <img src="${s.account.avatar}" class="mAuthorImg">
    </a>
  </span>
  <span class="mAuthor">
    <a href="${s.account.url}" target="_blank" 
    class="mAuthorLink">${s.account.display_name}</a>
    <br>
    <a class="mAuthorUser mAuthorLink" href="${s.account.url}" 
    target="_blank">@${s.account.username}</a>
  </span>
  <span class="mCreated">${formatDate(new Date(s.created_at))}</span></p>`;
  // Post content
  htmlStatus += '<p class="mContent">' + s.content + '</p>';
  // Image
  if (s.media_attachments[0] && s.media_attachments[0].type === 'image') {
    htmlStatus += '<a href=\'' + s.media_attachments[0].text_url +
      '\' target=\'_blank\'><img src=\'' + s.media_attachments[0].preview_url +
      '\' class=\'mImg\'></a>';
  }
  // Link
  htmlStatus += '<hr><a class=\'mLink\' target=\'_blank\' href=\'' + s.url +
    '\'>View on Mastodon</a></div>';
  return htmlStatus;
}

/**
 * builds date for display
 * @param {Date} date the date to format
 * @return {string} formatted date
 */
const formatDate = (date) => toTwoDigitNumber(date.getDate())
  + '.' + toTwoDigitNumber(date.getMonth() + 1)
  + ' ' + toTwoDigitNumber(date.getHours())
  + ':' + toTwoDigitNumber(date.getMinutes());

/**
 * Does redirection to authentication page
 * @param {string} mInstance The Mastodon instance
 */
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
  })
      .then((res) => res.json())
      .then((json) => {
        if (!json.client_id) {
          throw new Error('No client_id');
        }
        if (!json.success) {
          throw new Error('Server Side Problem');
        }
        setCookie('mInstance', mInstance, 30);
        // redirect
        window.location.replace('https://' + mInstance +
      '/oauth/authorize?scope=read&response_type=code&' +
      'redirect_uri=https://dashboard.tinf17.in&client_id=' + json.client_id);
      })
      .catch(() => {
        mastodonCardVue.mastodoncontent = `
      Login failed.
    `;
      });
}

/**
 * Sets a cookie
 * @param {string} cname Cookie name
 * @param {string} cvalue Cookie value
 * @param {number} exdays Expiration
 */
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  const expires = 'expires=' + d.toUTCString();
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}

/**
 * Gets a cookie
 * @param {string} cname Cookie name
 * @return {string} Cookie value
 */
function getCookie(cname) {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
