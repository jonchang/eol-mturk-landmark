/*jslint browser: true, vars: true*/
/*global $, jQuery*/


var groups = {
    "Mouth": {
        contains: ["M1"],
        help: "1 point that shows the angle of the fish's jaw.",
        image: ""
    },
    "Caudal fin": {
        contains: ["C1", "C2"],
        help: "2 points that describe the caudal fin (the tail of the fish).",
        image: ""
    },
    "Pectoral fin": {
        contains: ["P1", "P2"],
        help: "2 points that describe the pectoral fin (on the fish's \"chest\")",
        image: ""
    },
    "Gill cover": {
        contains: ["O1", "O2", "O3"],
        help: "3 points that describe the gill cover (operculum)",
        image: ""
    },
    "Eye": {
        contains: ["E1", "E2"],
        help: "2 points that describe the eye.",
        image: ""
    },
    "Head curves": {
        contains: ["FH", "CH"],
        help: "2 curves that describe the 'head' of the fish.",
        image: ""
    },
    "Fin curves": {
        contains: ["DF", "AF"],
        help: "2 curves that describe fins of the fish.",
        image: ""
    },
    "Dimensions": {
        contains: ["SL", "DP"],
        help: "2 lines that describe the height and length of the fish.",
        image: ""
    }
};


var tool_defs = {
    "M1": {
        kind: "point",
        help: "The back of the mouth, showing the angle of the mouth opening."
    },
    "C1": {
        kind: "point",
        help: "Where the top of the caudal fin meets the body."
    },
    "C2": {
        kind: "point",
        help: "Where the bottom of the caudal fin meets the body."
    },
    "P1": {
        kind: "point",
        help: "Where the top of the pectoral fin meets the body."
    },
    "P2": {
        kind: "point",
        help: "Where the bottom of the pectoral fin meets the body."
    },
    "O1": {
        kind: "point",
        help: "The top point of the gill cover opening."
    },
    "O2": {
        kind: "point",
        help: "The point of the gill cover opening closest to the tail of the fish."
    },
    "O3": {
        kind: "point",
        help: "The bottom point of the gill cover opening."
    },
    "E1": {
        kind: "point",
        help: "A point on the eye closest to the head of the fish."
    },
    "E2": {
        kind: "point",
        help: "A point on the eye closest to the tail of the fish."
    },
    "FH": {
        kind: "curve",
        help: "The curve of the body from the top tip of the mouth to the start of the dorsal fin (the fish's \"forehead\")."
    },
    "DF": {
        kind: "curve",
        help: "The curve of the body along the dorsal fin."
    },
    "AF": {
        kind: "curve",
        help: "The curve of the body along the anal fin."
    },
    "CH": {
        kind: "curve",
        help: "The curve of the body from the bottom tip of the mouth to the start of the ventral fin (the fish's \"chin\")."
    },
    "SL": {
        kind: "line",
        help: "The horizontal line from the tip of the mouth to the beginning of the caudal fin (between points C1 and C2)."
    },
    "DP": {
        kind: "line",
        help: "The vertical line along the tallest (i.e., deepest) part of the fish, excluding fins."
    }
};

function create_image(src) {
    "use strict";
    $("#canvasbg").attr("src", src);
    $("#canvasbg").on("load", function (e) {
        var img = $(e.target);
        var appcanvas = $("<canvas/>").attr({
            id: "appcanvas",
            width: img.width(),
            height: img.height()
        });
        $("#canvasbox").append(appcanvas);
        $(".container").css("min-width", img.css("width"));
        create_buttons();
    });
}

var tool_types = (function () {
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
        update_data(args.tool, [[args.x, args.y]]);
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
        update_data(args.tool, [[ctx.startx, ctx.starty], [args.x, args.y]]);
    }

    function draw_curve(args) {
        var ctx = args.ctx;
        function rect_at(pp) {
            ctx.fillRect(pp[0]-1,pp[1]-1,3,3);
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
        ctx.strokeStyle = "red";
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
            for (var jj = 0; jj < ctx.pts.length - 1; jj++) {
                var curdist = dist(ctx.pts[jj], ctx.pts[jj+1]);
                running_dist += curdist;
                // XXX: handle case where > 1 semilandmark occurs on 1 line segment
                if (running_dist > running_step) {
                    var frac = running_step / running_dist;
                    var newx = (1 - frac) * ctx.pts[jj][0] + frac * ctx.pts[jj+1][0];
                    var newy = (1 - frac) * ctx.pts[jj][1] + frac * ctx.pts[jj+1][1];
                    semilandmarks.push([newx, newy]);
                    ctx.fillStyle = "yellow";
                    rect_at([newx, newy]);
                    running_step += step;
                }
            }
            // add in the start and end points
            semilandmarks.unshift([ctx.startx, ctx.starty]);
            semilandmarks.push([ctx.endx, ctx.endy]);
            draw_point({x: ctx.endx, y: ctx.endy, tool: args.tool, ctx: ctx});
            update_data(args.tool, semilandmarks);
        }
    }

    function clear(fn) {
        return function (args) {
            args.ctx.clearRect(0, 0, args.ctx.canvas.width, args.ctx.canvas.height);
            fn(args);
        };
    }


    return {
        point: clear(draw_point),
        line: clear(draw_line),
        curve: clear(draw_curve)
    };
}());

