set -e

if [ -z "$1" ]; then
    echo "Please enter a website name as the first argument"
    exit
fi

mkdir -p "data/$1"

if screen -ls | grep -q "crawler"; then
    echo -n "Terminating previous crawler screen..."
    screen -XS crawler quit
    echo "done!"
fi

if screen -ls | grep -q "collector"; then
    echo -n "Terminating previous collector screen"
    screen -XS collector quit
fi

echo -n "Creating new crawler process..."
screen -S crawler -d -m node main.js $1
echo "done!"

echo -n "Creating new collector process..."
screen -S collector -d -m sudo tcpdump -s 0 -i eth0 -G 3600 -w "data/$1/$1_%d-%m_%Y__%H_%M.pcap"
echo "done!"
