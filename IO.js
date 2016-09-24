/*
    All file I/O is here.
*/

if( !app.FolderExists( "Temp" ) )
    app.MakeFolder( "Temp" );

const DWNLDR = app.CreateDownloader();
const CRYPT = app.CreateCrypt();
var SETTINGS_PATH;
if( app.GetAppPath() == "/Assets" ) {
    SETTINGS_PATH = "/data/data/ru.stihi.zelazny/shared_prefs/Settings.json"
    DEFAULT_SETTINGS_PATH = "/data/data/ru.stihi.zelazny/shared_prefs/Settings.json"
} else {
    SETTINGS_PATH = "Settings.json";
    DEFAULT_SETTINGS_PATH = "Settings.json";
};

function log ( string ) {
    app.WriteFile( "log.txt", string + "\n", "Append" );
};

function loadSettings () {
	if( !app.FileExists( SETTINGS_PATH ) ) {
		 app.WriteFile(
            SETTINGS_PATH,
            app.ReadFile( DEFAULT_SETTINGS_PATH )
        );
	};
    var settings = JSON.parse( app.ReadFile( SETTINGS_PATH ) );
    if( settings.password != '' )
        settings.password = CRYPT.Decrypt(  settings.password, settings.login );
    return settings;
};

function storeSettings () {
    var s = JSON.parse( JSON.stringify( settings ) );
    if( s.password != '' )
        s.password = CRYPT.Encrypt( s.password, s.login ); 
    app.WriteFile( SETTINGS_PATH, JSON.stringify( s, null, 4 ) );
};
