$env:Path += ";C:\Program Files (x86)\gs\gs9.06\bin"

$MDFILE = "protocol"

pandoc -S "${MDFILE}.markdown" --self-contained --toc -t html5 --mathml -c buttondown.min.css -o "${MDFILE}.html"

pandoc -S "$MDFILE.markdown" -o "$MDFILE.pdf" -V 'geometry:"margin=1.1in"'
gswin32c -o "${MDFILE}small.pdf" -sDEVICE=pdfwrite -f "$MDFILE.pdf"
Move-Item "${MDFILE}small.pdf" "$MDFILE.pdf" -force
