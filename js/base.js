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
                if (/^__message$/.test(key)) {
                    // set custom message and delete from config array
                    $("#custom-message").html(tool_defs[key]);
                    delete tool_defs[key];
                    continue;
                }
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

                // make confidences
                if (get_param("confidence", "0") == "1") {
                    var conf = $('<div class="form-group"/>');
                    conf.append($('<label class="col-sm-2 control-label">' + key + "</label>"));
                    conf.append($('<label class="radio-inline"><input type="radio" name="' + key + '_conf" value="ok" checked>OK</label>'));
                    conf.append($('<label class="radio-inline"><input type="radio" name="' + key + '_conf" value="unsure">Unsure</label>'));
                    conf.append($('<label class="radio-inline"><input type="radio" name="' + key + '_conf" value="missing">Missing</label>'));
                    $("#confidence_box").append(conf);
                    $("#confidence_box").append($("<br>"));
                    $("#confidence_box").css("display", "block");
                }
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
        $(document).trigger("toolbox_done");
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
            helpurl: tool_defs[tool_name].helpurl
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

function draw_scaled_box(ctx, xoff, yoff, label) {
    // 0.125 standard lengths
    var box_scale_factor = 0.125;
    var hit_x_size = 3

    var keys = Object.keys(Toolbox.tools);
    var pt1 = landmark_data[keys[0]];
    var pt2 = landmark_data[keys[1]];
    // must have points 1 and 2 defined
    if (!pt1 || !pt2) return false;
    // Euclidean distance
    var distance = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
    var boxwidth = distance * box_scale_factor;

    ctx.strokeStyle = "cyan";
    ctx.beginPath();
    ctx.moveTo(xoff - hit_x_size, yoff - hit_x_size);
    ctx.lineTo(xoff + hit_x_size, yoff + hit_x_size);
    ctx.moveTo(xoff - hit_x_size, yoff + hit_x_size);
    ctx.lineTo(xoff + hit_x_size, yoff - hit_x_size);
    ctx.closePath()
    ctx.stroke()

    ctx.strokeRect(xoff - boxwidth / 2, yoff - boxwidth / 2, boxwidth, boxwidth);

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
    if (tool.helpurl) {
        $("#infobox-content").html(
            '<b>' + tool.label + '</b>: ' + tool.help + ' <a href="' + tool.helpurl + '" target="_blank">More info</a>'
        );
    } else {
        $("#infobox-content").html()
    }
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
    } else if (key == "b") {
        var tools = Object.keys(Toolbox.tools);
        var idx = tools.indexOf(Toolbox.active());
        if (idx > 0 && idx <= tools.length) {
            var tool = tools[idx - 1];
            $("#" + tool).click();
            add_log("key-back", tool);
        }
    }
}

function evt_submit (evt) {
    "use strict";
    if (update_submit()) {
        // can submit!
        add_log("DPR_end", window.devicePixelRatio);
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
        if (parsed.hasOwnProperty(ii)) {
            // Get tool type
            ii = ii.trim();
            var tool = Toolbox.info(ii);
            switch (tool.kind) {
                // too lazy to support all types now
                case "point":
                    draw_point(tool.ctx, parsed[ii][0], parsed[ii][1], ii);
                    break;
                default:
                    console.log("Warning: Unsupported tool type in review ", tool.kind, ii);
            }
        }
    }
}

function review_on(txt) {
    "use strict";
    var rev = $("#review");
    rev.css("display", "block");
    rev.on("change", evt_review);
    rev[0].value = txt;
    $(document).on("toolbox_done", {}, evt_review);
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

    var warning = $("#check-warning-message");
    var checkmsg = check(landmark_data);
    if (checkmsg.length > 0) {
        var warnings = checkmsg.join("<br>");
        warning.html("<b>Warning:</b><br>" + warnings);
        warning.css("display", "block");
    } else {
        warning.css("display", "none");
    }
    $("#warnings")[0].value = JSON.stringify(checkmsg)

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
        case "scaled_box":
            ret = draw_scaled_box(tool.ctx, x, y, tool.label);
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

    load_resources(get_param("url", "protocol/fish_example.jpg"),
                   get_param("config", "config.json"));

    if (get_param("taxa") !== "") {
        $("#taxname").html("This is <i>" + get_param("taxa") + "</i>");
        $("#taxa")[0].value = get_param("taxa");
    }

    if (get_param("workerId") !== "") {
        $("#workerId")[0].value = get_param("workerId");
    }

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
        add_log("DPR_start", window.devicePixelRatio);
        $(".alert").hide();
        form[0].action = get_param("turkSubmitTo") + "/mturk/externalSubmit";
        update_submit();
    }

    if (get_param("review") !== "") {
        review_on(get_param("review"));
    }
}
