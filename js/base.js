/*jslint browser: true, vars: true, passfail: true*/
/*global $, jQuery*/

var cats = {
    "M1": 'Mouth',
    "M2": 'Mouth',
    "M3": 'Mouth',
    "E1": 'Eye',
    "D1": 'Dorsal fin',
    "D2": 'Dorsal fin',
    "A1": 'Anal fin',
    "A2": 'Anal fin',
    "P1": 'Pectoral fin',
    "P2": 'Pectoral fin',
    "C1": 'Caudal fin',
    "C2": 'Caudal fin',
    "C3": 'Caudal fin',
    "C4": 'Caudal fin'
};



var helps = {
    "M1": 'Mark the front upper tip of the mouth opening. (shortcut: m)',
    "M2": 'Mark the front lower tip of the mouth opening. (shortcut: m)',
    "M3": 'Mark the back of the mouth, showing the angle of the opening. (shortcut: m)',
    "E1": 'Mark the center of the eye. (shortcut: e)',
    "D1": 'Mark the front of the dorsal fin, where the first fin ray attaches to the body of the fish. (shortcut: d)',
    "D2": 'Mark the back of the dorsal fin, where the last fin ray attaches to the body of the fish. (shortcut: d)',
    "A1": 'Mark the front of the anal fin, where the first fin ray attaches to the body of the fish. (shortcut: a)',
    "A2": 'Mark the back of the anal fin, where the last fin ray attaches to the body of the fish. (shortcut: a)',
    "P1": 'Mark the top of the pectoral fin, where the fin ray attaches to the body of the fish. (shortcut: t)',
    "P2": 'Mark the bottom of the pectoral fin, where the fin ray attaches to the body of the fish. (shortcut: t)',
    "C1": 'Mark the top of the caudal fin, where the fleshy part of the caudal fin (peduncle) attaches to the body of the fish. (shortcut: c)',
    "C2": 'Mark the bottom of the caudal fin, where the fleshy part of the caudal fin (peduncle) attaches to the body of the fish. (shortcut: c)',
    "C3": 'Mark the spot where the top of the fin ray attaches to the rest of the caudal fin. This usually is where a change in the color or texture of the fin occurs. (shortcut: c)',
    "C4": 'Mark the spot where the bottom of the fin ray attaches to the rest of the caudal fin. This usually is where a change in the color or texture of the fin occurs. (shortcut: c)'
};

function create_image(src) {
    "use strict";
    $("#canvasbg")[0].src = src;
}

function create_buttons() {
    "use strict";
    var toolbox = $("#toolbox")[0],
        canvasbox = $("#canvasbox")[0],
        canvas_template = $("#appcanvas")[0];
    for (var key in cats) {
        if (cats.hasOwnProperty(key)) {
            // make buttons
            var div = document.createElement("div");
            div.className = "btn tool";
            div.id = div.textContent = key;
            div.title = cats[key];
            div.setAttribute("data-toggle", "tooltip");
            toolbox.appendChild(div);
            
            // make canvases
            var canvas = canvas_template.cloneNode(false);
            canvas.id = key + "_canvas";
            canvasbox.appendChild(canvas);
            canvas.getContext("2d").globalAlpha = 0.85;
            
        }
    }
    var tools = $(".tool");
    tools.tooltip();
    tools.click(function() {
        $("#active-tool").attr("value", $(this).attr("id"))
        update_help(get_active_tool());
    });
    tools[0].click();

}

function update_help(name) {
    var infobox = $("#infobox-content")[0];
    infobox.innerHTML = "";
    if (name in cats && cats[name] in helpimgs) {
        var img = document.createElement("img");
        img.src = helpimgs[cats[name]];
        img.className = "help";
        infobox.appendChild(img);
    }
    if (name in helps) {
        var pp = document.createElement("p");
        pp.textContent = "(" + name + ") " + helps[name];
        infobox.appendChild(pp);
    }
}

