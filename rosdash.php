<?php
function saveFile ()
{
	//@todo must test if the directory exists, should I remove .json?
	$file = $_POST['file_name'].'.json';
	$json = json_encode($_POST['data']);
	echo file_put_contents($file, $json);
}
function getOwnerList ()
{
	$dirs = glob('./file/*', GLOB_ONLYDIR);
	foreach ($dirs as $i)
	{
		if (strlen($i) > 7)
		{
			echo substr($i, 7).",";
		}
	}
}
function getPanelList ()
{
	// Define the full path to your folder from root
	$path = './file/'.$_POST["user"];
	// Open the folder
	$dir_handle = @opendir($path) or die("Unable to open $path");
	// Loop through the files
	while ($file = readdir($dir_handle))
	{
		if($file == "." || $file == "..")
		{
			continue;
		}
		echo $file." ";
		/*$pos = strpos($file, "-");
		if ($pos && substr($file, $pos) == "-panel.json")
		{
			echo substr($file, 0, $pos)." ";
		}*/
	}
	// Close
	closedir($dir_handle);
}
function newUser ()
{
	$user = $_POST['username'];
	if ("" == $user || " " == $user)
	{
		echo "user name error: ".$user;
		return false;
	}
	if (file_exists("file/".$user."/"))
	{
		echo "user dir exists " . $user;
		return false;
	}
	// create user dir
	$old_mask = umask(0); 
	if (! mkdir("file/".$user, 0777))
	{
		echo "unable to make dir: ".$user;
		return false;
	}
	umask($old_mask);
	// create user conf
	$conf = file_get_contents("file/index/conf.json");
	if (! $conf)
	{
		echo "unable to get default conf";
		return false;
	}
	$json = json_decode($conf, true);
	$json["user"] = $user;
	$json["discrip"] = "";
	// save user conf to database
	$con = mysqli_connect("localhost", "root", "123456", "rosdash");
	if (mysqli_connect_errno($con))
	{
		echo "Failed to connect to MySQL: " . mysqli_connect_error();
	} else
	{
		mysqli_query($con,'INSERT INTO users (Name, Openid) VALUES ("' . $user . '", "'. $conf .'")');
	}
	mysqli_close($con);
	// save user conf to file
	if (! file_put_contents('file/'.$user.'/conf.json', json_encode($json)))
	{
		echo "unable to create user conf file";
		return false;
	}
	if (! chmod('file/'.$user.'/conf.json', 0777))
	{
		echo "unable to chmod user conf file";
		return false;
	}
	// create index panel
	$conf = file_get_contents("file/index/new-panel.json");
	if (! $conf)
	{
		echo "unable to get default index panel page";
		return false;
	}
	$json = json_decode($conf, true);
	$json["user"] = $user;
	$json["discrip"] = "";
	$json["panel_name"] = "index";
	if (! file_put_contents('file/'.$user.'/index-panel.json', json_encode($json)))
	{
		echo "unable to create index panel file";
		return false;
	}
	if (! chmod('file/'.$user.'/index-panel.json', 0777))
	{
		echo "unable to chmod index panel file";
		return false;
	}
	// create index diagram
	$conf = file_get_contents("file/index/new-diagram.json");
	if (! $conf)
	{
		echo "unable to get default index diagram page";
		return false;
	}
	$json = json_decode($conf, true);
	$json["user"] = $user;
	$json["discrip"] = "";
	$json["panel_name"] = "index";
	if (! file_put_contents('file/'.$user.'/index-diagram.json', json_encode($json)))
	{
		echo "unable to create index diagram file";
		return false;
	}
	if (! chmod('file/'.$user.'/index-diagram.json', 0777))
	{
		echo "unable to chmod index diagram file";
		return false;
	}
	return true;
}
function newPanel ()
{
	$user = $_POST['username'];
	if ("" == $user || " " == $user)
	{
		echo "user name error: ".$user;
		return false;
	}
	$panel = $_POST['panel'];
	if ("" == $panel || " " == $panel)
	{
		echo "panel name error: ".$panel;
		return false;
	}
	// create panel
	$conf = file_get_contents("file/index/empty-panel.json");
	if (! $conf)
	{
		echo "unable to get empty panel page";
		return false;
	}
	$json = json_decode($conf, true);
	$json["user"] = $user;
	$json["discrip"] = "";
	$json["panel_name"] = $panel;
	if (! file_put_contents('file/'.$user.'/'.$panel.'-panel.json', json_encode($json)))
	{
		echo "unable to create panel file";
		return false;
	}
	if (! chmod('file/'.$user.'/'.$panel.'-panel.json', 0777))
	{
		echo "unable to chmod panel file";
		return false;
	}
	// create index diagram
	$conf = file_get_contents("file/index/empty-diagram.json");
	if (! $conf)
	{
		echo "unable to get empty diagram page";
		return false;
	}
	$json = json_decode($conf, true);
	$json["user"] = $user;
	$json["discrip"] = "";
	$json["panel_name"] = $panel;
	if (! file_put_contents('file/'.$user.'/'.$panel.'-diagram.json', json_encode($json)))
	{
		echo "unable to create diagram file";
		return false;
	}
	if (! chmod('file/'.$user.'/'.$panel.'-diagram.json', 0777))
	{
		echo "unable to chmod diagram file";
		return false;
	}
	return true;
}
// call corresponding method according to $method
function callMethod ($func)
{
	if(is_null($func) || "" == $func || ! function_exists($func))
	{
		echo "invalid func: ".$func;
		return;
	}
	$func();
}
//call method specified by javascript
callMethod($_POST["func"]);
?>
