/*jshint browser: true, strict: true*/
/*global $, jQuery*/

function init_canvas(img) {
    "use strict";
    $("#canvasbg").attr("src", img);
    // wait for the image to load
    $("#canvasbg").on("load", function (e) {
        var img = $(e.target);
        var canvasbox = $("#canvasbox");
        $(".container").css("min-width", img.css("width"));
    });
}

var Toolbox = (function () {
    "use strict";
    var tool_defs = {};
    var toolbox;
    var tools = {};

    function init(defs) {
        // set instance variables
        tool_defs = defs;
        toolbox = $("#toolbox");

        for (var key in tool_defs) {
            if (tool_defs.hasOwnProperty(key)) {
                var lab = $('<label>').attr("class", "btn btn-default").text(key);
                var newtool = $('<input>').attr({
                    type: "radio",
                    name: "tools",
                    value: key,
                    id: key
                });
                toolbox.append(lab.append(newtool));

                // make canvases
                var img = $("#canvasbg");
                var canvas = $("<canvas/>");
                canvas.attr({
                    id: key + "_canvas",
                    width: img.width(),
                    height: img.height()
                });
                $("#canvasbox").append(canvas);
                canvas[0].getContext("2d").globalAlpha = 0.85;
                tools[key] = canvas[0];
            }
        }

        var radios = $("input[type=radio]");
        radios.change(function () {
                update_submit();
                update_help();
            }
        )

        radios[0].click();
        radios[0].checked = true; // Shouldn't clicking a radio button also check it? :psyduck:
    }

    function info(tool_name) {
        if (!tool_name) {
            tool_name = active();
        }
        return {
            canvas: tools[tool_name],
            ctx: tools[tool_name].getContext("2d"),
            label: tool_name,
            kind: tool_defs[tool_name].kind,
            help: tool_defs[tool_name].help,
            anchor: tool_defs[tool_name].anchor
        }
    }

    function get_canvas(tool_name) {
        return tools[tool_name];
    }

    function active() {
        return $("#toolbox input[type=radio]:checked")[0].value;
    }

    function type(tool) {
        return tool_defs[tool].kind;
    }

    function help(tool) {
        return tool_defs[tool].help;
    }

    function anchor(tool) {
        return tool_defs[tool].anchor;
    }

    return {
        init: init,
        tools: tools,
        active: active,
        info: info
    };
})();

function clear_canvas(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function draw_point(ctx, xoff, yoff, label) {
    var radius = 6;
    var pin_height = 12
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.fillStyle = "white"
    ctx.beginPath()
    ctx.moveTo(xoff, yoff);
    ctx.lineTo(xoff, yoff - pin_height)
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(xoff, yoff - pin_height - radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();

    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "5pt sans-serif";
    ctx.fillText(label, xoff, yoff - pin_height - radius);
    return;
}

var landmark_data = {};

function update_data(name, value) {
    "use strict";
    landmark_data[name] = value;
    $("#form-marks")[0].value = JSON.stringify(landmark_data);
    update_submit();
}

function update_help() {
    var tool = Toolbox.info();
    $("#infobox-content").html(
        '<b>' + tool.label + '</b>: ' + tool.help + ' <a href="protocol/protocol.html#' + tool.anchor + '" target="_blank">More info</a>'
    );
}

function evt_keydown(evt) {
    "use strict";
    var key = String.fromCharCode(evt.keyCode || evt.which);
    if (key == "f") {
        var tools = Object.keys(Toolbox.tools);
        var idx = tools.indexOf(Toolbox.active());
        if (idx > -1 && idx < tools.length) {
            $("#" + (tools[idx + 1])).click();
        }
    }
}

function evt_submit (evt) {
    "use strict";
    if (update_submit()) {
        // can submit!
    } else {
        evt.preventDefault();
    }
}

function evt_review (evt) {
    "use strict";
    var parsed = JSON.parse($("#review")[0].value);
    for (var ii in parsed) {
        if (parsed.hasOwnProperty(ii))
            draw_landmark(parsed[ii][0], parsed[ii][1], ii);
    }
}

function review_on(txt) {
    "use strict";
    var rev = $("#review");
    rev.css("display", "block");
    rev.on("change", evt_review);
    rev[0].value = txt;
    evt_review();
}

function update_submit () {
    "use strict";
    var have = Object.keys(landmark_data).length | 0;
    var want = Object.keys(Toolbox.tools).length | 0;
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

function evt_mouse(e) {
    "use strict";
    var tool = Toolbox.info();
    var appbox = $("#appbox")[0];
    var x = e.pageX - appbox.offsetLeft;
    var y = e.pageY - appbox.offsetTop;
    clear_canvas(tool.ctx);
    draw_point(tool.ctx, x, y, tool.label);
    update_data(tool.label, x, y);
}

function get_param (param, default_value) {
    "use strict";
    var res = new RegExp(param + "=([^&#]*)").exec(window.location.search);
    return res && decodeURIComponent(res[1]) || default_value || "";
}

function initialize() {
    "use strict";
    var cbox = $("#canvasbox");

    cbox.on("mousedown", evt_mouse);
    $(document).keypress(evt_keydown);
    var form = $("#mturk_form");
    form.submit(evt_submit);

    var load_image = $.Deferred(function (dfd) {
        $("#canvasbg").one("load", dfd.resolve);
        $("#canvasbg").attr("src", get_param("url", "protocol/fish_example.jpg"));
    }).promise();

    var load_toolbox = $.getJSON("js/tool_defs.json");

    $.when(load_image, load_toolbox).then(function () {
        var img = $("#canvasbg");
        $(".container").css("min-width", img.css("width"));
        load_toolbox.done(Toolbox.init);
    });


    $("#assignmentId")[0].value = get_param("assignmentId");
    if (get_param("assignmentId") == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        var submit = $("#submitButton")[0];
        submit.disabled = true;
        submit.textContent = "Please ACCEPT the HIT first!";
        submit.className = "btn btn-danger btn-large";
        $("canvas").css("cursor", "not-allowed");
        update_submit = function() {};
    } else {
        $(".alert").hide();
        form.action = get_param("turkSubmitTo") + "/mturk/externalSubmit";
        update_submit();
    }

    if (get_param("review") !== "") {
        review_on(get_param("review"));
    }
}