function get_active_tool () {
    return $("#active-tool").attr("value");
}

var landmark_data = {};

function update_data(name, value) {
    landmark_data[name] = value;
    $("#form-marks")[0].value = JSON.stringify(landmark_data);
    update_submit();
}


function landmark(evt) {
    clearSelection();
    var tool = get_active_tool();
    var canvas = $("#" + tool + "_canvas");
    if (!canvas.length) return;

    var appbox = $("#appbox")[0];
    var x = evt.pageX - appbox.offsetLeft;
    var y = evt.pageY - appbox.offsetTop;

    var radius = 7;
    
    var ctx = canvas[0].getContext("2d");
    ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    
    ctx.strokeStyle = "#666";
    ctx.stroke();
    
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "6pt sans-serif";
    ctx.fillText(tool, x, y);
    update_data(tool, [x, y])
}

// from somewhere on stack overflow
function clearSelection() {
    var sel;
    if(document.selection && document.selection.empty){
        document.selection.empty() ;
    } else if(window.getSelection) {
        sel = window.getSelection();
        if (sel && sel.removeAllRanges) {
            sel.removeAllRanges()
        }
    }
}

function next_tool() {
    var tool = get_active_tool();
    
}

var shortcuts = {
    "m": ["M1" ,"M2", "M3"],
    "e": ["E1"],
    "d": ["D1", "D2"],
    "a": ["A1", "A2"],
    "t": ["P1", "P2"],
    "c": ["C1", "C2", "C3", "C4"],
    "f": ["M1", "M2", "M3", "E1", "D1", "D2", "A1", "A2", "P1", "P2", "C1", "C2", "C3", "C4"]
}

function evt_keydown(evt) {
    var key = String.fromCharCode(evt.keyCode || evt.which);
    if (key in shortcuts) {
        var idx = shortcuts[key].indexOf(get_active_tool())
        if (idx >= 0) {
            var newtool = shortcuts[key][idx + 1] || shortcuts[key][0];
        } else {
            var newtool = shortcuts[key][0];
        }
        $("#" + newtool).click();
    }
}

function evt_mdown (evt) {
    landmark(evt);
    $("#canvasbox").on("mousemove", landmark);
}

function evt_mup (evt) {
    $("#canvasbox").off("mousemove", landmark);
}

function evt_submit (evt) {
    if (update_submit()) {
        // can submit!
    } else {
        evt.preventDefault();
    }
}

function update_submit () {
    var have = Object.keys(landmark_data).length | 0;
    var want = Object.keys(cats).length | 0;
    var submit = $("#submitButton")[0];
    if (have < want) {
        submit.disabled = true;
        submit.textContent = "Need " + (want - have) + " more points";
        submit.className = "btn btn-warning btn-large";
        return false;
    } else {
        submit.disabled = false;
        submit.textContent = "Submit task";
        submit.className = "btn btn-primary btn-large";
        return true;
    }
}

// initialization
$(document).ready(function() {
    var canvasbox = $("#canvasbox");
    canvasbox.on("mousedown", evt_mdown);
    canvasbox.on("mouseup", evt_mup);
    $(document).keypress(evt_keydown);
    $("#mturk_form").submit(evt_submit);
    create_buttons();
    create_image(decode(turkGetParam("url", "test.jpg")));
    $("#assignmentId")[0].value = turkGetParam("assignmentId");
    if (turkGetParam("assignmentId") == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        var submit = $("#submitButton")[0]
        submit.disabled = true;
        submit.textContent = "Please ACCEPT the HIT first!";
        submit.className = "btn btn-danger btn-large";
        $("canvas").css("cursor", "not-allowed");
        update_submit = function() {};
    } else {
        $(".alert").hide();
        var form = document.getElementById('mturk_form');
        if (document.referrer && /workersandbox/.test(document.referrer)) {
            form.action = "https://workersandbox.mturk.com/mturk/externalSubmit";
        }
        update_submit();
    }
    
    
});