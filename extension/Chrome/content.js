// content.js

var renarration_enabled = 0;
var target_element;
var renarratedElement;
var target_element_style_border="";
var target_element_innerHTML="";
var target_element_className="";
var annotations = [];
var renarrations;
var renarrationTransforms = [];
var renarrationDiv;
var storedRenarrations = [];
var currentURL = document.location.href;
var renarrator = "A Person";
var renarratorEmail = "a.person@anonymous";
var renarrationStore = "https://oonserdbysewwersheryoula:64f4f6b854d2a118039e9a8116a49d4b65b1f12d@jants.cloudant.com/renos";
var annotationStore = "https://eyessometormentereeksmus:c113947ed248972ab87d0a3d7cfdd5d57a705047@jants.cloudant.com/annos";


chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" ) {
		if(renarration_enabled == 1){
			//alert("Renarration disabled!");
			renarration_enabled = 0;
			renarration.removeRenDiv();
		}
		else{
			renarration.createRenarrationDiv();
			//alert("Renarration enabled!");
			renarration_enabled = 1;
			annotation.getAnnotations();
			renarration.getRenarrations();
		}				
    }
  }
);

$('body').click(function(event) {
	var parentDiv = document.getElementById('renarrationDiv');
	if(renarration_enabled == 1 && window.event.srcElement.id!='renarrationDiv' && !$.contains(parentDiv, window.event.srcElement)){
		target_element = window.event.srcElement;
		
		renarratedElement = target_element;
		
		//alert(renarration.getXPath(target_element));
		var contentText = "";
		if(target_element.nodeName.toLowerCase() == 'img'){
			contentText = '<img src="' + target_element.src +'"></img>';
		}
		else{
			contentText = target_element.innerHTML;
		}
		renarration.updateRenarrationDivStyle(contentText);
    }
	else if(window.event.srcElement.id=='greenRNButton'){
		// Create Renarration Transform
		renarration.createRenarrationTransform();
	}
	else if(window.event.srcElement.id=='redRNButton'){
		// Close renarration interface 
		renarration.closeRenDiv();
	}
	else if(window.event.srcElement.id=='settingsRNButton'){
		renarration.settingsRenarrationDiv();
	}
	else if(window.event.srcElement.id=='apiSettings'){
		renarration.updateAPISettings();
	}
	else if(window.event.srcElement.id.indexOf('LoadRenarration')>=0){
		renarration.loadRenarration(window.event.srcElement.id);
	}	
	else if(window.event.srcElement.id=="saveRenarration"){
		renarration.createRenarration();
		//renarration.storeRenarration();
	}
	else if(window.event.srcElement.id=="CloseSettings"){
		renarration.closeRenDiv();
	}
});

$('body').mouseover(function(event) {
	var parentDiv = document.getElementById('renarrationDiv');
	if(renarration_enabled == 1 && window.event.srcElement.id!='renarrationDiv' && !$.contains(parentDiv, window.event.srcElement)){
		target_element = window.event.srcElement;
		target_element_style_border = target_element.style.border; 
		target_element.style.border ='2px dashed red';
	} 
	else {
		if(window.event.srcElement.id.indexOf("annotationId=")>-1){
			annotation.showAnnotationSelection(window.event.srcElement.id);
		}
	}
});

$('body').mouseout(function() {
	if(renarration_enabled == 1 && window.event.srcElement.id!='renarrationDiv' && !renarration.isDescendant(renarrationDiv, window.event.srcElement)){
		target_element.style.border = target_element_style_border;
	}
	else {
		if(window.event.srcElement.id.indexOf("annotationId=")>-1){
			annotation.copyStyleBackHoveredAnnotationElement(window.event.srcElement.id);
		}
	}
});

$('body').mouseup(function() {
	var annTable = document.getElementById("listOfAnnotationsTable");
	
	if(renarration_enabled == 1 && window.event.srcElement.id.indexOf("annotationId=")>=0){
		selection = window.getSelection();
		//alert(selection);
		var annId = window.event.srcElement.id.split("=")[1];
		//alert(annId);
		var annotationReferred = JSON.parse(annotations[annId]);
		var transformText = document.getElementById("renarrationTransform");
		transformText.value = transformText.value  + '[!Annotation=' + annotationReferred.id + '][' + selection +']\n';
	}
});

