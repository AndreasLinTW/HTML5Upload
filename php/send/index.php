<?php

$fsize = $_POST['size'];
$findex =$_POST['indexCount'];
$ftotal =$_POST['totalCount'];
$ftype = $_POST['type'];
$fdata = $_FILES['file'];
$fname = mb_convert_encoding($_POST['name'],"big5","utf-8");
$truename = mb_convert_encoding($_POST['trueName'],"big5","utf-8");
//$fname = $_POST['name'];

$path = "../../";
$dir = $path."source/".$truename."-".$fsize;
$save = $dir."/".$fname;
if(!is_dir($dir))
{
    mkdir($dir);
    chmod($dir,0777);
}

//讀取暫存檔案內容
$temp = fopen($fdata["tmp_name"],"r+");
$filedata = fread($temp,filesize($fdata["tmp_name"]));
//將分段內容存放到新建的暫存檔案裏面
if(file_exists($dir."/".$findex.".tmp")) unlink($dir."/".$findex.".tmp");
$tempFile = fopen($dir."/".$findex.".tmp","w+");
fwrite($tempFile,$filedata);
fclose($tempFile);

fclose($temp);

if($findex+1==$ftotal)
{
    if(file_exists($save)) @unlink($save);
    //迴圈讀取暫存檔案並將其合併置入新檔裏面
    for($i=0;$i<$ftotal;$i++)
    {
        $readData = fopen($dir."/".$i.".tmp","r+");
        $writeData = fread($readData,filesize($dir."/".$i.".tmp"));

        $newFile = fopen($save,"a+");
        fwrite($newFile,$writeData);
        fclose($newFile);

        fclose($readData);

        $resu = @unlink($dir."/".$i.".tmp");
    }
    $res = array("res"=>"success","url"=>mb_convert_encoding($truename."-".$fsize."/".$fname,'utf-8','big5'));
    echo json_encode($res);
}

?>
