<?php
$path = "./lib";
$dir = new DirectoryIterator($path);
foreach ($dir as $fileinfo) {
    if (/*$fileinfo->isDir() &&*/ !$fileinfo->isDot()) {
        //echo $fileinfo->getFilename()."\n";
        echo "<li>"."<em>".$fileinfo->getFilename()."</em>"."</li>"."\n";
    }
}
?>
