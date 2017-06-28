var excludeObj = new Array("0013","0015","0016","0017","0018","0019","0025","0026","0027","0028","0029","0030","0031","0032","0033","0034","0035","0036","0037","0038","0039","0040","0041","0042","0043","0044","0045","0046","0047","0048","0049","0050","0051","0052","0053","0054","0055","0056","0057","0058","0059","0060","0061","0062","0063","0064","0065","0066","0067","0068","0077","0078","0079","0080","0086","0089","0090","0091","0092","0093","0094","0095","0142","0143","0144","0145","0146","0147","0148","0149","0150","0151","0152","0153","0154","0155","0156","0157","0158","0159");
var chara1;
var chara2;

function getUrlParam(name) {
	if (window.location.href.indexOf('?') > 0){
		return window.location.href.substr(window.location.href.indexOf('?')+1).replace('fr_0','');
	}else{
		return '';
	}
}

function fixzero(id){
	var id_fixed = id.toString();
	while(id_fixed.length < 4){
		id_fixed = "0" + id_fixed;
	}
	return id_fixed;
}

var characterList = $('#characterList');
if (getUrlParam() != "" && getUrlParam() != undefined){
	CharacterTable = new Array({"id":getUrlParam(), "type": 1})
}

for (var index in CharacterTable){
	if (CharacterTable[index].type == 1){
		var charaid = fixzero(CharacterTable[index].id);
		if ($.inArray(charaid, excludeObj)<=-1){
			var option = $("<div></div>");
			option.attr("charaid", charaid).attr("charaname", CharacterTable[index].name).text(CharacterTable[index].name);
			option.css('background-image','url(assets/fr_'+$(this).attr('charaid')+'_0_th.png)');
			option.hover(function(){
				$(this).css('background-image','url(assets/fr_'+$(this).attr('charaid')+'_1_th.png)');
		    }, function(){
		    	$(this).css('background-image','url(assets/fr_'+$(this).attr('charaid')+'_0_th.png)');
			}).click(function(){
				characterList.removeClass("active");
				$(this).addClass("active");
				var charaid = $(this).attr('charaid');
				
				if (charaid != undefined){
					$('#captureresult').empty();
					if (chara1 != undefined) chara1.stop = true;
					canvas1.animate({opacity: 0, marginLeft: "-50%"}, 500, function(){
						chara1 = new CRChara({"id":charaid+"_0"}, canvas1, 
							function(){canvas1.animate({opacity: 1, marginLeft: 0}, 500);}).init();
					});
					if (chara2 != undefined) chara2.stop = true;
					canvas2.animate({opacity: 0, marginLeft: "150%"}, 500, function(){
						chara2 = new CRChara({"id":charaid+"_1"}, canvas2, 
							function(){canvas2.animate({opacity: 1, marginLeft: 0}, 500);}).init();
					});
				}
			});
			characterList.prepend(option);
		}
	}
}

var canvas1 = $('#canvas1');
var canvas2 = $('#canvas2');
characterList = $('#characterList>div');
$(characterList.get(0)).trigger('click');

var displaycount = 0;
$('#characterList').width(Math.floor($("#characterList").parent().width() / 80 - 3)*80)
var displayamount = Math.floor($("#characterList").width() / 80);
refreshcontrolbackground();
$(window).resize(function() {
	$('#characterList').width(Math.floor($("#characterList").parent().width() / 80 - 3)*80)
	displayamount = Math.floor($("#characterList").width() / 80);
	refreshcontrolbackground();
});
function scrollitems(action){
	var leftpos = $("#characterList").scrollLeft();
	displaycount += action * displayamount;
	if (displaycount < 0){displaycount = 0;}
	if (displaycount >= characterList.length){displaycount = characterList.length - displayamount;}
	
	try{
		leftpos = $("#characterList").scrollLeft() + characterList.get(displaycount).getBoundingClientRect().left;
		leftpos = leftpos - $("#characterList")[0].getBoundingClientRect().left; //width of button
	}catch(err){}
	$("#characterList").animate({scrollLeft: leftpos}, 500);
	
	if (action > 0){
		$('.control>div').animate({opacity: 0, left: "-100%"}, 250, function(){
			$('.control>div').css("left","100%");
			refreshcontrolbackground();
			$('.control>div').animate({opacity: 1, left: "5px"}, 250);
		});
	}else{
		$('.control>div').animate({opacity: 0, left: "100%"}, 250, function(){
			$('.control>div').css("left","-100%");
			refreshcontrolbackground();
			$('.control>div').animate({opacity: 1, left: "5px"}, 250);
		});
	}
	
	return false;
}
function refreshcontrolbackground(){
	if (displaycount >= 1){
		$('.control>div:eq(0)').css('background-image', $(characterList.get(displaycount-1)).css('background-image'));
	}else{$('.control>div:eq(0)').css('background-image', '');}
	var rightcount = displaycount + Math.floor($("#characterList").width() / 80);
	if (rightcount <= characterList.length - 2){
		$('.control>div:eq(1)').css('background-image', $(characterList.get(rightcount)).css('background-image'));
	}else{$('.control>div:eq(1)').css('background-image', '');}
}

$('.option .chara div').click(function(){
	$('#characterList div:not(:contains("'+$(this).attr('data')+'"))').hide();
	$('#characterList div:contains("'+$(this).attr('data')+'")').show();
	characterList = $('#characterList>div:visible');
	$("#characterList").scrollLeft(0);
	displaycount=0;
	refreshcontrolbackground();
});
var captureFrame1 = false;
var captureFrame2 = false;
$('.capture').click(function() {
	$("#captureresult").empty();
	captureFrame1 = true;
	captureFrame2 = true;
});