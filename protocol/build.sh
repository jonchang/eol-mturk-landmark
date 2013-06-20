#!/bin/sh

MDFILE=protocol

(pandoc -S $MDFILE.markdown --toc -t html5 -c buttondown.min.css -o $MDFILE.html) &

(pandoc -S $MDFILE.markdown -o $MDFILE.pdf -V geometry:'margin=1in'
gs -o ${MDFILE}small.pdf -sDEVICE=pdfwrite -f $MDFILE.pdf
mv ${MDFILE}small.pdf $MDFILE.pdf) &

wait
