.PHONY: clean clean_help
all: build

help:
	@cd protocol && pandoc -S protocol.markdown --toc -t html5 --self-contained -c buttondown.min.css -o protocol.html

clean_help:
	@cd protocol && rm protocol.html

build: help
	@mkdir -p build
	@cp -R css js fonts img index.html build
	@mkdir -p build/protocol
	@cp protocol/protocol.html protocol/fish_example.jpg build/protocol

deploy: all
	@cd ./build && git init . && git add . && git commit -m 'Deploy' && git push 'git@github.com:jonchang/eol-mturk-landmark.git' master:gh-pages --force && rm -rf .git

clean: clean_help
	@rm -rf build