annotation = {
	getAnnotations: function(){
		annotations = [];
		
		
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.open( "POST", annotationStore+"/_find", false ); // false for synchronous request
		var data = {
					"selector": {
						"type": "Annotation",
						"target.source": currentURL
					},
					"limit": 20,
					"skip": 0
					};	
		
		xmlHttp.send(JSON.stringify(data));
		
		var json_response = JSON.parse(xmlHttp.responseText);
		
		
		// build annotations
		for(var i=0; i<json_response.docs.length; i++){
			annotations[i] = JSON.stringify(json_response.docs[i]);
		}
		
	},
	createHTMLFromAnnotations: function(){
		
	},
	annotationsSubDiv: function(){
		var annotationsSubDiv = document.createElement('div');
		annotationsSubDiv.setAttribute("id", "annotationsSubDiv");
		annotationsSubDiv.className = 'annotationDiv';
		var annotations_table = '';
		for(var i=0; i<annotations.length; i++){
			var current_annotation = JSON.parse(annotations[i]);
			annotations_table = annotations_table + 
								'<table id="listOfAnnotationsTable" width="100%"><tr bgcolor="#F6D5AD" id="annotationId=' + i +'"><td align="left">' + current_annotation.creator.name + '</td><td align="right">' + current_annotation.created + '</td></tr>' + 
								'<tr><td id="annotationId=' + i +'" colspan="2">' + current_annotation.body.text+ '</td></tr></table>';
		}
		if(annotations.length>0){
			annotationsSubDiv.innerHTML = '<b>Annotations</b><br>' + annotations_table;
		}
		return annotationsSubDiv;
	},	
	showAnnotationSelection: function(annotationId){
		var annId = parseInt(annotationId.substring(13));
		var selectedAnnotation = JSON.parse(annotations[annId]);
		
		// write more clever code
		if(selectedAnnotation.target.selector.type=="List"){
			var annElementInList;
			for(i=0; i<selectedAnnotation.target.selector.members.length; i++){
				
				if(selectedAnnotation.target.selector.members[i].type=="XPathSelector"){
					annElementInList = selector.getElementByXPath(selectedAnnotation.target.selector.members[i].value);	
					//alert(annElementInList.src);					
				}
				else {
					if(selectedAnnotation.target.selector.members[i].type=="FragmentSelector"){
						//alert(selectedAnnotation.target.selector.members[i].value);	
						var coordinates = selectedAnnotation.target.selector.members[i].value.substring(5).split(",");
						annotation.createImageSelection(annElementInList, Number(coordinates[0]), Number(coordinates[1]), Number(coordinates[2]), Number(coordinates[3]));
					}
					else {
						if(selectedAnnotation.target.selector.members[i].type=="TextQuoteSelector"){						
							$(annElementInList).highlight(selectedAnnotation.target.selector.members[i].exact);
						}
					}
				}						
			}
		}
		else{
			if(selectedAnnotation.target.selector.type=="XPathSelector"){
				if(selectedAnnotation.target.selector.hasOwnProperty('refinedBy')){
					//alert('Refined');
					var annElementInList = selector.getElementByXPath(selectedAnnotation.target.selector.value);
					if(selectedAnnotation.target.selector.refinedBy.type=="FragmentSelector"){
						//alert(selectedAnnotation.target.selector.members[i].value);	
						var coordinates = selectedAnnotation.target.selector.refinedBy.value.substring(5).split(",");
						annotation.createImageSelection(annElementInList, Number(coordinates[0]), Number(coordinates[1]), Number(coordinates[2]), Number(coordinates[3]));
					}
					else {
						if(selectedAnnotation.target.selector.refinedBy.type=="TextQuoteSelector"){						
							$(annElementInList).highlight(selectedAnnotation.target.selector.refinedBy.exact);
						}
					}
				}
				else{
					var target = selector.getElementByXPath(selectedAnnotation.target.selector.value);
					target_element_style_border = target.style.border; 
					target.style.border ='2px solid yellow';
				}		
			} 
			else { 
				if(selectedAnnotation.target.selector.type=="TextQuoteSelector"){							    
					$('body').highlight(selectedAnnotation.target.selector.exact);		
				}
			}
		}
	},
	copyStyleBackHoveredAnnotationElement: function(annotationId){
		var annId = parseInt(annotationId.substring(13));
		var selectedAnnotation = JSON.parse(annotations[annId]);
		
		if(selectedAnnotation.target.selector.type=="List"){
			var annElementInList;
			for(i=0; i<selectedAnnotation.target.selector.members.length; i++){
				
				if(selectedAnnotation.target.selector.members[i].type=="XPathSelector"){
					annElementInList = selector.getElementByXPath(selectedAnnotation.target.selector.members[i].value);	
					//alert(annElementInList.src);					
				}
				else {
					if(selectedAnnotation.target.selector.members[i].type=="FragmentSelector"){
						//alert(selectedAnnotation.target.selector.members[i].value);	
						var imageSelectionEl = document.getElementById("AnnImageSelection");
						imageSelectionEl.parentNode.removeChild(imageSelectionEl);
					}
					else {
						if(selectedAnnotation.target.selector.members[i].type=="TextQuoteSelector"){						
							$(annElementInList).removeHighlight(selectedAnnotation.target.selector.members[i].exact);
						}
					}
				}		
				
			}			
		}
		else{
			if(selectedAnnotation.target.selector.type=="XPathSelector"){ 		
				if(selectedAnnotation.target.selector.hasOwnProperty('refinedBy')){
					//alert('Refined');
					var annElementInList = selector.getElementByXPath(selectedAnnotation.target.selector.value);
					if(selectedAnnotation.target.selector.refinedBy.type=="FragmentSelector"){
						var imageSelectionEl = document.getElementById("AnnImageSelection");
						imageSelectionEl.parentNode.removeChild(imageSelectionEl);
					}
					else {
						if(selectedAnnotation.target.selector.refinedBy.type=="TextQuoteSelector"){						
							$(annElementInList).removeHighlight(selectedAnnotation.target.selector.refinedBy.exact);
						}
					}
				}
				else{
					var target = selector.getElementByXPath(selectedAnnotation.target.selector.value);
					target.style.border = target_element_style_border;
				}
			}
			else { 
				if(selectedAnnotation.target.selector.type=="TextQuoteSelector"){
					$('body').removeHighlight(selectedAnnotation.target.selector.exact);		
				}
			}			
		}
	},
	highlight: function(container,what,spanClass) {
		var content = container.innerHTML,
        pattern = new RegExp('(>[^<.]*)(' + what + ')([^<.]*)','g'),
        replaceWith = '$1<span ' + ( spanClass ? 'class="' + spanClass + '"' : '' ) + '">$2</span>$3',
        highlighted = content.replace(pattern,replaceWith);
		return (container.innerHTML = highlighted) !== content;
	},
	createImageSelection: function(img, x, y, w, h) {
		var pos = annotation.findPosition(img);

		var imageTop = pos.top + y - window.scrollY;
		var imageLeft = pos.left + x - window.scrollX;
		
		// create div for the selection of an image
		var imageSelection = document.createElement('div');
		
		// div properties
		imageSelection.style.position = 'fixed';
		imageSelection.style.top = imageTop.toString() + 'px';
		imageSelection.style.left = imageLeft.toString() + 'px';
		imageSelection.style.width = w.toString() + 'px';   
		imageSelection.style.height = h.toString() + 'px';
		imageSelection.style.position = 'fixed';
		imageSelection.style.display = 'block';
		imageSelection.style.border = 'thin solid yellow';
		imageSelection.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
		imageSelection.setAttribute("id", "AnnImageSelection");
		
		// append div as a child to the body
		document.getElementsByTagName('body')[0].appendChild(imageSelection);
	},
	findPosition: function (element) {
		var top = 0, left = 0;
		do {
			top += element.offsetTop  || 0;
			left += element.offsetLeft || 0;
			element = element.offsetParent;
		} while(element);

		return {top: top, left: left};
	}
}

