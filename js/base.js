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
                tools[key] = canvas[0];
            }
        }

        var radios = $("input[type=radio]");
        radios.change(function (e) {
            add_log("change-tool", e.target.id);
            update_submit();
            update_help();
        });

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
        };
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
    "use strict";
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function draw_point(ctx, xoff, yoff, label) {
    "use strict";
    var radius = 6;
    var pin_height = 12;
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(xoff, yoff);
    ctx.lineTo(xoff, yoff - pin_height);
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
    return [xoff, yoff];
}

function draw_start_curve(ctx, xoff, yoff, label) {
    "use strict";
    draw_point(ctx, xoff, yoff, label);
    ctx.ctr = 0;
    ctx.allx = [xoff];
    ctx.ally = [yoff];
    ctx.beginPath();
}

function draw_continue_curve(ctx, xoff, yoff, label) {
    "use strict";
    ctx.strokeStyle = "#d00";
    ctx.lineWidth = 1;
    ctx.ctr += 1;
    ctx.allx.push(xoff);
    ctx.ally.push(yoff);
    ctx.lineTo(xoff, yoff);
    ctx.stroke();
}

function draw_end_curve(ctx, xoff, yoff, label) {
    "use strict";
    ctx.ctr += 1;
    ctx.allx.push(xoff);
    ctx.ally.push(xoff);
    // Redraw the whole thing on mouseup, to avoid overlap
    clear_canvas(ctx);
    ctx.strokeStyle = "#d00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ctx.allx[0], ctx.ally[0]);
    for (var ii = 0; ii < ctx.ctr; ii++) {
        ctx.lineTo(ctx.allx[ii], ctx.ally[ii]);
    }
    ctx.stroke();
    ctx.closePath();
    draw_point(ctx, ctx.allx[0], ctx.ally[0], label);
    draw_point(ctx, xoff, yoff, label);
    return [ctx.allx, ctx.ally];
}

function draw_start_line(ctx, xoff, yoff, label) {
    "use strict";
    draw_point(ctx, xoff, yoff, label);
    ctx.startx = xoff;
    ctx.starty = yoff;
}

function draw_continue_line(ctx, xoff, yoff, label) {
    "use strict";
    clear_canvas(ctx);
    ctx.strokeStyle = "#d00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ctx.startx, ctx.starty);
    ctx.lineTo(xoff, yoff);
    ctx.stroke();
    ctx.closePath();
    draw_point(ctx, ctx.startx, ctx.starty, label);
}

function draw_end_line(ctx, xoff, yoff, label) {
    "use strict";
    clear_canvas(ctx);
    ctx.strokeStyle = "#d00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ctx.startx, ctx.starty);
    ctx.lineTo(xoff, yoff);
    ctx.stroke();
    ctx.closePath();
    draw_point(ctx, ctx.startx, ctx.starty, label);
    draw_point(ctx, xoff, yoff, label);
    return [[ctx.startx, xoff], [ctx.starty, yoff]];
}

var landmark_data = {};
var logger_data = [];

function update_data(name, value) {
    "use strict";
    landmark_data[name] = value;
    $("#form-marks")[0].value = JSON.stringify(landmark_data);
    update_submit();
    add_log("data-" + name, value);
}

function add_log(name, payload) {
    "use strict";
    var data = [Date.now(), name, payload];
    logger_data.push(data);
    $("#logger")[0].value = JSON.stringify(logger_data);
}

function update_help() {
    "use strict";
    var tool = Toolbox.info();
    $("#infobox-content").html(
        '<b>' + tool.label + '</b>: ' + tool.help + ' <a href="protocol/protocol.html#' + tool.anchor + '" target="_blank">More info</a>'
    );
}

function evt_keydown(evt) {
    "use strict";
    if (document.activeElement.nodeName === "INPUT") {
        return; // don't interrupt form typing
    }
    var key = String.fromCharCode(evt.keyCode || evt.which);
    if (key == "f") {
        var tools = Object.keys(Toolbox.tools);
        var idx = tools.indexOf(Toolbox.active());
        if (idx > -1 && idx < tools.length) {
            var tool = tools[idx + 1];
            $("#" + tool).click();
            add_log("key-forward", tool);
        }
    }
}

