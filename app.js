//this is not related to Auth0. It's just here to make the page work correctly.
Prism.plugins.NormalizeWhitespace.setDefaults({
  'remove-trailing': true,
  'remove-indent': true,
  'left-trim': true,
  'right-trim': true
});
var logs = [];
if (window.localStorage.auth0logs) {
  logs = JSON.parse(window.localStorage.auth0logs);
}
function printLogs() {
  window.localStorage.auth0logs = JSON.stringify(logs);
  var code = '';
  logs.forEach(function(l) {
    code += '\r\n' + JSON.stringify(l, null, 1);
  });
  var html = Prism.highlight(code, Prism.languages.javascript);
  $('#logger').html(html);
}
function clearLogs() {
  logs = [];
  window.localStorage.removeItem('auth0logs');
  printLogs();
}
function subscribeToEvents(instance) {
  var validEvents = [
    'show',
    'hide',
    'unrecoverable_error',
    'authenticated',
    'authorization_error',
    'hash_parsed',
    'signin ready',
    'signup ready',
    'forgot_password ready',
    'socialOrPhoneNumber ready',
    'socialOrEmail ready',
    'vcode ready',
    'forgot_password submit',
    'signin submit',
    'signup submit',
    'socialOrPhoneNumber submit',
    'socialOrEmail submit',
    'vcode submit',
    'federated login'
  ];
  validEvents.forEach(function(e) {
    instance.on(e, function() {
      var args = arguments;
      if (arguments.length === 1) {
        args = arguments[0];
      }
      logs.push({ event: e, arguments: args });
      printLogs();
    });
  });
}

var clientId = '6qgR882b0vAiuTwsI6NZC9zynrUVF0mQ';
var domain = 'auth.brucke.club';
var defaultOptions = {
  configurationBaseUrl: 'https://cdn.auth0.com/',
  allowShowPassword: true,
  prefill: {
    email: 'johnfoo@gmail.com'
  }
};
var auth0 = new auth0.WebAuth({
  domain: domain,
  redirectUri: 'https://brucke.club/',
  clientID: clientId,
  responseType: 'token'
});
var auth0WithoutCustomDomains = new auth0.WebAuth({
  domain: 'brucke.auth0.com',
  redirectUri: 'https://brucke.club/',
  clientID: clientId,
  responseType: 'token'
});
function initLock() {
  var lock = new Auth0Lock(clientId, domain, defaultOptions);
  window.localStorage.lastUsed = 'lock';
  subscribeToEvents(lock);
  return lock;
}
function initPasswordless() {
  var lockPasswordless = new Auth0LockPasswordless(clientId, domain, defaultOptions);
  window.localStorage.lastUsed = 'passwordless';
  subscribeToEvents(lockPasswordless);
  return lockPasswordless;
}
$(function() {
  printLogs();
  $('#btn-clear-log').on('click', clearLogs);
  $('#btn-show-lock').on('click', function() {
    clearLogs();
    var lock = initLock();
    lock.show({
      languageDictionary: {
        title: 'Lock'
      }
    });
  });
  $('#btn-show-passwordless').on('click', function() {
    clearLogs();
    var lockPasswordless = initPasswordless();
    lockPasswordless.show({
      languageDictionary: {
        title: 'Passwordless'
      }
    });
  });
  $('#btn-ulp').on('click', function() {
    clearLogs();
    window.localStorage.lastUsed = 'a0js';
    auth0.authorize();
  });
  $('#btn-ulp-no-cname').on('click', function() {
    clearLogs();
    window.localStorage.lastUsed = 'a0js';
    auth0WithoutCustomDomains.authorize();
  });

  $('#a0js-form').on('submit', function(e) {
    e.preventDefault();
    window.external.AutoCompleteSaveForm;
    clearLogs();
    window.localStorage.lastUsed = 'a0js';
    auth0.login({
      username: $('#email').val(),
      password: $('#password').val(),
      realm: 'acme'
    });
  });
  //make sure we initialize Lock so we can parse the hash
  var lastUsed = window.localStorage.lastUsed;
  if (!lastUsed) {
    return;
  }
  switch (lastUsed) {
    case 'lock':
      initLock();
      break;
    case 'passwordless':
      initPasswordless();
      break;
    case 'a0js':
      auth0.parseHash(function(err, authResult) {
        logs.push({ event: 'a0js_parse_hash', arguments: [err, authResult] });
        printLogs();
        window.location.hash = '';
      });
      break;
    default:
      break;
  }
  window.localStorage.removeItem('lastUsed');
});
