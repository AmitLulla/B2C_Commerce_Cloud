

$( ".gotodetails" ).click(function() {
    
    
    
   
    var id= $(this).attr("id");
    id=id.replace(/s/g, '');
    
   
   var card = $('#'+id).html();
  
   localStorage.setItem('card', card);
      

  });


  if(localStorage.getItem('card')){

    $("#data-load").html(localStorage.getItem('card'));
      
     $(".direccion-entrega1").html($('.dir1').html());
    $(".direccion-entrega2").html($('.dir2').html());
    $(".tipo-pago").html($('.payMet').html());
    if($('#orderStat').html() != ""){

      $(".status-envio").html($('#orderStat').html());

    }else{
      $(".status-envio").html('No Configurado')
    }


    if($('.tracking').html() != ""){

      $(".numero-guia").html($('.tracking').html());

    }else{
      $(".numero-guia").html('No Configurado')
    }
    

  }

   




