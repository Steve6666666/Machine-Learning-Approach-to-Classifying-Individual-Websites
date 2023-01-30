if [ -z "$1" ]; then
	echo "Please enter a website name as the first argument"
	exit
fi
while(true)
do
	node main.js $1
done
