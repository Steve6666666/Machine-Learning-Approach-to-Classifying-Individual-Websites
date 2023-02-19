while(true)
do
        echo $1
        date
        sudo lsof -n -i TCP | grep https >> https.log
        sleep 1
done