var loading = false;

app.LoadPlugin( "UIExtras" );

app.LoadScript( "IO.js" );
app.LoadScript( "Net.js" );
app.LoadScript( "ImagePicker.js" );


var history = ["exit"];

function calcHeightLay ( testString ) {
    var layLbl = app.CreateLayout( "Absolute" );
    var lbl = app.CreateText( "", 1, null, "Multiline,Left" );
    lbl.SetHtml( testString );
    lbl.SetTextSize( 20, "sp" );
    layLbl.AddChild( lbl );
    layLbl.SetVisibility( "Hide" );
    app.AddLayout( layLbl );
    app.Wait( 0.05 );
    var height = lbl.GetHeight();
    app.RemoveLayout( layLbl );
    app.DestroyLayout( layLbl );
    return height;
};

function OnStart () {
    settings = loadSettings();

    uix = app.CreateUIExtras();
    mainLayFab = app.CreateLayout( "Linear", "FillXY, Bottom, Right, TouchThrough" );
    fab = uix.CreateFAButton( settings.ui.postBtn.text );
    fab.SetMargins( 0.02, 0.01, 0.02, 0.01 );
    fab.SetIconColor( settings.ui.postBtn.fg );
    fab.SetButtonColors( settings.ui.postBtn.bgNormal, settings.ui.postBtn.bgPressed );
    fab.SetOnTouch( addPost );
    mainLayFab.AddChild( fab );
    threadLayFab = app.CreateLayout( "Linear", "FillXY, Bottom, Right, TouchThrough" );
    threadFab = uix.CreateFAButton( settings.ui.commBtn.text );
    threadFab.SetMargins( 0.02, 0.01, 0.02, 0.01 );
    threadFab.SetIconColor( settings.ui.commBtn.fg );
    threadFab.SetButtonColors( settings.ui.commBtn.bgNormal, settings.ui.commBtn.bgPressed );
    threadFab.SetOnTouch( addComment );
    threadLayFab.AddChild( threadFab );
    createMsgListBtns();

    app.SetOrientation( "Portrait" );
    app.EnableBackKey( false );
    var theme = app.CreateTheme( settings.ui.theme[0] );
    app.SetTheme( theme );
    notify = app.CreateNotification( "AutoCancel" );
    fileReader = new FileReader();
    fileReader.readAsBinaryString("Images/Guick.png");
    createImagePicker();
	mainLay = app.CreateLayout( "linear", "VCenter,FillXY,Top" );	

	username = app.CreateTextEdit( "" || settings.username );
	username.SetHint( "Username" );
    username.SetTextSize( 32 );
    username.SetMargins( 0, 0, 0, 0.05 );
    username.SetOnEnter( validation );
	mainLay.AddChild( username );

	password = app.CreateTextEdit( "" || settings.password, -1, -1, "Nospell,Password" );
	password.SetHint( "Password" );
    password.SetTextSize( 32 );
    password.SetMargins( 0, 0, 0, 0.05 );
    password.SetOnEnter( validation );
	mainLay.AddChild( password );

    authBtn = app.CreateButton( "Войти", 0.3, 0.1, "Gray" );
    authBtn.SetTextSize( 32 );
    authBtn.SetOnTouch( validation );
    mainLay.AddChild( authBtn );
    if( !validation() )
        app.AddLayout( mainLay );
};

function validation () {
    if( !username.GetText() || !password.GetText() || !password.GetText().length > 15 )
        return false;
    if( !( settings.username == username.GetText() ) && !( settings.password == password.GetText() ) ) {
        settings.username = username.GetText();
        settings.password = password.GetText();
        storeSettings();
    };
    app.ShowProgress( "Авторизация..." );
    var start = auth();
    app.HideProgress();
    if( start ) {
        createMainScreen();
        openMainScreen();
    };
    return true;
};

