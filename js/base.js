/*jshint browser: true, strict: true*/
/*global $, jQuery*/

function init_canvas(img, callback) {
    "use strict";
    $("#canvasbg").attr("src", img);
    // wait for the image to load
    $("#canvasbg").on("load", function (e) {
        var img = $(e.target);
        var canvasbox = $("#canvasbox");
        var appcanvas = $("<canvas/>").attr({
            id: "appcanvas",
            width: img.width(),
            height: img.height()
        });
        canvasbox.append(appcanvas);
        $(".container").css("min-width", img.css("width"));
        if (typeof callback === "function") { callback(); }
    });
}

var Toolbox = (function () {
    "use strict";
    var tool_defs = {};
    var toolbox;
    var tools = {};

    function init(defs, callback) {
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
                var canvas = $("#appcanvas");
                var clone = canvas.clone(false).attr("id", key + "_canvas");
                $("#canvasbox").append(clone);
                clone[0].getContext("2d").globalAlpha = 0.85;
                tools[key] = clone[0];
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

        if (typeof callback == "function") callback();
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
        get_canvas: get_canvas,
        active: active,
        type: type,
        help: help,
        anchor: anchor
    };
})();


var Drawing = (function () {
    "use strict";
    function draw_point(args) {
        var ctx = args.ctx;
        var radius = 6;
        ctx.beginPath();
        ctx.arc(args.x, args.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();

        ctx.strokeStyle = "#666";
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "5pt sans-serif";
        ctx.fillText(args.tool, args.x, args.y);
        return [args.x, args.y];
    }

    function draw_line(args) {
        var ctx = args.ctx;
        if (args.evt === "mousedown") {
            ctx.startx = args.x;
            ctx.starty = args.y;
        }
        ctx.beginPath();
        ctx.moveTo(ctx.startx, ctx.starty);
        ctx.lineTo(args.x, args.y);
        ctx.closePath();
        ctx.strokeStyle = "red";
        ctx.stroke();
        draw_point({x: ctx.startx, y: ctx.starty, tool: args.tool, ctx: ctx});
        draw_point({x: args.x, y: args.y, tool: args.tool, ctx: ctx});
        return [[ctx.startx, ctx.starty], [args.x, args.y]];
    }

    function draw_curve(args) {
        var ctx = args.ctx;
        function rect_at(pp) {
            ctx.fillRect(pp[0] - 1, pp[1] - 1, 3, 3);
        }
        function dist(p1, p2) {
            return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
        }
        if (args.evt === "mousedown") {
            ctx.startx = args.x;
            ctx.starty = args.y;
            ctx.endx = undefined;
            ctx.endy = undefined;
            ctx.pts = [];
        } else if (args.evt === "mousemove") {
            ctx.pts.push([args.x, args.y]);
            ctx.lineTo(args.x, args.y);
        } else if (args.evt === "mouseup") {
            ctx.endx = args.x;
            ctx.endy = args.y;
        }
        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.moveTo(ctx.startx, ctx.starty);
        for (var ii = 0; ii < ctx.pts.length; ii++) {
            ctx.lineTo(ctx.pts[ii][0], ctx.pts[ii][1]);
        }
        ctx.stroke();
        draw_point({x: ctx.startx, y: ctx.starty, tool: args.tool, ctx: ctx});
        if (ctx.endx && ctx.endy) {
            // Find the arclength of the canvas curve, approximated by line segments
            var total_dist = 0;
            for (var jj = 0; jj < ctx.pts.length - 1; jj++) {
                total_dist += dist(ctx.pts[jj], ctx.pts[jj+1]);
            }

            // We want 5 semilandmarks, so that splits the arc into 4 subsegments
            var step = total_dist / 4;

            var running_dist = 0;
            var running_step = step;
            var semilandmarks = [];
            for (var kk = 0; kk < ctx.pts.length - 1; kk++) {
                var current_dist = dist(ctx.pts[kk], ctx.pts[kk+1]);
                running_dist += current_dist;
                while (running_dist > running_step) {
                    /*  frac                              ------
                     *  running_dist    |----------------|------*--------|
                     *  running_step     -----------------------
                     *  current_dist                      ---------------
                     */
                    var frac = (running_step + current_dist - running_dist) / current_dist;
                    var newx = Math.round((1 - frac) * ctx.pts[kk][0] + frac * ctx.pts[kk+1][0]);
                    var newy = Math.round((1 - frac) * ctx.pts[kk][1] + frac * ctx.pts[kk+1][1]);
                    semilandmarks.push([newx, newy]);
                    ctx.fillStyle = "cyan";
                    rect_at([newx, newy]);
                    running_step += step;
                }
            }
            // add in the start and end points
            semilandmarks.unshift([ctx.startx, ctx.starty]);
            semilandmarks.push([ctx.endx, ctx.endy]);
            draw_point({x: ctx.endx, y: ctx.endy, tool: args.tool, ctx: ctx});
            return {points: semilandmarks, curve: ctx.pts};
        }
    }

    function wrapper(fn) {
        return function (args) {
            if (!args.keep) args.ctx.clearRect(0, 0, args.ctx.canvas.width, args.ctx.canvas.height);
            if (args.callback) args.callback(args.tool, fn(args));
        };
    }


    return {
        point: wrapper(draw_point),
        line: wrapper(draw_line),
        curve: wrapper(draw_curve)
    };
}());

var landmark_data = {};

function update_data(name, value) {
    "use strict";
    landmark_data[name] = value;
    $("#form-marks")[0].value = JSON.stringify(landmark_data);
    update_submit();
}

function update_help() {
    var tool = Toolbox.active();
    var anchor = Toolbox.anchor(tool);
    var help = Toolbox.help(tool);
    $("#infobox-content").html(
        '<b>' + tool + '</b>: ' + help + ' <a href="protocol/protocol.html#' + anchor + '" target="_blank">More info</a>'
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
    var cbox = $("#canvasbox");
    if (e.type == "mousedown") cbox.on("mousemove", evt_mouse);
    if (e.type == "mouseup") cbox.off("mousemove", evt_mouse);
    var tool = Toolbox.active();
    var appbox = $("#appbox")[0];
    var args = {x: e.pageX - appbox.offsetLeft,
                y: e.pageY - appbox.offsetTop,
                evt: e.type,
                tool: tool,
                ctx: Toolbox.get_canvas(tool).getContext("2d"),
                callback: update_data
               };
    Drawing[Toolbox.type(tool)](args);
}

function get_param (param, default_value) {
    "use strict";
    var res = new RegExp(param + "=([^&#]*)").exec(window.location.search);
    return res && decodeURIComponent(res[1]) || default_value || "";
}

function initialize() {
    "use strict";
    var cbox = $("#canvasbox");

    cbox.on("mousedown mouseup", evt_mouse);
    $(document).keypress(evt_keydown);
    var form = $("#mturk_form");
    form.submit(evt_submit);

    init_canvas(get_param("url", "protocol/fish_example.jpg"),
                function () { $.getJSON("js/tool_defs.json").done(Toolbox.init); }
                );

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
