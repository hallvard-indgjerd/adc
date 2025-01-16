google.charts.load('current', {'packages':['corechart']});
let classid, classtype, storagePlaceMarker, findplaceMarker;
let markerArr={}
let polyArr={}
if($("[name=logged]").val() == 0){
  $("#itemTool, #statWrap").addClass('large');
}else{
  $("#itemTool").addClass(checkDevice()=='pc' ? 'small' :'large');
}

$("body").on('click',"#btWidescreen", function(){
  let div = ['artifact','geographic','model','media', 'stats']
  div.forEach((v)=>{ $("#"+v).toggleClass(v+'-primary ' + v +'-full') });
  resizeCanvas();
  setTimeout(function(){ artifactMap() },500) 
});

ajaxSettings.url=API+"artifact.php";
ajaxSettings.data={trigger:'getArtifact', id:artifactId};
$.ajax(ajaxSettings).done(function(data) {
  let artifact = data.artifact;
  console.log(data);
  classid = artifact.category_class_id;
  classtype = data.artifact.category_class;
  $("h2#title").text(artifact.name)
  Object.keys(artifact).forEach(function(key) {
    if(artifact[key] !== null && artifact[key] !== undefined) {
      artifact['is_museum_copy'] = artifact['is_museum_copy'] == 0 ? false : true;
      let statusClass = artifact['status_id'] == 1 ? 'alert-danger' : 'alert-success';
      $("#status").addClass(statusClass).text(artifact.status);
      if(key == 'notes' || key == 'description'){ artifact[key] = nl2br(artifact[key])}
      if(key == 'status'){ artifact[key] = 'The item status is: '+artifact[key] }
      $("#"+key).html(artifact[key])
    }else{
      if(!role){$("#"+key).parent('li').remove()}
      if(artifact.category_class_id == 128){
        $("#category_class").parent('li').remove()
        $("#category_specs").parent('li').remove()
      }
      if(artifact.conservation_state_id == 11){$("#conservation_state").parent('li').remove()}
      if(artifact.object_condition_id == 9){$("#object_condition").parent('li').remove()}
    }
  })

  if(data.crono){
    $("#timeline_serie").text("Reference timeline: "+data.crono.timeline)
    if(data.crono.start){
      $("#fromPeriodMacro").text(data.crono.start.macro)
      $("#fromPeriodGeneric").text(data.crono.start.generic)
      $("#fromPeriodSpecific").text(data.crono.start.spec)
    }else{
      $("#fromPeriod").remove()
    }

    if(data.crono.end){
      $("#toPeriodMacro").text(data.crono.end.macro)
      $("#toPeriodGeneric").text(data.crono.end.generic)
      $("#toPeriodSpecific").text(data.crono.end.spec)
    }else{
      $("#toPeriod").remove()
    }
  }else{
    $("#chronoSection").remove()
  }

  let material = data.artifact_material_technique;
  material.forEach((item) => {
    $("<li/>", {class:'list-group-item ps-0 pt-0'}).text(item.material +" / "+(item.technique ? item.technique : 'not defined') ).appendTo('#material>ol')
  });

  let institution = data.storage_place;
  let gMapLink = 'http://maps.google.com/maps?q='+institution.name.replace(/ /g,"+");
  $("#institutionLogo>img").attr("src", "img/logo/"+institution.logo)
  $("#storage_name").text(institution.name)
  $("#gMapLink").attr("href",gMapLink)
  $("#storage_address").text(institution.city+", "+institution.address)
  $("#storage_link").attr("href",institution.link).text(institution.link)
  markerArr.storage = [parseFloat(institution.lat), parseFloat(institution.lon)]

  if (data.artifact_findplace) {
    let findplace = data.artifact_findplace;
    if(findplace.county_id){polyArr.county=findplace.county_id}
    if(findplace.city_id){polyArr.city = findplace.city_id}
    if(findplace.latitude){
    markerArr.findplace = [parseFloat(findplace.latitude), parseFloat(findplace.longitude)]
    }
    Object.keys(findplace).forEach(function(key) {
      if(findplace[key]){
        if(key == 'notes'){ artifact[key] = nl2br(artifact[key])}
        $("#findplace_"+key).html(findplace[key])
      }else{
        $("#findplace_"+key).parent().remove()
      }
    })
  }else{
    if(!role){$("#findplaceAccordionSection").remove()}
  }

  if (typeof data.artifact_measure != "undefined") {
    let measure = data.artifact_measure;
    measure.forEach((item, i) => {
      Object.keys(item).forEach(function(key) {
        if (key == 'notes') {$("#measures_"+key).text(item[key])}
        if(item[key]){$("#"+key).text(item[key])}
      })
    });
  }else{
    if(!role){$("#measureAccordionSection").remove()} 
  }
  let metadata = data.artifact_metadata;
  $("#artifact_author>a").attr("href","person_view.php?person="+metadata.author.id).text(metadata.author.last_name+" "+metadata.author.first_name)
  $("#artifact_owner>a").attr("href","institution_view.php?institution="+metadata.owner.id).text(metadata.owner.name)
  $("#artifact_license>a").attr("href",metadata.license.link).text(metadata.license.license+" ("+metadata.license.acronym+")")

  if(data.model){
    // console.log(data.model);
    $("[name=editModelBtn],#editModelBtn>a").attr('href','model_edit.php?item='+data.model.model.id);
    let model = data.model.model_object[0];
    if (model.object) {
      if((role && role < 5) || (activeUser && model.author_id === activeUser)){
        $("[name=saveModelParam]").on('click', function(){
          let dati = buildModelParamArray()
          dati.model = model.id
          dati.trigger = 'updateModelParam'
          saveModelParam(dati)
        })
      }else{
        $("[name=saveModelParam]").remove()
      }
      $("#addModelBtn").remove();
      initModel(data.model)
      $("#toggleMenu").on('click', resizeDOM)
      $("#alertArtifactModelConnection").remove()
    }else{
      $("#3dhop > canvas, .modelTools, .model-accordion").remove()
    }
  }else {
    $("#3dhop > canvas, .modelTools, .model-accordion").remove()
    let noModelDiv = $("<div/>",{id:'alertModel'}).appendTo("#3dhop");
    $("<div/>",{class:'alert alert-info fs-3'}).text('Model not yet available!!').appendTo(noModelDiv);
    $("#editModelBtn").remove();
  }
  

  if(data.media){
    let navTabs = $("<ul/>",{class:'nav nav-tabs', id:'mediaTabs', role:'tablist'}).appendTo("#media")
    let navPanes =$("<div/>",{class:"tab-content", id:"mediaContent"}).appendTo("#media")
    const type = groupBy(['type']);
    let group = type(data.media);
    
    Object.entries(group).forEach(function(element,idx) {
      let active = idx == 0 ? 'active' : '';
      let show = idx == 0 ? 'show' : '';
      let elTab = $("<li/>", {class:'nav-item', role:'presentation'}).appendTo(navTabs)
      $("<button/>",{class:'nav-link '+active, id: element[0]+'Tab', type:'button', role:'tab'}).attr({"data-bs-toggle":'tab', "data-bs-target":'#'+element[0]+'Pane'}).text(element[0]).appendTo(elTab)

      let panes = $("<div/>", {class:'bg-light p-3 tab-pane fade '+show+' '+active, id: element[0]+'Pane', role:'tabpanel'}).appendTo(navPanes)

      if(element[0] == 'image'){
        let imgDiv = $("<div/>",{id:'imgDiv'}).appendTo('#imagePane')
        element[1].forEach(img => {
          let imgWrap = $("<div/>",{class:'imgCard bg-white rounded border p-2 mb-3'}).appendTo(imgDiv)
          let figure = $("<figure/>",{class:'figure m-0'}).appendTo(imgWrap)
          $("<img/>",{class:'figure-img img-fluid rounded', src:"./archive/image/"+img.path}).appendTo(figure);
          $("<figcaption/>",{class:'figure-caption', text:img.text}).appendTo(figure)
          let toolImage = $("<div/>", {class:'btn-group btn-group-sm mt-3 text-end', role:'group'}).appendTo(imgWrap);
          $("<button/>",{type:'button', class:'btn btn-sm btn-adc-blue', title:'expand image'}).html('<span class="mdi mdi-magnify-expand"></span>').appendTo(toolImage).tooltip({placement:'top',fallbackPlacements: []}).on('click', function(){fullImage(img)})
          if (activeUser) {
            $("<button/>",{type:'button', class:'btn btn-sm btn-adc-blue'}).html('<span class="mdi mdi-file-document-edit"></span>').appendTo(toolImage).on('click', function(){ imageMetadataEdit(img) })
            $("<button/>",{type:'button', class:'btn btn-sm btn-danger'}).html('<span class="mdi mdi-delete-forever"></span>').appendTo(toolImage).on('click',function(){
              let deleteImgAlert = 'Are you sure you want to delete the image? If you confirm the image will be permanently deleted from the server and it will not be possible to restore it'
              if (confirm(deleteImgAlert)) {
                deleteImage(img.file,img.path)
                return false;
              }
            })
          }
        });
      }

      if(element[0] == 'document'){
        let ul = $("<ul/>", {class:"list-group list-group-flush"}).appendTo("#documentPane")
        element[1].forEach(doc => {
          let li = $("<li/>",{class:'list-group-item'}).appendTo(ul)
          if(doc.path && doc.path != ''){
            let divFile = $("<div/>",{class:'d-block'}).appendTo(li)
            $("<span/>",{text:'download file: '}).appendTo(divFile)
            $("<a/>",{href:'./archive/document/'+doc.path, text:doc.path}).appendTo(divFile)
          }
          if(doc.url && doc.url != ''){
            let divUrl = $("<div/>",{class:'d-block'}).appendTo(li)
            $("<span/>",{text:'external resource: '}).appendTo(divUrl)
            $("<a/>",{href:doc.url, text:doc.url, target:'_blank'}).appendTo(divUrl)
          }
          let divText = $("<div/>",{class:'d-block'}).appendTo(li)
          $("<small/>",{class:'text-secondary',text:doc.text}).appendTo(divText)
        })
      }

      if(element[0] == 'video'){
        let videoDiv = $("<div/>",{id:'videoDiv'}).appendTo('#videoPane')
        element[1].forEach(video => {
          let divVideo = $("<div/>",{class:'mb-3 embed-responsive embed-responsive-16by9'}).appendTo(videoDiv)
          $("<iframe/>",{class:'embed-responsive-item', src:video.url.replace('watch?v=','embed/')}).prop('allowfullscreen', true).appendTo(divVideo)
          $("<small/>",{class:'text-secondary',text:video.text}).appendTo(divVideo)
        })
      }
    })
    
  }

  artifactMap()
  lineChart(classid,classtype)
  columnChart(classid,classtype)
  mapChart(classid,classtype)
});

