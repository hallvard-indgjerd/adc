const listTrigger='getSelectOptions';
const citySuggested = $("#citySuggested");
const form = $("[name='newArtifactForm']");
const toastToolBar = $('#toastBtn');
let dati={}
let tab=[]
let field=[]
let val=[]
let autocompleted = false;
let materialTechniqueArray = []
let listArray = [];
let listCatClass = {
  settings:{trigger:listTrigger,list:'list_category_class'},
  htmlEl: 'category_class',
  label: 'value'
}
let listMaterial = {
  settings: {trigger:listTrigger,list:'material'},
  htmlEl: 'material',
  label: 'value'
}
let listStoragePlace = {
  settings: {trigger:listTrigger, list:'institution', orderBy:'name'},
  htmlEl: 'storage_place',
  label: 'value'
}
let listConservationState = {
  settings: {trigger:listTrigger, list:'list_conservation_state', orderBy:'id'},
  htmlEl: 'conservation_state',
  label: 'value'
}
let listObjectCondition = {
  settings: {trigger:listTrigger, list:'list_object_condition', orderBy:'value'},
  htmlEl: 'object_condition',
  label: 'value'
}
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
let listCounty = {
  settings: {trigger:listTrigger, list:'county', orderBy:'name', filter:''},
  htmlEl: 'county',
  label: 'name'
}
let listCity = {
  settings: {trigger:listTrigger, list:'city', orderBy:'name', filter:''},
  htmlEl: 'city',
  label: 'name'
}
let jsonCity = {
  settings: {trigger:listTrigger, list:'', orderBy:'1', filter:''},
}
citySuggested.hide()
$("#resetMapDiv").hide();
mapInit()
map.fitBounds(mapExt)

listArray.push(listCatClass,listMaterial,listStoragePlace,listConservationState,listObjectCondition,listAuthor,listOwner,listLicense, listCounty)
listArray.forEach((item, i) => {getList(item.settings,item.htmlEl,item.label)});

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
  checkName({name:name,element:'artifact'})
})

$('#catSpecsMsg,#cityMsg').hide();
$(document).on('change', '#category_class', handleCategoryChange);
$('[name=resetMap]').on('click',function(e){
  e.preventDefault()
  e.stopPropagation()
  resetMapValue()
});
$("[name=confirmMaterial]").on('click', handleMaterialTechnique)

$("#is_museum_copy").on('click',function(){
  let label = $(this).is(':checked') ? 'yes' : 'no';
  $("label[for='is_museum_copy").text(label)
});

$("#county").on('change', function(){
  $("[name=city]").val('').attr({"data-cityid":''})
  $("#longitude, #latitude").val('')
  setMapExtent('jsonCounty',$(this).val())
  $("#resetMapDiv").show();
})

$("[name=city]").on({
  keyup: function(){
    let v = $(this).val()
    if(v.length >= 2){
      getCity(v)
    }else{
      citySuggested.html('').fadeOut('fast')
    }
  }
})

$(document).on('click', (event) => {
  if(!$(event.target).closest('#citySuggested').length &&
  $('#citySuggested').is(":visible")) {
    let city = $("[name=city]").val()
    $('#citySuggested').fadeOut('fast');
    if(city && !autocompleted){
      $("[name=city]").val('').attr({"data-cityid":''})
    }
  }
})

$("[name='newArtifact']").on('click', function(el){ newArtifact(el) })

function checkMaterialArray(){
  const mt = materialTechniqueArray.length
  const mtEl = document.getElementById('material')
  if (mt == 0) {
    alert('You have to add 1 material at least')
    mtEl.setCustomValidity('You have to add 1 material at least')
    return false;
  }else {
    mtEl.setCustomValidity('')
    return true;
  }
}

function newArtifact(el){
  checkMaterialArray()
  if (form[0].checkValidity()) {
    el.preventDefault()
    buildData()
    dati.trigger = 'addArtifact';
    dati.artifact_material_technique = materialTechniqueArray;
    if ($("#city").val()) {
      dati.artifact_findplace.city = $("#city").data('cityid')
    }
    ajaxSettings.url=API+"artifact.php";
    ajaxSettings.data = dati
    $.ajax(ajaxSettings)
    .done(function(data) {
      if (data.res==0) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        gotoIndex.appendTo(toastToolBar);
        gotoDashBoard.appendTo(toastToolBar);
        gotoNewItem.attr("href","artifact_view.php?item="+data.id).appendTo(toastToolBar);
        newRecord.appendTo(toastToolBar);
        $("#toastDivSuccess").removeClass("d-none")
      }
      $("#toastDivContent").removeClass('d-none')
    });
  }
}