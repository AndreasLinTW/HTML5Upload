//
//
//
//
//
//


var nSlice_count = 100,//分段數
	nFactCount,		   //實際分段數
	nMin_size 	 = 0.5,//最小分段大小(M)
	nMax_size	 = 5,  //最大分段大小(M)
	nFactSize,		   //實際分段大小
	nCountNum	 = 0,  //分段標號
	sFile_type,		   //文件類型
	nFile_load_size,   //檔上傳部分大小
	nFile_size,		   //文件大小
	nPreuploaded = 0,  //上一次記錄上傳部分的大小
	bIs_uploading= false,//是否上傳中
	bStart_upload= false,//是否開始上傳
	bEnd_upload  = false;//是否上傳完成


function init(){
	var $con = document.getElementById("submit").value;

	bStart_upload = ($con=="上傳"?true:false);
	if(bStart_upload)
	{
		if(!bEnd_upload)
		document.getElementById("submit").value = "暫停";
	}
	else
	{
		clearTimeout('timer');
		document.getElementById("submit").value = "上傳";
	}
	if(!bEnd_upload && bStart_upload)
	startUpload();
}

function startUpload(){
	var form = document.forms["upload_form"];
	if(form["file"].files.length<=0)
	{
		alert("請先選擇文件，然後再點擊上傳");
		return;
	}

	var file = form["file"].files[0];

	var get_file_message = (function(){

		var get_message = {
			get_name:function(){
				return file.name;
			},
			get_type:function(){
				return file.type;

			},
			get_size:function(){
				return file.size;
			},
			getAll:function(){
				return {
					fileName : this.get_name(),
					fileSize : this.get_size(),
					fileType : this.get_type()
				}
			}
		};
		return get_message;
	})();

	var conversion = (function(){
		var unitConversion = {
			bytesTosize:function(data){
				var unit = ["Bytes","KB","MB","GB"];
				var i = parseInt(Math.log(data)/Math.log(1024));
				return (data/Math.pow(1024,i)).toFixed(1) + " " + unit[i];
			},
			secondsTotime:function(sec){
				var h = Math.floor(sec/3600),
					m = Math.floor((sec-h*3600)/60),
					s = Math.floor(sec-h*3600-m*60);
				if(h<10) h = "0" + h;
				if(m<10) m = "0" + m;
				if(s<10) s = "0" + s;

				return h + ":" + m + ":" + s + ":";
			}
		};

		return unitConversion;
	})();

	//start sending
	var reader = new FileReader();
	var timer;

	var fProgress = function(e){
		var fSize = get_file_message.getAll().fileSize;
		timer = setTimeout(uploadCount(e,fSize,conversion),300);
	};

	var floadend = function(e){
		if(reader.error){alert("上傳失敗,出現未知錯誤");clearTimeout(timer);return;}
		clearTimeout(timer);
		if(nCountNum+1!=nFactCount)
		{
			if(bStart_upload)
			{
				nCountNum++;
				uploadStart();
				return;
			} else {
				document.querySelector(".speed").innerHTML = "0k/s";
				document.querySelector(".left_time").innerHTML = "剩餘時間 | 00:00:00";
				return;
			}
		}

		bEnd_upload = true;
		document.querySelector(".speed").innerHTML = "0k/s";
		document.querySelector(".left_time").innerHTML = "剩餘時間 | 00:00:00";
		document.querySelector(".upload_percent").innerHTML = "100.00%";
		document.getElementById("submit").value = "上傳";
		document.querySelector(".upload_bar").style.width = "100%";

		var $res = JSON.parse(e.target.responseText);
		filePreview($res);
		if($res.res=="success") bIs_uploading =true;
		document.querySelector(".isCompleted").innerHTML="上傳狀態: " + (bIs_uploading?"上傳完成":"正在上傳..");
	};

	var uploadStart = function(){
		var get_all = get_file_message.getAll();
		var start = nCountNum * nFactSize,
			end   = Math.min(start+nFactSize,get_all.fileSize);

		var fData = new FormData();

		fData.append("file",file.slice(start,end));
		fData.append("name",file.name);
		fData.append("size",file.size);
		fData.append("type",file.type);
		fData.append("totalCount",nFactCount);
		fData.append("indexCount",nCountNum);
		fData.append("trueName",file.name.substring(0,file.name.lastIndexOf(".")));

		if(!sFile_type)
		sFile_type = file.type.substring(0,file.type.indexOf("/"));
		var xhr = new XMLHttpRequest();
		xhr.upload.addEventListener("progress",fProgress,false);
		xhr.addEventListener("load",floadend,false);
		xhr.addEventListener("error",errorUp,false);
		xhr.addEventListener("abort",abortUp,false);

		xhr.open("POST","php/");
		xhr.send(fData);
	};

	reader.onloadstart = function(){
		var get_all = get_file_message.getAll(),
			fName = get_all.fileName,
			fType = get_all.fileType,
			fSize = conversion.bytesTosize(get_all.fileSize);

		document.querySelector(".upload_message_show").style.display = "block";
		document.querySelector(".upload_file_name").innerHTML ="檔案名稱: " + fName;
		document.querySelector(".upload_file_type").innerHTML ="文件類型: " + fType;
		document.querySelector(".upload_file_size").innerHTML ="文件大小: " + fSize;
		document.querySelector(".isCompleted").innerHTML      ="上傳狀態: " + (bIs_uploading?"完成":"正在上傳中..");

		nFactSize = get_all.fileSize/nSlice_count;
		nFactSize = (nFactSize>=nMin_size*1024*1024?nFactSize:nMin_size*1024*1024);
		nFactSize = (nFactSize<=nMax_size*1024*1024?nFactSize:nMax_size*1024*1024);
		nFactCount= Math.ceil(get_all.fileSize/nFactSize);

		uploadStart();
	};


	reader.readAsBinaryString(file);
}

