const model =$("[name=model]").val()
const object =$("[name=item]").val()
const form = $("[name=editObjForm]")[0];
const uuid = self.crypto.randomUUID();
const nxz = document.getElementById('nxz');
const thumb = document.getElementById('thumb');
const endpoint = 'api/modelPreview.php';
const thumbEndpoint = 'api/modelThumbUpload.php';
const toastToolBar = $('#toastBtn');

const listTrigger='getSelectOptions';
let listArray = [];
let listAuthor = {
  settings: {trigger:listTrigger, list:'user', orderBy:'name'},
  htmlEl: 'author',
  label: 'name'
}
let listOwner = {
  settings: {trigger:listTrigger, list:'institution', orderBy:'name'},
  htmlEl: 'owner',
  label: 'value'
}
let listLicense = {
  settings: {trigger:listTrigger, list:'license', orderBy:'name'},
  htmlEl: 'license',
  label: 'name'
}
let listMethod = {
  settings: {trigger:listTrigger, list:'list_model_acquisition', orderBy:'value'},
  htmlEl: 'acquisition_method',
  label: 'value'
}
listArray.push(listAuthor,listOwner,listLicense,listMethod)
listArray.forEach((item, i) => {getList(item.settings,item.htmlEl,item.label)});


$(document).ready(function () {
  getObject()
  $("#wrapViewSpot").remove()
  $(".closeTip").on('click', function(){
    $(this).text($(this).text()==='view tip' ? 'hide tip' : 'view tip')
  })
  $("#progressBar,#thumbWrap, #nxzWrap, [name=enlargeScreen],#object-control").hide()
  $("[name=nxz]").on('change', uploadFile);
  $("[name=thumb]").on('change', showPreview);
  $("[name=saveObj]").on('click', save);
  $("[name=checkNameBtn]").on('click', function(){
    let name = $("#name").val()
    if(!name){
      alert('The field is empty, enter a value and retry')
      return false;
    }
    if(name.length < 5){
      alert('The name must be 5 characters at least')
      return false;
    }
    checkName({name:name,element:'model'})
  })
  
  $("[name=measure_unit").on('change', function(){
    if($(this).val()){
      $("#uploadTip").text('To prevent the file from overwriting other files with the same name, the system will assign a unique id as the name of the file')
      $("#nxzWrap").show();
      measure_unit = $(this).val()
    }
  })
  
  $("[name=saveModelParam").remove()
});

function getObject(){
  ajaxSettings.url=API+'model.php';
  ajaxSettings.data={trigger:'getObject', id:object};
  $.ajax(ajaxSettings)
  .done(function(data) {
    console.log(data);
    let status_label = 'mark object as ';
    $("#author ").val(data.author)
    $("#owner").val(data.owner)
    $("#license").val(data.license)
    $("#object_description").val(data.description)
    $("#object_note").val(data.note)
    $("#acquisition_method").val(data.acquisition_method)
    $("#measure_unit").val(data.measure_unit)
    $("#software").val(data.software)
    $("#points").val(data.points)
    $("#polygons").val(data.polygons)
    $("#textures").val(data.textures)
    $("#scans").val(data.scans)
    $("#pictures").val(data.pictures)
    $("#encumbrance").val(data.encumbrance)
    $("#status").val(data.status == 1 ? 2 :1)
    $("label[for=status]").text(data.status == 1 ? status_label+'complete' : status_label+'under processing')
  });
}

function checkFiles(){
  const nxz = document.getElementById('nxz')
  const thumb = document.getElementById('thumb')
  if(!nxz.value){
    alert('Please select a valid model file from your computer');
    return false;
  }
  if(!thumb.value){
    alert('Please take a screenshot and upload it before saving');
    return false;
  }
  return true;
}

function save(btn){
  if (form.checkValidity()) {
    btn.preventDefault();
    let dati = {
      trigger: 'updateObjectMetadata', 
      model_object:{id:object},
      model_param:{object:object}};
    $("[data-table").each(function(){
      let table = $(this).data("table");
      let id=$(this).attr('id');
      if (!$(this).is(':checkbox')) {
        if($(this).is('input[type="number"]') && !$(this).val()){$(this).val(0)}
        if(id == 'object_description'){id='description'}
        if(id == 'object_note'){id='note'}
        dati[table][id]=$(this).val()
      } else {
        if ($(this).is(':checked')) { 
          dati[table][id]=$(this).val()
        }
      }
    })
    
    ajaxSettings.url=API+'model.php';
    ajaxSettings.data = dati;

    $.ajax(ajaxSettings)
    .done(function(data) {
      console.log(data);
      if (data.res==0) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        $("#toastDivSuccess").removeClass("d-none")
        setTimeout(function(){ window.location.href="model_view.php?item="+model; }, 3000);
      }
      $("#toastDivContent").removeClass('d-none')
    });
  }
}

function uploadFile(){
  let val = nxz.value.split('.').pop()
  if(val !== 'nxz'){
    el("status").innerHTML = "Sorry but you can upload only nxz files. You are trying to upload a "+val+" file type";
    return false;
  }
  var nxzUpload = new FormData();
  nxzUpload.append("nxz", nxz.files[0], nxz.files[0].name);
  var ajax = new XMLHttpRequest();
  $("#progressBar").show()
  ajax.upload.addEventListener("progress", progressHandler, false);
  ajax.addEventListener("load", completeHandler, false);
  ajax.addEventListener("error", errorHandler, false);
  ajax.addEventListener("abort", abortHandler, false);
  ajax.open("POST", endpoint);
  ajax.send(nxzUpload);
}

function progressHandler(event){
  el("loaded_n_total").innerHTML = "Uploaded "+event.loaded+" bytes of "+event.total;
  var percent = (event.loaded / event.total) * 100;
  el("progressBar").value = Math.round(percent);
  el("status").innerHTML = Math.round(percent)+"% uploaded... please wait";
}
function completeHandler(event){
  $("#progressBar").hide()
  el("status").innerHTML = event.target.responseText;
  el("progressBar").value = 0;
  $("#alertBg").remove()
  $("#uploadTip").text("Before saving the model, take a screenshot of canvas and upload it as thumbnail preview for use in the gallery")
  $("#thumbWrap").show()
  scene = {
    meshes: {"nxz" : { url: 'archive/models/preview/'+nxz.files[0].name }},
    modelInstances : instanceOpt,
    trackball: trackBallOpt,
    space: spaceOpt,
    config: configOpt
  }
  init3dhop();
  presenter = new Presenter("draw-canvas");
  presenter.setScene(scene);
  presenter._onEndMeasurement = onEndMeasure;
  presenter._onEndPickingPoint = onEndPick;
  presenter.setClippingPointXYZ(0.5, 0.5, 0.5);
  gStep = 1.0;
  startupGrid('gridBase')
  //light component
  setupLightController()
  resizeLightController()
  updateLightController(lightDir[0],lightDir[1])
  if(!el('encumbrance').value){setTimeout(computeEncumbrance,200)}
}
function errorHandler(event){
  el("status").innerHTML = "Upload Failed";
  console.log(event);
}
function abortHandler(event){
  el("status").innerHTML = "Upload Aborted";
  console.log(event);
}