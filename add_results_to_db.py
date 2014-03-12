#!/usr/bin/env python

from __future__ import print_function
from __future__ import unicode_literals
from __future__ import division
from __future__ import absolute_import

import argparse
import csv
import sys
import sqlite3
from operator import itemgetter

def set_up_args():
    parser = argparse.ArgumentParser(description="Adds Amazon Mturk results to an SQLite database")
    parser.add_argument("results", help="AWS Mturk .results file")
    parser.add_argument("--output", default="results.sqlite", help="SQLite database to write to")
    return parser.parse_args()


def main():
    args = set_up_args()

    with open(args.results, "rb") as rfile:
        reader = csv.DictReader(rfile, dialect="excel-tab")
        sql_fields = ",".join(['`' + x + '`' for x in reader.fieldnames])
        sql_params = ",".join("?" * len(reader.fieldnames))

        con = sqlite3.connect(args.output)
        con.executescript("create table if not exists meta({0});".format(sql_fields))
        get_ordered_values = itemgetter(*reader.fieldnames)

        for line in reader:
            con.execute("insert into meta ({0}) values ({1})".format(sql_fields, sql_params), get_ordered_values(line))
        con.commit()
        print("Changes:", con.total_changes)


if __name__ == "__main__":
    main()
