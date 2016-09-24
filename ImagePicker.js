app.LoadPlugin( "GalleryPick" );

function createImagePicker () {
    picker = app.CreateGalleryPick();
    picker.SetOnPick(picker_OnPick);
    picker.SetOnCancel(picker_OnCancel);
    picker.SetOnError(picker_OnError);
};

function pickImage () {
    picker.Pick({images: true, video: false});
};

function picker_OnPick ( filename, uri ) {
    picker.btn.path = filename;
    //alert("Picked filename: " + filename);
    //alert("Picked uri: " + uri);
};

function picker_OnCancel () {
    //alert("Pick aborted by user");
};

function picker_OnError ( msg ) {
    alert("Error: " + msg);
};