function imageMetadataEdit(img){
  $("#text").val(img.text);
  $("#downloadable").prop("checked", img.downloadable);
  let settings =  {trigger:'getSelectOptions', list:'license', orderBy:'name'}
  getList(settings,'license','name')
  let interval = setInterval(function() {
    if ($('#license option').length > 0) {
      clearInterval(interval); // Ferma il controllo periodico
      $('#license').val(img.license_id); // Imposta il valore selezionato
    }
  }, 100); 
  $("#imageMetadataModal").modal('show')
  $("#updateImage").on('click', function(e){
    const form = $("#editImage")[0];
    if (form.checkValidity()) {
      e.preventDefault();
      let dati = {trigger:'editImage', id:img.file}
      dati.text = $("#text").val()
      dati.license = $("#license").val()
      dati.downloadable = $('#downloadable').is(':checked') ? 1 : 0;
      ajaxSettings.url=API+"file.php";
      ajaxSettings.data = dati
      $.ajax(ajaxSettings)
      .done(function(data) {
        if (data.res==0) {
          $("#toastDivError .errorOutput").text(data.output);
          $("#toastDivError").removeClass("d-none");
        }else {
          $(".toastTitle").text(data.output)
          $("#toastDivSuccess").removeClass("d-none")
          setTimeout(function(){location.reload(); }, 3000);
        }
        $("#toastDivContent").removeClass('d-none')
      }).fail((jqXHR, errorMsg) => {console.log(jqXHR.responseText, errorMsg)});
    }
  })
}

