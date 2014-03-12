#!/usr/bin/env python

from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division
from __future__ import absolute_import

import argparse
import SocketServer, BaseHTTPServer, SimpleHTTPServer
import urlparse, urllib, cgi
import multiprocessing
import webbrowser
import sys, shutil, os, os.path
import sqlite3
from collections import namedtuple, OrderedDict

def namedtuple_factory(cursor, row):
    """Usage: con.row_factory = namedtuple_factory"""
    fields = [col[0].replace(".", "_") for col in cursor.description]
    Row = namedtuple("Row", fields)
    return Row(*row)

class ReviewHTTPServer(BaseHTTPServer.HTTPServer):
    """Needed to pass arguments to our request handler. Yes this is really dumb."""
    def __init__(self, *args, **kwargs):
        self.sqlite = kwargs.pop("sqlite")
        self.pics = kwargs.pop("pics")
        BaseHTTPServer.HTTPServer.__init__(self, *args, **kwargs)
        self.con = sqlite3.connect(self.sqlite)
        self.con.row_factory = namedtuple_factory


def get_next_unreviewed(con):
    return list(con.execute("select * from meta where feedback='' and reject='' limit 1;")).pop()

def approve_work(con, asnid, feedback):
    if feedback == "":
        feedback = "approved"
    con.execute("update meta set feedback=? where `assignmentid`=?", (feedback, asnid))
    con.commit()

def reject_work(con, asnid, feedback):
    if feedback == "":
        feedback = "rejected"
    con.execute("update meta set reject=1, feedback=? where `assignmentid`=?", (feedback, asnid))
    con.commit()


class ReviewHTTPServerHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    """We generally let the base class handle GET and HEAD requests, while we handle POSTs."""

    def do_GET(self):
        parts = urlparse.urlparse(self.path)
        if self.path.endswith("/"):  # just starting up
            self.redir()
        elif parts.path.startswith("/pic/"):
            # translate image urls
            path = parts.path.replace("/pic/", "")
            path = os.path.abspath(os.path.join(self.server.pics, path))
            print(path)
            try:
                f = open(path, "rb")
            except IOError:
                self.send_error(404, "File not found")
                return None
            self.send_response(200)
            self.send_header("Content-Length", str(os.fstat(f.fileno())[6]))
            self.end_headers()
            shutil.copyfileobj(f, self.wfile)
        else:
            SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

    def redir(self):
        info = get_next_unreviewed(self.server.con)
        img = info.annotation.split("/").pop()
        qs = urllib.urlencode(dict(assignmentId=info.assignmentid, url="/pic/" + img, review=info.Answer_marks, comment=info.Answer_comments))
        self.send_response(303, "Redirecting")
        self.send_header('Location', '/index.html?' + qs)
        self.end_headers()


    def parse_POST(self):
        ctype, pdict = cgi.parse_header(self.headers['content-type'])
        if ctype == 'multipart/form-data':
            postvars = cgi.parse_multipart(self.rfile, pdict)
        elif ctype == 'application/x-www-form-urlencoded':
            length = int(self.headers['content-length'])
            postvars = urlparse.parse_qs(self.rfile.read(length), keep_blank_values=1)
        else:
            postvars = {}
        return postvars

    def do_POST(self):
        parts = urlparse.urlparse(self.path)
        if parts.path == "/review":
            postvars = self.parse_POST()
            action = postvars["action"].pop()
            asnid = postvars["assignmentid"].pop()
            if action == "approve":
                self.log_message("Approving " + asnid)
                approve_work(self.server.con, asnid, postvars["feedback"].pop())
                self.redir()
            elif action == "reject":
                self.log_message("Rejecting " + asnid)
                reject_work(self.server.con, asnid, postvars["feedback"].pop())
                self.redir()
        else:
            self.send_error(405, "POST not allowed for this resource")


class ServerProcess(multiprocessing.Process):
    def __init__(self, **kwargs):
        self._port = kwargs.pop("port")
        self._sqlite = kwargs.pop("sqlite")
        self._pics = kwargs.pop("pics")
        multiprocessing.Process.__init__(self, **kwargs)

    def run(self):
        httpd = ReviewHTTPServer(("", self._port), ReviewHTTPServerHandler, sqlite=self._sqlite, pics=self._pics)
        print("Serving on port", self._port)
        try:
            httpd.serve_forever()
        except (KeyboardInterrupt, SystemExit):
            print("Stopping server.")
            # cleanup actions here
            sys.exit(0)

def set_up_args():
    parser = argparse.ArgumentParser(description="Handles reviewing mturk submissions")
    parser.add_argument("results", help="AWS Mturk .results file")
    parser.add_argument("--port", default=8000, help="Port on which to service requests")
    parser.add_argument("--pics", help="folder that holds the pictures")
    return parser.parse_args()

def main():
    args = set_up_args()

    httpd = ServerProcess(port=args.port, sqlite=args.results, pics=args.pics)
    httpd.start()
    webbrowser.open("http://127.0.0.1:" + str(args.port))
    try:
        httpd.join()
    except (KeyboardInterrupt, SystemExit):
        sys.exit(httpd.exitcode)


if __name__ == "__main__":
    main()
