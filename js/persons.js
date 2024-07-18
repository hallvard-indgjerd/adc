const apiPerson = API+"person.php";
const trigger = 'updatePerson'
const personMainFieldForm = document.getElementById('usrMainFieldForm')
const personAffiliationForm = document.getElementById('usrAffiliationForm') 
const personalInformationForm = document.getElementById('personalInformationForm') 
const toastToolBar = $('#toastBtn');


$("#changeUsrMainFieldBtn").on('click', function(el){ changePersonMainField(el) })
$("#changeUsrAffiliationBtn").on('click', function(el){ changePersonAffiliation(el) })
$("#changePersonalInformationBtn").on('click', function(el){ changePersonInformation(el) })

function getPerson(person) {
  ajaxSettings.url=apiPerson;
  ajaxSettings.data={trigger:'getPerson', id:person}
  $.ajax(ajaxSettings)
  .done(function(data) {
    console.log(data);
    $("#first_name").val(data.first_name)
    $("#last_name").val(data.last_name)
    $("#email").val(data.email)
    if(data.institution_id){
      $("#institution option[value="+data.institution_id+"]").prop('selected',true)
    }
    if(data.position_id){
      $("#position option[value="+data.position_id+"]").prop('selected',true)
    }
    $("#city").val(data.city)
    $("#address").val(data.address)
    $("#phone").val(data.phone)
  });
}

function changePersonMainField(btn) {
  if(personMainFieldForm.checkValidity()){
    btn.preventDefault();
    ajaxSettings.url=apiPerson;
    ajaxSettings.data={
      trigger : trigger,
      id : person,
      first_name : $("#first_name").val(),
      last_name : $("#last_name").val(),
      email : $("#email").val()
    }
    saveInfo(ajaxSettings)
  }
}

function changePersonAffiliation(btn) {
  if(personAffiliationForm.checkValidity()){
    btn.preventDefault();
    ajaxSettings.url=apiPerson;
    ajaxSettings.data={
      trigger: trigger,
      id:person,
      institution : $("#institution").val(),
      position : $("#position").val()
    }
    saveInfo(ajaxSettings)
  }
}

function changePersonInformation(btn) {
  btn.preventDefault();
  ajaxSettings.url=apiPerson;
  ajaxSettings.data={
    trigger:trigger, 
    id:person, 
    city:$("#city").val(), 
    address:$("#address").val(), 
    phone:$("#phone").val()
  }
  saveInfo(ajaxSettings)
}

function saveInfo(ajaxSettings){
  $.ajax(ajaxSettings)
    .done(function(data) {
      console.log(data);
      if (data.res==0) {
        $("#toastDivError .errorOutput").text(data.output);
        $("#toastDivError").removeClass("d-none");
      }else {
        $(".toastTitle").text(data.output)
        $("#toastDivSuccess").removeClass("d-none")
        setTimeout(function(){ window.location.reload(); }, 3000);
      }
      $("#toastDivContent").removeClass('d-none')
    })
    .fail(function(data){
      form.find(".outputMsg").html(data);
    });
}