function createMainScreen () {
    mainLay = app.CreateLayout( "Linear", "VCenter,FillXY" );
    
    //CreatePanelLayout();
    mainLay = app.CreateLayout( "Linear", "VCenter,FillXY" );
    actionBar = app.CreateLayout("Linear", "Horizontal,FillXY,VLeft");
    actionBar.SetBackColor( settings.ui.mainScreen.title.bg );
    actionBar.SetSize( 1, 0.1 );
    mainLay.AddChild( actionBar );
    menuBtn = app.CreateButton( "[fa-bars]", 0.05, -1, "FontAwesome" );
    //menuBtn.SetOnTouch( panel.Slide );
    actionBar.AddChild( menuBtn );
    title = app.CreateText( "Juick                                ", 0.95, -1 );
    title.SetFontFile( "Res/FreeSerifItalic.ttf" );
    title.SetTextSize( "5", "mm" );
    title.SetTextColor( settings.ui.mainScreen.title.fg );
    actionBar.AddChild( title );
    var data = ( "Всё: 0:null," +
                 "Фотографии: 0:null,Моя лента: 0:null,Приватные: 0:null," +
                 "Обсуждения: 0:null,Рекомендации: 0:null"
    );
    lst = app.CreateList( data, 1, 0.9, "BlackGrad" );
    lst.SetBackground( settings.ui.mainScreen.wallpaper );
    lst.SetFontFile( "Misc/FreeSans.ttf" );
    lst.SetTextSize1( "5", "mm" );
    lst.SetTextSize2( "3", "mm" );
    lst.SetTextColor1( "#ffffdd00");
    lst.SetTextColor2( "#ffaa0000" );
    lst.SetTextMargins( 0.04, 0, 0, 0 ); 
    lst.SetOnTouch( lst_OnTouch );
    mainLay.AddChild( lst );

    //app.AddLayout( panel );
    //API( "list" );
};

function openMainScreen () {
    if( !~history.indexOf( "main" ) )
        history.push( "main" );
    app.AddLayout( mainLay );
    app.AddLayout( mainLayFab );
};

function closeMainScreen () {
    app.RemoveLayout( mainLay );
    app.RemoveLayout( mainLayFab );
};

function createNewPostScreen () {
    newPostScreenLay = app.CreateLayout( "Linear", "FillXY" );
    scroll = app.CreateScroller( 1.0, 1.0 );
    newPostScreenLay.AddChild( scroll );
    layScroll = app.CreateLayout( "Linear", "Left" );
    scroll.AddChild( layScroll );
    layScroll.SetBackColor( "#555555" );
    
    post = app.CreateTextEdit( "Тест", 1, 0.93 );
    post.SetHint( "Текст" );
    post.SetBackColor( "#ffffeeff" );
    post.SetCursorColor( "#ffff00ff" );
    post.SetTextColor( "#ff000000" );
    layScroll.AddChild( post );
    
    
    tags = app.CreateTextEdit( "", 1, 0.07 );
    tags.SetHint( "Теги (разделять запятой)" );
    tags.SetBackColor( "#ffdddddd" );
    tags.SetCursorColor( "#ffff00ff" );
    tags.SetTextColor( "#ff000000" );
    layScroll.AddChild( tags );
    
    illBtn = app.CreateButton( "+ пикча", 0.96, -1, "VLeft,Gray" );
    illBtn.SetTextSize( 22 );
    illBtn.SetMargins( 0.02, 0.02, 0.02, 0.02 );
    illBtn.SetOnTouch( addIllustration );
    illBtn.path = null;
    picker.btn = illBtn;
	layScroll.AddChild( illBtn );

    var btn = app.CreateButton( "Отправить", 0.96, -1, "VLeft,Gray" );
    btn.SetTextSize( 22 );
    btn.SetMargins( 0.02, 0, 0.02, 0.02 )
    btn.SetOnTouch( sendPost );
    layScroll.AddChild( btn );
};

function clearNewPostScreen () {
    scroll.ScrollTo( 0, 0 );
    post.SetText( "" );
    tags.SetText( "" );
    illBtn.path = null;
};

function openNewPostScreen () {
    if( !~history.indexOf( "newpost" ) )
        history.push( "newpost" );
    app.AddLayout( newPostScreenLay );
};

function closeNewPostScreen () {
    app.RemoveLayout( newPostScreenLay );
};