function create_buttons() {
    "use strict";
    var toolbox = $("#toolbox"),
        canvasbox = cbox[0],
        canvas_template = $("#appcanvas")[0];
    for (var key in tool_defs) {
        if (tool_defs.hasOwnProperty(key)) {
            toolbox.append('<label class="btn btn-default tool" id="' + key +
                           '"><input type="radio" name="tools">' + key + '</label>');
            // make canvases
            var canvas = canvas_template.cloneNode(false);
            canvas.id = key + "_canvas";
            canvasbox.appendChild(canvas);
            canvas.getContext("2d").globalAlpha = 0.85;
        }
    }
    var tools = $(".tool");
    tools.click(function() {
        active_tool($(this).attr("id")); // set this as the current tool
    });
    tools[0].click();
}

function active_tool(set_to) {
    if (set_to) $("#active-tool").attr("value", set_to);
    return $("#active-tool").attr("value");
}

var landmark_data = {};

function update_data(name, value) {
    landmark_data[name] = value;
    $("#form-marks")[0].value = JSON.stringify(landmark_data);
    update_submit();
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

function evt_keydown(evt) {
    var key = String.fromCharCode(evt.keyCode || evt.which);
    if (key == "f") {
        var tools = Object.keys(tool_defs);
        var idx = tools.indexOf(active_tool());
        if (idx > -1 && idx < tools.length) {
            $("#" + (tools[idx + 1])).click();
        }
    }
}

function evt_submit (evt) {
    if (update_submit()) {
        // can submit!
    } else {
        evt.preventDefault();
    }
}

function evt_review (evt) {
    var parsed = JSON.parse($("#review")[0].value);
    for (var ii in parsed) {
        if (parsed.hasOwnProperty(ii))
            draw_landmark(parsed[ii][0], parsed[ii][1], ii);
    }
}

function review_on(txt) {
    var rev = $("#review");
    rev.css("display", "block");
    rev.on("change", evt_review);
    rev[0].value = txt;
    evt_review()
}

function update_submit () {
    var have = Object.keys(landmark_data).length | 0;
    var want = Object.keys(tool_defs).length | 0;
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

function get_canvas(tool) {
    return $("#" + tool + "_canvas")[0].getContext("2d");
}

function get_evt_xy (evt) {
    var appbox = $("#appbox")[0];
    var x = evt.pageX - appbox.offsetLeft;
    var y = evt.pageY - appbox.offsetTop;
    return [x, y];
}

function evt_mouse(e) {
    if (e.type == "mousedown") cbox.on("mousemove", evt_mouse);
    if (e.type == "mouseup") cbox.off("mousemove", evt_mouse);
    var tool = active_tool();
    var appbox = $("#appbox")[0];
    var args = {x: e.pageX - appbox.offsetLeft,
                y: e.pageY - appbox.offsetTop,
                evt: e.type,
                tool: tool,
                ctx: $("#" + tool + "_canvas")[0].getContext("2d")
               };
    tool_types[tool_defs[tool].kind](args);
}

function initialize() {
    cbox = $("#canvasbox"); // global canvasbox
    cbox.on("mousedown mouseup", evt_mouse);
    $(document).keypress(evt_keydown);
    $("#mturk_form").submit(evt_submit);
    create_image(decode(turkGetParam("url", "protocol/fish_example.jpg")));
    $("#assignmentId")[0].value = turkGetParam("assignmentId");
    if (turkGetParam("assignmentId") == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        var submit = $("#submitButton")[0];
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
    if (turkGetParam("review", "") !== "") {
        review_on(decode(turkGetParam("review")));
    }
}