function uploadCount(e,fSize,conversion){
	var upSize = e.loaded+nCountNum*nFactSize,
		perc = (upSize*100/fSize).toFixed(2) + "%";
	var speed = Math.abs(upSize - nPreuploaded);
	if(speed==0){clearTimeout("timer");return;}
	var leftTime = conversion.secondsTotime(Math.round((fSize-upSize)/speed));
	speed = conversion.bytesTosize(speed)+"/s";
	document.querySelector(".speed").innerHTML = speed;
	document.querySelector(".left_time").innerHTML = "剩餘時間 | " + leftTime;
	document.querySelector(".upload_percent").innerHTML = perc;
	document.querySelector(".upload_bar").style.width = perc;
	nPreuploaded = upSize;
}

function messageChange(){
	document.querySelector(".upload_file_name").innerHTML ="檔案名稱: " ;
	document.querySelector(".upload_file_type").innerHTML ="文件類型: " ;
	document.querySelector(".upload_file_size").innerHTML ="文件大小: " ;
	document.querySelector(".isCompleted").innerHTML      ="上傳狀態: " ;
	document.querySelector(".upload_bar").style.width = "0%";
	document.querySelector(".upload_percent").innerHTML = "0%";
	document.querySelector(".upload_file_preview").innerHTML ="";
	document.querySelector(".upload_message_show").style.display = "none";
}

function clearUploadFile(){
	var e = e || event;
	e.stopPropagation();
	e.preventDefault();
	document.getElementById("file").value = "";
	bStart_upload = false;
	messageChange();
}


function fileReady(){
	bIs_uploading = false;
	bEnd_upload = false;
	nCountNum = 0;
	bStart_upload = false;
	messageChange();
}


function errorUp(){
	bStart_upload = false;
	document.querySelector(".upload_file_error").innerHTML = "上傳過程中出錯";
}

function abortUp(){
	bStart_upload = false;
	document.querySelector(".upload_file_error").innerHTML = "網路故障，請檢查重試";
}

function filePreview($src){
	var ftype = sFile_type;
	var $temp;
	var IMGMaxHeight = document.querySelector(".upload_message_show").offsetHeight;
	switch(ftype){
		case "image" :
		$temp = '<img src="upload/'+$src.url+'" style="max-height:'+IMGMaxHeight+'px;margin-left:30%;">';
		break;
		case "audio" :
		$temp = '<audio src="upload/'+$src.url+'" controls="controls"></audio>';
		break;
		case "video" :
		$temp = '<video src="upload/'+$src.url+'" controls="controls"></video>';
		break;
	}
	var IsPreview = checkUserAgent();

	if(IsPreview)
	document.querySelector(".upload_file_preview").innerHTML = $temp;
}

function checkUserAgent(){
	var msg = true;
	var agent = ["ipod","iphone","android","symbian","windows mobile"];
	var info =navigator.userAgent.toLowerCase();

	for(var i=0,j=agent.length;i<j;i++)
	{
		if(info.indexOf(agent[i])>0)
		msg = false;
	}

	return msg;
}