function createMsgListBtns () {
    pullLay = app.CreateLayout( "Linear" );
    pullBody = app.CreateText( "", 1, 0 );
    //pullBody.SetOnTouch( msg_OnTouchMove );
    //pullBody.SetOnTouchMove( msg_OnTouchMove );
    pullLay.AddChild( pullBody );
    pullLay.SetBackColor( "#555555" );
    btnRefresh = app.CreateButton( "[fa-refresh]", 1, -1, "Custom,FontAwesome" )
    btnRefresh.SetStyle( "#4285F4", "#4285F4", 5 );
    btnRefresh.SetOnTouch( refreshMsg );
    btnNext = app.CreateButton( "предыдущие [fa-level-down]", 1, -1, "Custom,FontAwesome" )
    btnNext.SetStyle( "#4285F4", "#4285F4", 5 );
    btnNext.SetOnTouch( loadNextMsg );
};

function createMsgListScreen () {
    msgListScreenLay = app.CreateLayout( "Linear", "Vertical,FillXY,Left" );
    msgScroll = app.CreateScroller( 1.0, 1.0 );
    msgListScreenLay.AddChild( msgScroll );
    layMsgScroll = app.CreateLayout( "Linear", "Left" );
    msgScroll.AddChild( layMsgScroll );
    layMsgScroll.SetSize( 1, -1 );
    layMsgScroll.AddChild( pullLay );
    layMsgScroll.AddChild( btnRefresh );
    layMsgScroll.AddChild( btnNext );
    //setInterval( checkScrollPos, 1000 );
};

var intervalId = null;
function msg_OnTouchMove ( env ) {
    if( intervalId !== null )
        clearInterval( intervalId );
    app.ShowPopup( env.Y );
    pullLay.SetSize( 1, Math.min( Math.max( 0.1, +env.Y ), 0.3 ) );
    intervalId = setInterval( "pullLay.SetSize( 1, 0.1 )", 3000 );
};

function checkScrollPos () {
    var y = msgScroll.GetScrollY().toFixed( 1 );app.ShowPopup(y);return;
    if( y == 1 ) {
        if( loading === true )
            return;
        loading = true;
        loadMsg( API( "allNext", layMsgScroll.lastId ) );
        loading = false;
    };
};

function loadNextMsg () {
    loadMsg( API( "allNext", layMsgScroll.lastId ) );
};

function openMsgListScreen () {
    if( !~history.indexOf( "msglist" ) )
        history.push( "msglist" );
    app.AddLayout( msgListScreenLay );
    app.AddLayout( mainLayFab );
};

function closeMsgListScreen () {
    app.RemoveLayout( msgListScreenLay );
    app.RemoveLayout( mainLayFab );
};


function loadMsg ( json ) {
    layMsgScroll.RemoveChild( btnNext );
    app.Wait( 0.05 );
    var data = JSON.parse( json );//alert(json);
    for( var i in data ) {
        var paddingX = 0.02;
        var paddingY = 0.015;
        var item = app.CreateLayout( "Linear", "FillXY,Left" );
        item.SetSize( 1, -1 );
        item.SetBackColor( "#ffffff" );
        item.SetMargins( 0.0, 0.005, 0.0, 0.005 );
        
        var title = app.CreateText( "@" + data[i].user.uname + " in " + data[i].timestamp, 1, null,
                                    "Left"
        );
        item.AddChild( title );
        title.SetPadding( paddingX, 0, paddingX, 0 );
        title.SetFontFile( "Misc/Ubuntu-L.ttf" );
        title.SetTextSize( 22, "vh" ),
        title.SetBackColor( "#4400ff" );
        title.SetTextColor( "#ffffff" );
        var html = ( ( typeof data[i].tags !== "undefined" ? ( "<i>*" + data[i].tags.join( " *" ) + "</i>" + "<br>" ) : "" )
                   + "<b>" + data[i].body.replace( /\n/g, "<br>" ) + "</b>"
        );
        html = html.replace( /(<br>>\w+<br>)/g, "<i>$1</i>" );
        var body = app.CreateText( "", null, calcHeightLay( html ) + paddingY * 2, "Multiline,Left" );
        body.SetHtml( html );
        body.SetPadding( paddingX, paddingY, paddingX, paddingY );
        body.mid = data[i].mid;
        body.SetFontFile( "Misc/Ubuntu-L.ttf" );
        body.SetTextSize( 20, "sp" );
        body.SetBackColor( "#ffffff" );
        body.SetTextColor( settings.ui.colours[Math.ceil( Math.random() * ( settings.ui.colours.length - 1 ) )] );
        body.SetOnTouchUp( msg_OnTouch );
        item.AddChild( body );

        if( typeof data[i].photo !== "undefined" ) {
            //var photoName = data[i].photo.small.split( "/" ).pop();
            //XHR.open("GET", data[i].photo.small, false);
            //XHR.send( null );
            //app.WriteFile("Temp/" + photoName, XHR.responseText);
            var photoScroll = app.CreateScroller( 1, 0.5 );
            item.AddChild( photoScroll );
            var photo = app.CreateImage( "Img/Tmpl.png" );//( "Temp/" + photoName );
            photoScroll.AddChild( photo );
            photoScroll.ScrollTo( 0, 0.5 );
            photo.Url = data[i].photo.medium;
            photo.SetOnTouchUp( threadPhoto_onTouch );
        };

        layMsgScroll.AddChild( item );
        layMsgScroll.lastId = data[i].mid;
    };
    layMsgScroll.AddChild( btnNext );
};

