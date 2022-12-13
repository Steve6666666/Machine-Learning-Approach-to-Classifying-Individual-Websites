if [ -z "$1" ]; then
	echo "Please enter a website name as the first argument"
	exit
fi

if [ -z "$2" ]; then
	echo "Please enter the IP address as the second argument"
	exit
fi

mkdir -p "./data/TCP-filtered/$1"

unfilteredTCPFiles=`ls ./data/TCP-unfiltered/$1/*`
for eachfile in $unfilteredTCPFiles
do
	echo -n "Filtering $(basename $eachfile)..."
	if [ -f "./data/TCP-filtered/$1/$(basename $eachfile)" ]; then
		echo "already filtered so skip."
	else
		tshark -Y "tcp and ip.src==$2 or ip.dst==$2" -r $eachfile -w "./data/TCP-filtered/$1/$(basename $eachfile)" -F libpcap
		echo "done!"
	fi
done
