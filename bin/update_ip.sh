#!/bin/sh
sleep 5
/usr/bin/curl http://bismuth.rocky.edu/pi-player/index.php?ip=`ifconfig eth0 |grep -w 'inet' |awk '{print $2}'`