function threadPhoto_onTouch () {
    app.OpenUrl( this.Url );
};

function msg_OnTouch () {
    createThreadScreen();
    app.Vibrate( "0,100,50,150" );
    app.ShowProgress( "Загружаем тред..." );
    setTimeout( "app.HideProgress()", 30000 );
    loadThread( API( "getThread", this.mid ) );
    app.HideProgress();
    closeMainScreen();
    openThreadScreen();
};

function lst_OnTouch ( title, body, type, index ) {
    if( title == "Всё" ) {
	    if( typeof msgListScreenLay == "undefined" ) {
            createMsgListScreen();
            app.Vibrate( "0,100" );
            app.ShowProgress( "Загружаем ленту..." );
            setTimeout( "app.HideProgress()", 30000 );
            loadMsg( API( "all" ) );
            app.HideProgress();
	    } else {
            app.Vibrate( "0,100" );
	    };
        closeMainScreen();
        openMsgListScreen();
	};
};

function refreshMsg () {
    closeMsgListScreen();
    app.DestroyLayout( msgListScreenLay );
    createMsgListBtns();
    createMsgListScreen();
    app.Vibrate( "0,100" );
    app.ShowProgress( "Загружаем ленту..." );
    setTimeout( "app.HideProgress()", 30000 );
    loadMsg( API( "all" ) );
    app.HideProgress();
    openMsgListScreen();
};

function createThreadScreen () {
    threadScreenLay = app.CreateLayout( "Linear", "Vertical,FillXY,Left" );
    threadScreenLay.SetBackColor( "#000000" );
    threadScroll = app.CreateScroller( 1.0, 1.0 );
    threadScreenLay.AddChild( threadScroll );
    layThreadScroll = app.CreateLayout( "Linear", "Left" );
    threadScroll.AddChild( layThreadScroll );
    layThreadScroll.SetSize( 1, -1 );
};

function openThreadScreen () {
    if( !~history.indexOf( "thread" ) )
        history.push( "thread" );
    app.AddLayout( threadScreenLay );
    app.AddLayout( threadLayFab );
};

function closeThreadScreen () {
    app.RemoveLayout( threadScreenLay );
    app.RemoveLayout( threadLayFab );
};

