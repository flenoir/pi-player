<?php
$file = "ip.txt";

if ($_GET)
{
	$fh = fopen($file, 'w') or die("Can't open file to write");

	$ip = preg_replace('/[^0-9.]/', '', $_GET['ip']);
	
	if (strlen($ip) < 16)
	{
		fwrite($fh, $ip);
		fclose($fh);
	}
}

$fh = fopen($file, 'r');
$data = fread($fh, 20) or die("Can't open file to read");
fclose($fh);

$data = preg_replace('/[^0-9.]/', '', $data);

if(strlen($data) < 16)
	header("Location: http://$data");
else
	echo "Invalid data found";
?>