function deleteImage(id,img){
  let dati={trigger:'deleteImg', id:id, img:img}
  ajaxSettings.url=API+"file.php";
  ajaxSettings.data = dati
  $.ajax(ajaxSettings)
    .done(function(data) {
      if (data.error==1) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        $("#toastDivSuccess").removeClass("d-none")
        setTimeout(function(){ location.reload(); }, 3000);
      }
      $("#toastDivContent").removeClass('d-none')
    }).fail((jqXHR, errorMsg) => {console.log(jqXHR.responseText, errorMsg)});
}

function fullImage(img){
  let imgPath = "./archive/image/"+img.path;
  let licensePath = "./assets/license/"+img.deed;
  $("#downloadImg").css("display",img.downloadable ? 'block' : 'none');
  $("#fullScreenImg").fadeIn('fast', function(){
    $("#modalImg").attr("src",imgPath)
    $("#licenseLink").text(img.license+" ("+img.acronym+")").attr("href",img.link)
    $("#downloadImg").on('click', function(){downloadZip(imgPath,licensePath)})
    $("#closeFullScreenImage").on('click', function(){ 
      $("#fullScreenImg").fadeOut('fast', function(){
        $("#modalImg").attr("src","")
        $("#licenseLink").text('').attr("href",'')
      }); 
    })
  }).css("display","flex")
}