function evt_submit (evt) {
    "use strict";
    if (update_submit()) {
        // can submit!
        add_log("submission", "");
        if (!get_param("turkSubmitTo")) {
            evt.preventDefault();
            window.location.href = "data:application/json;base64," + window.btoa($("#form-marks")[0].value)
        }
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
    var have = Object.keys(landmark_data);
    var want = Object.keys(Toolbox.tools);
    for (var ii = 0; ii < have.length; ii++) {
        if (want.indexOf(have[ii]) > -1) {
            $("#" + have[ii]).parent().css("text-decoration", "line-through");
        }
    }
    var submit = $("#submitButton")[0];
    if (have.length < want.length) {
        submit.disabled = true;
        submit.textContent = "Need " + (want.length - have.length) + " more points";
        submit.className = "btn btn-warning btn-large";
        return false;
    } else {
        submit.disabled = false;
        if (get_param("turkSubmitTo")) {
            submit.textContent = "Submit task";
        } else {
            submit.textContent = "Download data";
        }
        submit.className = "btn btn-primary btn-large";
        return true;
    }
}

function evt_mousedown(e) {
    "use strict";
    var tool = Toolbox.info();
    var appbox = $("#appbox");
    var x = e.pageX - appbox[0].offsetLeft;
    var y = e.pageY - appbox[0].offsetTop;
    clear_canvas(tool.ctx);
    var ret;
    switch (tool.kind) {
        case "point":
            ret = draw_point(tool.ctx, x, y, tool.label);
            break;
        case "line":
            // Could avoid code duplication by making a ClickDragTool prototype with
            // Line and Curve as implementations but way too heavyweight for 2 cases
            appbox.on("mousemove", evt_mousemove);
            appbox.on("mouseup", evt_mouseup);
            draw_start_line(tool.ctx, x, y, tool.label);
            break;
        case "curve":
            appbox.on("mousemove", evt_mousemove);
            appbox.on("mouseup", evt_mouseup);
            draw_start_curve(tool.ctx, x, y, tool.label);
            break;
        default:
            console.log("Warning: Undefined tool type", tool.kind, "used.");
    }
    if (ret) {
        update_data(tool.label, ret);
    }
}

function evt_mousemove(e) {
    "use strict";
    var tool = Toolbox.info();
    var appbox = $("#appbox");
    var x = e.pageX - appbox[0].offsetLeft;
    var y = e.pageY - appbox[0].offsetTop;

    if (tool.kind === "line") {
        draw_continue_line(tool.ctx, x, y, tool.label);
    } else {
        draw_continue_curve(tool.ctx, x, y, tool.label);
    }
}

function evt_mouseup(e) {
    "use strict";
    var tool = Toolbox.info();
    var appbox = $("#appbox");
    var x = e.pageX - appbox[0].offsetLeft;
    var y = e.pageY - appbox[0].offsetTop;
    var ret;
    if (tool.kind === "line") {
        ret = draw_end_line(tool.ctx, x, y, tool.label);
    } else {
        ret = draw_end_curve(tool.ctx, x, y, tool.label);
    }
    if (ret) {
        update_data(tool.label, ret);
    }
    appbox.off("mousemove", evt_mousemove);
    appbox.off("mouseup", evt_mouseup);
}

function get_param (param, default_value) {
    "use strict";
    var res = new RegExp(param + "=([^&#]*)").exec(window.location.search);
    return res && decodeURIComponent(res[1]) || default_value || "";
}

function load_resources(image, toolbox) {
    "use strict";
    var wait_img = $.Deferred(function (dfd) {
        $("#canvasbg").one("load", dfd.resolve);
        $("#canvasbg").attr("src", image);
    }).promise();
    var wait_tool = $.getJSON(toolbox);
    $.when(wait_img, wait_tool).then(function () {
        var img = $("#canvasbg");
        $(".container").css("min-width", img.css("width"));
        wait_tool.done(Toolbox.init);
    });
}

function initialize() {
    "use strict";
    var cbox = $("#canvasbox");

    cbox.on("mousedown", evt_mousedown);
    $(document).keypress(evt_keydown);
    var form = $("#mturk_form");
    form.submit(evt_submit);

    load_resources(get_param("url", "protocol/fish_example.jpg"), "js/tool_defs.json");

    $("#assignmentId")[0].value = get_param("assignmentId");
    if (get_param("assignmentId") == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        var submit = $("#submitButton")[0];
        submit.disabled = true;
        submit.textContent = "Please ACCEPT the HIT first!";
        submit.className = "btn btn-danger btn-large";
        $("canvas").css("cursor", "not-allowed");
        update_submit = function() {};
    } else {
        add_log("init", get_param("url", "protocol/fish_example.jpg"));
        $(".alert").hide();
        form[0].action = get_param("turkSubmitTo") + "/mturk/externalSubmit";
        update_submit();
    }

    if (get_param("review") !== "") {
        review_on(get_param("review"));
    }
}
