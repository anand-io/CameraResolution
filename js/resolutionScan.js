/**
 * Main js file for WebRTC-Camera-Resolution finder
 * Created by chad on 7/19/2014.
 * Modified January 1, 2016
 */

'use strict';

//Global variables
var video = $('#video')[0];     //where we will put & test our video output
var stream = null;
var camDevices = [];
var currentScan = 0;
var currentDevice = 0;
var oneSuccess = false;

//find & list camera devices on load
$(document).ready(function(){

    console.log("adapter.js says this is " + webrtcDetectedBrowser + " " + webrtcDetectedVersion);

    if (!getUserMedia){
        alert('You need a browser that supports WebRTC');
        $("div").hide();
        return;
    }

    //check if the user is using http vs. https & redirect to https if needed
    if (document.location.protocol != "https:" && document.location.host.indexOf('localhost') === -1){
        $(document).html("This doesn't work well on http. Redirecting to https");
        console.log("redirecting to https");
        document.location.href = "https:" + document.location.href.substring(document.location.protocol.length);
    }


});


function gotDevices(deviceInfos) {
    $('#selectArea').show();
    var camcount = 1;   //used for labeling if the device label is not enumerated
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            camDevices.push(deviceInfo);
        }
    }
    if (camDevices.length > 0) {
      gum(camDevices[currentDevice]);
    }
}

function errorCallback(error) {
    console.log('navigator.getUserMedia error: ', error);
}


navigator.mediaDevices.getUserMedia({ audio:false, video: true }).then(function(stream){
     stream.getTracks().forEach(function (track) {
        track.stop();
    });
    navigator.mediaDevices.enumerateDevices()
    .then(gotDevices)
    .catch(errorCallback);
});



//calls getUserMedia for a given camera and constraints
function gum(device) {
    var candidate = quickScan[currentScan];
    // console.log("trying " + device.scans[device.scan] + " on " + device.label);

    //Kill any running streams;
    if (stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }

    //create constraints object
    var constraints = {
        audio: false,
        video: {
                deviceId: device.id ? {exact: device.id} : undefined,
                width: {exact: candidate.width},    //new syntax
                height: {exact: candidate.height}   //new syntax
        }
    };

    setTimeout(function() {
        navigator.mediaDevices.getUserMedia(constraints)
            .then(gotStream)
            .catch(function (error) {
                console.log('getUserMedia error!', error);

                // if (scanning) {
                    captureResults("fail: " + error.name);
                // }
            });
    }, (stream ? 200 : 0));  //official examples had this at 200


    function gotStream(mediaStream) {

        //change the video dimensions
        console.log("Display size for " + candidate.label + ": " + candidate.width + "x" + candidate.height);
        video.width = candidate.width;
        video.height = candidate.height;

        window.stream = mediaStream; // make globally available
        video.srcObject = mediaStream;

    }
}

function displayVideoDimensions() {
    if (!video.videoWidth) {
        setTimeout(displayVideoDimensions, 500);  //was 500
    }

    if (video.videoWidth * video.videoHeight > 0) {
        if(quickScan[currentScan].width + "x" + quickScan[currentScan].height != video.videoWidth + "x" + video.videoHeight){
            captureResults("fail: mismatch");
        }
        else{
            captureResults("pass");
        }
    }
}

video.onloadedmetadata = displayVideoDimensions;

// This is where we are showing the reuslt if it passes.
function captureResults(status){
    if(status === 'pass') {
        var res = `${camDevices[currentDevice].label || `Camera ${currentDevice + 1}`} - ${video.videoWidth}x${video.videoHeight}`;
        $('#ress').append(`<span class="result">${res}</span>`);
        oneSuccess = true;
    }

    if (status !== 'pass' && currentScan < quickScan.length - 1) {
      currentScan++;
      gum(camDevices[currentDevice]);
    } else if (currentDevice < camDevices.length - 1 ){
          currentScan = 0;
          gum(camDevices[++currentDevice]);
    } else if (stream) {
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
        if (!oneSuccess) {
          $('#ress').append(`<span class="result" style='color:red'>No result</span>`);
        }
    }
}

//Variables to use in the quick scan
const quickScan = [
    {
        "label": "4K(UHD)",
        "width" : 3840,
        "height": 2160,
        "ratio": "16:9"
    },
    {
        "label": "1080p(FHD)",
        "width": 1920,
        "height": 1080,
        "ratio": "16:9"
    },
    {
        "label": "UXGA",
        "width": 1600,
        "height": 1200,
        "ratio": "4:3"
    },
    {
        "label": "720p(HD)",
        "width": 1280,
        "height": 720,
        "ratio": "16:9"
    },
    {
        "label": "SVGA",
        "width": 800,
        "height": 600,
        "ratio": "4:3"
    },
    {
        "label": "VGA",
        "width": 640,
        "height": 480,
        "ratio": "4:3"
    },
    {
        "label": "360p(nHD)",
        "width": 640,
        "height": 360,
        "ratio": "16:9"
    },
    {
        "label": "CIF",
        "width": 352,
        "height": 288,
        "ratio": "4:3"
    },
    {
        "label": "QVGA",
        "width": 320,
        "height": 240,
        "ratio": "4:3"
    },
    {
        "label": "QCIF",
        "width": 176,
        "height": 144,
        "ratio": "4:3"
    },
    {
        "label": "QQVGA",
        "width": 160,
        "height": 120,
        "ratio": "4:3"
    }

];
