//
//
//
//
//
//


var nSlice_count = 100,//分段數
	nMin_size 	 = 0.5,//最小分段大小(M)
	nMax_size	 = 5,  //最大分段大小(M)
	sFile_type,		   //文件類型
	nFile_load_size,   //文件上傳部分大小
	nFile_size,		   //文件大小
	nPreuploaded = 0,  //上一次記錄上傳部分的大小
	bIs_uploading= false,//是否上傳中
	bStart_upload= false;//是否開始上傳


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
		timer = setInterval(uploadCount(e,fSize,conversion),300);
	};

	var floadend = function(e){
		if(reader.error){alert("上傳失敗,出現未知錯誤");clearInterval(timer);return;}
		clearInterval(timer);
		document.querySelector(".speed").innerHTML = "0k/s";
		document.querySelector(".left_time").innerHTML = "剩餘時間 | 00:00:00";
		var $res = e.target.responseText;
		if($res=="success") bIs_uploading =true;
		document.querySelector(".isCompleted").innerHTML="上傳狀態: " + (bIs_uploading?"上傳完成":"正在上傳..");
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
		document.querySelector(".isCompleted").innerHTML 	  ="上傳狀態: " + (bIs_uploading?"完成":"正在上傳中..");

		var fData = new FormData(form);
		var xhr = new XMLHttpRequest();
		xhr.upload.addEventListener("progress",fProgress,false);
		xhr.addEventListener("load",floadend,false);
		xhr.open("POST","php/");
		xhr.send(fData);
	};


	reader.readAsBinaryString(file);
}

function uploadCount(e,fSize,conversion){
	var upSize = e.loaded,
		perc = (upSize*100/fSize).toFixed(2) + "%";
	var speed = upSize - nPreuploaded;
	if(speed==0){clearInterval("timer");return;}
	var leftTime = conversion.secondsTotime(Math.round(fSize/speed));
	speed = conversion.bytesTosize(speed)+"/s";
	document.querySelector(".speed").innerHTML = speed;
	document.querySelector(".left_time").innerHTML = "剩餘時間 | " + leftTime;
	document.querySelector(".upload_percent").innerHTML = perc;
	document.querySelector(".upload_bar").style.width = perc;
	nPreuploaded = upSize;
}

function clearUploadFile(){
	var e = e || event;
	e.stopPropagation();
	e.preventDefault();
	document.querySelector(".upload_message_show").style.display = "none";
	document.getElementById("file").value = "";
}
