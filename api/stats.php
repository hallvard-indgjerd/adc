<?php
require 'vendor/autoload.php';
use \Adc\Stats;
$obj = new Stats();
$funzione = $_POST['trigger'];
unset($_POST['trigger']);
if(isset($funzione) && function_exists($funzione)) {
  $trigger = $funzione($obj);
  echo $trigger;
}

function statIndex($obj){ return json_encode($obj->statIndex());}
function artifactByCounty($obj){return json_encode($obj->artifactByCounty($_POST["filter"]));}
function typeChronologicalDistribution($obj){ return json_encode($obj->typeChronologicalDistribution($_POST['type'])); }
function typeInstitutionDistribution($obj){ return json_encode($obj->typeInstitutionDistribution($_POST['filter'])); }

?>