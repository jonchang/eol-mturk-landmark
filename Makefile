# Patterned after Rust-Empty <https://github.com/bvssvni/rust-empty>, MIT License.
SHELL := /bin/bash

DEFAULT = make help

PROTOCOL_FILES = protocol/protocol.html

all:
	$(DEFAULT)

help:
	clear \
	&& echo "make help            - This help" \
	&& echo "make protocol        - Protocol HTML files" \
	&& echo "make deploy          - Deploy to GitHub" \
	&& echo "make clean           - Deletes builds and documentation"

.PHONY: clean

.SUFFIXES: .html .markdown

.markdown.html:
	pandoc -s '$<' --toc --self-contained -t html5 -o '$@' -c buttondown.min.css --data-dir $$(dirname $<)

protocol: $(PROTOCOL_FILES)

build:
	mkdir -p build

build/protocol:
	mkdir -p build/protocol

stage: protocol | build/ build/protocol
	cp -R css js fonts img index.html build
	cp "$(PROTOCOL_FILES)" protocol/fish_example.jpg build/protocol

deploy: stage | build/
	( \
		test -e build/.git \
		&& echo "--- There is already a .git directory in build/" \
	) \
	|| \
	( \
		cd build/ \
		&& git init . \
		&& git add . \
		&& git commit -m 'Deploy' \
		&& git push 'git@github.com:jonchang/eol-mturk-landmark.git' master:gh-pages --force \
		&& rm -rf .git \
		&& echo "Pushed to:" \
		&& echo "    http://jonchang.github.io/eol-mturk-landmark/" \
	)

clean:
	rm -f protocol/protocol.html
	rm -rf build
