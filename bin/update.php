<?php
$file = "ip.txt";

if ($_GET)
{
	$fh = fopen($file, 'w') or die("Can't open file to write");

	$ip = preg_replace('/[^0-9.]/', '', $_GET['ip']);
	
	if (strlen($ip) < 16)
	{
		$data = $ip . ":8080";
		fwrite($fh, $data);
		fclose($fh);
	}
}
?>
