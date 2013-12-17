<?php
	$q=$_GET["q"];
	exec('./loop '.$q, $output, $ret);
if ($ret)
{
	echo 'failed to execute c++. '.$ret;
	var_dump($output);
}
else
{
	var_dump($output);
	echo ' ret= '.$ret;
}
?>