function downloadZip(imagePath, licensePath) {
  var zip = new JSZip();
  fetch(imagePath)
    .then(response => response.blob())
    .then(imageBlob => {
      zip.file("image.jpg", imageBlob);
      return fetch(licensePath);
    })
    .then(response => response.text())
    .then(licenseText => {
      zip.file("license.txt", licenseText);
      return zip.generateAsync({ type: "blob" });
    })
    .then(blob => { saveAs(blob, "download.zip"); })
    .catch(error => { console.error("Errore nella creazione dello zip:", error); });
}


function mapChart(id,type){
  $("#mapChartTitle").text(type)
  ajaxSettings.url=API+"stats.php";
  ajaxSettings.data={
    trigger:'artifactByCounty',
    filter:["artifact.category_class = "+id]
  };
  $.ajax(ajaxSettings)
  .done(function(data) { mapStat(data); })
}

function lineChart(id,type){
  let statData = [['chronology', 'tot']]
  ajaxSettings.url=API+"stats.php";
  ajaxSettings.data={trigger:'typeChronologicalDistribution', type:id};
  $.ajax(ajaxSettings).done(function(data) {
    data.forEach((v) => { statData.push([v.crono, v.tot]) })
    google.charts.setOnLoadCallback(function(){
      var data = google.visualization.arrayToDataTable(statData);
      var options = {
        title: type + ' Chronological distribution',
        curveType: 'function',
        legend: { position: 'bottom' },
        pointsVisible: true
      };
      var chart = new google.visualization.LineChart(document.getElementById('lineChart'));
      chart.draw(data, options);
    });
  })
}

function columnChart(id, type){
  let statData = [['chronology', 'tot', { role: 'style' }]]
  ajaxSettings.url=API+"stats.php";
  ajaxSettings.data={
    trigger:'typeInstitutionDistribution',
    filter:["a.category_class = "+id]
  };
  $.ajax(ajaxSettings).done(function(data) {
    data.forEach((v) => { statData.push([v.name, v.tot, 'color: '+v.color]) })
    google.charts.setOnLoadCallback(function(){
      var data = google.visualization.arrayToDataTable(statData);
      var options = {
        title: 'Number of '+type + ' by Institution',
        legend: { position: 'none' },
        // bar:{groupWidth:"95%" }
      };
      var chart = new google.visualization.ColumnChart(document.getElementById('columnChart'));
      chart.draw(data, options);
    });
  })
}

function resizeDOM(){
  setTimeout(function() {
    lineChart(classid,classtype)
    columnChart(classid,classtype)
    resizeCanvas()
    }, 500);
}