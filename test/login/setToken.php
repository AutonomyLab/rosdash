<?php
$q=$_GET["q"];
$con = mysqli_connect('localhost','root','autolab','test');
if (!$con)
  {
  die('Could not connect: ' . mysqli_error($con));
  }

mysqli_select_db($con, "test");
$result = mysqli_query($con, "INSERT INTO users (token, name) VALUES ('".$q."', 'fzhan')");
echo "done";
mysqli_close($con);
?>
