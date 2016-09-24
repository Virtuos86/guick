/*
    All net I/O stuff is here.
*/


var LOGGED_IN = false;
var UPLOAD = false;

const AUTH_URL = 'https://juick.com/login';
const LAST_MSG_URL = 'https://api.juick.com/messages';
const NEXT_MSG_URL = 'http://api.juick.com/messages?before_mid=';
const ADD_NEW_POST_URL = 'https://juick.com/post';
const SEARCH_MSG_URL = 'http://api.juick.com/messages?search=';
// Просмотр сообщения с комментариями:
const VIEW_THREAD_URL = 'http://api.juick.com/thread?mid=';

// A global net object.
var XHR = new XMLHttpRequest();

/*
XHR.upload.onprogress = function ( event ) {
  if( event.loaded == event.total ) {
  		UPLOAD = false;
    app.HideProgressBar();
  } else {
    var perc = Math.round( event.loaded * 100 / event.total );
    if( !UPLOAD ) {
    		UPLOAD = true;
    		app.ShowProgressBar( 'Загрузка данных" );
    	};
    	app.UpdateProgressBar( perc );
  };
};
*/

XHR.upload.onload = function () {
  app.ShowPopup( 'Данные полностью загружены на сервер!' );
};

XHR.upload.onerror = function () {
  app.ShowPopup( 'Произошла ошибка при загрузке данных на сервер!' );
};

var PARAMS = {
    'username': null,
    'password': null
};

var NEW_POST_PARAMS = {
    "body": null,
    "tags": null
};

// Logging.
function log( string ) {
    app.WriteFile( "log.txt", string + "\n", "Append" );
};

////////////////////////////////////////////////////////////////////////////////

var BOUNDARY = String( Math.random() ).slice( 2 );
var BOUNDARY_MIDDLE = '------------------------------' + BOUNDARY + '\r\n';
var BOUNDARY_LAST = '------------------------------' + BOUNDARY + '--\r\n';

function constructLoginString() {
    var body = ['\r\n'];
    for( var key in PARAMS ) {
        body.push( 'Content-Disposition: form-data; name="' + key + '"\r\n\r\n' + PARAMS[key] + '\r\n' );
    };
    body = body.join( BOUNDARY_MIDDLE ) + BOUNDARY_LAST;log(body);
    return body;
};

function _constructNewPostRequestString() {
    var body = "";
    body += "block=save&file=&code=" + encodeURIComponent( NEW_POST_PARAMS.code ) +
            "title=" + encodeURIComponent( NEW_POST_PARAMS.title ) +
            "&text=" + encodeURIComponent( NEW_POST_PARAMS.text ) +
            "&photo=" + app.ReadFile( illBtn.path ) +
            "&text_topic=" + encodeURIComponent( NEW_POST_PARAMS.text_topic ) +
            "&dogovor=" + encodeURIComponent( NEW_POST_PARAMS.dogovor );
    XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    XHR.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    XHR.setRequestHeader( 'Content-type', 'text/plain; charset=utf-8' );
    return body;
};

function setSomeHeaders( httpRequest ) {
    httpRequest.setRequestHeader( 'Content-Type', 'multipart/form-data; boundary=' + BOUNDARY );
    httpRequest.setRequestHeader( 'X-Requested-With', 'XMLHttpRequest' );
    //httpRequest.setRequestHeader( 'Content-type', 'text/plain; charset=utf-8' );
};

////////////////////////////////////////////////////////////////////////////////
// API calls.
function API( cmd, arg ) {
    if( cmd == "all" ) {
        return getLastMsg();
    } else if( cmd == "allNext" ) {
        return getNextMsg( arg );
    } else if( cmd == "addPost" ) {
        return addNewPost();
    } else if( cmd == "search" ) {
        return search( arg );
    } else if( cmd == "getThread" ) {
        return getThread( arg );
    };
};

function auth() {
    PARAMS.username = settings.username;
    PARAMS.password = settings.password;
    var data = ( "Content-Type: application/x-www-form-urlencoded\r\n"
               + "Content-Length: " + ( "username=" + PARAMS.username + "&password=" + PARAMS.password ).length
               + "username=" + PARAMS.username + "&password=" + PARAMS.password
    );
    try {
        XHR.open( 'POST', AUTH_URL, false );
        XHR.send( data );
        resp = XHR.responseText;

        if( ~resp.indexOf( "<h1>HTTP Status 400 - </h1>" ) ) {
            LOGGED_IN = true;
            app.ShowPopup( "Авторизация завершена." );
            return true;
        } else {
            return false;
        };
    } catch ( err ) {
        alert( err );
    };
};

function getLastMsg () {
    XHR.open( 'GET', LAST_MSG_URL + "?username=" + PARAMS.username + "&password=" + PARAMS.password, false );
    XHR.send( null );
    resp = XHR.responseText;
    return resp;
};

function getNextMsg ( lastId ) {
    XHR.open( 'GET', NEXT_MSG_URL + lastId + "&username=" + PARAMS.username + "&password=" + PARAMS.password, false );
    XHR.send( null );
    resp = XHR.responseText;
    return resp;
};

function getThread ( id ) {
    XHR.open( 'GET', VIEW_THREAD_URL + id + "&username=" + PARAMS.username + "&password=" + PARAMS.password, false );
    XHR.send( null );
    resp = XHR.responseText;
    return resp;
};

function addNewPost () {
    NEW_POST_PARAMS.body = post.GetText();
    NEW_POST_PARAMS.tags = tags.GetText();
    XHR.open( 'POST', ADD_NEW_POST_URL, false );
    var timeout = setTimeout( stopReq, 30000 );
    var callback = info;
    XHR.onreadystatechange = function() { clearTimeout( timeout ); callback( XHR ); };
    app.ShowProgress( "Отправка" );
    var formData = new FormData();
    formData.append( "body", NEW_POST_PARAMS.body );
    formData.append( "tags", NEW_POST_PARAMS.tags );
    var filename = illBtn.path;
    if( filename !== null ) {
        formData.append(
            "attach",
            app.ReadFile( filename )//new Blob( [app.ReadFile( filename )], { "type": "image/jpeg,image/png" } )
        );
    };
    formData.append( "username", PARAMS.username );
    formData.append( "password", PARAMS.password );
    XHR.send( formData );
    app.HideProgress();
};

function info ( xhr ) {alert(xhr.responseText);
    if( xhr.readyState == 4 ) {
        if( xhr.status == 200 ) {
            var data = xhr.responseText;
            if( data.indexOf ( "<h1>Сообщение опубликовано</h1>" ) ) {
                closeNewPostScreen();
                openMainScreen();
                app.ShowPopup( "Сообщение опубликовано" );
                clearNewPostScreen();
            };
        };
    };
};


function search ( word ) {
    XHR.open( 'GET', SEARCH_MSG_URL + word + "&username=" + PARAMS.username + "&password=" + PARAMS.password, false );
    XHR.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
    XHR.send();
    resp = XHR.responseText;
    return resp;
};

function stopReq () {
    XHR.abort();
};