selector = {
	getElementByXPath: function(xpath){
		return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	},
	getElementByCss: function(css){
		return document.querySelectorAll(css);
	}
}

renarration = {
	getRenarrations: function(){
		storedRenarrations = [];
		
		
		var xmlHttp = new XMLHttpRequest();
		
		xmlHttp.open( "POST", renarrationStore+"/_find", false ); // false for synchronous request
		var data ={
					"selector": {
						"@type": "rn:Renarration"
					},
					"limit": 10,
					"skip": 0
				};	
		
		xmlHttp.send(JSON.stringify(data));
		
		var json_response = JSON.parse(xmlHttp.responseText);
		
		
		// build annotations
		
		var j=0;
		for(var i=0; i<json_response.docs.length; i++){
			var current_ren = json_response.docs[i];
			
			if(current_ren.source["@id"]==currentURL){
				
				storedRenarrations[j] = JSON.stringify(json_response.docs[i]);
				j = j +1;
			}
		}
		
	},
	closeRenDiv: function(){
		var div = document.getElementById("renarrationDiv");
		$(div).remove();
		renarration.createRenarrationDiv();
	},
	removeRenDiv: function(){
		var div = document.getElementById("renarrationDiv");
		$(div).remove();
	},
	getXPath: function(element) {
		if (element===document.body)
			return '/html[1]/' + element.tagName.toLowerCase() + '[1]';

		var ix= 0;
		var siblings= element.parentNode.childNodes;
		
		for (var i= 0; i<siblings.length; i++) {
			var sibling= siblings[i];
			if (sibling===element)
				return renarration.getXPath(element.parentNode)+'/'+element.tagName.toLowerCase()+'['+(ix+1)+']';
			if (sibling.nodeType===1 && sibling.tagName===element.tagName)
			ix++;
		}
	},
	loadRenarration: function(renID){
		var ren_ID = renID.split("=")[1];
		var renToLoad = JSON.parse(storedRenarrations[ren_ID]);
		
		//alert(JSON.stringify(renToLoad));
		if(renToLoad.hasOwnProperty('transformList')){
			//alert(renToLoad.transformList.nodes.length);
			for(var i=0; i<renToLoad.transformList.nodes.length; i++){
				renarration.applyRenarrationTransformOnCurrentPage(renToLoad.transformList.nodes[i]);
			}
		}else{
			if(renToLoad.hasOwnProperty('transform')){				
				renarration.applyRenarrationTransformOnCurrentPage(renToLoad.transform);
			}
		}
	},
	applyRenarrationTransformOnCurrentPage: function(transform){
		var ren_Transform = transform;
		var elementOnTarget;
				
		// find target element
		if(ren_Transform.sourceSelection["@type"]=="rn:XPathSelector"){
			elementOnTarget = selector.getElementByXPath(ren_Transform.sourceSelection.value);
		}
		
		if(ren_Transform.action=="rn:Remove"){
				$(elementOnTarget).replaceWith('');
		}
		else{
			if(ren_Transform.action=="rn:Replace"){
				if(ren_Transform.hasOwnProperty('narration')){
					if(ren_Transform.narration["@type"]=="dctypes:Image"){
						$(elementOnTarget).replaceWith('<img src="' + ren_Transform.narration["@id"] + '"></img>');
					}
					else if(ren_Transform.narration["@type"]=="cnt:ContentAsText"){
						$(elementOnTarget).replaceWith(ren_Transform.narration["content"]);
					}
				}
				else{
					var textToReplace = "";
					//alert('Burdayim');
					for(var i=0; i<ren_Transform.narrationList.nodes.length; i++){
						var currNarration = ren_Transform.narrationList.nodes[i];
						
						if(currNarration["@type"]=="dctypes:Image"){
							//alert('Burdayim1');
							textToReplace = textToReplace + '<img src="' + currNarration["@id"] + '"></img>';
						}
						else if(currNarration["@type"]=="cnt:ContentAsText"){
							//alert('Burdayim2');
							textToReplace = textToReplace + currNarration["content"];
						}
					}
					$(elementOnTarget).replaceWith(textToReplace);
				}
			}
		}
	},
	updateAPISettings: function(){
		var renAPI = document.getElementById('renarrationAPI').value;
		var annAPI = document.getElementById('annotationAPI').value;
		
		
		renarrationStore = renAPI;
		
		annotationStore = annAPI;
		
		
		//alert(renarrationStore);
		renarration.getRenarrations();
		//alert(annotationStore);
		annotation.getAnnotations();
		
		var span = document.getElementById("apiSettingSpan");
		span.style.display = "block";
		
	},
	createRenarrationDiv: function(){
		var div = document.createElement( 'div' );
		document.body.appendChild( div );
		// Renarration Div ID
		div.setAttribute("id", "renarrationDiv");
		// Renarration Div Style
		div.className = 'wrap';
		//div.appendChild(renarration.renarrateSubDiv(innerHTML));
		//div.appendChild(annotation.annotationsSubDiv());
		div.innerHTML ='<button id="settingsRNButton" class="greenRNButton">&nbsp;&nbsp;&nbsp;...&nbsp;&nbsp;&nbsp;</button>';
		renarrationDiv = div;
	},
	settingsRenarrationDiv: function(){
		var renDiv = document.getElementById("renarrationDiv");
		$(renDiv).remove();
		var div = document.createElement( 'div' );
		document.body.appendChild( div );
		// Renarration Div ID
		div.setAttribute("id", "renarrationDiv");
		// Renarration Div Style
		div.className = 'wrap2';
		
		div.appendChild(renarration.renarrationSettingDiv());
		div.appendChild(renarration.createRenarrationList());
		renarrationDiv = div;
	},	
	createRenarrationList: function(){
		
		
		var div = document.createElement('div');
		div.setAttribute("id", "renarrationListDiv");
		
		div.className = 'renarrationListDiv';
	
		var renarrations_table = '';
		//alert(storedRenarrations.length);
		for(var i=0; i<storedRenarrations.length; i++){
			var current_renarration = JSON.parse(storedRenarrations[i]);
			renarrations_table = renarrations_table + 
								'<table width="100%"><tr bgcolor="#F6D5AD"><td align="left">' + current_renarration.renarrator.name + '</td><td align="right">' + current_renarration.renarratedAt + '</td></tr>' + 
								'<tr><td id="renarrationId=' + i +'" colspan="2">Motivation : ' + current_renarration.motivation + ' &nbsp;<button class="loadRNButton" id="LoadRenarration=' + i +'">Load Renarration</button></td></tr></table>';
		}
		if(storedRenarrations.length>0){
			div.innerHTML = '<b>Renarrations</b><br>' + renarrations_table;
		}
		return div;		
		
		
	},
	updateRenarrationDivStyle: function(innerHTML){
		var renDiv = document.getElementById("renarrationDiv");
		$(renDiv).remove();
		
		
		var div = document.createElement( 'div' );
		document.body.appendChild( div );
		// Renarration Div ID
		div.setAttribute("id", "renarrationDiv");
		// Renarration Div Style
		div.className = 'wrap2';
		div.appendChild(renarration.renarrateSubDiv(innerHTML));
		div.appendChild(annotation.annotationsSubDiv());
		renarrationDiv = div;
	},
	renarrateSubDiv: function(content){
		var renarrateSubDiv = document.createElement('div');
		renarrateSubDiv.setAttribute("id", "renarrateSubDiv");
		renarrateSubDiv.className = 'renarrationDiv';
		renarrateSubDiv.innerHTML = '<b>Original Content</b><br>' + content + '<br><br>' 
								  + '<b>Action</b><br><select id="renarration_action"><option value="rn:Replace" selected>Replace</option><option value="rn:Remove">Remove</option></select><br><br>'
								  + '<b>Alternative Content</b><br><textarea class="renarration_textArea" id="renarrationTransform"></textarea><br>'
								  + '<b>Language : </b><input type="Text" class="renarration_input" id="transformLanguage"></input><br>'
								  + '<table border="1" width="80%"><tr><td align="left"><button id="greenRNButton" class="greenRNButton">Alternate</button> &nbsp;<button id="redRNButton" class="redRNButton">&nbsp;Close&nbsp;</button></td></tr></table>';
		return renarrateSubDiv;
	},
	renarrationSettingDiv: function(){
		var renarrateSubDiv = document.createElement('div');
		renarrateSubDiv.setAttribute("id", "renarrateSubDiv");
		renarrateSubDiv.className = 'renarrationDiv';
		renarrateSubDiv.innerHTML = '<div width="95%" align="center"><center><button class="redRNButton" id="CloseSettings">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Close&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</button></center></div>'
								  + '<b><u>Renarration Settings</u></b><br>' 
								  + '<table class=""><tr><td align="left" class=""><b>Renarrator : </b></td><td><input type="Text" class="renarration_input" id="renarrator" value="' + renarrator + '"></input></td></tr>'
								  + '<tr><td align="left"><b>Email :</b></td><td><input class="renarration_input" type="Text" id="renarratorEmail" value="' + renarratorEmail + '"></input></td></tr></table>'
								  + '<b>Motivation :</b> <select id="renarration_motivation"><option value="rn:alternative">Alternative</option><option value="rn:correction">Correction</option><option value="rn:elaboration">Elaboration</option><option value="rn:simplification" selected>Simplification</option><option value="rn:translation">Translation</option></select><br>'
								  + '<button id="saveRenarration" class="createRNButton">Save Renarration</button><span id="renSaveSpan" style="display:none;">&#10004; Renarration is saved...</span><br><br>'
								  + '<b><u>API Settings</u></b><br>'
								  + '<b>Renarration API</b><br><input type="Text" id="renarrationAPI" class="api_input" value="' + renarrationStore + '"></input><br>'
								  + '<b>Annotation API</b><br><input type="Text" id="annotationAPI" class="api_input" value="' + annotationStore + '"></input><br>'
								  + '<button id="apiSettings" class="greenRNButton">Save API Settings</button><span id="apiSettingSpan" style="display:none;">&#10004; API settings changed...</span><br><br>';
								  
		return renarrateSubDiv;
	},			
	isDescendant: function(parent, child) {
		var node = child.parentNode;
		while (node != null) {
			if (node == parent) {
				return true;
			}
			node = node.parentNode;
		}
		return false;
	},
	createRenarrationTransform: function(){
		var transformJSON = {};
		var transformHTML = "";
		var action = document.getElementById("renarration_action");
		var dt = new Date();
		transformJSON["@type"] = "rn:RenarrationTransform";
		transformJSON["action"] = action.options[action.selectedIndex].value;
		transformJSON["createdAt"] = dt.toISOString();
		transformJSON["sourceSelection"] = {"@type": "rn:XPathSelector", "value": renarration.getXPath(renarratedElement)};
		transformJSON["language"] = document.getElementById("transformLanguage").value;
		
		if(transformJSON["action"]=="rn:Replace"){	
			
			//alert(JSON.stringify(transformJSON));
			
			var textTransform = document.getElementById('renarrationTransform').value.replace(/(\r\n|\n|\r)/gm,"");
			var transformArray = textTransform.split("[!");
			var narrationArray = [];
			var narIth = 0;
			for(var i=0; i<transformArray.length; i++){
				if(transformArray[i].length>0){
					var atomicTransform = transformArray[i].split('][');
					//alert(atomicTransform[0] + '--' + atomicTransform[1].substring(0, atomicTransform[1].length-1));
					if(atomicTransform[0]=="Text"){
						var nodeJSON = {};
						nodeJSON["@type"] = "cnt:ContentAsText";
						nodeJSON["content"] = atomicTransform[1].substring(0, atomicTransform[1].length-1);
						//alert(JSON.stringify(nodeJSON));
						narrationArray[narIth] = JSON.stringify(nodeJSON);
						narIth = narIth + 1;
						
						transformHTML = transformHTML + nodeJSON["content"];
					}
					else {
						if(atomicTransform[0]=="Image"){
							var nodeJSON = {};
							nodeJSON["@id"] = atomicTransform[1].substring(0, atomicTransform[1].length-1);
							nodeJSON["@type"] = "dctypes:Image";
							//alert(JSON.stringify(nodeJSON));
							narrationArray[narIth] = JSON.stringify(nodeJSON);
							narIth = narIth + 1;						
							transformHTML = transformHTML + "<img src='" + nodeJSON["@id"] + "'></img>";
						}
						else {
							if(atomicTransform[0].indexOf('Annotation=')>=0){
								var nodeJSON = {};
								nodeJSON["@type"] = "cnt:ContentAsText";
								nodeJSON["content"] = atomicTransform[1].substring(0, atomicTransform[1].length-1);							
								nodeJSON["accessedFrom"] = {"@id": atomicTransform[0].split('=')[1], "@type": "Annotation"};
							
								//alert(JSON.stringify(nodeJSON));
								narrationArray[narIth] = JSON.stringify(nodeJSON);
								narIth = narIth + 1;						
								
								transformHTML = transformHTML + nodeJSON["content"];
							}
						}					
					}				
				}
			}

			if(narIth>1){
				var narrationList = {};
				narrationList["@type"] = "rn:List";
				narrationList["nodes"] = [];
				
				for(var i=0; i<narrationArray.length; i++){
					narrationList["nodes"][i] = JSON.parse(narrationArray[i]);
				}
				
				transformJSON["narrationList"] = narrationList;
			}
			else{
				var narration = JSON.parse(narrationArray[0]);;
				transformJSON["narration"] = narration;
			}
		}
		renarrationTransforms[renarrationTransforms.length] = JSON.stringify(transformJSON);
		//alert(renarrationTransforms[renarrationTransforms.length-1]);
		//alert(transformHTML);
		$(renarratedElement).replaceWith(transformHTML);
		
		renarration.closeRenDiv();
	},
	createRenarration: function(){	
		var re_narration = {};
		var dt = new Date();
		var motivation = document.getElementById("renarration_motivation");
		re_narration["@id"] = renarration.generateUUID();
		re_narration["@type"] = "rn:Renarration";
		re_narration["renarratedAt"] = dt.toISOString();
		re_narration["renarrator"] = {"@type": "foaf:Person", "name": document.getElementById("renarrator").value};
		re_narration["source"] = {"@id": currentURL, "@type": "rn:Document"};
		re_narration["motivation"] = motivation.options[motivation.selectedIndex].value;
		
		if(renarrationTransforms.length>1){
			var transformList = {};
			transformList["@type"] = "rn:List";
			transformList["nodes"] = [];
			
			
			for(var i=0; i<renarrationTransforms.length; i++){
				transformList["nodes"][i] = JSON.parse(renarrationTransforms[i]);
			}		
			re_narration["transformList"] = transformList;
		}
		else{
			re_narration["transform"] = JSON.parse(renarrationTransforms[0]);
		}
		renarration.storeRenarration(re_narration);
		//alert(JSON.stringify(re_narration));
	},
	generateUUID: function(){
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = (d + Math.random()*16)%16 | 0;
				d = Math.floor(d/16);
				return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		    });
		return uuid;
	},
	storeRenarration: function(re_narration){
		xhr = new XMLHttpRequest();
		var url = renarrationStore;
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-type", "application/json");
		xhr.onreadystatechange = function () { 
			if (xhr.readyState == 4 && xhr.status == 200) {
				var json = JSON.parse(xhr.responseText);
				console.log(JSON.stringify(json))
			}
		}
		var data = JSON.stringify(re_narration);
		xhr.send(data);
		
		var span = document.getElementById("renSaveSpan");
		span.style.display = "block";
	}	
}