function loadThread ( json ) {
    if( typeof threadScreenLay !== "undefined" ) {
        app.DestroyLayout( threadScreenLay );
        createThreadScreen();
    };
    var data = JSON.parse( json );
    for( var i in data ) {
        var paddingX = 0.02;
        var paddingY = 0.015;
        var item = app.CreateLayout( "Linear", "FillXY,Left" );
        item.SetSize( 1, -1 );
        item.SetBackColor( "#ffffff" );
        item.SetMargins( 0.0, 0.005, 0.0, 0.005 );
        
        var title = app.CreateText( "@" + data[i].user.uname + " in " + data[i].timestamp, 1, null,
                                    "Left"
        );
        item.AddChild( title );
        title.SetPadding( paddingX, 0, paddingX, 0 );
        title.SetFontFile( "Misc/Ubuntu-L.ttf" );
        title.SetTextSize( 22, "vh" ),
        title.SetBackColor( "#4400ff" );
        title.SetTextColor( "#ffffff" );
        var html = ( ( typeof data[i].tags !== "undefined" ? ( "<i>*" + data[i].tags.join( " *" ) + "</i>" + "<br>" ) : "" )
                   + "<b>" + data[i].body.replace( /\n/g, "<br>" ) + "</b>"
        );
        html = html.replace( /(<br>>\w+<br>)/g, "<i>$1</i>" );
        var body = app.CreateText( "", null, calcHeightLay( html ) + paddingY * 2, "Multiline,Left" );
        body.SetHtml( html );
        body.SetPadding( paddingX, paddingY, paddingX, paddingY );
        body.mid = data[i].mid;
        body.SetFontFile( "Misc/Ubuntu-L.ttf" );
        body.SetTextSize( 20, "sp" );
        body.SetBackColor( "#ffffff" );
        body.SetTextColor( settings.ui.colours[Math.ceil( Math.random() * ( settings.ui.colours.length - 1 ) )] );
        //body.SetOnTouchUp( msg_OnTouch );
        item.AddChild( body );

        if( typeof data[i].photo !== "undefined" ) {
            //var photoName = data[i].photo.small.split( "/" ).pop();
            //XHR.open("GET", data[i].photo.small, false);
            //XHR.send( null );
            //app.WriteFile("Temp/" + photoName, XHR.responseText);
            var photoScroll = app.CreateScroller( 1, 0.5 );
            item.AddChild( photoScroll );
            var photo = app.CreateImage( "Img/Tmpl.png" );//( "Temp/" + photoName );
            photoScroll.AddChild( photo );
            photoScroll.ScrollTo( 0, 0.5 );
            photo.Url = data[i].photo.medium;
            photo.SetOnTouchUp( threadPhoto_onTouch );
        };

        layThreadScroll.AddChild( item );
        if( i == 0 ) {
            var sep = app.CreateText( "", 1, 0.05 );
        };
        layThreadScroll.AddChild( sep );
    };
};

////////////////////////////////////////////////////////////////////////////////

function addPost () {
    if( typeof newPostScreenLay == "undefined" )
        createNewPostScreen();
    closeMainScreen();
    openNewPostScreen();
};

function addIllustration () {
    pickImage();
};

function sendPost () {
    API( "addPost" );
};

function addComment () {
    
};

function CreatePanelLayout () {
    panel = app.CreatePanel( "Left" );
    mainLayPanel = panel.GetLayout();
    
    //Add a list box to panel.
    var listItems = "Home:[fa-home],Temp:[fa-line-chart],Settings:[fa-cog]";
    lstMenu = app.CreateList( listItems, 0.45, 1 );
    lstMenu.SetTextSize( 28 );
    lstMenu.SetBackColor( "#dd000000" );
    lstMenu.SetTextColor2( "#bbbbbb" );
    lstMenu.SetPadding( 0.01, 0.01, 0, 0 );
    lstMenu.SetOnTouch( lstMenu_OnTouch );
    mainLayPanel.AddChild( lstMenu );
};

////////////////////////////////////////////////////////////////////////////////

function OnMenu ( name ) {        		
	app.ShowPopup( "OnMenu( " + name + " )" );
};

function OnBack () {
    var current = history.pop();
    var previous = history[history.length - 1];
	if( current == "main" ) {
	    app.Exit();
	} else if( current == "newpost" ) {
    	closeNewPostScreen();
	    if( previous == "msglist" ) {
	        openMsgListScreen();
	    } else if( previous == "main" ) {
    	    openMainScreen();
	    };
	} else if( current == "msglist" ) {
	    closeMsgListScreen();
	    openMainScreen();
	} else if( current == "thread" ) {
	    closeThreadScreen();
	    openMsgListScreen();
	};
};

function OnPause () {
	app.ShowPopup( "OnPause" );
};

function OnResume () {
	app.ShowPopup( "OnResume" );
};

function OnConfig () {         
	app.ShowPopup( "OnConfig" );
};
