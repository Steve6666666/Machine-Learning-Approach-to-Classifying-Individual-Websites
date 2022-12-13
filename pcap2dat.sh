if [ -z "$1" ]; then
	echo "Please enter a website name as the first argument"
	exit
fi

filteredTCPFiles=`ls ./data/TCP-filtered/$1/*`
for eachfile in $filteredTCPFiles
do 
	echo "Converting $(basename $eachfile)..."
	python3 pcap2times.py -r $eachfile -w "./data/dat-files/$1.dat" -u tcp -d 22
	echo "done!"
	echo ""
done
