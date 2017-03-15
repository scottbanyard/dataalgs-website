printf "*** Validation of HTML pages ***\n"
counter=0
for file in *.xhtml
do
  let counter="$counter"+1
  printf "\n\n--- PAGE $counter : $file ---\n\n"
  java -jar ../vnu.jar "$file"
done
