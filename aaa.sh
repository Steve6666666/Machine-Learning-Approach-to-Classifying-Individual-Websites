while(true)
do
	yourfilenames=`ls ./eno1.*`
	sum=0
	for eachfile in $yourfilenames
	do
		echo $eachfile
		tshark -Y 'tcp and ip.src==172.16.94.200 or ip.dst==172.16.94.200' -r $eachfile -w $sum.pcap -F libpcap
		sum=$(($sum+1))
		#python3 pcap2times.py -r $eachfile -w scp2.dat -u tcp -d 22

	done

	yourfile=`ls ./*.pcap`
	for each in $yourfile
	do
		echo $each
		python3 pcap2times.py -r $each -w zhihu3.dat -u tcp -d 22
	done
	sleep 3600
done	
